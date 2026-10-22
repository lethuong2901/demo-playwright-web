// Steps: bdd/features/login.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @login
import { Given, When } from './bdd';
import { CREDENTIALS } from '@config/env';

Given('người dùng mở trang đăng nhập', async ({ poManager }) => {
  await poManager.getLoginPage().open();
});

When('người dùng đăng nhập với email {string} và mật khẩu {string}', async ({ poManager }, email: string, password: string) => {
  await poManager.getLoginPage().login(email, password);
});

// Precondition of @auth:<role> scenarios: the session comes from storageState — verify it is valid
Given('người dùng đã đăng nhập', async ({ poManager }) => {
  const dashboardPage = poManager.getDashboardPage();
  await dashboardPage.open();
  await dashboardPage.expectLoaded();
});

// Login through the UI with a role's credentials (values from .env, never in the .feature)
When('người dùng đăng nhập bằng tài khoản {string}', async ({ poManager }, role: string) => {
  const creds = { WEB: CREDENTIALS.web }[role];
  if (!creds) throw new Error(`Role "${role}" chưa khai báo trong step — thêm getter vào CREDENTIALS`);
  await poManager.getLoginPage().login(creds.username, creds.password);
});
