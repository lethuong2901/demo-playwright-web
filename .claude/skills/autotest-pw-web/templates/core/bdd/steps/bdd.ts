/**
 * Given/When/Then bound to the framework fixtures — every step file imports from here.
 * `test` is re-exported because generated specs (.features-gen/) import it from this file.
 *
 * Tag @auth:<role> on a Feature/Scenario → the browser starts with STORAGE[<role>] (logged in once by
 * the `setup` project), e.g. @auth:webUser. Without the tag the scenario starts logged out.
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
