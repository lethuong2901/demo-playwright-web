// Steps dùng chung — chạy theo từng feature: npx bddgen && npx playwright test --grep @<feature>
/**
 * Generic steps shared by every feature. Add a step here only when ≥ 2 features use the same
 * sentence; feature-specific steps live in bdd/steps/<feature>.steps.ts (import from './bdd').
 * List all existing steps before writing a new one:  npx bddgen export
 */
import { expect } from '@fixtures/index';
import { Then } from '../bdd';

Then('hiển thị thông báo {string}', async ({ page }, message: string) => {
  await expect(page.getByText(message).first()).toBeVisible();
});
