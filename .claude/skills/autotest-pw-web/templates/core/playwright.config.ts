import { defineConfig, devices } from '@playwright/test';
import { defineBddProject } from 'playwright-bdd';
import { ENV, RUN } from './config/env';
import { TIMEOUTS } from './config/timeouts';

/**
 * Kiểu Cucumber (BDD): kịch bản Gherkin ở bdd/features/ (phẳng), step definitions TypeScript ở bdd/steps/.
 * Mỗi project lọc theo tag @web/@api/@android. `npx bddgen` sinh test vào .features-gen/<project> (gitignored) —
 * các npm script đã gọi sẵn; chạy tay: `npx bddgen && npx playwright test ...`.
 *
 * Projects (chọn bằng --project=<name>):
 *   setup         — đăng nhập UI 1 lần, lưu storageState (.auth/) — chỉ giữ khi web cần login
 *   web-chromium  — Feature gắn tag @web   (thêm web-firefox / web-webkit / mobile-web khi strategy yêu cầu)
 *   api           — Feature gắn tag @api   (không mở trình duyệt)
 *   android       — Feature gắn tag @android (autotest-pw-android thêm vào; luôn chạy --workers=1)
 */
/**
 * DNS_HOST_MAP "a.internal 10.0.0.1, b.internal 10.0.0.2" → Chromium --host-resolver-rules. Chromium cần chữ MAP
 * đứng trước TỪNG cặp host-IP ("MAP a 1.1.1.1, MAP b 2.2.2.2"); chỉ thêm một MAP ở đầu thì từ host thứ hai trở đi
 * bị bỏ qua. Cặp nào người dùng đã tự ghi MAP thì giữ nguyên.
 */
function hostResolverRules(map: string): string {
  return map
    .split(',')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => (/^MAP\s/i.test(rule) ? rule : `MAP ${rule}`))
    .join(', ');
}

function bdd(name: string, platform: string) {
  return defineBddProject({
    name,
    // Cấu trúc PHẲNG: mọi .feature ở bdd/features/, mọi step ở bdd/steps/. Project định tuyến theo TAG
    // (@web/@api/@android ở đầu mỗi Feature) chứ không theo thư mục con — project 1 platform khỏi lồng folder.
    features: 'bdd/features/**/*.feature',
    featuresRoot: 'bdd/features',
    steps: ['bdd/steps/**/*.ts'],
    outputDir: `.features-gen/${name}`,
    tags: `@${platform}`,
    missingSteps: 'fail-on-gen',
  });
}

export default defineConfig({
  outputDir: './results/test-results',
  // Ảnh chuẩn của toHaveScreenshot() — ngoài .features-gen/ (bị sinh lại mỗi lần bddgen); commit vào git
  snapshotPathTemplate: './bdd/__screenshots__/{projectName}/{testFileName}/{arg}{ext}',
  timeout: TIMEOUTS.test,
  expect: { timeout: TIMEOUTS.expect },
  // Song song / tuần tự: RUN_MODE + WORKERS (config/env.ts), hoặc --workers=1 khi chạy
  fullyParallel: RUN.mode === 'parallel',
  workers: RUN.mode === 'serial' ? 1 : RUN.workers ? Number(RUN.workers) : ENV.isCI ? 2 : undefined,
  forbidOnly: ENV.isCI,
  retries: ENV.isCI ? 1 : 0,
  // Không truyền --reporter trên dòng lệnh: nó THAY cả danh sách này → mất results.json/junit.xml.
  // Reporter gốc của Playwright (html/junit/json — summary, Jenkins JUnit, notify đều đọc từ đây) + Monocart.
  reporter: [
    ['list'],
    ['html', { outputFolder: './results/html-report', open: 'never' }],
    ['junit', { outputFile: './results/junit.xml' }],
    ['json', { outputFile: './results/results.json' }],
    // Monocart: 1 trang HTML gồm cây suite/scenario/step, lọc theo tag (@TC-NNN, @smoke...), đính kèm ảnh/video/trace.
    // Mở thẳng results/monocart-report/index.html hoặc `npm run report:monocart`.
    ['monocart-reporter', { name: 'Automation Test Report', outputFile: './results/monocart-report/index.html' }],
  ],
  use: {
    baseURL: ENV.baseUrl,
    // Local: headed (xem trình duyệt chạy); CI: headless. Đổi bằng HEADED env (config/env.ts).
    headless: !RUN.headed,
    actionTimeout: TIMEOUTS.action,
    navigationTimeout: TIMEOUTS.navigation,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    ignoreHTTPSErrors: true,
  },
  projects: [
    // { name: 'setup', testDir: './tests/setup', testMatch: /.*\.setup\.ts/ },
    {
      ...bdd('web-chromium', 'web'),
      // dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        // Only active when DNS_HOST_MAP is set — see config/env.ts and framework.md §6.
        launchOptions: ENV.dnsHostMap
          ? { args: [`--host-resolver-rules=${hostResolverRules(ENV.dnsHostMap)}`] }
          : {},
      },
    },
    {
      ...bdd('api', 'api'),
      use: { baseURL: ENV.apiBaseUrl },
    },
  ],
});
