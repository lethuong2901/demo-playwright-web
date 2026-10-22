import type { Page } from '@playwright/test';
import { SignupPage } from './signup/SignupPage';

/**
 * POManager — quản lý tất cả page objects
 * Step definitions lấy nó từ fixture `poManager` (fixtures/web.fixture.ts)
 */
export class POManager {
  readonly page: Page;
  readonly signupPage: SignupPage;

  constructor(page: Page) {
    this.page = page;
    this.signupPage = new SignupPage(page);
  }

  getSignupPage(): SignupPage {
    return this.signupPage;
  }
}
