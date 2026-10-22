import type { AndroidDevice, AndroidSelector } from '@playwright/test';
import { BaseFunction } from '@functions/base/BaseFunction';

/** Mục danh sách của ApiDemos: resource-id dùng chung `android:id/text1` → phân biệt bằng text (ui_dump gợi ý). */
export const listItem = (text: string): AndroidSelector => ({ res: 'android:id/text1', text });

/** Màn hình danh sách (màn chính và các màn con như Views, Controls). */
export class HomeFunction extends BaseFunction {
  readonly title: AndroidSelector = { text: 'API Demos' };

  constructor(device: AndroidDevice) {
    super(device);
  }

  async expectLoaded(): Promise<void> {
    await this.waitVisible(this.title);
  }

  async open(item: string): Promise<void> {
    await this.tap(listItem(item));
  }

  async expectItems(items: string[]): Promise<void> {
    for (const text of items) await this.waitVisible(listItem(text));
  }

  async expectItemVisible(item: string): Promise<void> {
    await this.waitVisible(listItem(item));
  }

  async scrollToItem(item: string): Promise<void> {
    await this.scrollTo(listItem(item), 'end');
  }
}
