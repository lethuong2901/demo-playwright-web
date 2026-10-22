/** Timeouts (ms) — one place, three levels (test > action/navigation > expect). */
export const TIMEOUTS = {
  test: 60_000,
  expect: 10_000,
  action: 15_000,
  navigation: 30_000,
  slow: 30_000,
} as const;
