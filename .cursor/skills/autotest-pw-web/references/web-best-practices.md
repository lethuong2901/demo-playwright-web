# Playwright web — best practices (TypeScript)

Distilled from the Playwright JS/TS course (`PlayWrightAutomation/`, sections 3–25) and corrected where
the course uses patterns the Playwright docs discourage (marked **Course → better**). Every snippet is
TypeScript and assumes `import { test, expect } from '@fixtures/index'`. In the Cucumber style these
snippets live inside page-object methods (actions/locators) and `Then` step definitions (assertions);
`page`, `testInfo` (`$testInfo`) and the other fixtures are the first argument of a step.

## 0. Course file → verified example in this skill

Every example below ran green on the course practice sites (`autotest-pw-web/examples/`):

| Course file | Topic | Example (.feature + steps + page object) |
|---|---|---|
| `UIBasicstest.spec.js` | static dropdown, radio + popup, checkbox check/uncheck, attribute, child window | `bdd/features/ui-controls.feature` TC-101, TC-102 · `pages/practise/LoginPractisePage.ts` |
| `llc.spec.js` | getByLabel / getByPlaceholder / getByRole / filter, timeout overrides | `ui-controls.feature` TC-103 · `pages/angular/AngularPracticePage.ts` |
| `MoreValidations.spec.js` | navigation, hidden/visible, alert/confirm accept+dismiss, hover, iframe, screenshots, visual compare | `bdd/features/more-validations.feature` TC-111..116 · `pages/automation/AutomationPracticePage.ts` |
| — | **Alert handling: sync vs async patterns** (§6.1) | `bdd/features/alert-handling.feature` · `pages/alert/AlertDemoPage.ts` (Demoblaze signup) |
| `upload-download.spec.js` | download → edit Excel (exceljs) → upload → assert table | `bdd/features/upload-download.feature` · `pages/upload/UploadDownloadPage.ts` · `support/excel.ts` |
| `WebAPIPart1.spec.js` | API login → token into localStorage | `login.feature` TC-004 · `steps/web/dashboard.steps.ts` |
| `WebAPIPart2.spec.js` | UI login once → storageState reused | `tests/setup/auth.setup.ts` + tag `@auth:webUser` (`login.feature` TC-001) |
| `NetworkTest.spec.js` / `NetworlTest2.spec.js` | mock response / alter request | `login.feature` TC-004 (fulfill) · §8 below (continue / abort) |
| `ClientAppPO.spec.ts` + `pageobjects_ts/` | POM + POManager | `pages/POManager.ts` + fixture `poManager` |

## 1. Async model
- Every action, query and web-first assertion returns a Promise → `await` it. A missing `await` gives
  flaky errors (empty title, `Promise {<pending>}`, assertion that never runs).
- Creating a locator is synchronous: `const btn = page.getByRole('button', { name: 'Login' });` (no await).
- Fixtures: `{ page }` (fresh context + tab per test, use it 90% of the time), `{ context }`, `{ browser }`
  (several users / custom context options), `{ request }` / our `api` (API), `{ playwright }`.

**Navigation** (course lecture 11): `page.goto(path)` (relative to `baseURL`; page objects use `open()`),
`page.goBack()`, `page.goForward()`, `page.reload()`, `page.title()`, `page.url()`. Assert where you are with
`await expect(page).toHaveURL(/fragment/)` / `toHaveTitle()` + a stable element (`expectLoaded()`), never
by reading `page.url()` into a value assertion.

## 2. Locators — priority
1. `page.getByRole(role, { name, exact })` — buttons, links, textboxes, checkboxes, rows, headings…
2. `page.getByLabel('Gender')` — only when the input is inside `<label>` or `for=id` matches.
3. `page.getByPlaceholder('email@example.com')`
4. `page.getByText('Thankyou for the order.')` / `getByAltText` / `getByTitle`
5. `page.getByTestId('submit')` (attribute `data-testid`, configurable `testIdAttribute`)
6. CSS (`#id`, `[formcontrolname='x']`, `.card-body`) — only when 1–5 are impossible; keep it short & stable.
7. XPath — last resort, never position-based (`//div[3]/span`).

Narrowing & lists:
```ts
// pick a card by content, then act inside it (course: loop over nth(i) → better: filter)
await page.locator('.card-body').filter({ hasText: productName }).getByRole('button', { name: 'Add To Cart' }).click();
// table row that contains a cell, then a cell in that row
const row = page.getByRole('row').filter({ has: page.getByText(orderId) });
await row.getByRole('button', { name: 'View' }).click();
// scope to avoid substring matches: name 'Cart' also matches 'Add To Cart'
await page.getByRole('listitem').getByRole('button', { name: 'Cart' }).click();
await page.getByRole('button', { name: 'Cart', exact: true }).click();
```
- Accessible name ≠ visible text when the element has an icon or leading spaces (e.g. autosuggest button
  `" India"` with an icon glyph): `getByRole('button', { name: 'India', exact: true })` and even a `^…$` regex on
  `name` can match 0. Use `locator('button').filter({ hasText: /^\s*India\s*$/ })` — verify `count() = 1` live.
- **Strict mode**: an action on a locator matching N>1 elements throws "resolved to N elements". Narrow it
  (scope/filter/exact). `.first()/.last()/.nth(i)` only when the order itself is meaningful (e.g. "first row").
- `:visible` pseudo-class (`a[href*='lifetime']:visible`) when hidden duplicates exist.
- Iframes: `const frame = page.frameLocator('#courses-iframe'); await frame.getByRole('link', { name: 'All Access' }).click();`
  (no switch back; `page` keeps working on the main frame).
- Shadow DOM: CSS/role locators pierce open shadow roots automatically.

## 3. Actions
| Need | Use |
|---|---|
| type into input | `fill(text)` (clears first); `fill('')` to clear |
| autocomplete that reacts per key | `pressSequentially('ind', { delay: 50 })` — **Course `type()` is deprecated** |
| key | `press('Enter')`, `page.keyboard.press('Control+A')` |
| checkbox / radio | `check()` / `uncheck()` (not click) |
| `<select>` | `selectOption('value' | { label } | [values])` |
| hover menu | `hover()` |
| double/right click | `dblclick()`, `click({ button: 'right' })` |
| drag & drop | `source.dragTo(target)` |
| file upload | `locator('input[type=file]').setInputFiles(path | [paths])` — no OS dialog |
| scroll into view | automatic before actions; `scrollIntoViewIfNeeded()` if needed for a screenshot |
| read input value | `inputValue()` — **`textContent()` on `<input>` returns ''** |
| read text | `textContent()` (raw, may be null), `innerText()` (rendered), `allTextContents()` (list) |

Dropdown with suggestions (course: auto-suggest country):
```ts
await page.getByPlaceholder('Select Country').pressSequentially('ind');
await page.locator('.ta-results').getByRole('button', { name: 'India', exact: true }).click();
```

Date picker (course: react-calendar): open → click header to zoom out (year view) → pick year → month
(`nth(month - 1)` is meaningful here) → day (`getByText(day, { exact: true })` scoped to the calendar) →
assert each input with `toHaveValue`.

## 4. Waiting
- Actions auto-wait (attached, visible, stable, enabled, receives events). Web-first assertions retry until
  `expect.timeout`. **That is the only waiting you normally need.**
- Lists: `count()`, `allTextContents()`, `isVisible()`, `isChecked()` **do not wait** → before reading a list:
  `await expect(cards.first()).toBeVisible()` (course: `waitFor()` — same effect).
- Navigation result: `await expect(page).toHaveURL(/dashboard/)` or a stable element of the next page.
- Network: register **before** the trigger
  ```ts
  const ordersResponse = page.waitForResponse((r) => r.url().includes('/get-orders-for-customer/') && r.ok());
  await page.getByRole('button', { name: 'ORDERS' }).click();
  await ordersResponse;
  ```
- New tab/popup, download, dialog: listen before the click (see §6).
- **Course → better**: `waitForLoadState('networkidle')` after login (flaky with polling/websockets) →
  assert the landing page element. `page.waitForTimeout(ms)` → never.

## 5. Assertions
Web-first (auto-retry, `await expect(locator)...`):
`toBeVisible() toBeHidden() toBeEnabled() toBeDisabled() toBeChecked() toBeEditable() toBeFocused()
toHaveText(str|re|[list]) toContainText() toHaveValue() toHaveValues() toHaveAttribute(name, value)
toHaveClass() toHaveCount(n) toHaveCSS()`; page: `toHaveURL() toHaveTitle()`; `toHaveScreenshot()`.

Value assertions (no retry — only for values already computed): `expect(orderId).toContain(rowId)`,
`expect(total).toBe(sum)`. `expect.poll(() => fn()).toBe(x)` to retry any async value.

- `toBeHidden()` also passes when the element is absent.
- `expect.soft(...)` — keeps going after a failure; use when the manual TC lists several independent
  expected results for ONE step, so the report shows all mismatches. Never for preconditions.
- Custom message: `await expect(locator, 'Tổng tiền sau khi áp mã').toHaveText('90.000 ₫')`.
- **Course → better**: `const b = await loc.isVisible(); expect(b).toBeTruthy()` and
  `await page.getByText('Success').isVisible();` (asserts nothing) → `await expect(loc).toBeVisible()`.

## 6. UI components & browser features

### 6.1. Alert / Confirm / Prompt — Sync vs Async

Websites show `window.alert()` in two timing patterns:
1. **Sync (client-side validation)**: Alert appears IMMEDIATELY when clicking → blocks the click action
2. **Async (after API response)**: Alert appears AFTER the click completes → need to wait for it

**Pattern A — Sync alerts (empty field validation, client-side checks):**
```ts
// Alert blocks the click, so we MUST handle it immediately using page.once()
const dialogPromise = new Promise<string>((resolve) => {
  page.once('dialog', async (dialog) => {
    resolve(dialog.message());
    await dialog.accept();  // or dialog.dismiss()
  });
});
await page.getByRole('button', { name: 'Submit' }).click();
const message = await dialogPromise;
expect(message).toBe('Please fill out all fields.');
```

**Pattern B — Async alerts (after API call):**
```ts
// Alert appears after server responds, click completes first
const dialogPromise = page.waitForEvent('dialog', { timeout: 15000 });
await page.getByRole('button', { name: 'Register' }).click();
const dialog = await dialogPromise;
expect(dialog.message()).toBe('Registration successful.');
await dialog.accept();
```

**Pattern C — Universal (handles BOTH sync and async):**
```ts
// Best for actions that may show alert either way (e.g., form submission that validates
// client-side first, then calls API). Use page.once() to auto-accept immediately (sync),
// and Promise.race with timeout to wait for async alerts.
const dialogPromise = new Promise<string>((resolve) => {
  page.once('dialog', async (dialog) => {
    resolve(dialog.message());
    await dialog.accept();
  });
});

await page.getByRole('button', { name: 'Sign up' }).click();

// Wait for dialog with timeout (handles both sync and async)
const alertMessage = await Promise.race([
  dialogPromise,
  new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error('No alert appeared within 15s')), 15000)
  ),
]);
expect(alertMessage).toBe('Sign up successful.');
```

**When to use which pattern:**
| Scenario | Pattern | Example |
|----------|---------|---------|
| Client-side validation (empty fields, format check) | A (sync) | "Please fill out Username" |
| API response alert (success/error from server) | B (async) | "User already exists" |
| Unknown timing OR mixed validation | C (universal) | Form with both client + server validation |

**Common mistake:** Using `page.waitForEvent('dialog')` for sync alerts causes timeout because
the alert blocks the click before `waitForEvent` can capture it.

### 6.2. Other UI components
```ts
// Confirm dialog with dismiss (Cancel)
const dialogPromise = page.waitForEvent('dialog');
const clickPromise = page.locator('#confirmbtn').click();
const dialog = await dialogPromise;
expect(dialog.message()).toBe('Are you sure?');
await dialog.dismiss();            // or: await dialog.accept();
await clickPromise;

// Prompt dialog with input
page.once('dialog', async (d) => {
  await d.accept('my input text');
});
await page.getByRole('button', { name: 'Prompt' }).click();

// child window / new tab
const [newPage] = await Promise.all([page.context().waitForEvent('page'), page.getByRole('link', { name: 'Free Access' }).click()]);
await expect(newPage.locator('.red')).toContainText('@');

// download → edit → upload (course: exceljs) — files under testInfo.outputPath, never absolute paths
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download' }).click();
const download = await downloadPromise;
const file = testInfo.outputPath(download.suggestedFilename());
await download.saveAs(file);
await updateCellNextTo(file, 'Mango', '350', { rowChange: 0, colChange: 2 });   // @support/excel
await page.locator('#fileinput').setInputFiles(file);
```
- Hidden/displayed: `await expect(loc).toBeVisible()` → action → `await expect(loc).toBeHidden()`.
- Static `<select>`: `selectOption('consult')` → `await expect(select).toHaveValue('consult')`.
- Radio: `page.getByRole('radio', { name: 'User' }).check()` → `toBeChecked()`; a confirmation popup that
  appears after choosing → click its button in the same page-object method (`chooseUserType`).
- Checkbox: `check()` / `uncheck()` → `toBeChecked()` / `not.toBeChecked()` (course used
  `expect(await isChecked()).toBeFalsy()` — use the web-first form).
- Child window: after `Promise.all([...waitForEvent('page'), click])` both tabs stay usable — read from the
  new tab, act on the old one (`ui-controls.feature` TC-102). Store the new `Page` in `ctx` between steps.
- Mobile web emulation: project with `...devices['Pixel 7']` / `devices['iPhone 13']` (UA + viewport +
  touch). A bare `viewport` keeps desktop UA.
- Geolocation / permissions / locale / timezone: project `use` (`permissions: ['geolocation']`,
  `geolocation`, `locale: 'vi-VN'`, `timezoneId: 'Asia/Ho_Chi_Minh'`).
- `ignoreHTTPSErrors: true` for staging certificates (already in config).

## 7. Session reuse (login once)
- Project `setup` (`tests/setup/auth.setup.ts`) logs in through the UI and writes `STORAGE.<role>`; web
  projects depend on it; Scenarios opt in with the tag `@auth:<role>` (e.g. `@auth:webUser` — handled in
  `bdd/steps/bdd.ts`); spec-style files with `test.use({ storageState: STORAGE.webUser })`.
- Several roles: one setup test + one storage file per role; a TC with two roles uses
  `browser.newContext({ storageState: STORAGE.admin })` for the second actor and closes it.
- Token in localStorage (course WebAPIPart1): `apiToken` fixture + `page.addInitScript((t) => window.localStorage.setItem('token', t), apiToken)`
  **before** `goto` — `page.evaluate` is too late (app already redirected to login).
- Cookies: `context.addCookies([...])`. sessionStorage: `addInitScript` with `sessionStorage.setItem`.
- Login-screen TCs never use storageState.

## 8. Network (Playwright-only power — RF SeleniumLibrary cannot do this)
```ts
// mock a response (empty state / error state) — register before the trigger
await page.route('**/api/ecom/order/get-orders-for-customer/*', (route) => route.fulfill({ json: { data: [], message: 'No Orders' } }));
// patch a real response
await page.route('**/api/cart', async (route) => {
  const response = await route.fetch();
  const json = await response.json();
  await route.fulfill({ response, json: { ...json, total: 0 } });
});
// alter the request (course: security test — view someone else's order)
await page.route('**/get-orders-details?id=*', (route) => route.continue({ url: `${ENV.apiBaseUrl}order/get-orders-details?id=${otherUsersOrderId}` }));
// simulate server down / block heavy assets
await page.route('**/api/payment/**', (route) => route.abort('failed'));
await page.route('**/*.{png,jpg,jpeg}', (route) => route.abort());
// observe
page.on('response', (r) => { if (r.status() >= 400) console.log(r.status(), r.url()); });
```
- Mock only what the manual TC needs to put the app in a state ("khi API trả lỗi 500…", "khi không có đơn").
  A TC that verifies real backend behaviour must hit the real backend.
- Use the data from the real API contract (api-reference.md) for mocked bodies.

## 9. Visual testing
- Evidence: `await page.screenshot({ path: testInfo.outputPath('step.png'), fullPage: true })`,
  `locator.screenshot()` (element must be visible).
- Evidence in reports: after saving, `await $testInfo.attach(name, { path: file, contentType: 'image/png' })`
  → shown in Playwright HTML and Monocart reports (`more-validations.feature` TC-115).
- Comparison: `await expect(page).toHaveScreenshot('landing.png', { mask: [page.locator('.clock')], maxDiffPixelRatio: 0.01 })`
  (**Course `toMatchSnapshot(await page.screenshot())` → better `toHaveScreenshot`**: retries until stable).
  First run writes the baseline to `bdd/__screenshots__/` (config `snapshotPathTemplate`) and fails →
  `npm run update-snapshots`, review the PNG, commit it; later runs compare. Tag these TCs `@visual`. Baselines are per
  OS/browser → generate them in the CI image, commit them. Only when the TC asks for visual checks.

## 10. Timeouts (step > test > global; test timeout is the ceiling)
| Kind | Default here | Global (`config/timeouts.ts`) | Per test | Per step |
|---|---|---|---|---|
| test | 60 s | `TIMEOUTS.test` | `test.setTimeout(120_000)`, `test.slow()` (×3) | — |
| expect | 10 s | `TIMEOUTS.expect` | `const slowExpect = expect.configure({ timeout: TIMEOUTS.slow })` | `toBeVisible({ timeout })` |
| action | 15 s | `use.actionTimeout` | `page.setDefaultTimeout()` | `click({ timeout })` |
| navigation | 30 s | `use.navigationTimeout` | `page.setDefaultNavigationTimeout()` | `goto(url, { timeout })` |
Raise a timeout only for a step the TC/business says is slow (report generation, payment) — with a comment.

## 11. Parallel, retries, flaky
- `fullyParallel: true`; locally workers = CPU/2, CI `WORKERS` param. Each test owns its data.
- `retries`: 0 locally, 1 in CI. A test that passes on retry is **flaky** (summary shows it) → fix the
  cause (missing wait/assertion, shared data, order dependency), don't raise retries.
- Race condition across workers (course: two tests editing one cart) → per-test data via API or a
  per-worker account (`testInfo.parallelIndex` → `WEB_USER_<n>` keys), not `test.skip`/more retries.
- `test.describe.configure({ mode: 'serial' })` only for genuinely dependent steps (failure skips the rest).

## 12. Data-driven
Cucumber style: `Scenario Outline` + `Examples` (bdd-gherkin.md §2). Spec-style projects only:
```ts
interface CheckoutRow { label: string; product: string; country: string }
const ROWS = loadData<CheckoutRow[]>('checkout')['TC-021'];
for (const row of ROWS) {
  test(`TC-021 — Đặt hàng thành công [${row.label}]`, { tag: ['@TC-021', '@regression'] }, async ({ poManager }) => { ... });
}
```
Course alternatives: static data fixture (`extend<{ testData: T }>`), JSON array loop — use the loop above.

## 13. Debugging toolbox (for the agent and the user)
| Tool | Command | Use |
|---|---|---|
| Live locator session | `playwright-cli` (references/live-locator.md) | discover/verify locators before writing |
| UI mode | `npx playwright test --ui` | user: time-travel, watch mode |
| Inspector | `npx playwright test <file> --debug` / `await page.pause()` | user: step through |
| Codegen | `npx playwright codegen <url>` | user: quick skeleton (~70% only) — never paste raw into the framework |
| Trace viewer | `npx playwright show-trace results/test-results/<t>/trace.zip` | DOM before/after, network, console |
| Error context | `results/test-results/<t>/error-context.md` | ARIA snapshot at failure — agent reads it |
| Fix with AI | "Copy prompt" in HTML report / trace | user-side; same info the agent already reads |
| Headed | local **mặc định headed** (config `HEADED`, default true khi không CI); `--headed` ép bật, `HEADED=false` tắt | xem trình duyệt chạy khi viết/chạy thử; CI luôn headless |

## 14. Anti-patterns (reject in review / refactor)
1. `waitForTimeout`, `networkidle` waits, sleeps.
2. `isVisible()`/`isChecked()` as assertions; `expect(locator)` without `await`.
3. `type()` (deprecated) → `fill` / `pressSequentially`.
4. Loops over `nth(i)` + `textContent() ===` to find an item → `filter({ hasText | has })`.
5. Hardcoded URLs, credentials, product ids, absolute download paths.
6. `waitForResponse` / dialog / popup listeners registered after the triggering click.
7. Shared accounts/data between parallel tests "fixed" with retries or skips.
8. Assertions on business rules inside page objects (keep in specs); page objects importing test data.
9. `toMatchSnapshot(await page.screenshot())` → `toHaveScreenshot`.
10. `trace/video/screenshot: 'on'` in CI → retain-on-failure / only-on-failure (config already does it).
11. storageState created inside `beforeAll` of a spec → setup project.
12. `any`, duplicate `export` + `module.exports`, `require()` in TS, JS files.
13. **Wrong alert handling pattern for sync alerts**: Using `page.waitForEvent('dialog')` + click + await dialog
    for client-side validation alerts causes timeout because sync alerts block the click action before
    `waitForEvent` can capture it. Use `page.once('dialog')` + Promise pattern instead (§6.1 Pattern A/C).
