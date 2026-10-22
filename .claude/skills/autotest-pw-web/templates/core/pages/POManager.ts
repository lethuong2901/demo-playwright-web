import type { Page } from '@playwright/test';
// import { LoginPage } from './login/LoginPage';

/**
 * POManager — theo khoá học (pageobjects_ts/POManager.ts): tạo sẵn MỌI page object trên cùng 1 tab
 * và trả về qua getter. Step definitions lấy nó từ fixture `poManager` (fixtures/web.fixture.ts):
 *   When('...', async ({ poManager }) => { await poManager.getLoginPage().login(...); });
 * Thêm 1 page: (1) import  (2) khai báo field  (3) new trong constructor  (4) getter getXxxPage().
 * Ví dụ đầy đủ: .claude/skills/autotest-pw-web/examples/pages/POManager.ts
 */
export class POManager {
  readonly page: Page;
  // readonly loginPage: LoginPage;

  constructor(page: Page) {
    this.page = page;
    // this.loginPage = new LoginPage(page);
  }

  // getLoginPage(): LoginPage {
  //   return this.loginPage;
  // }
}
