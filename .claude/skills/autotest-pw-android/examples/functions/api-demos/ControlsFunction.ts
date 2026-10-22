import { expect, type AndroidDevice, type AndroidSelector } from '@playwright/test';
import { BaseFunction } from '@functions/base/BaseFunction';
import { ANDROID } from '@config/android';

const id = (name: string): AndroidSelector => ({ res: `${ANDROID.appPackage}:id/${name}` });

/** Views > Controls > "1. Light Theme" — locator verify live (ui_dump + probe). */
export class ControlsFunction extends BaseFunction {
  readonly textField = id('edit');
  readonly checkbox1 = id('check1');

  constructor(device: AndroidDevice) {
    super(device);
  }

  async expectLoaded(): Promise<void> {
    await this.waitVisible(this.textField);
    await this.waitVisible(this.checkbox1);
  }

  async typeText(text: string): Promise<void> {
    await this.fill(this.textField, text);
  }

  async tickCheckbox1(): Promise<void> {
    await this.tap(this.checkbox1);
  }

  async expectTextValue(text: string): Promise<void> {
    await this.expectText(this.textField, text);
  }

  async expectCheckbox1Checked(): Promise<void> {
    await expect.poll(async () => (await this.device.info(this.checkbox1)).checked, { message: 'Checkbox 1 checked' }).toBe(true);
  }
}
