import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { test as base, type AndroidDevice } from '@playwright/test';
import { _android } from 'playwright';
import { ANDROID } from '@config/android';
import { FunctionManager } from '@functions/FunctionManager';
import { hideKeyboard } from '@functions/base/BaseFunction';
import { acquire, adbPath, checkFarmHost, credKeys, download, farmAdb, farmCredsAvailable, parseControlUrl, release, unzipTo, type Lease } from '@support/stf';

export interface AndroidWorkerFixtures {
  /** Connected device, opened once per worker (run android with --workers=1). */
  device: AndroidDevice;
}

export interface AndroidFixtures {
  /** Device with the app under test launched in a known state; force-stopped after the test. */
  app: AndroidDevice;
  /** Mọi FUNCTION object qua 1 manager (tổ chức theo chức năng) — phụ thuộc `app` nên app mở trước. */
  functionManager: FunctionManager;
}

/** `adb <args>` — returns stdout+stderr text, never throws (adb prints errors on stdout too). */
function adb(...args: string[]): string {
  try {
    return execFileSync(adbPath(), args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000 });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; message: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}` || err.message;
  }
}

/** Trạng thái của address trong `adb devices` ('device' | 'offline' | 'unauthorized' | 'authorizing' | ''). */
function adbState(address: string): string {
  const line = adb('devices').split('\n').find((l) => l.startsWith(`${address}\t`));
  return line ? line.trim().split(/\s+/)[1] ?? '' : '';
}

/**
 * Một thiết bị offline/unauthorized trong `adb devices` làm _android.devices() treo tới hết timeout
 * (đã gặp thật). Kiểm tra trước để báo lỗi rõ ràng.
 */
function assertNoStuckDevices(run: (...args: string[]) => string = adb): void {
  const stuck = run('devices')
    .split('\n')
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([id, state]) => id && state && state !== 'device');
  if (stuck.length) {
    const list = stuck.map(([id, state]) => `${id} (${state})`).join(', ');
    throw new Error(
      `adb có thiết bị chưa sẵn sàng: ${list} — Playwright sẽ treo. Máy farm: "adb disconnect <host:port>"; ` +
        'máy USB: mở khoá + chấp nhận "Allow USB debugging" hoặc rút ra.',
    );
  }
}

/**
 * Chuẩn bị thiết bị 1 lần/worker (nhất là máy farm): tắt Google Play Protect quét app cài qua adb — nếu không,
 * driver APK của Playwright (`com.microsoft.playwright.androiddriver.test`, build cho Android cũ) bị chặn bằng
 * hộp thoại che màn hình → mọi thao tác timeout. Đóng luôn hộp thoại Play Protect đang hiện (nếu có).
 */
export async function prepareDevice(device: AndroidDevice): Promise<void> {
  // Màn hình tắt (Dozing — máy farm tự tắt giữa lượt chạy) → UiAutomator không thao tác được, test treo tới hết
  // timeout. Đánh thức + giữ màn sáng khi đang sạc (máy farm luôn cắm sạc).
  await device.shell('input keyevent KEYCODE_WAKEUP').catch(() => undefined);
  await device.shell('svc power stayon true').catch(() => undefined);
  for (const s of ['verifier_verify_adb_installs 0', 'package_verifier_user_consent -1']) {
    await device.shell(`settings put global ${s}`).catch(() => undefined);
  }
  const focus = (await device.shell('dumpsys window | grep mCurrentFocus').catch(() => '')).toString();
  if (/packageinstaller|play.?protect|harmful|GppMainActivity/i.test(focus)) {
    await device.input.press('Back'); // đóng hộp thoại "Đã chặn ứng dụng không an toàn"
  }
}

/**
 * Hộp thoại hệ thống chặn màn hình: ANR "… isn't responding" / crash "… keeps stopping" — thường của app
 * KHÁC trên emulator/farm quá tải (đã gặp: Digital Wellbeing). Khi cửa sổ đó giữ focus, mọi lệnh UiAutomator
 * trả NullPointerException → phát hiện bằng `dumpsys window` (không qua UiAutomator):
 *  - của app khác → force-stop app đó (hộp thoại tự đóng);
 *  - của chính app đang test → throw (có thể là bug thật, không che đi).
 * Trả về số hộp thoại đã đóng.
 */
export async function dismissSystemDialogs(device: AndroidDevice, appPackage = ANDROID.appPackage, rounds = 3): Promise<number> {
  let closed = 0;
  for (let i = 0; i < rounds; i++) {
    const focus = (await device.shell('dumpsys window | grep mCurrentFocus')).toString();
    const m = /(Application Not Responding|Application Error): ([\w.]+)/.exec(focus);
    if (!m) break;
    const [, kind, pkg] = m;
    if (pkg === appPackage) {
      throw new Error(`App đang test (${pkg}) hiện "${kind}" — có thể là bug thật, xem ảnh/logcat.`);
    }
    await device.shell(`am force-stop ${pkg}`);
    closed++;
  }
  return closed;
}

/**
 * Thiết bị còn trả lời không. Mất kết nối (máy farm rớt mạng, farm thu hồi máy, rút cáp) thì lệnh shell TREO
 * tới hết timeout của test → chặn bằng thời hạn ngắn và báo rõ. Test fail thì Playwright dựng lại worker:
 * fixture `device` trả máy, mượn + kết nối lại từ đầu; test được chạy lại theo `retries` của project android
 * (mặc định 1, đổi bằng ANDROID_RETRIES).
 */
export async function assertDeviceAlive(device: AndroidDevice, ms = 15_000): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const dead = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    await Promise.race([device.shell('echo ok'), dead]);
  } catch {
    throw new Error(
      `Mất kết nối thiết bị ${device.serial()} (không trả lời sau ${ms / 1000}s). Worker sẽ được dựng lại và ` +
        'kết nối lại từ đầu; máy farm rớt thường xuyên → chạy "npx tsx support/stf.ts doctor <link>" và kiểm tra mạng tới farm.',
    );
  } finally {
    clearTimeout(timer);
  }
}

const DRIVER_APKS = ['android-driver.apk', 'android-driver-target.apk'];

/** APK = file zip: phải có bản ghi "End of central directory" (PK\x05\x06) ở cuối. File tải đứt giữa chừng thì không có. */
function apkIntact(file: string): boolean {
  try {
    const buf = fs.readFileSync(file);
    return buf.length > 22 && buf.subarray(Math.max(0, buf.length - 65_557)).includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  } catch {
    return false;
  }
}

const driverReady = (dir: string): boolean => DRIVER_APKS.every((f) => apkIntact(path.join(dir, f)));

/** Thư mục + URL tải driver Android lấy từ chính registry của Playwright đang cài (đúng revision, đúng cache). */
function driverInfo(): { dir: string; urls: string[] } | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registry } = require('playwright-core/lib/server/registry/index') as {
      registry: { findExecutable(name: string): { directory?: string; downloadURLs?: string[] } | undefined };
    };
    const exe = registry.findExecutable('android');
    return exe?.directory ? { dir: exe.directory, urls: exe.downloadURLs ?? [] } : undefined;
  } catch {
    return undefined; // Playwright đổi cấu trúc nội bộ → chỉ dùng `playwright install`
  }
}

function playwrightInstallAndroid(): void {
  try {
    execFileSync('npx', ['playwright', 'install', 'android'], { stdio: 'ignore', shell: process.platform === 'win32', timeout: 300_000 });
  } catch {
    /* lỗi tải / crash → tự tải bên dưới */
  }
}

/**
 * Bảo đảm driver Android của Playwright có và NGUYÊN VẸN trong cache — lỗi "Please install Android driver apk" chỉ hiện ở
 * thao tác UI đầu tiên, và driver hỏng còn tệ hơn: đã gặp thật trên Windows sau proxy công ty:
 *  - APK tải đứt (thiếu 1.313 byte cuối) nhưng thư mục vẫn có INSTALLATION_COMPLETE → `install` coi là đã cài, thiết bị
 *    báo INSTALL_PARSE_FAILED_NOT_APK, driver không bao giờ chạy, _android.devices() treo vô hạn ở "Polling the socket";
 *  - `npx playwright install android` CRASH (`String.repeat(Infinity)` ở thanh tiến trình) khi chạy không có terminal
 *    và proxy trả file không kèm Content-Length → không cài được gì.
 * → Kiểm tra từng APK; thiếu/hỏng thì thử `playwright install`, vẫn không được thì TỰ TẢI android.zip từ URL của
 * registry bằng bộ tải theo proxy (support/stf.ts → download), giải nén, kiểm tra lại, đặt dấu INSTALLATION_COMPLETE.
 */
async function ensureAndroidDriver(): Promise<void> {
  const info = driverInfo();
  if (info && driverReady(info.dir)) return;
  playwrightInstallAndroid();
  if (!info || driverReady(info.dir)) return;

  const errors: string[] = [];
  for (const url of info.urls) {
    const zip = path.join(os.tmpdir(), `pw-${path.basename(info.dir)}-${process.pid}.zip`);
    const why = await download(url, zip);
    if (why) {
      errors.push(`${new URL(url).host}: ${why}`);
      continue;
    }
    fs.rmSync(info.dir, { recursive: true, force: true });
    unzipTo(zip, info.dir, path.join(info.dir, DRIVER_APKS[0]));
    fs.rmSync(zip, { force: true });
    if (driverReady(info.dir)) {
      for (const marker of ['INSTALLATION_COMPLETE', 'DEPENDENCIES_VALIDATED']) fs.writeFileSync(path.join(info.dir, marker), '');
      return;
    }
    errors.push(`${new URL(url).host}: giải nén xong nhưng APK không nguyên vẹn`);
  }
  throw new Error(
    `Không cài được driver Android của Playwright vào ${info.dir} (${errors.join('; ') || 'không có URL tải'}). ` +
      'Kiểm tra mạng/HTTPS_PROXY rồi chạy "npx playwright install android".',
  );
}

/** _android.devices() kết nối + khởi động driver trên từng máy; driver không lên được thì nó treo vô hạn → chặn bằng thời hạn. */
async function listDevices(port: number, ms = 150_000): Promise<AndroidDevice[]> {
  let timer: NodeJS.Timeout | undefined;
  const hung = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `Playwright không khởi động được driver Android sau ${ms / 1000}s (treo ở "Polling the socket"). Nguyên nhân thường gặp: ` +
              'APK driver trong cache bị hỏng (xoá thư mục ms-playwright/android-* rồi "npx playwright install android"), ' +
              'Play Protect chặn cài driver, máy khoá màn hình. Xem chi tiết: chạy lại với DEBUG=pw:android.',
          ),
        ),
      ms,
    );
  });
  try {
    return await Promise.race([_android.devices({ host: ANDROID.adbHost, port }), hung]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Hộp thoại xin quyền runtime (thông báo, thiết bị ở gần, vị trí…) che màn hình đầu tiên của app và không có trong TC
 * → cấp sẵn mọi quyền runtime app khai báo mà chưa được cấp. Quyền không cấp được (không phải runtime) thì bỏ qua.
 */
async function grantRuntimePermissions(device: AndroidDevice, appPackage: string): Promise<void> {
  const info = (await device.shell(`dumpsys package ${appPackage}`).catch(() => '')).toString();
  const denied = new Set([...info.matchAll(/(android\.permission\.[A-Z_]+): granted=false/g)].map((m) => m[1]));
  for (const perm of denied) await device.shell(`pm grant ${appPackage} ${perm}`).catch(() => undefined);
}

export const androidTest = base.extend<AndroidFixtures, AndroidWorkerFixtures>({
  device: [
    async ({}, use) => {
      // 2 cách lấy thiết bị:
      //  A. Device farm: ANDROID_DEVICE_URL là link control STF → bắt buộc có tài khoản Keycloak device farm trong
      //     ~/.vds/sdlc-config.env; tự đăng nhập, tự đăng ký ADB key, mượn máy, adb connect (support/stf.ts).
      //  B. Local: không có ANDROID_DEVICE_URL → máy cắm USB / emulator (ANDROID_SERIAL nếu nhiều máy).
      const url = ANDROID.deviceUrl;
      let lease: Lease | undefined;
      if (url) {
        const dev = parseControlUrl(url);
        await checkFarmHost(dev); // link sai / mất mạng tới farm → báo đúng lỗi đó, không báo nhầm thiếu tài khoản
        if (!farmCredsAvailable(dev)) {
          const { user, pass } = credKeys(dev);
          throw new Error(`Chạy trên device farm cần tài khoản Keycloak device farm (do DevOps Trung tâm Vận hành Khai thác cấp): mở ~/.vds/sdlc-config.env, điền ${user}= và ${pass}= (không dán vào chat).`);
        }
        lease = await acquire(dev); // tự đăng ký key + adb server farm riêng (FARM_ADB_PORT)
      }
      const serial = lease?.address || ANDROID.serial;
      // Farm-AUTO dùng adb server riêng của farm; các chế độ khác dùng server mặc định (ADB_PORT, 5037).
      assertNoStuckDevices(lease ? farmAdb : adb);
      await ensureAndroidDriver();
      let devices: AndroidDevice[];
      try {
        devices = await listDevices(lease ? lease.adbPort : ANDROID.adbPort);
      } catch (e) {
        if (lease) await release(lease.dev, undefined, lease.address);
        throw e;
      }
      const device = serial ? devices.find((d) => d.serial() === serial) : devices[0];
      if (!device) {
        if (lease) await release(lease.dev, undefined, lease.address);
        throw new Error(`Không thấy thiết bị Android${serial ? ` ${serial}` : ''} — kiểm tra "adb devices".`);
      }
      try {
        await prepareDevice(device);
        if (ANDROID.apkPath) await device.installApk(ANDROID.apkPath);
        await use(device);
      } finally {
        await device.close();
        if (lease) await release(lease.dev, undefined, lease.address); // ngắt adb + tắt remote debug + trả máy cho farm
      }
    },
    // Lần đầu: Playwright cài driver lên máy + khởi động — có thể mất 1–2 phút (emulator, farm)
    { scope: 'worker', timeout: 180_000 },
  ],
  app: async ({ device }, use, testInfo) => {
    const { appPackage, appActivity } = ANDROID;
    await assertDeviceAlive(device); // rớt giữa 2 test → báo ngay thay vì treo hết timeout
    const installed = (await device.shell(`pm path ${appPackage}`).catch(() => '')).toString().includes('package:');
    if (!installed) {
      throw new Error(
        `App "${appPackage}" chưa cài trên thiết bị đang chạy (${device.serial()}). ` +
          `Thường do lệnh chạy KHÔNG có ANDROID_DEVICE_URL nên fixture lấy thiết bị đầu tiên trong "adb devices" ` +
          `(vd emulator) thay vì máy farm có cài app. Khắc phục: chạy với ` +
          `ANDROID_DEVICE_URL='http://<host>/#!/control/<serial>' (nháy ĐƠN — URL có '!'; hoặc ANDROID_SERIAL của đúng máy), ` +
          `hoặc đặt APK_PATH/APK_URL để fixture tự cài app.`,
      );
    }
    // am start chỉ đưa app ĐANG CHẠY ra trước, giữ nguyên màn cũ (vd màn còn lại từ lượt test trước / thao tác tay)
    // → luôn force-stop để mỗi test mở app từ đầu. APP_CLEAR_DATA=false vẫn giữ phiên đăng nhập.
    await device.shell(`am force-stop ${appPackage}`);
    if (ANDROID.clearData) await device.shell(`pm clear ${appPackage}`);
    await grantRuntimePermissions(device, appPackage);
    await hideKeyboard(device); // bàn phím / bảng của bàn phím còn sót từ test trước sẽ che app
    await device.shell(`am start -W -n ${appPackage}/${appActivity}`);
    await dismissSystemDialogs(device);
    await use(device);
    if (testInfo.status !== testInfo.expectedStatus) {
      // Saved as a file (not a body) so ci/summarize.ts + collage pick it up like web screenshots
      const file = testInfo.outputPath('test-failed-android.png');
      await device.screenshot({ path: file });
      await testInfo.attach('screenshot', { path: file, contentType: 'image/png' });
    }
    await device.shell(`am force-stop ${appPackage}`);
  },
  functionManager: async ({ app }, use) => use(new FunctionManager(app)),
});
