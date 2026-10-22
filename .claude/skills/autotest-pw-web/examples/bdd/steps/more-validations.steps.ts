// Steps: bdd/features/more-validations.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @more-validations
import { expect } from '@fixtures/index';
import { Given, When, Then } from './bdd';

Given('người dùng mở trang luyện tập tự động hoá', async ({ poManager }) => {
  await poManager.getAutomationPracticePage().open();
});

// ---- Điều hướng: goto / goBack / goForward / reload ----
When('người dùng đi tới trang luyện tập đăng nhập', async ({ poManager }) => {
  await poManager.getLoginPractisePage().open();
});

When('người dùng quay lại trang trước', async ({ page }) => {
  await page.goBack();
});

When('người dùng đi tiếp trang sau', async ({ page }) => {
  await page.goForward();
});

When('người dùng tải lại trang', async ({ page }) => {
  await page.reload();
});

Then('đang ở trang luyện tập tự động hoá', async ({ page, poManager }) => {
  await expect(page).toHaveURL(/AutomationPractice/);
  await poManager.getAutomationPracticePage().expectLoaded();
});

Then('đang ở trang luyện tập đăng nhập', async ({ page, poManager }) => {
  await expect(page).toHaveURL(/loginpagePractise/);
  await poManager.getLoginPractisePage().expectLoaded();
});

// ---- Ẩn / hiện ----
When('người dùng bấm nút Hide', async ({ poManager }) => {
  await poManager.getAutomationPracticePage().hideButton.click();
});

When('người dùng bấm nút Show', async ({ poManager }) => {
  await poManager.getAutomationPracticePage().showButton.click();
});

Then('ô nhập liệu được hiển thị', async ({ poManager }) => {
  await expect(poManager.getAutomationPracticePage().displayedText).toBeVisible();
});

Then('ô nhập liệu bị ẩn', async ({ poManager }) => {
  await expect(poManager.getAutomationPracticePage().displayedText).toBeHidden();
});

// ---- Alert / confirm (JS dialog) ----
When(
  'người dùng nhập tên {string} rồi bấm {string} và chọn {string} trên hộp thoại',
  async ({ poManager, ctx }, name: string, button: string, action: string) => {
    const practice = poManager.getAutomationPracticePage();
    await practice.nameInput.fill(name);
    const target = button === 'Alert' ? practice.alertButton : practice.confirmButton;
    ctx.set('dialogMessage', await practice.clickAndHandleDialog(target, action === 'dismiss' ? 'dismiss' : 'accept'));
  },
);

Then('hộp thoại có nội dung {string}', async ({ ctx }, message: string) => {
  expect(ctx.get<string>('dialogMessage')).toBe(message);
});

// ---- Hover + iframe ----
When('người dùng rê chuột vào {string}', async ({ poManager }, _label: string) => {
  await poManager.getAutomationPracticePage().mouseHover.hover();
});

Then('menu hover có các mục {string}', async ({ poManager }, items: string) => {
  await expect(poManager.getAutomationPracticePage().hoverMenu.getByRole('link')).toHaveText(items.split(/,\s*/));
});

When('người dùng bấm link {string} trong iframe khoá học', async ({ poManager }, name: string) => {
  await poManager.getAutomationPracticePage().frameLink(name).click();
});

Then('iframe hiển thị tiêu đề chứa {string}', async ({ poManager }, text: string) => {
  await expect(poManager.getAutomationPracticePage().coursesFrame.locator('.text h2').first()).toContainText(text);
});

// ---- Screenshot làm bằng chứng (đính kèm vào Playwright / Monocart report) ----
When('người dùng chụp ảnh ô nhập liệu {string}', async ({ poManager, $testInfo }, name: string) => {
  const file = $testInfo.outputPath(`${name}.png`);
  await poManager.getAutomationPracticePage().displayedText.screenshot({ path: file });
  await $testInfo.attach(name, { path: file, contentType: 'image/png' });
});

When('người dùng chụp ảnh toàn trang {string}', async ({ page, $testInfo }, name: string) => {
  const file = $testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await $testInfo.attach(name, { path: file, contentType: 'image/png' });
});

// ---- Visual testing: so sánh với ảnh chuẩn (baseline) ----
Then('giao diện trang khớp ảnh chuẩn {string}', async ({ page }, snapshot: string) => {
  await expect(page).toHaveScreenshot(snapshot, { maxDiffPixelRatio: 0.02 });
});
