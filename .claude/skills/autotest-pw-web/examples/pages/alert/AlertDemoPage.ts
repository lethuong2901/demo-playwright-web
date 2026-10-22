import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/**
 * Example Page Object demonstrating alert handling patterns.
 * Target: Demoblaze signup popup (https://www.demoblaze.com)
 *
 * Key insight: Websites show window.alert() in two timing patterns:
 * - Sync (client-side validation): Alert blocks the click action
 * - Async (after API response): Alert appears after click completes
 *
 * See: references/web-best-practices.md §6.1
 */
export class AlertDemoPage extends BasePage {
  protected readonly path = '/';

  // Locators
  private readonly signupButton: Locator = this.page.locator('#signin2');
  private readonly signupModal: Locator = this.page.locator('#signInModal');
  private readonly usernameInput: Locator = this.page.locator('#sign-username');
  private readonly passwordInput: Locator = this.page.locator('#sign-password');
  private readonly submitButton: Locator = this.signupModal.locator('button[onclick="register()"]');

  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/demoblaze\.com/);
  }

  async openSignupModal(): Promise<void> {
    await this.signupButton.click();
    await expect(this.signupModal).toBeVisible();
  }

  async fillForm(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Pattern A: Sync alert handling
   * Use when alert appears IMMEDIATELY (client-side validation).
   * Alert blocks click action, so we MUST use page.once() to auto-accept.
   */
  async clickSubmitWithSyncAlert(): Promise<string> {
    const dialogPromise = new Promise<string>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        resolve(dialog.message());
        await dialog.accept();
      });
    });

    await this.submitButton.click();
    return dialogPromise;
  }

  /**
   * Pattern B: Async alert handling
   * Use when alert appears AFTER API response.
   * Click completes first, then we wait for the dialog.
   */
  async clickSubmitWithAsyncAlert(timeout = 15000): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog', { timeout });
    await this.submitButton.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }

  /**
   * Pattern C: Universal pattern (handles BOTH sync and async)
   * Use when you don't know if alert will be sync or async.
   * This is the RECOMMENDED pattern for form submissions.
   */
  async clickSubmitWithUniversalAlert(timeout = 15000): Promise<string> {
    const dialogPromise = new Promise<string>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        resolve(dialog.message());
        await dialog.accept();
      });
    });

    await this.submitButton.click();

    // Wait for dialog with timeout (handles both sync and async)
    const alertMessage = await Promise.race([
      dialogPromise,
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error(`No alert appeared within ${timeout}ms`)), timeout)
      ),
    ]);

    return alertMessage;
  }

  static generateRandomUsername(): string {
    return `testuser_${Date.now()}`;
  }
}
