/**
 * Example step definitions for alert handling patterns.
 * Demonstrates: sync alerts, async alerts, and universal pattern.
 *
 * Key patterns from web-best-practices.md §6.1:
 * - Pattern A (sync): page.once('dialog') - for client-side validation
 * - Pattern B (async): page.waitForEvent('dialog') - for API response alerts
 * - Pattern C (universal): Combines both patterns with Promise.race
 */
import { expect } from '@fixtures/index';
import { Given, When, Then } from './bdd';
import { AlertDemoPage } from '@pages/alert/AlertDemoPage';

// Assuming POManager has getAlertDemoPage() registered
// For standalone example, we create page directly in steps

Given('mở trang signup Demoblaze', async ({ page }) => {
  const alertPage = new AlertDemoPage(page);
  await alertPage.open();
  await alertPage.expectLoaded();
  await alertPage.openSignupModal();
});

// Pattern A: Sync alert (empty form validation)
When('click nút Sign up với form trống', async ({ page, ctx }) => {
  const alertPage = new AlertDemoPage(page);
  // Don't fill anything - form is empty
  // Use sync pattern because client-side validation triggers alert immediately
  const message = await alertPage.clickSubmitWithSyncAlert();
  ctx.set('alertMessage', message);
});

// Pattern B: Async alert (API response)
When('điền username {string} và password {string}', async ({ page }, username: string, password: string) => {
  const alertPage = new AlertDemoPage(page);
  await alertPage.fillForm(username, password);
});

When('click nút Sign up', async ({ page, ctx }) => {
  const alertPage = new AlertDemoPage(page);
  // Use universal pattern - works for both sync and async
  const message = await alertPage.clickSubmitWithUniversalAlert();
  ctx.set('alertMessage', message);
});

// Pattern C: Universal (random username - API call)
When('điền username ngẫu nhiên và password {string}', async ({ page }, password: string) => {
  const alertPage = new AlertDemoPage(page);
  const randomUsername = AlertDemoPage.generateRandomUsername();
  await alertPage.fillForm(randomUsername, password);
});

// Shared assertion for all patterns
Then('alert hiển thị message {string}', async ({ ctx }, expectedMessage: string) => {
  const actualMessage = ctx.get<string>('alertMessage');
  expect(actualMessage).toBe(expectedMessage);
});
