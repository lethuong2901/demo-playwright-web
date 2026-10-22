import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';
import { TIMEOUTS } from '@config/timeouts';

/** https://rahulshettyacademy.com/angularpractice/ — course llc.spec.js (locator đặc biệt + ghi đè timeout). */
export class AngularPracticePage extends BasePage {
  protected readonly path = '/angularpractice/';
  readonly password: Locator;
  readonly gender: Locator;
  readonly shopLink: Locator;
  readonly checkoutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.password = page.getByPlaceholder('Password');      // getByPlaceholder
    this.gender = page.getByLabel('Gender');                  // getByLabel trên <select> → selectOption
    this.shopLink = page.getByRole('link', { name: 'Shop' }); // getByRole link
    this.checkoutLink = page.locator('a.nav-link.btn.btn-primary');
  }

  /** getByLabel + click / check (checkbox, radio có <label>) */
  async tickLabel(label: string): Promise<void> {
    await this.page.getByLabel(label).check();
  }

  async selectGender(value: string): Promise<void> {
    await this.gender.selectOption(value);
  }

  /** Ghi đè ACTION timeout cho riêng 1 bước (course: click({ timeout: 7000 })) */
  async submit(buttonName: string): Promise<void> {
    await this.page.getByRole('button', { name: buttonName }).click({ timeout: TIMEOUTS.action });
  }

  /** filter({ hasText }) rồi getByRole bên trong thẻ sản phẩm */
  async addProductToCart(product: string): Promise<void> {
    await this.page.locator('app-card').filter({ hasText: product }).getByRole('button').click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.password).toBeVisible();
  }
}
