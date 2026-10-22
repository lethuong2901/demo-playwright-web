/**
 * Single entry point for environment values.
 * Non-secret values from automation_test/docs/global-data.md
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
  name: optionalEnv('TEST_ENV', 'staging'),
  baseUrl: optionalEnv('BASE_URL', 'https://www.demoblaze.com'),
  apiBaseUrl: optionalEnv('API_BASE_URL', 'https://www.demoblaze.com'),
  dnsHostMap: optionalEnv('DNS_HOST_MAP', ''),
  isCI: !!process.env.CI,
} as const;

export const RUN = {
  mode: optionalEnv('RUN_MODE', 'parallel') as 'parallel' | 'serial',
  workers: optionalEnv('WORKERS'),
  headed: optionalEnv('HEADED', process.env.CI ? 'false' : 'true') === 'true',
} as const;

export const AUTH = {
  loginEndpoint: optionalEnv('EP_LOGIN', 'none'),
  usernameField: optionalEnv('LOGIN_USERNAME_FIELD', 'username'),
  passwordField: optionalEnv('LOGIN_PASSWORD_FIELD', 'password'),
  tokenField: optionalEnv('TOKEN_FIELD', 'token'),
  tokenScheme: optionalEnv('TOKEN_SCHEME', 'Bearer') as 'Bearer' | 'raw',
} as const;

export const CREDENTIALS = {
  web: {
    get username() { return requireEnv('WEB_USERNAME'); },
    get password() { return requireEnv('WEB_PASSWORD'); },
  },
};
