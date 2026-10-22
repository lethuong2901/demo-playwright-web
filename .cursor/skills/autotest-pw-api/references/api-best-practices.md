# Playwright API testing — best practices (TypeScript)

From the course (sections 11–13: `request.newContext`, APiUtils, token → localStorage, mock/intercept,
custom fixtures) rewritten for the framework in `autotest-pw-web/references/framework.md`.
Verified implementation: `autotest-pw-api/examples/` (auth + order services, data-driven, teardown).

## 1. Layers (API Object Model)
| Layer | File | Rule |
|---|---|---|
| Transport | `services/base/ApiClient.ts` (core) | the ONLY place calling `APIRequestContext`; adds auth header, status assertion, `test.step` per call, typed JSON |
| Auth | `services/auth/AuthService.ts` (core) | login contract from `config/env.ts` `AUTH` (global-data.md) |
| Endpoints | `services/<feature>/<feature>.endpoints.ts` | `EP` const — relative paths (no host), functions for path params |
| API object | `services/<feature>/<Feature>Service.ts` | one method per business call, typed request/response `interface`s, no business assertions |
| Fixtures | `fixtures/api.fixture.ts` | `api` (anonymous), `authedApi` (token), `apiToken` (worker-scoped, one login per worker) |
| Scenario | `bdd/features/<feature>.feature` | the TC in Gherkin (bdd-gherkin.md) |
| Steps | `bdd/steps/<feature>.steps.ts` | `When` = service call → `ctx`; `Then` = assertions; `After` = cleanup |

**Course → better:** `APiUtils(apiContext: any, loginPayLoad)` with hardcoded URLs and a `{token: String}`
object → typed services + fixtures; login once per worker; base URL from config.

## 2. ApiClient usage
```ts
const res = await api.get(EP.products, { params: { page: 1, size: 20 } });          // 2xx asserted
const res2 = await api.post(EP.createOrder, { data: payload, expectStatus: 201 });   // exact status
const bad = await api.post(EP.login, { data: { email: 'x' }, expectStatus: 400 });   // negative
const up = await api.post(EP.upload, { multipart: { file: { name: 'a.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer } } });
const body = await ApiClient.json<CreateOrderResponse>(res2);
```
- `expectStatus` = the status the manual TC / api-reference.md says. Not stated → default 2xx check.
- BDD: when a `Then` step asserts the status (`Then API trả về mã 400 …`), the `When` step sends with
  `expectStatus: 'any'` and stores `{ status, body }` in `ctx` (example: `examples/bdd/steps/auth.steps.ts`).
- Headers per call via `headers`; the token header comes from `authedApi` (scheme `AUTH.tokenScheme`).
- Response time when the TC requires it: `const t0 = Date.now(); ...; expect(Date.now() - t0).toBeLessThan(2000)`.

## 3. Assertions
```ts
expect(res.status()).toBe(201);                                      // when not using expectStatus
expect(body.message).toBe('Order Placed Successfully');
expect(body.orders).toHaveLength(1);
expect(body.data).toMatchObject({ country: line.country, productName: expect.any(String) });
expect(body.items).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id })]));
expect(res.headers()['content-type']).toContain('application/json');
```
- Assert exactly what the TC's expected result says (status, message, fields) — plus the contract fields
  the TC implies (id present, type). Don't snapshot whole bodies with volatile values (ids, dates).
- Schema check when the TC asks for "đúng cấu trúc": `toMatchObject` with `expect.any(Type)` per field
  (no extra schema library unless the project already uses one).
- Lists: `toHaveLength`, `arrayContaining`, sort/filter checks computed in TS.

## 4. Data & isolation
- Payloads in `data/<feature>.json` keyed by TC id (every API TC has an entry, `{}` if none). Values that
  must be unique (email, code) → `uniqueSuffix()`.
- Create what the TC needs inside the test or a fixture; **clean up** in `finally` / after `use()`:
  ```ts
  const created = await orders.create([line]);
  try { /* steps + asserts */ } finally { await orders.remove(created.orders[0]); }
  ```
- No order dependency between tests (`fullyParallel`). A TC that is a dependent chain (create → update →
  delete) is ONE test with `test.step` per manual step.

## 5. Data-driven

Two tools — pick per feature (the skill recommends one in Step 1d and waits for the user):

| | **Mode D — CSV** (= RF `autotest-rf-api` Mode D / DataDriver) | **Scenario Outline** |
|---|---|---|
| Data | `data/api/<feature>.csv`, 1 row = 1 TC (own `@TC-NNN`), testers edit in Excel | `Examples` table inside the `.feature` |
| Code | none per TC — shared steps `bdd/steps/common/api-dd.steps.ts` | service + steps per feature |
| Fits | many TCs on 1–2 endpoints, only request/expected data differs, assert status + a few fields | one TC run with several data rows; custom flow/assertions |

### 5a. Mode D — CSV (`support/dd.ts`, `npm run dd:sync`)
```csv
tc,title,method,url,request_body,response_status_code,response_body,auth,tags
TC-010,Lấy bài viết theo id,GET,/posts/1,,200,"{""id"": 1, ""userId"": 1}",,@smoke
TC-011,Tạo bài viết,POST,/posts,"{""title"": ""INPUT_DATA:string:8"", ""userId"": 1}",201,"{""userId"": 1}",,
TC-012,Lọc theo userId,GET,/posts,"{""userId"": 1}",200,"[{""userId"": 1}]",,
TC-013,Không tồn tại,GET,/posts/999999,,404,,no,
```
- Required columns `tc` (TC-NNN, unique), `title`, `method` (GET/POST/PUT/PATCH/DELETE), `url` (relative to
  `API_BASE_URL`), `response_status_code`. Optional `request_body` (JSON; GET → query params, others → JSON
  body; empty/`{}` = none), `response_body` (JSON **subset**: nested keys, arrays by position, values compared
  as strings; empty = status only), `auth` (`yes`/`no`; empty = yes when `EP_LOGIN` ≠ none), `tags`.
- Encoding: UTF-8 (BOM ok). Excel on Windows → *Save As → "CSV UTF-8 (Comma delimited)"*; an ANSI file is rejected with that hint.
- `INPUT_DATA:<type>` anywhere in `request_body`/`url` → generated at run time: `uuid`, `timestamp`
  (`YYYY/MM/DD HH:mm:ss`, same as RF), `iso`, `epoch`, `number:<n>`, `string:<n>`.
- `npm run dd:sync` writes `bdd/features/<feature>.dd.feature` (header "TỰ SINH", never edit): one Scenario
  per row `TC-NNN — <title>` tagged `@TC-NNN` + row tags (+ `@negative` when status ≥ 400, else `@regression`
  if no level tag). So `--grep`, summary, reports and the Jenkins TC picker work unchanged. Hand-written
  `<feature>.feature` (Mode A) and `<feature>.dd.feature` may coexist with the same `@<feature>` tag — TC ids
  must not repeat between them.
- Failure message lists every mismatch path (`status: mong đợi 201, thực tế 200`, `response.data.id: …`)
  without dumping the whole body.
- Need a flow (create → use id → delete), computed values or DB checks → Mode A for that TC.

### 5b. Scenario Outline
One TC with many rows → `Scenario Outline` + `Examples` (each row = one test, unique title via a `<case>`
column in the Scenario title):
```gherkin
  @TC-030 @negative
  Scenario Outline: TC-030 — Đăng nhập sai dữ liệu [<case>]
    When gọi API đăng nhập với email "<email>" và mật khẩu "<password>"
    Then API trả về mã <status> với thông báo "<message>"

    Examples:
      | case         | email                 | password  | status | message                      |
      | sai mật khẩu | not-exist@example.com | Wrong@123 | 400    | Incorrect email or password. |
```
Several items inside ONE request → DataTable (`table.hashes()`). Use Outline when strategy.md / the user
decides to consolidate; otherwise one Scenario per TC.

## 6. Auth patterns
| API auth (global-data `## Authentication`) | Framework setting |
|---|---|
| Bearer JWT from login endpoint | `--ep-login <path> --token-field <path.in.json> --token-scheme Bearer` |
| Raw token in Authorization | `--token-scheme raw` |
| API key header | `requireEnv('API_KEY')` → `headers: { 'x-api-key': ... }` in a fixture `keyedApi` |
| Basic | `playwright.request.newContext({ httpCredentials: { username, password } })` in a fixture |
| No auth | `--ep-login none` → use `api` only |
| Several roles | one worker fixture per role (`adminToken`) reading `API_ADMIN_USERNAME/_PASSWORD` |
| OTP / TOTP login | ask the mechanism (see autotest-pw-web Step 1d); TOTP via `otpauth` + `TOTP_SECRET` |

Never print tokens (`console.log(token)` in the course) — ApiClient logs method + URL only.

## 7. Mixing API with web / Android (the main reason this layer exists)
```gherkin
  @TC-012 @regression
  Scenario: TC-012 — Đơn vừa tạo hiển thị trong My Orders
    Given đã có đơn hàng cho quốc gia "Cuba" tạo qua API
    And người dùng vào app bằng token API
    When người dùng mở trang My Orders
    Then đơn hàng vừa tạo hiển thị trong danh sách
```
```ts
// Precondition via API, verification in UI (course WebAPIPart1)
Given('đã có đơn hàng cho quốc gia {string} tạo qua API', async ({ authedApi, ctx }, country: string) => {
  ctx.set('order', await new OrderService(authedApi).create([{ country, productOrderedId: PRODUCT_ID }]));
});
Given('người dùng vào app bằng token API', async ({ page, apiToken }) => {
  await page.addInitScript((t) => window.localStorage.setItem('token', t), apiToken);   // skip UI login
});
Then('đơn hàng vừa tạo hiển thị trong danh sách', async ({ ordersPage, ctx }) => {
  await expect(ordersPage.row(ctx.get<CreateOrderResponse>('order').orders[0])).toBeVisible();
});
After({ tags: '@orders' }, async ({ authedApi, ctx }) => { /* remove ctx order */ });
```
- Same in Android specs: `authedApi` works without a browser.
- Verify a UI action's backend effect: act in UI, then `await expect.poll(async () => (await svc.details(id)).data.status).toBe('PAID')`.
- Wait for the UI's own call: `page.waitForResponse(r => r.url().includes(EP.createOrder) && r.status() === 201)`
  registered before the click; read `await (await resp).json()` to get server-generated ids.
- Mock instead of real backend only when the TC describes a backend state that can't be produced
  (see web-best-practices §8).

## 8. Probing the real API before asserting (replaces RF "verify with curl")
Do not guess status codes/fields. Before writing assertions for a new endpoint, run a throw-away probe that
uses the real fixtures (so credentials never pass through the chat) and prints status + body SHAPE:
```ts
// probe.ts — script tạm (xoá ngay sau khi dùng, KHÔNG commit). Chạy: npx tsx probe.ts
// Dùng `request` thô (không qua ApiClient vì ApiClient gọi test.step → chỉ chạy trong test runner).
// Import TƯƠNG ĐỐI (tsx bỏ qua path alias của tsconfig). Credential đọc từ .env, không qua chat.
import { request } from '@playwright/test';
import { ENV } from './config/env';

void (async () => {
  const ctx = await request.newContext({ baseURL: ENV.apiBaseUrl });
  // Cần token: POST login endpoint rồi set header Authorization trước khi gọi — tuỳ api-reference.
  const res = await ctx.get('order/get-orders-details', { params: { id: 'x' } });
  console.log(res.status(), Object.keys(await res.json()));
  await ctx.dispose();
})();
```
`cd automation_test && npx tsx probe.ts` → đọc status + shape → **xoá `probe.ts`**.
Real behaviour ≠ manual TC/api-reference → discrepancy protocol (STOP, report, wait).

## 9. Anti-patterns
- Calling `request.post(...)` / `fetch` directly in steps; hardcoded host; `any` payloads.
- Login in every test (use `apiToken` worker fixture); printing tokens.
- Asserting only `response.ok()` when the TC states a message/field.
- Tests that depend on data created by another test; no cleanup.
- Using the UI to create preconditions an API can create.
