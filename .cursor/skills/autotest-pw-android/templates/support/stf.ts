/**
 * Device farm MCloud (STF / DeviceFarmer) — MỘT chế độ duy nhất, tự động hoàn toàn. User chỉ cần:
 *   1. điền tài khoản Keycloak device farm vào ~/.vds/sdlc-config.env: VDS_STF_<HOST_SLUG>_USER, VDS_STF_<HOST_SLUG>_PASSWORD
 *      (tài khoản Keycloak riêng của device farm do DevOps Trung tâm Vận hành Khai thác cấp, mỗi người một tài khoản;
 *      key đúng tên: cred_env.py check --scope shared --keys ...);
 *   2. đưa link điều khiển máy: ANDROID_DEVICE_URL=http://10.207.247.201/#!/control/<serial>
 * Fixture (android.fixture.ts) gọi acquire() → tự: đăng nhập Keycloak device farm lấy token → TỰ ĐĂNG KÝ ADB key của máy này
 * vào tài khoản (POST /api/v1/user/adbPublicKeys) → mượn máy → bật remote debug → adb connect trên adb server
 * riêng của farm (FARM_ADB_PORT, mặc định 5038) → chờ máy sẵn sàng. Teardown gọi release().
 *
 * Chỉ bearer token Keycloak (password grant) được REST /api/v1 chấp nhận — access-token tĩnh của STF và
 * accesskey của Appium grid đều bị từ chối (đã kiểm chứng). Biến môi trường (Jenkins withCredentials) ưu tiên hơn file.
 *
 * ADB key: ưu tiên key MẶC ĐỊNH ~/.android/adbkey (Windows %USERPROFILE%\.android\adbkey — đúng key trong hướng dẫn
 * tạo key tay của farm), tự đăng ký vào tài khoản mỗi lần mượn máy rồi kiểm tra lại; adb server farm chạy với môi
 * trường bình thường. Key mặc định đã thuộc tài khoản farm khác (farm trả success nhưng không lưu) → keypair riêng
 * ~/.android/stf (adb chạy với HOME/ANDROID_USER_HOME trỏ vào đó). Thử hết (đăng ký, đổi key, mở phiên mới, khởi
 * động lại server) vẫn không kết nối → lỗi kèm hướng dẫn thêm key bằng tay đúng hệ điều hành (manualKeyGuide).
 * "failed to authenticate" khi connect là bắt tay bình thường; chỉ "device" trong `adb -P <cổng farm> devices` mới là
 * đã kết nối (`adb devices` thường hỏi server mặc định 5037, có thể thấy offline dù skill đang chạy được).
 * Kiểm tra cả chuỗi 1 lệnh: `npx tsx support/stf.ts doctor "<link control hoặc http://host>"`.
 */
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import dotenv from 'dotenv';

export interface FarmDevice {
  /** http://host[:port] của STF */
  origin: string;
  serial: string;
}

export interface Lease {
  /** Địa chỉ ADB host:port (remote debug) */
  address: string;
  dev: FarmDevice;
  /** Cổng adb server riêng của farm — _android.devices({ port }) phải dùng cổng này. */
  adbPort: number;
}

/**
 * adb server RIÊNG cho farm (mặc định 5038, đổi bằng FARM_ADB_PORT), tách khỏi server mặc định 5037.
 * Server mặc định bị mọi công cụ khác dùng chung (Android Studio, Appium, lượt test khác, `adb` gõ tay):
 * chỉ cần một bên kill-server/start-server là kết nối farm rớt, hoặc server chạy lại với key mặc định
 * → farm báo sai key. Server riêng chỉ nạp key farm và không ai khác đụng tới.
 */
export const FARM_ADB_PORT = Number(process.env.FARM_ADB_PORT || 5038);
/** Cổng đang dùng thật: = FARM_ADB_PORT, trừ khi cổng đó bị chương trình khác chiếm (xem ensureFarmServer). */
let farmPort = FARM_ADB_PORT;

const ADB_EXE = process.platform === 'win32' ? 'adb.exe' : 'adb';
/** Bản platform-tools skill tự tải khi máy chưa có adb (không cần quyền admin, không đụng PATH). */
const OWN_PLATFORM_TOOLS = path.join(os.homedir(), '.android', 'stf', 'platform-tools');
let adbBin: string | undefined;

function adbWorks(bin: string): boolean {
  try {
    execFileSync(bin, ['version'], { stdio: 'ignore', timeout: 15_000 });
    return true;
  } catch {
    return false;
  }
}

/** Nơi có thể có adb: ADB_PATH, PATH, Android SDK (biến môi trường + chỗ mặc định từng OS), bản skill tự tải. */
function adbCandidates(): string[] {
  const home = os.homedir();
  const sdks = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(home, 'Library', 'Android', 'sdk'),
    path.join(home, 'Android', 'Sdk'),
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : undefined,
  ].filter((d): d is string => Boolean(d));
  return [process.env.ADB_PATH, 'adb', ...sdks.map((d) => path.join(d, 'platform-tools', ADB_EXE)), path.join(OWN_PLATFORM_TOOLS, ADB_EXE)]
    .filter((b): b is string => Boolean(b));
}

/** Đường dẫn adb dùng được (không tải). Chưa tìm thấy → 'adb' (lệnh sẽ báo lỗi rõ). */
export function adbPath(): string {
  if (!adbBin) adbBin = adbCandidates().find(adbWorks);
  return adbBin ?? 'adb';
}

function zipComplete(file: string): boolean {
  try {
    const buf = fs.readFileSync(file);
    return buf.subarray(Math.max(0, buf.length - 65_557)).includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  } catch {
    return false;
  }
}

/**
 * Tải file ra đĩa, thử lần lượt tới khi được (trả '' khi xong, ngược lại lý do lỗi):
 *  1. fetch trực tiếp — `fetch` của Node BỎ QUA HTTPS_PROXY → máy trong mạng công ty đi qua proxy bị timeout (đã gặp);
 *  2. tiến trình Node con với NODE_USE_ENV_PROXY=1 (Node ≥ 22.21 / 24: fetch theo HTTPS_PROXY/NO_PROXY — chỉ đặt được lúc khởi động);
 *  3. curl (có sẵn trên Windows 10+/macOS/Linux, tự theo HTTPS_PROXY; --ssl-no-revoke vì proxy giải mã TLS làm Windows
 *     không kiểm tra được thu hồi chứng chỉ); 4. PowerShell (Windows — dùng proxy hệ thống).
 * File zip phải nguyên vẹn (có phần cuối) — tải đứt giữa chừng coi như lỗi.
 */
export async function download(url: string, dest: string): Promise<string> {
  const errors: string[] = [];
  const done = (): boolean => zipComplete(dest);
  try {
    const res = await http(url, {}, 120_000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    if (done()) return '';
  } catch (e) {
    errors.push(`fetch: ${(e as Error).message}`);
  }
  const script =
    'const [u,f]=process.argv.slice(1);fetch(u).then(async r=>{if(!r.ok)throw new Error("HTTP "+r.status);' +
    'require("fs").writeFileSync(f,Buffer.from(await r.arrayBuffer()))}).catch(e=>{console.error(e.cause?.code||e.message);process.exit(1)})';
  const tries: [string, string, string[], NodeJS.ProcessEnv?][] = [
    ['node+proxy', process.execPath, ['-e', script, url, dest], { ...process.env, NODE_USE_ENV_PROXY: '1' }],
    ['curl', 'curl', ['-fsSL', '--max-time', '600', ...(process.platform === 'win32' ? ['--ssl-no-revoke'] : []), '-o', dest, url]],
  ];
  if (process.platform === 'win32') {
    tries.push(['powershell', 'powershell', ['-NoProfile', '-Command', `$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -UseBasicParsing -Uri '${url}' -OutFile '${dest}'`]]);
  }
  for (const [name, cmd, args, env] of tries) {
    try {
      execFileSync(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: 600_000, env: env ?? process.env });
      if (done()) return '';
      errors.push(`${name}: file tải về không nguyên vẹn`);
    } catch (e) {
      errors.push(`${name}: ${String((e as { stderr?: Buffer }).stderr ?? (e as Error).message).trim().split('\n')[0]}`);
    }
  }
  fs.rmSync(dest, { force: true });
  return errors.join('; ');
}

/** Giải nén zip vào `dir` bằng công cụ có sẵn trên máy (không cần Python); xong khi `expectFile` xuất hiện. */
/**
 * Giải nén zip bằng Node thuần (zlib) — dùng khi máy không có unzip / python3 (Linux tối giản, agent Jenkins chạy
 * Docker: GNU tar không đọc được zip — đã gặp). Hỗ trợ đúng thứ platform-tools cần: stored + deflate, không zip64;
 * giữ quyền chạy (bit x) của file trên macOS/Linux.
 */
function nodeUnzip(zip: string, dir: string): void {
  const buf = fs.readFileSync(zip);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip hỏng (không có central directory)');
  let off = buf.readUInt32LE(eocd + 16);
  const root = path.resolve(dir);
  for (let n = buf.readUInt16LE(eocd + 10); n > 0; n--) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('zip hỏng (central directory)');
    const method = buf.readUInt16LE(off + 10);
    const size = buf.readUInt32LE(off + 20);
    const nameLen = buf.readUInt16LE(off + 28);
    const mode = buf.readUInt32LE(off + 38) >>> 16;
    const local = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf-8', off + 46, off + 46 + nameLen);
    off += 46 + nameLen + buf.readUInt16LE(off + 30) + buf.readUInt16LE(off + 32);
    const target = path.resolve(root, name);
    if (!target.startsWith(root + path.sep)) continue; // tên file chứa "../" — bỏ qua
    if (name.endsWith('/')) { fs.mkdirSync(target, { recursive: true }); continue; }
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, method === 8 ? zlib.inflateRawSync(data) : data);
    if (mode & 0o111) try { fs.chmodSync(target, mode & 0o777); } catch { /* Windows: không có quyền POSIX */ }
  }
}

export function unzipTo(zip: string, dir: string, expectFile: string): boolean {
  fs.mkdirSync(dir, { recursive: true });
  const unpackers: [string, string[]][] = [
    ['unzip', ['-oq', zip, '-d', dir]],
    ['tar', ['-xf', zip, '-C', dir]], // Windows 10+ có sẵn bsdtar đọc được zip
    ['powershell', ['-NoProfile', '-Command', `Expand-Archive -Force -LiteralPath '${zip}' -DestinationPath '${dir}'`]],
    ['python3', ['-m', 'zipfile', '-e', zip, dir]],
  ];
  for (const [cmd, args] of unpackers) {
    try {
      execFileSync(cmd, args, { stdio: 'ignore', timeout: 120_000 });
      if (fs.existsSync(expectFile)) return true;
    } catch {
      /* thử cách giải nén tiếp theo */
    }
  }
  try {
    nodeUnzip(zip, dir); // không có công cụ giải nén nào ở trên → Node thuần
  } catch {
    /* zip hỏng — báo lỗi ở chỗ gọi */
  }
  return fs.existsSync(expectFile);
}

/**
 * Bảo đảm có adb: tìm sẵn trên máy, không có thì TỰ TẢI Android platform-tools chính thức của Google về
 * ~/.android/stf/platform-tools (macOS / Windows / Linux) — người dùng không phải cài gì.
 */
export async function ensureAdb(): Promise<string> {
  const found = adbCandidates().find(adbWorks);
  if (found) return (adbBin = found);
  const plat = ({ darwin: 'darwin', win32: 'windows', linux: 'linux' } as Record<string, string>)[process.platform];
  if (!plat) throw new Error(`Chưa có adb và không tự tải được cho hệ điều hành ${process.platform} — cài Android platform-tools.`);
  const url = `https://dl.google.com/android/repository/platform-tools-latest-${plat}.zip`;
  const dir = path.dirname(OWN_PLATFORM_TOOLS);
  fs.mkdirSync(dir, { recursive: true });
  const zip = path.join(dir, 'platform-tools.zip');
  const why = await download(url, zip);
  if (why) throw new Error(`Chưa có adb và không tải được platform-tools (${why}). Máy không ra được internet → cài Android SDK / platform-tools rồi đặt ADB_PATH, hoặc đặt HTTPS_PROXY.`);
  unzipTo(zip, dir, path.join(OWN_PLATFORM_TOOLS, ADB_EXE));
  fs.rmSync(zip, { force: true });
  const bin = path.join(OWN_PLATFORM_TOOLS, ADB_EXE);
  try { fs.chmodSync(bin, 0o755); } catch { /* Windows */ }
  if (!adbWorks(bin)) throw new Error(`Đã tải platform-tools nhưng không chạy được ${bin} — cài Android platform-tools.`);
  return (adbBin = bin);
}

/**
 * Thư mục chứa riêng ADB key cho farm, để adb CHỈ gửi đúng key này.
 * adb đọc key ở `$ANDROID_USER_HOME/adbkey` VÀ ở home (`$HOME/.android/adbkey` trên Unix,
 * `%USERPROFILE%\.android\adbkey` trên Windows), lại tự sinh key mới nếu thiếu — nên phải đặt cùng một key
 * đã-đăng-ký vào CẢ HAI đường dẫn, rồi chạy adb với HOME + USERPROFILE + ANDROID_USER_HOME = thư mục này.
 * Dùng os.homedir()/path.join nên đường dẫn đúng trên mọi OS. Thiếu thì tạo keypair mới
 * (registerKey() tự đăng ký vào tài khoản farm, người dùng không phải thao tác trên web).
 */
export function stfKeyDir(): string {
  const dir = path.join(os.homedir(), '.android', 'stf');
  fs.mkdirSync(path.join(dir, '.android'), { recursive: true });
  if (!fs.existsSync(path.join(dir, 'adbkey'))) {
    execFileSync(adbPath(), ['keygen', path.join(dir, 'adbkey')], { stdio: 'ignore' });
  }
  for (const ext of ['', '.pub']) {
    const src = path.join(dir, `adbkey${ext}`);
    const dst = path.join(dir, '.android', `adbkey${ext}`);
    // Chép lại khi NỘI DUNG khác (không chỉ khi thiếu): key được tạo lại mà bản sao cũ vẫn nằm đó thì adb
    // gửi key cũ → farm báo sai key dù key mới đã đăng ký.
    if (fs.existsSync(src) && (!fs.existsSync(dst) || !fs.readFileSync(src).equals(fs.readFileSync(dst)))) {
      fs.copyFileSync(src, dst);
      if (!ext) try { fs.chmodSync(dst, 0o600); } catch { /* Windows: không có quyền POSIX, bỏ qua */ }
    }
  }
  return dir;
}

/**
 * Thư mục key MẶC ĐỊNH của adb: ~/.android (Windows: %USERPROFILE%\.android) — đúng chỗ hướng dẫn tạo key tay của
 * farm (adb keygen + adb pubkey). adb chạy với môi trường bình thường tự gửi key này, không cần đổi HOME — cách
 * chắc chắn nhất trên Windows. Thiếu thì tạo đúng như hướng dẫn tay.
 */
export function defaultKeyDir(): string {
  const dir = path.join(os.homedir(), '.android');
  fs.mkdirSync(dir, { recursive: true });
  const key = path.join(dir, 'adbkey');
  if (!fs.existsSync(key)) execFileSync(adbPath(), ['keygen', key], { stdio: 'ignore' });
  if (!fs.existsSync(`${key}.pub`)) {
    fs.writeFileSync(`${key}.pub`, execFileSync(adbPath(), ['pubkey', key], { encoding: 'utf-8' }));
  }
  return dir;
}

/**
 * Key adb server farm dùng: 'default' = ~/.android/adbkey (ưu tiên — cũng là key người dùng dán tay theo hướng dẫn),
 * 'stf' = keypair riêng ~/.android/stf (chỉ khi key mặc định đã thuộc tài khoản farm khác nên không đăng ký được).
 * registerKey() chọn.
 */
let keyMode: 'default' | 'stf' = 'default';

function activePub(): string {
  return path.join(keyMode === 'default' ? defaultKeyDir() : stfKeyDir(), 'adbkey.pub');
}

/**
 * adb với server dùng ĐÚNG key farm. adb lấy key từ thư mục home: Unix = $HOME/.android, Windows = %USERPROFILE%\.android;
 * cộng thêm $ANDROID_USER_HOME nếu đặt. Set cả ba (HOME + USERPROFILE + ANDROID_USER_HOME = thư mục stf) để
 * chỉ đúng key đã đăng ký được gửi, chạy giống nhau trên macOS/Linux/Windows. Không throw.
 */
export function farmAdb(...args: string[]): string {
  return farmAdbWithin(30_000, ...args);
}

/** Như farmAdb nhưng với thời hạn riêng — kiểm tra server dùng thời hạn ngắn (cổng bị chiếm thì adb treo). */
function farmAdbWithin(ms: number, ...args: string[]): string {
  // Bỏ các biến làm adb đọc key ở chỗ khác / gửi thêm key (máy có Android Studio, SDK cũ hay đặt sẵn).
  const { ADB_VENDOR_KEYS: _v, ANDROID_SDK_HOME: _s, ANDROID_USER_HOME: _u, ...base } = process.env;
  const port = { ANDROID_ADB_SERVER_PORT: String(farmPort) };
  // Key mặc định: chỉ chỉ thẳng thư mục ~/.android (đúng thư mục adb tự dùng trên mọi OS), không đổi HOME.
  // Key riêng: đổi cả HOME/USERPROFILE để adb không gửi kèm key mặc định.
  const dir = keyMode === 'stf' ? stfKeyDir() : defaultKeyDir();
  const env = keyMode === 'stf' ? { ...base, HOME: dir, USERPROFILE: dir, ANDROID_USER_HOME: dir, ...port } : { ...base, ANDROID_USER_HOME: dir, ...port };
  try {
    return execFileSync(adbPath(), args, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: ms,
      env,
    });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}` || err.message;
  }
}

/**
 * Khởi động adb server farm với ĐÚNG key hiện tại. adb chỉ nạp key lúc server khởi động: server còn chạy từ lần
 * trước mà key đã đổi (hoặc do ai/công cụ khác khởi động với key mặc định) → nó gửi sai key → farm báo
 * "failed to authenticate" rồi ĐÓNG cổng remote debug. Vì vậy khởi động lại server TRƯỚC khi connect khi:
 *  - dấu vân tay key server đang dùng (ghi trong file) khác key hiện tại, hoặc
 *  - server không đang phục vụ máy nào (không ai dùng → khởi động lại không ảnh hưởng ai, và chắc chắn đúng key).
 * Không bao giờ khởi động lại giữa lúc đang bắt tay.
 */
function ensureFarmServer(force = false): void {
  const dir = path.join(os.homedir(), '.android', 'stf'); // chỗ ghi dấu key của server farm
  fs.mkdirSync(dir, { recursive: true });
  // Dấu gồm cả chế độ key: đổi giữa key mặc định và key riêng thì môi trường adb khác → phải khởi động lại server.
  const fp = crypto.createHash('sha256').update(keyMode).update(fs.readFileSync(activePub())).digest('hex');
  // Cổng bị chương trình KHÁC adb chiếm → adb không khởi động được server (mọi lệnh treo/lỗi, trước đây báo nhầm
  // thành "không tới được remote debug"). Thử lần lượt tối đa 10 cổng kế tiếp; Lease.adbPort trả về cổng thật.
  for (let port = FARM_ADB_PORT; port < FARM_ADB_PORT + 10; port++) {
    farmPort = port;
    const stamp = path.join(dir, `server-${port}.key`);
    const listing = farmAdbWithin(8_000, 'devices');
    const alive = listing.includes('List of devices attached');
    const idle = alive && !listing.split(/\r?\n/).slice(1).some((l) => l.trim());
    if (!alive || force || idle || !fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf-8').trim() !== fp) {
      if (alive) farmAdb('kill-server'); // cổng bị chương trình khác chiếm: không có server adb nào để tắt
      farmAdbWithin(15_000, 'start-server');
      fs.writeFileSync(stamp, fp);
    }
    if (farmAdbWithin(8_000, 'devices').includes('List of devices attached')) return;
    fs.rmSync(stamp, { force: true });
  }
  throw new Error(`Không khởi động được adb server farm trên cổng ${FARM_ADB_PORT}–${FARM_ADB_PORT + 9} (bị chương trình khác chiếm) — đặt FARM_ADB_PORT=<cổng trống khác>.`);
}

function adbState(address: string): string {
  const line = farmAdb('devices').split('\n').find((l) => l.startsWith(`${address}\t`));
  return line ? line.trim().split(/\s+/)[1] ?? '' : '';
}

/** Tách origin + serial từ link control STF (`…/#!/control/<serial>`). */
/** Dán thiếu "http://" (vd 10.207.247.201/#!/control/X) vẫn nhận. */
function withScheme(link: string): string {
  const t = link.trim().replace(/^['"]|['"]$/g, '');
  return /^https?:\/\//i.test(t) ? t : `http://${t}`;
}

export function parseControlUrl(link: string): FarmDevice {
  const m = /^(https?:\/\/[^/#]+).*?\/control\/([^/?#]+)/.exec(withScheme(link));
  if (!m) throw new Error(`ANDROID_DEVICE_URL không đúng dạng "http://<host>/#!/control/<serial>": ${link}`);
  return { origin: m[1], serial: decodeURIComponent(m[2]) };
}

/** Tên key credential theo host: VDS_STF_<HOST_SLUG>_USER / _PASSWORD. */
export function credKeys(dev: FarmDevice): { user: string; pass: string } {
  let host = new URL(dev.origin).hostname;
  if (host.toLowerCase().startsWith('stf.')) host = host.slice(4);
  const base = `VDS_STF_${host.replace(/[^A-Za-z0-9]/g, '_').toUpperCase()}`;
  return { user: `${base}_USER`, pass: `${base}_PASSWORD` };
}

function sharedConfigFile(): string {
  return process.env.VDS_CONFIG_FILE || path.join(os.homedir(), '.vds', 'sdlc-config.env');
}

/**
 * Đọc 1 giá trị credential: biến môi trường > ~/.vds/sdlc-config.env > automation_test/.env.
 * Chỗ chuẩn là sdlc-config.env; đọc thêm .env của project để user lỡ điền vào đó vẫn chạy được.
 */
function readCred(name: string): string | undefined {
  const files = [sharedConfigFile(), process.env.AUTOTEST_ENV_FILE || path.resolve(__dirname, '..', '.env')];
  for (const file of files) {
    const value = fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file))[name] : undefined;
    if (value) return process.env[name] || value;
  }
  return process.env[name] || undefined;
}

/** Đã điền đủ tài khoản Keycloak device farm của farm chưa (user + password). */
export function farmCredsAvailable(dev: FarmDevice): boolean {
  const { user, pass } = credKeys(dev);
  return Boolean(readCred(user) && readCred(pass));
}

/** Đọc cấu hình Keycloak từ keycloak.json công khai → URL token endpoint + client. */
/**
 * fetch có thời hạn + lỗi mạng dễ hiểu. Không có thời hạn thì farm/Keycloak sập mạng là cả lượt chạy TREO;
 * lỗi gốc của Node chỉ là "fetch failed" — không nói được hỏng ở đâu.
 */
async function http(url: string, init: RequestInit = {}, ms = 30_000): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  } catch (e) {
    const err = e as Error & { cause?: { code?: string } };
    const why = err.name === 'TimeoutError' ? `không phản hồi sau ${ms / 1000}s` : (err.cause?.code ?? err.message);
    throw new Error(`Không kết nối được ${new URL(url).origin} (${why}) — kiểm tra mạng/VPN tới địa chỉ này.`);
  }
}

async function keycloak(dev: FarmDevice): Promise<{ tokenUrl: string; clientId: string; secret?: string }> {
  const kcRes = await http(`${dev.origin}/keycloak.json`);
  if (!kcRes.ok) throw new Error(`${dev.origin} không phải device farm STF (không có /keycloak.json, HTTP ${kcRes.status}) — kiểm tra lại link.`);
  const kc = (await kcRes.json().catch(() => ({}))) as { realm: string; 'auth-server-url': string; resource: string; credentials?: { secret?: string } };
  if (!kc['auth-server-url'] || !kc.realm) throw new Error(`${dev.origin}/keycloak.json không đúng dạng — kiểm tra lại link farm.`);
  return {
    tokenUrl: `${kc['auth-server-url'].replace(/\/$/, '')}/realms/${kc.realm}/protocol/openid-connect/token`,
    clientId: kc.resource,
    secret: kc.credentials?.secret,
  };
}

/**
 * Link trỏ đúng một device farm STF và tới được không — kiểm tra TRƯỚC khi đòi tài khoản, để link sai / mất mạng
 * không bị báo nhầm thành "chưa điền tài khoản cho host đó".
 */
export async function checkFarmHost(dev: FarmDevice): Promise<void> {
  await keycloak(dev);
}

/** Lấy bearer token Keycloak bằng tài khoản Keycloak device farm (password grant) để gọi STF REST. */
async function login(dev: FarmDevice): Promise<string> {
  const { user, pass } = credKeys(dev);
  const username = readCred(user);
  const password = readCred(pass);
  if (!username || !password) {
    throw new Error(`Chưa điền tài khoản Keycloak device farm (do DevOps Trung tâm Vận hành Khai thác cấp): mở ~/.vds/sdlc-config.env, điền ${user}= và ${pass}= (không dán vào chat).`);
  }
  const kc = await keycloak(dev);
  const res = await http(kc.tokenUrl, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'password', username, password, scope: 'openid',
      client_id: kc.clientId, ...(kc.secret ? { client_secret: kc.secret } : {}),
    }),
  });
  if (!res.ok) {
    const otp = /otp|totp|2fa|mfa/i.test(await res.text());
    throw new Error(
      `Đăng nhập Keycloak device farm thất bại (HTTP ${res.status})${otp ? ' — tài khoản bật OTP/2FA, không dùng được cho farm tự động; xin DevOps Trung tâm Vận hành Khai thác cấp tài khoản không bật OTP' : ''}. ` +
        `Kiểm tra ${user}/${pass} trong ~/.vds/sdlc-config.env (tài khoản Keycloak device farm do DevOps Trung tâm Vận hành Khai thác cấp, không phải SSO).`,
    );
  }
  return ((await res.json()) as { access_token: string }).access_token;
}

async function api<T = unknown>(dev: FarmDevice, token: string, method: string, apiPath: string, body?: unknown): Promise<{ status: number; json: T }> {
  const res = await http(`${dev.origin}/api/v1${apiPath}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { description: text.slice(0, 160) };
  }
  return { status: res.status, json: json as T };
}

/** Dấu vân tay kiểu STF (md5 của khoá base64, dạng aa:bb:…) — để so với danh sách key của tài khoản. */
function keyFingerprint(pub: string): string {
  const hex = crypto.createHash('md5').update(Buffer.from(pub.trim().split(/\s+/)[0], 'base64')).digest('hex');
  return hex.match(/../g)!.join(':');
}

/**
 * Public key (file .pub) đã nằm trong tài khoản Keycloak device farm đang dùng chưa (GET /user → adbKeys).
 * undefined = farm không trả danh sách key (bản cũ) → không kiểm được.
 */
async function keyInAccount(dev: FarmDevice, token: string, pubFile: string): Promise<boolean | undefined> {
  const fp = keyFingerprint(fs.readFileSync(pubFile, 'utf-8'));
  const me = await api<{ user?: { adbKeys?: { fingerprint?: string }[] } }>(dev, token, 'GET', '/user');
  const keys = me.json.user?.adbKeys;
  return Array.isArray(keys) ? keys.some((k) => k.fingerprint === fp) : undefined;
}

/** Đăng ký 1 public key vào tài khoản rồi kiểm tra lại — farm trả "success" cả khi KHÔNG lưu (đo thật). */
async function landKey(dev: FarmDevice, token: string, pubFile: string, title: string): Promise<boolean> {
  if (await keyInAccount(dev, token, pubFile)) return true;
  const pub = fs.readFileSync(pubFile, 'utf-8').trim();
  await api(dev, token, 'POST', '/user/adbPublicKeys', { publickey: pub, title });
  return (await keyInAccount(dev, token, pubFile)) !== false;
}

/**
 * Đưa ADB key của máy này vào tài khoản Keycloak device farm (API DeviceFarmer `POST /user/adbPublicKeys`) và chọn
 * key cho adb server farm. Farm tự tiêm key của chủ phiên vào thiết bị khi mượn → không phải bấm "Allow USB debugging".
 *  1. Key mặc định ~/.android/adbkey — trùng với key người dùng tạo + dán tay theo hướng dẫn (manualKeyGuide).
 *  2. Đo thật: farm trả "success" nhưng KHÔNG lưu khi key đã thuộc tài khoản farm khác → dùng keypair riêng
 *     ~/.android/stf (tạo mới nếu cũng không vào được). Không bao giờ tạo lại key mặc định: nó còn dùng cho máy cắm USB.
 * false = không đưa được key nào vào tài khoản → nếu kết nối thất bại, hướng dẫn người dùng dán key mặc định lên web.
 */
export async function registerKey(dev: FarmDevice, token: string): Promise<boolean> {
  keyMode = 'default';
  if (await landKey(dev, token, path.join(defaultKeyDir(), 'adbkey.pub'), `${os.userInfo().username}@${os.hostname()}`)) return true;
  keyMode = 'stf';
  const own = path.join(stfKeyDir(), 'adbkey.pub');
  if (await landKey(dev, token, own, `autotest-${os.hostname()}`)) return true;
  for (const f of ['adbkey', 'adbkey.pub']) fs.rmSync(path.join(path.dirname(own), f), { force: true });
  stfKeyDir(); // sinh keypair riêng mới + chép bản sao
  if (await landKey(dev, token, own, `autotest-${os.hostname()}`)) return true;
  keyMode = 'default'; // không vào được → người dùng dán key mặc định lên web theo hướng dẫn
  return false;
}

/**
 * Hướng dẫn tạo + thêm ADB key bằng tay (theo hướng dẫn của device farm), đúng hệ điều hành đang chạy. Chỉ dùng
 * khi tự động đã thử hết mà vẫn không kết nối được. Key dán lên web là key mặc định → lần chạy sau skill dùng nó.
 */
export function manualKeyGuide(dev: FarmDevice): string {
  const adb = adbPath().includes(path.sep) ? `"${adbPath()}"` : 'adb';
  const steps =
    process.platform === 'win32'
      ? [
          'cd %USERPROFILE%\\.android\\',
          `${adb} keygen adbkey            (bỏ qua nếu đã có file adbkey)`,
          `${adb} pubkey %USERPROFILE%\\.android\\adbkey > %USERPROFILE%\\.android\\adbkey.pub`,
          'type %USERPROFILE%\\.android\\adbkey.pub | clip',
        ]
      : [
          'cd ~/.android/',
          `${adb} keygen adbkey            (bỏ qua nếu đã có file adbkey)`,
          `${adb} pubkey ~/.android/adbkey > ~/.android/adbkey.pub`,
          process.platform === 'darwin' ? 'pbcopy < ~/.android/adbkey.pub' : 'xclip -sel clip < ~/.android/adbkey.pub',
        ];
  const { user } = credKeys(dev);
  return [
    'Tự động không kết nối được — thêm ADB key bằng tay MỘT lần:',
    `  1. Mở ${process.platform === 'win32' ? 'Command Prompt (cmd, không phải PowerShell)' : 'Terminal'}, tạo key và chép public key:`,
    ...steps.map((l) => `       ${l}`),
    `  2. Mở ${dev.origin}/#!/settings/keys, đăng nhập ĐÚNG tài khoản đã điền ở ${user} (~/.vds/sdlc-config.env)`,
    '     → mục ADB Keys → thêm key → dán → lưu. Web báo key đã có ở tài khoản khác → xoá key ở tài khoản đó',
    '     (hoặc xoá adbkey, adbkey.pub rồi tạo lại ở bước 1).',
    '  3. Chạy lại test (hoặc: npx tsx support/stf.ts doctor "<link>").',
  ].join('\n');
}

/**
 * Mượn máy → bật remote debug → adb connect bằng đúng key → chờ `device` → kiểm tra serial.
 * Trả về Lease để teardown gọi release().
 */
/**
 * Chủ máy có phải chính tài khoản đang đăng nhập không. So email (không phân biệt hoa thường); tài khoản
 * Keycloak do DevOps cấp có thể không có email → so tên người dùng.
 */
function sameOwner(owner: { email?: string; name?: string } | undefined, me: { email?: string; name?: string; username?: string } | undefined): boolean {
  if (!owner || !me) return false;
  const norm = (v?: string) => (v ?? '').trim().toLowerCase();
  if (norm(owner.email) && norm(me.email)) return norm(owner.email) === norm(me.email);
  return Boolean(norm(owner.name)) && [me.name, me.username].some((n) => norm(n) === norm(owner.name));
}

/** Vài máy Android đang rảnh trên farm (để gợi ý khi máy được chọn đang bận). */
async function freeDevices(dev: FarmDevice, token: string): Promise<string> {
  const r = await api<{ devices?: { serial?: string; model?: string; platform?: string; present?: boolean; ready?: boolean; using?: boolean }[] }>(
    dev, token, 'GET', '/devices?fields=serial,model,platform,present,ready,using',
  );
  const free = (r.json.devices ?? []).filter((d) => d.present && d.ready && !d.using && d.platform === 'Android').slice(0, 5);
  return free.length
    ? ' Máy đang rảnh: ' + free.map((d) => `${d.model ?? ''} ${dev.origin}/#!/control/${d.serial}`).join(' · ')
    : ' Hiện không có máy Android nào rảnh.';
}

export async function acquire(dev: FarmDevice): Promise<Lease> {
  await ensureAdb(); // máy chưa có adb → tự tải platform-tools
  defaultKeyDir(); // đảm bảo có key mặc định (tạo như hướng dẫn tay nếu thiếu)
  const token = await login(dev);
  const me = await api<{ user?: { email?: string; name?: string; username?: string } }>(dev, token, 'GET', '/user');
  if (me.status !== 200) throw new Error(`STF từ chối token (HTTP ${me.status}) — kiểm tra tài khoản Keycloak device farm.`);

  const info = await api<{
    device?: { present?: boolean; ready?: boolean; using?: boolean; platform?: string; model?: string; owner?: { email?: string; name?: string } };
  }>(dev, token, 'GET', `/devices/${dev.serial}`);
  const d = info.json.device;
  if (info.status === 404 || (info.status === 200 && !d)) {
    throw new Error(`Farm không có máy serial "${dev.serial}" — kiểm tra lại link control.${await freeDevices(dev, token)}`);
  }
  if (info.status !== 200) throw new Error(`Không đọc được thông tin máy ${dev.serial} (HTTP ${info.status}).`);
  if (d?.platform && d.platform !== 'Android') {
    throw new Error(`Máy ${dev.serial} (${d.model ?? ''}) là ${d.platform}, không phải Android — Playwright chỉ chạy Android (iOS dùng /autotest-rf-ios).${await freeDevices(dev, token)}`);
  }
  if (!d?.present || d.ready === false) {
    throw new Error(`Máy ${dev.serial} (${d?.model ?? ''}) đang offline / chưa sẵn sàng trên farm.${await freeDevices(dev, token)}`);
  }
  // Đăng ký key TRƯỚC khi mượn: farm tiêm các key đã đăng ký vào thiết bị lúc cấp phiên remote debug.
  const keyRegistered = await registerKey(dev, token).catch(() => false);
  const owner = d.owner;
  // Mỗi người dùng MỘT tài khoản Keycloak device farm riêng: máy đang được chính tài khoản này giữ = máy của mình (vd lượt chạy
  // trước chết giữa chừng chưa trả) → dùng tiếp. Tài khoản khác giữ → không chiếm.
  // Dùng chung tài khoản không được hỗ trợ: farm không phân biệt được hai máy tính cùng tài khoản, nên hai lượt
  // chạy cùng một điện thoại sẽ chồng lên nhau (khác điện thoại thì không sao).
  const mine = sameOwner(owner, me.json.user);
  if (d.using && !mine) {
    throw new Error(`Máy ${dev.serial} đang được ${owner?.name ?? owner?.email ?? 'người khác'} dùng — không chiếm máy của người khác.${await freeDevices(dev, token)}`);
  }

  if (!mine) {
    const r = await api<{ description?: string }>(dev, token, 'POST', '/user/devices', { serial: dev.serial });
    if (r.status === 403) {
      // Farm giữ chỗ nguyên tử: hai bên cùng mượn một máy trong cùng lúc → chỉ một bên được, bên kia 403.
      throw new Error(`Máy ${dev.serial} vừa được người khác mượn trước (cùng lúc) — chọn máy khác.${await freeDevices(dev, token)}`);
    }
    if (r.status !== 200) throw new Error(`Không mượn được máy ${dev.serial} (HTTP ${r.status}): ${r.json.description ?? ''}`);
  }
  const rc = await api<{ remoteConnectUrl?: string; description?: string }>(dev, token, 'POST', `/user/devices/${dev.serial}/remoteConnect`);
  if (rc.status !== 200 || !rc.json.remoteConnectUrl) {
    throw new Error(`Không bật được remote debug cho ${dev.serial} (HTTP ${rc.status}): ${rc.json.description ?? ''}`);
  }
  let address = rc.json.remoteConnectUrl;

  // Server farm riêng (FARM_ADB_PORT) chỉ nạp key farm; không đụng server mặc định 5037 của máy.
  ensureFarmServer();
  // Farm hay cấp lại đúng cổng cũ: kết nối "offline" còn sót từ lần trước trên server làm `adb connect` bám vào nó.
  farmAdb('disconnect', address);
  farmAdb('connect', address);
  // "failed to authenticate" trong output của `adb connect`, rồi offline / unauthorized / authorizing ngay sau đó, là
  // BƯỚC BẮT TAY bình thường (tài liệu farm cũng ghi vậy) — không phải lỗi. Chỉ coi là ĐÃ kết nối khi `adb devices`
  // báo "device" (offline thì mọi lệnh đều lỗi "device offline"). Đang bắt tay thì CHỈ CHỜ: ngắt / connect lại lúc
  // này cắt ngang bắt tay. ~30s chưa được → xin farm mở phiên remote debug mới (cổng mới), chờ thêm ~30s.
  let state = '';
  let reopened = false;
  for (let i = 0; i < 30; i++) {
    state = adbState(address);
    if (state === 'device') break;
    if (i === 15 && !reopened) {
      reopened = true;
      farmAdb('disconnect', address);
      // Kẹt: khởi động lại server farm với đúng key — an toàn lúc này vì sắp xin phiên remote debug mới
      // (máy khác đang chạy trên server này, nếu có, sẽ tự kết nối lại).
      ensureFarmServer(true);
      await api(dev, token, 'DELETE', `/user/devices/${dev.serial}/remoteConnect`);
      const again = await api<{ remoteConnectUrl?: string }>(dev, token, 'POST', `/user/devices/${dev.serial}/remoteConnect`);
      if (again.status === 200 && again.json.remoteConnectUrl) address = again.json.remoteConnectUrl;
      farmAdb('connect', address);
    } else if (state === '') {
      farmAdb('connect', address); // transport mất hẳn (không còn trong danh sách) → connect lại
    }
    await new Promise((r) => setTimeout(r, 2_000));
  }
  if (state !== 'device') {
    await release(dev, token, address).catch(() => undefined);
    // Không còn trong danh sách = không tới được cổng (mạng / phiên). Còn đó mà kẹt offline/unauthorized = farm không nhận
    // key → hướng dẫn thêm key bằng tay (đã thử: đăng ký qua API, đổi key, mở phiên mới, khởi động lại server).
    const hint = !state
      ? 'không tới được địa chỉ remote debug — kiểm tra bạn còn giữ phiên máy và mạng tới farm.'
      : `${keyRegistered ? 'Key đã nằm trong tài khoản nhưng thiết bị không nhận.' : 'Farm không nhận ADB key qua API.'}\n${manualKeyGuide(dev)}`;
    throw new Error(`Máy farm ${address} ở trạng thái "${state || 'không kết nối'}" sau ~60s. ${hint}`);
  }

  const actual = farmAdb('-s', address, 'shell', 'getprop', 'ro.serialno').trim();
  if (actual && actual !== dev.serial) {
    await release(dev, token, address).catch(() => undefined);
    throw new Error(`Địa chỉ ${address} là máy ${actual}, không phải ${dev.serial} — kiểm tra lại link.`);
  }
  return { address, dev, adbPort: farmPort };
}

/**
 * Ngắt adb, tắt remote debug, trả máy cho farm. Không throw (dọn dẹp).
 * Ngắt đúng địa chỉ của máy này, ở MỌI trạng thái (cả "offline") — kết nối chết để sót lại sẽ chặn lần mượn sau
 * vì farm hay cấp lại đúng cổng cũ. Không truyền address (CLI "release") → hỏi farm địa chỉ remote debug của máy.
 */
export async function release(dev: FarmDevice, token?: string, address?: string): Promise<void> {
  try {
    const t = token ?? (await login(dev));
    let addr = address;
    if (!addr) {
      const d = await api<{ device?: { remoteConnectUrl?: string } }>(dev, t, 'GET', `/user/devices/${dev.serial}`);
      addr = d.json.device?.remoteConnectUrl;
    }
    if (addr) farmAdb('disconnect', addr);
    await api(dev, t, 'DELETE', `/user/devices/${dev.serial}/remoteConnect`);
    await api(dev, t, 'DELETE', `/user/devices/${dev.serial}`);
  } catch {
    if (address) farmAdb('disconnect', address); // mất mạng tới farm vẫn dọn transport trên server
  }
}

/** Tách origin từ link bất kỳ (control link hoặc chỉ host). */
function parseOrigin(link: string): string {
  const m = /^(https?:\/\/[^/#]+)/.exec(withScheme(link));
  if (!m) throw new Error(`Không đọc được host từ: ${link} (cần "http://<host>[/#!/control/SERIAL]").`);
  return m[1];
}

/**
 * Tự kiểm tra toàn bộ chuỗi device farm bằng MỘT lệnh, chỉ ra đúng thứ còn thiếu rồi dừng ở đó.
 * Nhận link control (có serial) HOẶC chỉ host (tự chọn 1 máy rảnh để thử). Các bước:
 *   1. keypair ADB farm      2. tài khoản Keycloak device farm     3. đăng nhập lấy token
 *   4. mượn → remote debug → adb connect → serial  5. trả máy
 * Bước 4 "unauthorized" ⇒ in key + link đăng ký (lần đầu cho máy/node này).
 */
async function doctor(link: string): Promise<void> {
  const hasSerial = /\/control\//.test(link);
  const origin = parseOrigin(link);
  const probe: FarmDevice = { origin, serial: '' };
  const ok = (m: string) => console.log(`  ✓ ${m}`);

  try {
    ok(`adb: ${await ensureAdb()}`);
  } catch (e) {
    console.log(`  ✗ ${(e as Error).message}`);
    process.exit(1);
  }
  ok(`ADB key mặc định: ${path.join(defaultKeyDir(), 'adbkey.pub')}`);

  try {
    await checkFarmHost(probe);
  } catch (e) {
    console.log(`  ✗ ${(e as Error).message}`);
    process.exit(1);
  }
  ok(`Farm ${origin} tới được`);
  if (!farmCredsAvailable(probe)) {
    const { user, pass } = credKeys(probe);
    console.log(`  ✗ Chưa điền tài khoản Keycloak device farm (do DevOps Trung tâm Vận hành Khai thác cấp): mở ~/.vds/sdlc-config.env, điền ${user}= và ${pass}=.`);
    process.exit(1);
  }
  ok('Tài khoản farm: đã điền user/password Keycloak device farm');

  let token: string;
  try {
    token = await login(probe);
  } catch (e) {
    console.log(`  ✗ ${(e as Error).message}`);
    process.exit(1);
  }
  ok('Đăng nhập farm: lấy được bearer token');
  if (await registerKey(probe, token).catch(() => false)) {
    ok(`ADB key có trong tài khoản farm: ${activePub()}`);
  } else {
    console.log('  ! Không đưa được ADB key vào tài khoản qua API — vẫn thử kết nối; không được sẽ có hướng dẫn thêm key bằng tay.');
  }

  let serial: string;
  if (hasSerial) {
    serial = parseControlUrl(link).serial;
  } else {
    const list = await api<{ devices?: Array<Record<string, unknown>> }>(probe, token, 'GET', '/devices');
    const free = (list.json.devices ?? []).find(
      (d) => d.present && d.ready && !d.using && d.platform === 'Android',
    );
    if (!free) {
      console.log('  ✗ Không có máy Android nào rảnh để thử — truyền thẳng link control một máy đang rảnh.');
      process.exit(1);
    }
    serial = String(free.serial);
    ok(`Chọn máy rảnh để thử: ${serial} (${free.model ?? ''})`);
  }

  const dev: FarmDevice = { origin, serial };
  try {
    const lease = await acquire(dev);
    ok(`Mượn + remote debug + adb connect: ${lease.address} (serial khớp, trạng thái "device")`);
    // `adb devices` gõ tay hỏi server MẶC ĐỊNH (5037) — kết nối của skill nằm trên server farm riêng.
    ok(`Xem kết nối của skill: adb -P ${lease.adbPort} devices -l   (lệnh "adb devices" thường hỏi server khác, có thể thấy offline)`);
    await release(dev, token, lease.address);
    ok('Trả máy về farm');
  } catch (e) {
    console.log(`  ✗ ${(e as Error).message}\n`);
    process.exit(1);
  }
  console.log('\n✅ Sẵn sàng. Từ giờ chỉ cần đưa link control, không cần chạm vào điện thoại.');
}

/** CLI:  npx tsx support/stf.ts <doctor|acquire|status|release> "<link>" */
async function main(): Promise<void> {
  const [cmd, link] = process.argv.slice(2);
  if (cmd === 'doctor' && link) {
    await doctor(link);
    return;
  }
  if (!cmd || !link) {
    console.log('Dùng: npx tsx support/stf.ts <doctor|acquire|status|release> "http://host[/#!/control/SERIAL]"');
    console.log('  doctor  — kiểm tra toàn bộ chuỗi farm bằng 1 lệnh (onboard máy/node)');
    process.exit(1);
  }
  const dev = parseControlUrl(link);
  if (cmd === 'acquire') {
    const lease = await acquire(dev);
    console.log(`Đã kết nối ${lease.address}  (serial ${dev.serial}, adb server farm cổng ${lease.adbPort})`);
    console.log(`Dò màn hình: adb -P ${lease.adbPort} -s ${lease.address} shell ...`);
    console.log(`  hoặc: python3 scripts/ui_dump.py --port ${lease.adbPort} --serial ${lease.address}   — xong chạy "release".`);
  } else if (cmd === 'release') {
    // Chỉ trả máy tài khoản của mình đang giữ — máy người khác giữ thì farm cũng không cho, báo rõ thay vì lỗi mơ hồ.
    const token = await login(dev);
    const me = await api<{ user?: { email?: string; name?: string; username?: string } }>(dev, token, 'GET', '/user');
    const info = await api<{ device?: { using?: boolean; owner?: { email?: string; name?: string } } }>(dev, token, 'GET', `/devices/${dev.serial}`);
    const owner = info.json.device?.owner;
    if (info.json.device?.using && !sameOwner(owner, me.json.user)) {
      console.log(`Máy ${dev.serial} đang được ${owner?.name ?? owner?.email ?? 'người khác'} dùng, không phải tài khoản của bạn — không trả.`);
      process.exit(1);
    }
    await release(dev, token);
    console.log(`Đã trả máy ${dev.serial}`);
  } else if (cmd === 'status') {
    const token = await login(dev);
    const info = await api<{ device?: Record<string, unknown> }>(dev, token, 'GET', `/devices/${dev.serial}`);
    const d = info.json.device ?? {};
    console.log(JSON.stringify({ serial: dev.serial, present: d.present, using: d.using, owner: (d.owner as { name?: string } | null)?.name ?? null }));
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error((e as Error).message);
    process.exit(1);
  });
}
