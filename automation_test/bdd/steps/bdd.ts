/**
 * Given/When/Then bound to the framework fixtures — every step file imports from here.
 */
import { createBdd } from 'playwright-bdd';
import { test as base } from '@fixtures/index';
import { STORAGE } from '@config/storage';

export const test = base.extend({
  storageState: async ({ $tags, storageState }, use) => {
    const authTag = $tags.find((tag) => tag.startsWith('@auth:'));
    if (!authTag) return use(storageState);
    const role = authTag.slice('@auth:'.length) as keyof typeof STORAGE;
    if (!STORAGE[role]) throw new Error(`Tag ${authTag}: không có role "${role}" trong config/storage.ts`);
    await use(STORAGE[role]);
  },
});

export const { Given, When, Then, Before, After, BeforeAll, AfterAll, Step } = createBdd(test);
