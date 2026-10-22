import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

export class LoginPage extends BasePage {
  protected readonly path = '/client/#/auth/login';
  readonly email: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    super(page);
    this.email = page.getByPlaceholder('email@example.com');
    this.password = page.getByPlaceholder('enter your passsword');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.toast = page.getByRole('alert');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }
}
