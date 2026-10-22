import type { AndroidDevice } from '@playwright/test';
// import { LoginFunction } from './login/LoginFunction';

/**
 * FunctionManager — Android tổ chức theo FUNCTION (nghiệp vụ), KHÔNG theo từng màn: mỗi object gói TRỌN
 * một chức năng (thường trải nhiều màn) qua các method. Steps lấy từ fixture `functionManager`:
 *   When('...', async ({ functionManager }) => { await functionManager.getLoginFunction().login(...); });
 * Thêm 1 function: (1) import  (2) khai báo field  (3) new trong constructor  (4) getter getXxxFunction().
 */
export class FunctionManager {
  readonly device: AndroidDevice;
  // readonly loginFunction: LoginFunction;

  constructor(device: AndroidDevice) {
    this.device = device;
    // this.loginFunction = new LoginFunction(device);
  }

  // getLoginFunction(): LoginFunction {
  //   return this.loginFunction;
  // }
}
