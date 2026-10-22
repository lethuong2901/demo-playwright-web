import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/**
 * Demoblaze Signup Page Object
 * Locators từ business-scenario.md
 */
export class SignupPage extends BasePage {
  protected readonly path = '/';

  // Header elements
  private readonly signupButtonHeader: Locator = this.page.locator('#signin2');

  // Modal elements
  private readonly signupModal: Locator = this.page.locator('#signInModal');
  private readonly modalTitle: Locator = this.signupModal.locator('.modal-title');
  private readonly usernameInput: Locator = this.page.locator('#sign-username');
  private readonly passwordInput: Locator = this.page.locator('#sign-password');
  private readonly signupButtonModal: Locator = this.signupModal.locator('button[onclick="register()"]');
  private readonly closeButton: Locator = this.signupModal.locator('.btn-secondary');

  constructor(page: Page) {
    super(page);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/demoblaze\.com/);
  }

  // TC-001: Kiểm tra hiển thị nút Sign up trên header
  async expectSignupButtonVisible(): Promise<void> {
    await expect(this.signupButtonHeader).toBeVisible();
    await expect(this.signupButtonHeader).toHaveText('Sign up');
  }

  // TC-002: Click nút Sign up để mở popup
  async clickSignupButton(): Promise<void> {
    await this.signupButtonHeader.click();
  }

  // TC-002: Kiểm tra popup hiển thị đầy đủ
  async expectModalVisible(): Promise<void> {
    await expect(this.signupModal).toBeVisible();
    await expect(this.modalTitle).toHaveText('Sign up');
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.closeButton).toBeVisible();
    await expect(this.signupButtonModal).toBeVisible();
  }

  // TC-003, TC-004, TC-005, TC-006: Nhập username
  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  // TC-003, TC-004, TC-005, TC-006: Nhập password
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  // TC-003, TC-004, TC-005, TC-006: Click nút Sign up trong modal
  async clickSignupButtonInModal(): Promise<void> {
    await this.signupButtonModal.click();
  }

  // TC-007: Click nút Close
  async clickCloseButton(): Promise<void> {
    await this.closeButton.click();
  }

  // TC-007: Kiểm tra modal đã đóng
  async expectModalHidden(): Promise<void> {
    await expect(this.signupModal).not.toBeVisible();
  }

  // Full signup flow
  async signup(username: string, password: string): Promise<void> {
    await this.fillUsername(username);
    await this.fillPassword(password);
    await this.clickSignupButtonInModal();
  }

  // Generate random username để tránh trùng
  static generateRandomUsername(): string {
    return `testuser_${Date.now()}`;
  }
}
