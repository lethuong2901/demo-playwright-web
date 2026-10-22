import type { Page } from '@playwright/test';
import { LoginPage } from './login/LoginPage';
import { DashboardPage } from './dashboard/DashboardPage';
import { LoginPractisePage } from './practise/LoginPractisePage';
import { AutomationPracticePage } from './automation/AutomationPracticePage';
import { UploadDownloadPage } from './upload/UploadDownloadPage';
import { AngularPracticePage } from './angular/AngularPracticePage';
import { TodoPage } from './todo/TodoPage';

/**
 * POManager — theo khoá học (pageobjects_ts/POManager.ts): tạo sẵn MỌI page object trên cùng 1 tab
 * và trả về qua getter. Step definitions lấy nó từ fixture `poManager`:
 *   When('...', async ({ poManager }) => { await poManager.getLoginPage().login(...); });
 * Thêm 1 page: (1) import  (2) khai báo field  (3) new trong constructor  (4) getter getXxxPage().
 */
export class POManager {
  readonly page: Page;
  readonly loginPage: LoginPage;
  readonly dashboardPage: DashboardPage;
  readonly loginPractisePage: LoginPractisePage;
  readonly automationPracticePage: AutomationPracticePage;
  readonly uploadDownloadPage: UploadDownloadPage;
  readonly angularPracticePage: AngularPracticePage;
  readonly todoPage: TodoPage;

  constructor(page: Page) {
    this.page = page;
    this.loginPage = new LoginPage(page);
    this.dashboardPage = new DashboardPage(page);
    this.loginPractisePage = new LoginPractisePage(page);
    this.automationPracticePage = new AutomationPracticePage(page);
    this.uploadDownloadPage = new UploadDownloadPage(page);
    this.angularPracticePage = new AngularPracticePage(page);
    this.todoPage = new TodoPage(page);
  }

  getLoginPage(): LoginPage {
    return this.loginPage;
  }

  getDashboardPage(): DashboardPage {
    return this.dashboardPage;
  }

  getLoginPractisePage(): LoginPractisePage {
    return this.loginPractisePage;
  }

  getAutomationPracticePage(): AutomationPracticePage {
    return this.automationPracticePage;
  }

  getUploadDownloadPage(): UploadDownloadPage {
    return this.uploadDownloadPage;
  }

  getAngularPracticePage(): AngularPracticePage {
    return this.angularPracticePage;
  }

  getTodoPage(): TodoPage {
    return this.todoPage;
  }
}
