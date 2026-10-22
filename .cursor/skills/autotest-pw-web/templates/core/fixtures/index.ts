/**
 * The ONLY test import:  import { test, expect } from '@fixtures/index';
 * Chain: playwright-bdd runtime + ctx (scenario context) + apiTest (api, authedApi, apiToken)
 *        + webTest (page objects). autotest-pw-android adds androidTest (device, app, screens).
 */
import { mergeTests } from '@playwright/test';
import { test as bddBase } from 'playwright-bdd';
import { contextTest } from './context.fixture';
import { webTest } from './web.fixture';

export const test = mergeTests(bddBase, contextTest, webTest);
export { expect } from '@playwright/test';
