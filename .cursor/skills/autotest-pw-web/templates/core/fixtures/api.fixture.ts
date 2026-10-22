import { test as base, request as playwrightRequest } from '@playwright/test';
import { ApiClient } from '@services/base/ApiClient';
import { AuthService } from '@services/auth/AuthService';
import { ENV, AUTH, CREDENTIALS } from '@config/env';

export interface ApiFixtures {
  /** Anonymous client on API_BASE_URL — fresh per test. */
  api: ApiClient;
  /** Client already carrying the API user's token. */
  authedApi: ApiClient;
}

export interface ApiWorkerFixtures {
  /** Token fetched ONCE per worker (login API), reused by authedApi and by web/mobile tests that bypass UI login. */
  apiToken: string;
}

export const apiTest = base.extend<ApiFixtures, ApiWorkerFixtures>({
  apiToken: [
    async ({}, use) => {
      if (AUTH.loginEndpoint === 'none') throw new Error('API không có login (EP_LOGIN=none) — không dùng fixture apiToken/authedApi.');
      const context = await playwrightRequest.newContext({ baseURL: ENV.apiBaseUrl });
      const token = await new AuthService(new ApiClient(context)).login(CREDENTIALS.api.username, CREDENTIALS.api.password);
      await use(token);
      await context.dispose();
    },
    { scope: 'worker' },
  ],
  api: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({ baseURL: ENV.apiBaseUrl });
    await use(new ApiClient(context));
    await context.dispose();
  },
  authedApi: async ({ playwright, apiToken }, use) => {
    const context = await playwright.request.newContext({ baseURL: ENV.apiBaseUrl });
    const client = new ApiClient(context);
    client.setToken(apiToken, AUTH.tokenScheme);
    await use(client);
    await context.dispose();
  },
});
