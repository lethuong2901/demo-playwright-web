import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Base for every page object. Holds only behaviour shared by all screens —
 * feature logic goes in pages/<feature>/<Name>Page.ts.
 */
export abstract class BasePage {
  /** Relative path (resolved against baseURL). Override in pages that can be opened directly. */
  protected readonly path: string = '/';

  constructor(protected readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** Web-first check that the page is the expected one. Override with a stable anchor element. */
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(this.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  /** Text of a locator, never null (textContent() returns string | null). */
  protected async textOf(locator: Locator): Promise<string> {
    return ((await locator.textContent()) ?? '').trim();
  }
}
