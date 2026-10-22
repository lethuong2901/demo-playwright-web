// Steps: bdd/features/signup.feature — chạy: npx bddgen && npx playwright test --project=web-chromium --headed --grep @signup
import { expect } from '@fixtures/index';
import { Given, When, Then } from './bdd';
import { SignupPage } from '@pages/signup/SignupPage';

// Given steps
Given('người dùng truy cập trang chủ Demoblaze', async ({ poManager }) => {
  await poManager.getSignupPage().open();
  await poManager.getSignupPage().expectLoaded();
});

// When steps
When('người dùng click nút Sign up trên header', async ({ poManager }) => {
  await poManager.getSignupPage().clickSignupButton();
});

When('người dùng nhập username ngẫu nhiên', async ({ poManager, ctx }) => {
  const randomUsername = SignupPage.generateRandomUsername();
  ctx.set('username', randomUsername);
  await poManager.getSignupPage().fillUsername(randomUsername);
});

When('người dùng nhập username {string}', async ({ poManager }, username: string) => {
  await poManager.getSignupPage().fillUsername(username);
});

When('người dùng để trống username', async ({ poManager }) => {
  await poManager.getSignupPage().fillUsername('');
});

When('người dùng nhập password {string}', async ({ poManager }, password: string) => {
  await poManager.getSignupPage().fillPassword(password);
});

When('người dùng để trống password', async ({ poManager }) => {
  await poManager.getSignupPage().fillPassword('');
});

When('người dùng click nút Sign up trong popup', async ({ poManager, page, ctx }) => {
  // Handle both sync (empty fields) and async (API response) dialogs
  // Use Promise to capture message, page.once to auto-accept immediately
  const dialogPromise = new Promise<string>((resolve) => {
    page.once('dialog', async (dialog) => {
      resolve(dialog.message());
      await dialog.accept();
    });
  });

  // Click - dialog handler will auto-accept if dialog appears
  await poManager.getSignupPage().clickSignupButtonInModal();

  // Wait for dialog message with timeout
  const alertMessage = await Promise.race([
    dialogPromise,
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Dialog timeout after 15s')), 15000)
    ),
  ]);

  ctx.set('alertMessage', alertMessage);
});

When('người dùng click nút Close trong popup', async ({ poManager }) => {
  await poManager.getSignupPage().clickCloseButton();
});

// Then steps
Then('nút Sign up hiển thị trên header', async ({ poManager }) => {
  await poManager.getSignupPage().expectSignupButtonVisible();
});

Then('popup Sign up hiển thị với đầy đủ các thành phần', async ({ poManager }) => {
  await poManager.getSignupPage().expectModalVisible();
});

Then('alert hiển thị với message {string}', async ({ ctx }, expectedMessage: string) => {
  // Verify the alert message captured by the previous step
  const actualMessage = ctx.get<string>('alertMessage');
  expect(actualMessage).toBe(expectedMessage);
});

Then('popup Sign up đóng lại', async ({ poManager }) => {
  await poManager.getSignupPage().expectModalHidden();
});
