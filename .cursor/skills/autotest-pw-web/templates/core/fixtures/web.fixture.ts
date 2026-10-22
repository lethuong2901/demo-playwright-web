import { test as base } from '@playwright/test';
import { POManager } from '@pages/POManager';

/**
 * POM theo khoá học: 1 fixture `poManager` (pages/POManager.ts) cho mỗi test/scenario, dùng chung tab `page`.
 * Steps: async ({ poManager }) => poManager.getLoginPage().open()
 * Độc lập với api.fixture — project cần cả API thì scaffold `--platforms web,api`, index ghép cả hai
 * (apiToken/authedApi dùng cho login-bypass khi test yêu cầu).
 */
export interface PageFixtures {
  poManager: POManager;
}

export const webTest = base.extend<PageFixtures>({
  poManager: async ({ page }, use) => use(new POManager(page)),
});
