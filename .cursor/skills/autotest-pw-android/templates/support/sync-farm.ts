/**
 * Đồng bộ các file kết nối thiết bị / device farm của project (support/stf.ts, fixtures/android.fixture.ts,
 * config/android.ts, chính file này) theo bản mẫu của skill autotest-pw-android. Các file này được chép lúc dựng
 * project và KHÔNG bị ghi đè khi cài lại skill — cài bản skill mới mà project vẫn chạy file cũ → lỗi cũ vẫn còn.
 * Bản cũ luôn được lưu ở results/backup/<thời điểm>/ trước khi ghi.
 *
 * Hai cách chạy:
 *  1. globalSetup (playwright.config.ts): mỗi lượt `npx playwright test`, kể cả không qua skill — tìm skill đang
 *     cài trong project (.claude/ .cursor/ .agents/ … skills/autotest-pw-android/templates) và chép bản mới sang
 *     TRƯỚC khi worker nạp code. Không thấy skill (vd agent CI chỉ có automation_test/) → bỏ qua.
 *  2. Dòng lệnh — KHÔNG cần Python (máy không có python3 thì pw_scaffold.py android-sync không chạy được, project
 *     kẹt mãi ở bản cũ: đã gặp thật), chạy trong automation_test/:
 *       npx tsx <thư mục skill>/autotest-pw-android/templates/support/sync-farm.ts .
 *     Làm đủ việc của android-sync: chép file + gắn globalSetup vào playwright.config.ts + cảnh báo chế độ farm cũ.
 */
import fs from 'fs';
import path from 'path';

const MANAGED = ['support/stf.ts', 'fixtures/android.fixture.ts', 'config/android.ts', 'support/sync-farm.ts'];
/** Dấu vết của chế độ farm đã bỏ (dán Remote debug tay, refresh token). */
const STALE = /ANDROID_REMOTE_ADB|REFRESH_TOKEN|connectRemote|remoteAdb|stf\.ts (token|key)\b/;

/** Thư mục templates của autotest-pw-android trong project (cài cho bất kỳ công cụ AI nào). */
function skillTemplates(projectRoot: string): string | undefined {
  let entries: string[] = [];
  try {
    entries = fs.readdirSync(projectRoot).filter((d) => d.startsWith('.'));
  } catch {
    return undefined;
  }
  return entries
    .map((d) => path.join(projectRoot, d, 'skills', 'autotest-pw-android', 'templates'))
    .filter((dir) => fs.existsSync(path.join(dir, 'support', 'stf.ts')))
    .sort((a, b) => fs.statSync(path.join(b, 'support', 'stf.ts')).mtimeMs - fs.statSync(path.join(a, 'support', 'stf.ts')).mtimeMs)[0];
}

/** Giữ giá trị mặc định APP_PACKAGE / APP_ACTIVITY của project khi thay config/android.ts. */
function keepAppDefaults(template: string, current: string): string | undefined {
  let out = template;
  // Chuỗi chỗ trống dựng bằng template string: scaffold thay mọi chỗ trống viết nguyên văn trong file .ts lúc chép.
  for (const name of ['APP_PACKAGE', 'APP_ACTIVITY']) {
    const placeholder = `__${name}__`;
    const m = new RegExp(`optionalEnv\\('${name}',\\s*'([^']*)'\\)`).exec(current);
    if (!m) return undefined;
    out = out.split(placeholder).join(m[1]);
  }
  return out;
}

/** Chép file farm từ `templates` sang project `root`. Trả về các dòng báo cáo (UPDATED / OK / WARN). */
export function syncFiles(root: string, templates: string): string[] {
  const report: string[] = [];
  const backup = path.join(root, 'results', 'backup', new Date().toISOString().replace(/[:.]/g, '-'));
  for (const rel of MANAGED) {
    const source = path.join(templates, rel);
    const target = path.join(root, rel);
    if (!fs.existsSync(source)) continue;
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf-8') : '';
    let wanted: string | undefined = fs.readFileSync(source, 'utf-8');
    if (rel === 'config/android.ts') {
      wanted = current ? keepAppDefaults(wanted, current) : undefined;
      if (wanted === undefined) {
        report.push(`WARN không đọc được APP_PACKAGE/APP_ACTIVITY trong ${rel} — giữ nguyên, sửa tay theo template`);
        continue;
      }
    }
    if (wanted === current) {
      report.push(`OK (đã mới nhất) ${rel}`);
      continue;
    }
    if (current) {
      fs.mkdirSync(path.dirname(path.join(backup, rel)), { recursive: true });
      fs.writeFileSync(path.join(backup, rel), current);
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, wanted);
    report.push(`UPDATED ${rel}${current ? ` (bản cũ: ${path.relative(root, path.join(backup, rel))})` : ''}`);
  }
  return report;
}

/** Gắn globalSetup sync-farm + retries của project android vào playwright.config.ts (bỏ qua nếu đã có). */
function wireConfig(root: string): string[] {
  const cfg = path.join(root, 'playwright.config.ts');
  if (!fs.existsSync(cfg)) return ['WARN không thấy playwright.config.ts'];
  let text = fs.readFileSync(cfg, 'utf-8');
  const report: string[] = [];
  const single = /^(\s*)globalSetup:\s*(['"][^'"]+['"])\s*,/m.exec(text);
  if (text.includes('sync-farm')) {
    report.push('OK (đã gắn sync-farm) playwright.config.ts');
  } else if (single) {
    // globalSetup có sẵn (vd ./ci/allure-clean.ts) → gộp thành mảng, Playwright ≥1.49 chạy lần lượt
    text = text.replace(single[0], `${single[1]}globalSetup: [${single[2]}, './support/sync-farm.ts'],`);
    report.push('PATCHED playwright.config.ts (globalSetup + sync-farm)');
  } else if (text.includes('globalSetup')) {
    report.push("WARN playwright.config.ts có globalSetup dạng khác — thêm './support/sync-farm.ts' vào đó để file farm tự cập nhật");
  } else if (text.includes('export default defineConfig({\n')) {
    text = text.replace(
      'export default defineConfig({\n',
      "export default defineConfig({\n  // Android: trước mỗi lượt chạy, cập nhật file kết nối farm theo skill autotest-pw-android đang cài\n  globalSetup: './support/sync-farm.ts',\n",
    );
    report.push('PATCHED playwright.config.ts (globalSetup sync-farm)');
  } else {
    report.push("WARN không tìm thấy 'export default defineConfig({' — thêm globalSetup: './support/sync-farm.ts' bằng tay");
  }
  const noRetry = '      fullyParallel: false,\n      retries: 0,\n';
  if (text.includes(noRetry)) {
    text = text.replace(
      noRetry,
      '      fullyParallel: false,\n      // Chạy lại 1 lần: máy farm rớt kết nối giữa chừng thì worker kết nối lại, test chạy lại trên kết nối mới\n      retries: Number(process.env.ANDROID_RETRIES ?? 1),\n',
    );
    report.push('PATCHED playwright.config.ts (ANDROID_RETRIES)');
  }
  fs.writeFileSync(cfg, text);
  return report;
}

/** File ngoài danh sách quản lý còn nhắc chế độ farm đã bỏ → cảnh báo để sửa sang ANDROID_DEVICE_URL. */
function staleWarnings(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!['node_modules', 'results', '.features-gen', '.auth'].includes(e.name)) walk(full);
        continue;
      }
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (MANAGED.includes(rel) || !(/\.(ts|feature|md|env|example)$/.test(e.name) || e.name === 'Jenkinsfile')) continue;
      if (STALE.test(fs.readFileSync(full, 'utf-8'))) out.push(`WARN ${rel} còn nhắc chế độ farm đã bỏ (ANDROID_REMOTE_ADB / refresh token) — sửa sang ANDROID_DEVICE_URL`);
    }
  };
  walk(root);
  return out;
}

/** globalSetup: chép bản mới từ skill đang cài trong project (im lặng nếu không có gì đổi). */
export default function syncFarm(): void {
  const root = path.resolve(__dirname, '..'); // automation_test/
  const templates = skillTemplates(path.dirname(root));
  if (!templates) return;
  for (const line of syncFiles(root, templates)) {
    if (line.startsWith('UPDATED')) console.log(`[sync-farm] Cập nhật ${line.slice(8)} theo skill autotest-pw-android mới`);
    else if (line.startsWith('WARN')) console.log(`[sync-farm] ${line}`);
  }
}

// Chạy bằng dòng lệnh: npx tsx <skill>/templates/support/sync-farm.ts <automation_test>
if (process.argv[1] && /sync-farm\.ts$/.test(process.argv[1]) && process.argv.length > 2) {
  const root = path.resolve(process.argv[2]);
  if (!fs.existsSync(path.join(root, 'fixtures', 'android.fixture.ts'))) {
    console.log(`SKIP: ${root} chưa có android (không thấy fixtures/android.fixture.ts) — dựng bằng scaffold trước`);
    process.exit(0);
  }
  // Chạy từ chính thư mục templates của skill → dùng nó; chạy bản đã chép trong project → tìm skill cài trong project
  const ownTemplates = path.resolve(__dirname, '..');
  const templates = /autotest-pw-android[\\/]templates$/.test(ownTemplates) ? ownTemplates : skillTemplates(path.dirname(root));
  if (!templates) {
    console.log('ERROR: không tìm thấy templates của skill autotest-pw-android');
    process.exit(1);
  }
  console.log([...syncFiles(root, templates), ...wireConfig(root), ...staleWarnings(root)].join('\n'));
}
