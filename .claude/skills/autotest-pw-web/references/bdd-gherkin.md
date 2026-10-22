# Writing Cucumber scenarios (Gherkin + TypeScript steps) — shared by all autotest-pw-* skills

From the course's Section 22 (Cucumber integration: `features/*.feature`, `step_definitions/steps.ts`,
`support/hooks.js`, `cucumber.js`) rebuilt on playwright-bdd so it runs inside Playwright Test.
Verified examples: `autotest-pw-web/examples/bdd/`, `autotest-pw-api/examples/bdd/` (Background,
Scenario Outline, DataTable, tagged After hook), `autotest-pw-android/examples/bdd/`.

## 1. From a manual TC to a Scenario

test-cases.md (KBKTCN) fields → Gherkin:

| TC field | Gherkin |
|---|---|
| Feature title (header) | `Feature: <title>` + tag `@<feature>` on the Feature line |
| `### TC-NNN — <Title>` | `Scenario: TC-NNN — <Title>` (verbatim) + `@TC-NNN` |
| Category / H/I | `@smoke` (happy path, HIGH) · `@regression` · `@negative` (Negative/Security) |
| D (Trường hợp) + preconditions | `Given …` (state the precondition, e.g. `Given người dùng đã đăng nhập` + `@auth:webUser`) |
| E (Data test) | quoted values in steps, `Examples` table, or DataTable |
| F[i] (Các bước) | `When …` / `And …` — one line per step |
| G[i] (Kết quả mong muốn) | `Then …` / `And …` directly after its F[i] |
| Known bug confirmed by the user | `@known-bug @fail` (+ `# BUG-123: <reason>` comment above the Scenario) |

```gherkin
# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @cart
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=web-chromium --headed --trace on --grep @cart
@cart
Feature: Giỏ hàng

  Background:
    Given người dùng đã đăng nhập

  @TC-003 @regression @auth:webUser
  Scenario: TC-003 — Thêm sản phẩm vào giỏ cập nhật số lượng trên icon giỏ
    When người dùng thêm sản phẩm "ZARA COAT 3" vào giỏ
    Then icon giỏ hàng hiển thị số lượng 1
    When người dùng mở giỏ hàng
    Then giỏ hàng có sản phẩm "ZARA COAT 3"
```

Rules:
- Keep the TC's words; only normalise into a reusable sentence with parameters (`"ZARA COAT 3"`, `1`).
  Never change meaning, merge steps or drop an expected result.
- One sentence = one business action or one check. No UI mechanics ("click nút có id …") unless the TC
  itself is about that UI element.
- `Background` only for preconditions shared by **every** Scenario of the file; it is shown in reports.
- Keywords: English (`Feature/Scenario/Given/When/Then/And/But`, as in the course). Vietnamese keywords
  (`# language: vi` → `Tính năng`, `Bối cảnh`, `Kịch bản`/`Tình huống`, `Khung kịch bản`, `Dữ liệu`, `Biết`/`Cho`,
  `Khi`, `Thì`, `Và`) only if the team asks — then for every file of the project.
- No credentials, tokens, real customer data in `.feature` files — roles (`tài khoản "ADMIN"`), test data only.

## 2. Data-driven (course: `Scenario Outline` + `Examples`)

```gherkin
  @TC-030 @negative
  Scenario Outline: TC-030 — Đăng nhập sai dữ liệu [<case>]
    When gọi API đăng nhập với email "<email>" và mật khẩu "<password>"
    Then API trả về mã <status> với thông báo "<message>"

    Examples:
      | case         | email                 | password  | status | message                      |
      | sai mật khẩu | not-exist@example.com | Wrong@123 | 400    | Incorrect email or password. |
```
Each row = one test in reports (`TC-030 — … [sai mật khẩu]`). **The Scenario title must contain the
columns that make each row unique** — two rows with the same title fail with `duplicate test title`. Use it when several TCs differ only by data
and the user/strategy agreed to consolidate, or when one TC lists several data sets.

DataTable (several rows inside one step):
```gherkin
    When tạo đơn hàng gồm các dòng:
      | country | productOrderedId         |
      | India   | 6960eac0c941646b7a8b3e68 |
```
```ts
When('tạo đơn hàng gồm các dòng:', async ({ authedApi, ctx }, table: DataTable) => {
  ctx.set('order', await new OrderService(authedApi).create(table.hashes() as unknown as OrderLine[]));
});
```
(`import { DataTable } from 'playwright-bdd'`; `table.hashes()`, `table.rows()`, `table.rowsHash()`, `table.raw()`.)

## 3. Step definitions

```ts
// Steps: bdd/features/cart.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @cart
import { expect } from '@fixtures/index';
import { When, Then } from './bdd';

When('người dùng thêm sản phẩm {string} vào giỏ', async ({ poManager }, product: string) => {
  await poManager.getDashboardPage().addToCart(product);
});

Then('icon giỏ hàng hiển thị số lượng {int}', async ({ poManager }, count: number) => {
  await expect(poManager.getHeaderPage().cartBadge).toHaveText(String(count));
});
```
- First argument = fixtures (`poManager`, `page`, `api`, `authedApi`, `apiToken`, `ctx`, `device`,
  `screenManager`, `$testInfo`, `$tags`); then the parameters in order.
- Parameter types: `{string}` (quoted), `{int}`, `{float}`, `{word}`, `{}` (anything); regex steps
  (`/^…$/`) only when an expression cannot express it. Custom types: `defineParameterType` in `bdd.ts`.
- Assertions live in `Then` steps (web-first `expect`, `BaseScreen` helpers for native Android).
- Missing step → `npx bddgen` prints the exact TS snippet; paste into the right file, implement.
- Ambiguous step (two definitions match) → `bddgen` fails; make sentences distinct.
- Where (cấu trúc PHẲNG): feature-specific → `bdd/steps/<feature>.steps.ts` (import `from './bdd'`);
  shared by ≥ 2 features → `bdd/steps/common/*.steps.ts` (import `from '../bdd'`). Không có thư mục con theo
  platform — project định tuyến feature theo **tag** `@web`/`@api`/`@android` ở đầu mỗi Feature.

## 4. Sharing values between steps — `ctx` (replaces Cucumber `this` / World)

Course: `this.orderId = …` in one step, `this.orderId` in the next (World). Here: the `ctx` fixture (fresh
per Scenario, typed at use):
```ts
When('người dùng đặt hàng', async ({ poManager, ctx }) => {
  ctx.set('orderId', await poManager.getCheckoutPage().placeOrderAndGetId());
});
Then('đơn hàng xuất hiện trong lịch sử', async ({ poManager, ctx }) => {
  await expect(poManager.getOrdersPage().row(ctx.get<string>('orderId'))).toBeVisible();
});
```
Never module-level variables (`let poManager` in the course's steps.ts) — shared across parallel scenarios.

## 5. Hooks (course: `support/hooks.js`)

| Course (cucumber-js) | Here |
|---|---|
| `Before` launches browser + page into `this.page` | nothing — the `page` fixture does it (and closes it) |
| `AfterStep` screenshot on failure + `this.attach` | nothing — `screenshot: 'only-on-failure'`, trace, video in config |
| `After` (teardown) | `After(async ({ … }) => …)` in a steps file, or fixture teardown after `use()` |
| `BeforeAll` / `AfterAll` | `BeforeAll` / `AfterAll` from `../bdd` (worker scope, worker fixtures only) |
| tagged hook `Before({ tags: '@Regression' })` | same: `After({ tags: '@order' }, …)` |

Use hooks for plumbing (cleanup, mocks shared by a whole feature). Anything a reader must know to
understand the scenario belongs in `Given` steps, not hooks.

## 6. Tags

| Tag | Effect |
|---|---|
| `@<feature>`, `@TC-NNN`, `@smoke/@regression/@negative` | selection: `--grep "@TC-003\b"`, `--grep @smoke`; Jenkins `TCS`/`GREP` |
| `@auth:<role>` | start logged in with `STORAGE[<role>]` (bdd.ts) |
| `@known-bug @fail` | expected to fail (green in Playwright/JUnit/summary while the bug exists, red when it gets fixed) |
| `@skip` / `@fixme` | not run (Pending/blocked TCs — add a comment why) |
| `@slow` / `@timeout:N` | ×3 timeout / N ms for that scenario |
| `@retries:N` | retries for that scenario (only with a reason) |
| `@mode:serial` (Feature) | scenarios of the file run in order — last resort |
| `@only` | forbidden in committed code |

Feature-level tags apply to all its scenarios. Selection at run time always uses `--grep` (regex over
title + tags); `--grep-invert @slow` to exclude.

## 7. Commands

```bash
npx bddgen                      # generate .features-gen/ (fails on missing/ambiguous steps, prints snippets)
npm run steps                   # = npx bddgen export → list every existing step (check before writing new ones)
npx bddgen && npx playwright test --project=web-chromium --headed --grep "@TC-003\b"
npx bddgen && npx playwright test --project=api --grep "@order"
npm run summary  ·  npm run report  ·  npm run report:monocart
```

## 8. Anti-patterns

- Scenario that is not a manual TC, or one TC split across Scenarios.
- UI details in Gherkin ("click vào `#btn-submit`"), or business logic/locators in step definitions.
- Near-duplicate steps (`mở trang đăng nhập` vs `vào trang đăng nhập`) — search `npm run steps` first.
- Steps depending on another Scenario's state; module-level variables; `this`.
- Credentials or tokens in `.feature`/Examples; real personal data.
- Editing `.features-gen/` (overwritten every `bddgen`).
- Giant `Background` or hooks hiding preconditions the reader needs.

## 9. Why not `cucumber-js` (the course's runner)

The course runs features with `npx cucumber-js` (+ `cucumber.js` profile, World, hooks launching the
browser). On that runner Playwright fixtures, `storageState` projects, trace/video, retries with flaky
detection, HTML/JUnit/JSON reporters, `--shard` and our Jenkins/summary/notify pipeline are not available or
must be rebuilt by hand. playwright-bdd keeps the same Gherkin + step-definition style and produces
Playwright tests, so all of that keeps working. Course command equivalents:

| cucumber-js | here |
|---|---|
| `npx cucumber-js features/X.feature --exit` | `npx bddgen && npx playwright test --grep @<feature>` |
| `--tags "@Regression"` | `--grep @regression` |
| `--parallel 2` | `--workers=2` (default parallel) |
| `--retry 1` | `--retries=1` (flaky shown in summary) |
| `--format html:cucumber-report.html` | reporters already write `results/html-report/` (Playwright) + `results/monocart-report/index.html` (Monocart) |
| snippets printed for undefined steps | `npx bddgen` prints TS snippets |
| `{ timeout: 100 * 1000 }` on a step | `@timeout:100000` on the scenario, or `TIMEOUTS` |
