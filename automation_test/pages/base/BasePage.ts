import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Base for every page object. Holds only behaviour shared by all screens.
 */
export abstract class BasePage {
  protected readonly path: string = '/';

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  protected async textOf(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').trim();
  }
}
