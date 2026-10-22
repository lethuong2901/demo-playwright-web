import type { APIResponse } from '@playwright/test';
import { ApiClient, type RequestOptions } from '@services/base/ApiClient';
import { AUTH } from '@config/env';

/**
 * Generic login against the contract in config/env.ts (AUTH, filled from global-data.md).
 * Feature services never log in themselves — they receive an authed ApiClient fixture.
 */
export class AuthService {
  constructor(private readonly api: ApiClient) {}

  /** Login and return the token (2xx asserted by ApiClient). */
  async login(username: string, password: string): Promise<string> {
    const response = await this.api.post(AUTH.loginEndpoint, { data: this.body(username, password) });
    const json = await ApiClient.json<Record<string, unknown>>(response);
    const token = AUTH.tokenField.split('.').reduce<unknown>((node, key) => (node as Record<string, unknown> | undefined)?.[key], json);
    if (typeof token !== 'string' || !token) throw new Error(`Login response không có field "${AUTH.tokenField}"`);
    return token;
  }

  /** Login expecting a specific status (negative cases) — returns the parsed body for assertions. */
  async loginExpectingStatus<T = Record<string, unknown>>(username: string, password: string, status: number, extra: RequestOptions = {}): Promise<T> {
    const response = await this.api.post(AUTH.loginEndpoint, { ...extra, data: this.body(username, password), expectStatus: status });
    return ApiClient.json<T>(response);
  }

  /** Login without any status check — for BDD steps where a later Then asserts status/message. */
  async loginResponse(username: string, password: string): Promise<APIResponse> {
    return this.api.post(AUTH.loginEndpoint, { data: this.body(username, password), expectStatus: 'any' });
  }

  private body(username: string, password: string): Record<string, string> {
    return { [AUTH.usernameField]: username, [AUTH.passwordField]: password };
  }
}
