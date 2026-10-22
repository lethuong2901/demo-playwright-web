import { test as base } from '@playwright/test';

/**
 * Scenario context — replaces Cucumber's `this` (World) from the course.
 * One fresh instance per scenario; steps share values through it with a type at each call:
 *   When:  ctx.set('orderId', created.orders[0]);
 *   Then:  const orderId = ctx.get<string>('orderId');
 * Prefer page objects / fixtures for state; use ctx only for values produced by one step and
 * consumed by a later one (ids, tokens, computed totals).
 */
export class ScenarioContext {
  private readonly store = new Map<string, unknown>();

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  get<T>(key: string): T {
    if (!this.store.has(key)) {
      throw new Error(`ctx chưa có "${key}" — step trước chưa lưu giá trị này (kiểm tra thứ tự step trong .feature).`);
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
