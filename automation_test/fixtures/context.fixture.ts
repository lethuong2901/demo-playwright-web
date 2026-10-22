import { test as base } from '@playwright/test';

/**
 * Scenario context — replaces Cucumber's `this` (World).
 * One fresh instance per scenario; steps share values through it.
 */
export class ScenarioContext {
  private readonly store = new Map<string, unknown>();

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  get<T>(key: string): T {
    if (!this.store.has(key)) {
      throw new Error(`ctx chưa có "${key}" — step trước chưa lưu giá trị này.`);
    }
    return this.store.get(key) as T;
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}

export const contextTest = base.extend<{ ctx: ScenarioContext }>({
  ctx: async ({}, use) => use(new ScenarioContext()),
});
