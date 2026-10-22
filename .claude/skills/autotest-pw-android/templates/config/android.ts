import { optionalEnv } from './env';

/** Non-secret Android settings — defaults from automation_test/docs/global-data.md, overridable by env/CI. */
export const ANDROID = {
  /** adb serial (`adb devices`); empty = first connected device. */
  serial: optionalEnv('ANDROID_SERIAL'),
  appPackage: optionalEnv('APP_PACKAGE', '__APP_PACKAGE__'),
  appActivity: optionalEnv('APP_ACTIVITY', '__APP_ACTIVITY__'),
  /** Optional LOCAL path of the APK to install once per worker (Jenkins downloads APK_URL to this path first). */
  apkPath: optionalEnv('APK_PATH'),
  /**
   * Xoá app data trước mỗi test để có state sạch (`pm clear`). ⚠️ `pm clear` XOÁ SẠCH phiên đăng nhập /
   * tài khoản đã lưu / token sinh trắc. Với bản store/production đăng nhập sẵn, SSO, hoặc app cần OTP để
   * đăng nhập lại → PHẢI đặt APP_CLEAR_DATA=false, nếu không mỗi test sẽ phải login + OTP lại (hoặc mất tài
   * khoản). Chỉ để "true" cho app test/dev tự login được bằng credential trong .env.
   */
  clearData: optionalEnv('APP_CLEAR_DATA', 'true') === 'true',
  /**
   * Device farm MCloud (STF): ANDROID_DEVICE_URL = link control, vd http://10.207.247.201/#!/control/<serial>.
   * Cần tài khoản Keycloak device farm (VDS_STF_<HOST>_USER/_PASSWORD ở ~/.vds/sdlc-config.env) — fixture TỰ ĐỘNG: đăng nhập →
   * tự đăng ký ADB key → mượn máy → bật remote debug → adb connect (support/stf.ts). Bỏ trống = máy USB / emulator.
   */
  deviceUrl: optionalEnv('ANDROID_DEVICE_URL'),
  adbHost: optionalEnv('ADB_HOST', '127.0.0.1'),
  adbPort: Number(optionalEnv('ADB_PORT', '5037')),
} as const;
