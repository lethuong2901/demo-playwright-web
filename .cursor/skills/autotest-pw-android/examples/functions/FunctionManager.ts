import type { AndroidDevice } from '@playwright/test';
import { HomeFunction } from './api-demos/HomeFunction';
import { ControlsFunction } from './api-demos/ControlsFunction';

/**
 * FunctionManager — Android tổ chức theo FUNCTION (nghiệp vụ), mỗi object gói trọn 1 chức năng (trải nhiều
 * màn). Steps lấy qua fixture `functionManager`:
 *   When('...', async ({ functionManager }) => { await functionManager.getControlsFunction().typeText(...); });
 * Thêm 1 function: (1) import  (2) field  (3) new trong constructor  (4) getter getXxxFunction().
 */
export class FunctionManager {
  readonly device: AndroidDevice;
  readonly homeFunction: HomeFunction;
  readonly controlsFunction: ControlsFunction;

  constructor(device: AndroidDevice) {
    this.device = device;
    this.homeFunction = new HomeFunction(device);
    this.controlsFunction = new ControlsFunction(device);
  }

  getHomeFunction(): HomeFunction {
    return this.homeFunction;
  }

  getControlsFunction(): ControlsFunction {
    return this.controlsFunction;
  }
}
