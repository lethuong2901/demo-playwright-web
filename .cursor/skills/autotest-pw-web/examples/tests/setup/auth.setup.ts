// Chạy: npx playwright test --project=setup  (tự chạy trước web-chromium qua dependencies)
import { test as setup } from '@fixtures/index';
import { CREDENTIALS } from '@config/env';
import { STORAGE } from '@config/storage';

/**
 * Logs in ONCE through the UI and saves cookies + localStorage to STORAGE.webUser.
 * Specs that need a logged-in user:  test.use({ storageState: STORAGE.webUser })
 * Specs that test the login screen itself do NOT use it.
 */
setup('authenticate web user', async ({ page, poManager }) => {
  const loginPage = poManager.getLoginPage();
  await loginPage.open();
  await loginPage.login(CREDENTIALS.web.username, CREDENTIALS.web.password);
  await poManager.getDashboardPage().expectLoaded();
  await page.context().storageState({ path: STORAGE.webUser });
});
