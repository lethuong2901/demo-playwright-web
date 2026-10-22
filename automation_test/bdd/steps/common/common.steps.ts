// Steps dùng chung — chạy theo từng feature: npx bddgen && npx playwright test --grep @<feature>
import { expect } from '@fixtures/index';
import { Then } from '../bdd';

Then('hiển thị thông báo {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message).first()).toBeVisible();
});
