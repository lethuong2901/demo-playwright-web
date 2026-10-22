import { test as base } from '@playwright/test';
import { POManager } from '@pages/POManager';

export interface PageFixtures {
  poManager: POManager;
}

export const webTest = base.extend<PageFixtures>({
  poManager: async ({ page }, use) => use(new POManager(page)),
});
