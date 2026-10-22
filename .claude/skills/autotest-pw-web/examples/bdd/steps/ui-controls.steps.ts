// Steps: bdd/features/ui-controls.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @ui-controls
import { expect } from '@fixtures/index';
import type { Page } from '@playwright/test';
import { Given, When, Then } from './bdd';
import { TIMEOUTS } from '@config/timeouts';

Given('người dùng mở trang luyện tập đăng nhập', async ({ poManager }) => {
  await poManager.getLoginPractisePage().open();
});

// ---- Dropdown / radio / checkbox (UIBasicstest.spec.js) ----
When('người dùng chọn vai trò {string} trong dropdown', async ({ poManager }, value: string) => {
  await poManager.getLoginPractisePage().selectRole(value);
});

Then('dropdown vai trò có giá trị {string}', async ({ poManager }, value: string) => {
  await expect(poManager.getLoginPractisePage().roleDropdown).toHaveValue(value);
});

When('người dùng chọn loại tài khoản {string}', async ({ poManager }, label: string) => {
  await poManager.getLoginPractisePage().chooseUserType(label);
});

Then('radio {string} được chọn', async ({ poManager }, label: string) => {
  await expect(poManager.getLoginPractisePage().userTypeRadio(label)).toBeChecked();
});

When('người dùng tick ô đồng ý điều khoản', async ({ poManager }) => {
  await poManager.getLoginPractisePage().terms.check();
});

When('người dùng bỏ tick ô đồng ý điều khoản', async ({ poManager }) => {
  await poManager.getLoginPractisePage().terms.uncheck();
});

Then('ô đồng ý điều khoản được tick', async ({ poManager }) => {
  await expect(poManager.getLoginPractisePage().terms).toBeChecked();
});

Then('ô đồng ý điều khoản không được tick', async ({ poManager }) => {
  await expect(poManager.getLoginPractisePage().terms).not.toBeChecked();
});

Then('link tài liệu có class {string}', async ({ poManager }, cls: string) => {
  await expect(poManager.getLoginPractisePage().documentLink).toHaveAttribute('class', cls);
});

// ---- Child window (UIBasicstest.spec.js "Child windows hadl") ----
When('người dùng mở link tài liệu ở tab mới', async ({ poManager, ctx }) => {
  ctx.set('childPage', await poManager.getLoginPractisePage().openDocumentLinkInNewTab());
});

Then('tab mới hiển thị email có domain {string}', async ({ ctx }, domain: string) => {
  const redText = ctx.get<Page>('childPage').locator('.red');
  await expect(redText).toContainText(`@${domain}`);
  const text = (await redText.textContent()) ?? '';
  ctx.set('domain', text.split('@')[1].split(' ')[0]);
});

When('người dùng nhập domain lấy được vào ô username ở tab cũ', async ({ poManager, ctx }) => {
  await poManager.getLoginPractisePage().username.fill(ctx.get<string>('domain'));
});

Then('ô username có giá trị {string}', async ({ poManager }, value: string) => {
  await expect(poManager.getLoginPractisePage().username).toHaveValue(value); // inputValue, không phải textContent
});

// ---- Locator đặc biệt + ghi đè timeout (llc.spec.js) ----
Given('người dùng mở trang form Angular', async ({ poManager }) => {
  await poManager.getAngularPracticePage().open();
});

When('người dùng tick {string} và chọn {string}', async ({ poManager }, checkbox: string, radio: string) => {
  const angular = poManager.getAngularPracticePage();
  await angular.tickLabel(checkbox);
  await angular.tickLabel(radio);
});

When('người dùng chọn giới tính {string} và nhập mật khẩu {string}', async ({ poManager }, gender: string, password: string) => {
  const angular = poManager.getAngularPracticePage();
  await angular.selectGender(gender);
  await angular.password.fill(password);
});

When('người dùng bấm nút {string}', async ({ poManager }, name: string) => {
  await poManager.getAngularPracticePage().submit(name);
});

Then('form hiển thị thông báo thành công {string}', async ({ page }, message: string) => {
  // Ghi đè EXPECT timeout: cả 1 nhóm assertion (expect.configure) hoặc 1 assertion ({ timeout })
  const slowExpect = expect.configure({ timeout: TIMEOUTS.slow });
  await slowExpect(page.getByText(message)).toBeVisible();
});

When('người dùng vào Shop và thêm {string} vào giỏ', async ({ poManager }, product: string) => {
  const angular = poManager.getAngularPracticePage();
  await angular.shopLink.click();
  await angular.addProductToCart(product);
});

Then('nút Checkout trên header hiển thị {string}', async ({ poManager }, count: string) => {
  await expect(poManager.getAngularPracticePage().checkoutLink).toContainText(count, { timeout: 10_000 });
});
