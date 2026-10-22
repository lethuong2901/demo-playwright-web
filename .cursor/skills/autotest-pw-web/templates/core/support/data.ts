import fs from 'fs';
import path from 'path';

/**
 * Load automation_test/data/<feature>.json — top-level key "data", one entry per TC id.
 *   { "data": { "TC-001": { ... }, "TC-002": { ... } } }
 * Typed by the caller: loadData<LoginData>('login')['TC-001'].
 */
export function loadData<T>(feature: string): Record<string, T> {
  const file = path.resolve(__dirname, '..', 'data', `${feature}.json`);
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8')) as { data?: Record<string, T> };
  if (!raw.data) throw new Error(`${file} thiếu key "data"`);
  return raw.data;
}

/** Unique suffix for data that must not collide between parallel workers/runs. */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
