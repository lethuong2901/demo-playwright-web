/**
 * Single entry point for environment values.
 *
 * Precedence (same as the RF framework's env_secrets.py): real environment variable
 * > env file > empty. Env file = $AUTOTEST_ENV_FILE (Jenkins Secret file credential) or
 * automation_test/.env, created and maintained by the autotest-credentials skill —
 * never read or print its values, only reference key names.
 *
 * Non-secret values (URLs, timeouts, app package...) come from automation_test/docs/global-data.md
 * and are written as defaults below; CI may override them with env vars.
 */
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.AUTOTEST_ENV_FILE || path.resolve(__dirname, '..', '.env'), quiet: true });

/** Optional value: env var or .env, else the given default. */
export function optionalEnv(key: string, fallback = ''): string {
  const value = process.env[key];
  return value === undefined || value === '' ? fallback : value;
}

/** Required secret: fails the test with the key NAME only (never the value). */
export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Thiếu credential "${key}". Điền vào automation_test/.env (hoặc biến môi trường CI) rồi chạy lại.`,
    );
  }
  return value;
}

export const ENV = {
  /** Target environment name (Jenkins param ENV), used for reporting/notification. */
  name: optionalEnv('TEST_ENV', 'staging'),
  /** global-data.md → **Base URL** */
  baseUrl: optionalEnv('BASE_URL', '__BASE_URL__'),
  /** global-data.md / api-reference.md → API base (keep the trailing slash; endpoints are relative). */
  apiBaseUrl: optionalEnv('API_BASE_URL', '__API_BASE_URL__'),
  /**
   * Escape hatch for a STALLING DNS RESOLVER on the machine running the tests — leave empty unless
   * you hit it. Symptom: most/all web scenarios fail with `page.goto: Timeout … waiting until "load"`,
   * including tests that were green yesterday, while the site opens fine in a normal browser.
   *
   * Typical cause (seen on macOS + corporate VPN): the DNS *servers* answer instantly, but the OS
   * resolver that Chromium/Node actually use (`getaddrinfo`) stalls ~30s for internal hostnames only.
   * The stall alone exceeds `navigationTimeout`, so every navigation dies. Diagnose and fix:
   * framework.md §6 "page.goto times out everywhere".
   *
   * `DNS_HOST_MAP="host.internal 10.0.0.1"` makes Chromium map the host straight to the IP
   * (`--host-resolver-rules`), skipping the OS resolver. Several entries: comma-separate them,
   * e.g. "a.internal 10.0.0.1, b.internal 10.0.0.2". Empty (default, including CI) changes nothing.
   * This is a workaround on the test machine, not a fix: repair the resolver/VPN when you can.
   */
  dnsHostMap: optionalEnv('DNS_HOST_MAP', ''),
  isCI: !!process.env.CI,
} as const;

/**
 * Chạy song song hay tuần tự (khoá học: workers, test.describe.configure({ mode })).
 *   RUN_MODE=parallel (mặc định) — các scenario chạy song song trên WORKERS worker (bỏ trống = Playwright tự chọn)
 *   RUN_MODE=serial              — 1 worker, chạy lần lượt từng scenario (debug, môi trường yếu, dữ liệu dùng chung)
 * Ghi đè khi chạy: RUN_MODE=serial npx playwright test …  hoặc  npx playwright test --workers=1 …
 * Cần tuần tự chỉ trong 1 feature (các scenario phụ thuộc nhau) → tag @mode:serial trên dòng Feature.
 */
export const RUN = {
  mode: optionalEnv('RUN_MODE', 'parallel') as 'parallel' | 'serial',
  workers: optionalEnv('WORKERS'),
  // Local mặc định HIỆN cửa sổ trình duyệt (headed) để xem test thao tác khi viết/chạy thử; CI luôn headless.
  // Ghi đè: HEADED=false để ẩn khi chạy local, HEADED=true để hiện trên CI. (--headed/--headless trên CLI vẫn ưu tiên.)
  headed: optionalEnv('HEADED', process.env.CI ? 'false' : 'true') === 'true',
} as const;

/** Login API contract — global-data.md → ## Authentication. loginEndpoint 'none' = API without auth. */
export const AUTH = {
  loginEndpoint: optionalEnv('EP_LOGIN', '__EP_LOGIN__'),
  usernameField: optionalEnv('LOGIN_USERNAME_FIELD', 'username'),
  passwordField: optionalEnv('LOGIN_PASSWORD_FIELD', 'password'),
  /** Dotted path in the login response, e.g. 'token' or 'data.accessToken'. */
  tokenField: optionalEnv('TOKEN_FIELD', 'token'),
  /** 'Bearer' → "Authorization: Bearer <t>"; 'raw' → "Authorization: <t>". */
  tokenScheme: optionalEnv('TOKEN_SCHEME', 'Bearer') as 'Bearer' | 'raw',
} as const;

/** Credentials are getters so a missing key only fails the tests that actually use it. */
export const CREDENTIALS = {
  web: {
    get username() { return requireEnv('WEB_USERNAME'); },
    get password() { return requireEnv('WEB_PASSWORD'); },
  },
  api: {
    get username() { return requireEnv('API_USERNAME'); },
    get password() { return requireEnv('API_PASSWORD'); },
  },
  app: {
    get username() { return requireEnv('APP_USERNAME'); },
    get password() { return requireEnv('APP_PASSWORD'); },
  },
};
