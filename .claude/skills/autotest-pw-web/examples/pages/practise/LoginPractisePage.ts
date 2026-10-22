import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/** https://rahulshettyacademy.com/loginpagePractise/ — course UIBasicstest.spec.js (dropdown, radio, checkbox, child window). */
export class LoginPractisePage extends BasePage {
  protected readonly path = '/loginpagePractise/';
  readonly username: Locator;
  readonly roleDropdown: Locator;
  readonly okayButton: Locator;
  readonly terms: Locator;
  readonly documentLink: Locator;

  constructor(page: Page) {
    super(page);
    this.username = page.locator('#username');
    this.roleDropdown = page.locator('select.form-control');
    this.okayButton = page.locator('#okayBtn');
    this.terms = page.locator('#terms');
    this.documentLink = page.locator("[href*='documents-request']");
  }

  /** Static <select>: chọn theo value (hoặc { label }) */
  async selectRole(value: string): Promise<void> {
    await this.roleDropdown.selectOption(value);
  }

  /** Radio theo nhãn hiển thị ("Admin" / "User"); "User" mở popup xác nhận → bấm Okay */
  async chooseUserType(label: string): Promise<void> {
    await this.userTypeRadio(label).check();
    if (label === 'User') await this.okayButton.click();
  }

  /** Radio theo accessible name — dùng cho assertion toBeChecked() */
  userTypeRadio(label: string): Locator {
    return this.page.getByRole('radio', { name: label });
  }

  /** Mở link ở TAB MỚI (child window) và trả về page của tab đó — đăng ký chờ event trước khi click */
  async openDocumentLinkInNewTab(): Promise<Page> {
    const [newPage] = await Promise.all([this.page.context().waitForEvent('page'), this.documentLink.click()]);
    await newPage.waitForLoadState();
    return newPage;
  }

  async expectLoaded(): Promise<void> {
    await expect(this.username).toBeVisible();
  }
}
