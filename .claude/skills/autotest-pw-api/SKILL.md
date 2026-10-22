---
name: autotest-pw-api
description: Playwright TypeScript REST API automation in Cucumber/BDD style — write, update, refactor, delete API scenarios (Gherkin .feature + TypeScript steps via playwright-bdd, typed service objects, ApiClient, auth fixtures, Scenario Outline data-driven, cleanup hooks), plus Mode D data-driven from CSV (data/api/<feature>.csv, 1 row = 1 TC, shared steps, INPUT_DATA generators) like autotest-rf-api, from the manual TC file; also the API layer reused by autotest-pw-web and autotest-pw-android for setup, teardown and backend checks. Same docs/TC/credential flow as autotest-rf-api.
disable-model-invocation: true
argument-hint: "<yêu cầu bất kỳ>"
---

# Playwright API Agent

You are a **Senior API Test Automation Engineer** for Playwright (TypeScript) in `automation_test/`.
Two roles:
1. **Standalone API testing** — TCs of an API feature (`Loại chức năng: API` in test-cases.md).
2. **API layer for UI tests** — services/fixtures used by `autotest-pw-web` / `autotest-pw-android` for
   preconditions, cleanup, skipping UI login and checking backend effects. When those skills need it they
   read `references/api-best-practices.md` and follow §1–§7; this SKILL.md flow is for standalone use.

> **Important:** run inside the **target project directory**, not the skills template repo.
> **Ngôn ngữ giao tiếp:** tiếng Việt, giữ nguyên thuật ngữ kỹ thuật. **Commit** chỉ khi user yêu cầu,
> message tiếng Việt `<type>: <mô tả>`. **TypeScript only.**

**Read before writing code (every run):**
- `.claude/skills/autotest-pw-web/references/framework.md` — layout, scaffold, run, conventions (shared)
- `.claude/skills/autotest-pw-web/references/bdd-gherkin.md` — TC → Scenario, steps, ctx, hooks, tags, Outline/DataTable
- `.claude/skills/autotest-pw-api/references/api-best-practices.md` — API layer rules
- Reference implementation (ran green against a real API): `.claude/skills/autotest-pw-api/examples/`
  - **Ví dụ tối giản, public, zero-setup (đã verify PASS):** `examples/services/posts/` + `bdd/features/posts.feature` + `bdd/steps/posts.steps.ts` + `data/posts.json` — JSONPlaceholder, GET + POST, không cần auth.
  - **Mode D (CSV data-driven, đã verify PASS):** `examples/data/api/posts.csv` → `npm run dd:sync` → `posts.dd.feature` (GET/POST/PUT, query params, INPUT_DATA, assert mảng, 404 không đăng nhập)

Core principles are the same as autotest-pw-web: AI acts / user only provides data · never ask, read or
print credential values · manual TC is the contract · ask, never guess · run after writing, done = passes
against the real API server · never overwrite files wholesale.

---

## Argument Parsing

Same as autotest-pw-web (`/autotest-pw-api orders`, `viết test API đơn hàng`, `sửa TC-004 của auth`,
`refactor api cart`, `xoá TC-005 của order`; empty → ask one question). MODE A (write/update) · B (refactor)
· C (delete) · D (data-driven CSV, chosen in Step 1d). FEATURE slug, TC_LIST. No need to choose data-driven up front — decided in Step 1d.

## Step 0: Guard · Step 0a: State · Step 0-env · Step 0b: Scaffold

Exactly as `autotest-pw-web` Steps 0 → 0b (same guard message with `/autotest-pw-api`, same
`pw_scaffold.py state|core`, same `cred_env.py init --scope project`, same install rules). For an API-only
project omit `--web-login`, and `npx playwright install chromium` is still needed for `ci/collage.ts`
only in CI — locally it can be skipped.

## Step 0c: Environment & domain docs

`global-data.md` + `api-reference.md` exist → read API base URL, `## Authentication` (login endpoint,
username/password/token fields, auth type), endpoint catalog for the feature. Several environments → ask
which one and wait.

Missing → ask in ONE message (groups 2–5 accept "skip"):
> **1. API** — Base URL? Endpoint login (hoặc "none")? Kiểu auth (Bearer JWT / raw token / API key / Basic / none)? Tên field username, password trong body login (mặc định `username`/`password`) và field chứa token trong response (vd `token`, `data.accessToken`)? *(Không gửi username/password/key ở đây — mình tạo sẵn `automation_test/.env` để bạn tự điền.)*
> **2. product-overview** · **3. business-scenario** · **4. detail-design** · **5. api-reference** (danh sách endpoint: method, path, body, response, mã lỗi) — hoặc "skip"

Write docs as autotest-pw-web Step 0c (key names only, `cred_env.py ignore`). Feed the answers into
`pw_scaffold.py core --platforms api --api-base-url ... --ep-login ... --username-field ... --password-field ...
--token-field ... --token-scheme ...` (or, for an existing project, the defaults in `config/env.ts` AUTH).
`--platforms api` = API-only framework (no web POM). A web/android project already carries the API layer as
support, so add `api` to its platforms only when you also want API as a separate test target there.

Credential gate (before running): `cred_env.py check --scope project --keys API_USERNAME API_PASSWORD`
(+ `API_KEY`, `API_<ROLE>_*`). Exit 2 → relay the HƯỚNG DẪN block, keep writing, block only the run.

---

## Mode A — Write / update

### Step 1a: TC file — same lookup and fallback question as autotest-pw-web Step 1a.
### Step 1b: Read test-cases.md, api-reference.md, business-scenario.md, detail-design.md, strategy.md.
### Step 1b2: TC selection — same mandatory question as autotest-pw-web Step 1b2 (wait for a real answer).

### Step 1c: Probe the real API (mandatory for every endpoint not yet covered)
api-best-practices §8: throw-away `probe.ts` chạy bằng `npx tsx` (request thô, đọc .env) → real status codes and
body shape → delete the probe. Behaviour ≠ TC/api-reference → STOP with the discrepancy report:
> **TC-NNN — phát hiện sai khác:** TC ghi: `<expected>` · Thực tế `<METHOD> <path>` trả: `<status/body excerpt>` · Bạn kiểm tra giúp TC còn đúng không?

Confirmed real bug → write the Scenario as specified with tags `@known-bug @fail` + `# BUG-<id>: <reason>` comment.

### Step 1d: Structure decision — Mode A or Mode D (once, before writing any file)
Analyse the selected TCs (same table as autotest-rf-api Step 1b):

| Factor | Mode A (Scenario + service) | Mode D (CSV data-driven) |
|---|---|---|
| Number of TCs | few (1–10) | many (10+) or will grow |
| Steps | each TC has its own flow | same endpoint, only data differs |
| Endpoints | many | 1–2, many inputs |
| Assertions | complex / different per TC | status + a few response fields |
| Dynamic data | fixed values | generated (uuid, timestamp, random) |

> **Phân tích `<feature>`:** X TC · cấu trúc: <vd "8 TC đều gọi POST /payment, chỉ khác body và status"> · dữ liệu động: <có/không>
> **Khuyến nghị: Mode A / Mode D** — <1–2 câu lý do>
> | | Mode A — Scenario | Mode D — CSV |
> |---|---|---|
> | Cấu trúc | 1 Scenario + step/service riêng mỗi TC | 1 file CSV, mỗi dòng 1 TC, step dùng chung |
> | Phù hợp | flow khác nhau, assert phức tạp | cùng endpoint, nhiều bộ dữ liệu |
> | Mở rộng | viết thêm code | thêm dòng CSV + `npm run dd:sync` |
> **Bạn chọn mode nào?** (**A** / **D**, hoặc trả lời "theo khuyến nghị")

**STOP — wait for the answer** (strategy.md already decided → follow it). Mixed is fine: Mode D for the
validation matrix, Mode A for flows. Mode D → section "Mode D" below. Mode A with several TCs that differ only
by data inside ONE TC → still offer a `Scenario Outline` (bdd-gherkin.md §2):
  > TC-030..TC-036 chỉ khác dữ liệu đầu vào. Gộp thành 1 Scenario Outline (7 dòng Examples, mỗi dòng 1 test riêng trong report) hay giữ 7 Scenario riêng? **1** Gộp · **2** Giữ riêng
- Special signals (OTP, DB, 3rd-party) → same handling as autotest-pw-web Step 1d.

### Step 2: Write files
1. `services/<feature>/<feature>.endpoints.ts` — paths from api-reference.md (relative to API base).
2. `services/<feature>/<Feature>Service.ts` — typed interfaces, one method per call, cleanup helpers.
   Calls whose status is asserted by a later `Then` use `expectStatus: 'any'` (api-best-practices §2).
3. `bdd/features/<feature>.feature` — `@api @<feature>` on the Feature; one Scenario per TC
   (`Scenario: TC-NNN — <Title verbatim>`, tags `@TC-NNN` + `@smoke|@regression|@negative`), shared
   precondition (`Given đã đăng nhập API`) in `Background`, request data visible in the steps
   (quoted values, `Examples`, DataTable); big JSON bodies → `data/<feature>.json` referenced by key.
4. `npx bddgen` → snippets for new sentences → `bdd/steps/<feature>.steps.ts`: `When` = service call,
   result stored in `ctx`; `Then` = assertions on `ctx` values; cleanup in `After({ tags: '@<feature>' })`.
   Reuse existing sentences (`npm run steps`).
5. First line of the `.feature` and steps file = run-command comment (framework.md §4).
6. `npx bddgen` (no missing/ambiguous) → `npm run typecheck`. 7. If `ci/tc-catalog.ts` exists (Jenkins pipeline from `/autotest-pw-jenkins`) → `npm run ci:catalog` so the Jenkins `FEATURES`/`TC_LIST` checkboxes list the new/changed/removed TCs; relay its `⚠` lines.

### Step 3: Run & debug
```bash
cd automation_test && npx bddgen && npx playwright test --project=api --grep "@TC-004\b|@TC-005\b"
# nhiều log nhất (debug): DEBUG=pw:api trước lệnh test (log từng request) + --trace on (trace cả API request, xem bằng show-trace)
#   npx bddgen && DEBUG=pw:api npx playwright test --project=api --trace on --grep "@TC-004\b"
cd automation_test && npm run summary
```
Debug table additions to autotest-pw-web Step 5: `expected 201, received 401` → token/auth contract
(`AUTH.*`, scheme) or credential value (tell the user which key, never guess) · `Response không phải JSON`
→ wrong base URL/path (HTML error page) · 404 on a valid id → environment/data mismatch, ask ·
`ECONNREFUSED`/`ENOTFOUND` → URL/VPN/proxy (`HTTPS_PROXY`) · `apiRequestContext.fetch: Timeout` on EVERY call,
the host unchanged and reachable in a browser → stalling OS DNS resolver, diagnose with framework.md §6 before
touching the code (a per-call `timeout` is only right for an endpoint the API docs call slow, e.g. one that starts
a long backend command). Repeat until green.
After the selected TCs pass, run the whole feature once (`--grep @<feature>`, API tests are fast) and report.

## Mode D — Data-driven CSV (api-best-practices §5a)
Chosen in Step 1d. Step 1c probe still applies (real status/body for each endpoint).
1. Ask only what the TC file / api-reference does not say — ONE message:
   > Cần thêm để tạo data-driven cho `<feature>`: **1** Field nào trong body cần sinh lúc chạy, kiểu gì (`uuid`, `timestamp`, `iso`, `epoch`, `number:<n>`, `string:<n>`) — vd `transactionId=number:18` · **2** Có TC nào gọi KHÔNG cần đăng nhập? · **3** Tạo CSV từ TC file, hay bạn có dữ liệu mẫu (file CSV/Excel)?
   (TC file đã đủ endpoint/body/expected → bỏ câu 3.)
2. Write `data/api/<feature>.csv` — header `tc,title,method,url,request_body,response_status_code,response_body,auth,tags`,
   one row per TC (`tc` = `TC-NNN` from test-cases.md, `title` verbatim), JSON cells with `""` escaping,
   `response_body` = only the keys the TC asserts. UTF-8 (user edits in Excel on Windows → tell them *Save As → "CSV UTF-8"*), `\n` line endings. User gives an Excel file → convert
   to this CSV (keep their columns' meaning, ask when a column is unclear).
3. `npm run dd:sync` (→ `bdd/features/<feature>.dd.feature`) → `npx bddgen` → `npm run typecheck`.
   No service, no steps file, no per-TC code. Never edit the `.dd.feature` — fix the CSV and re-sync.
4. Run: `npx playwright test --project=api --grep @<feature>` (or `"@TC-010\b"`); debug as Step 3. A row whose
   behaviour ≠ TC → same discrepancy STOP as Step 1c; confirmed bug → put `@known-bug @fail` in its `tags` cell.
5. If `ci/tc-catalog.ts` exists → `npm run ci:catalog`.
Update/delete later = edit/remove CSV rows + `npm run dd:sync` (it also deletes `.dd.feature` of removed CSVs).
Example (ran green): `examples/data/api/posts.csv` (JSONPlaceholder).

## Mode B — Refactor
Raw `request.*`/`fetch` in steps → services; hardcoded host → endpoints + config; `any` → interfaces;
login per scenario → `authedApi`; missing cleanup hook; missing `@TC-NNN`; near-duplicate steps →
parameterised steps; repeated per-row Scenarios → Scenario Outline (only with the user's OK);
APiUtils-style classes → service + fixture; spec-style files → keep style unless the user asks to convert
(same procedure as autotest-pw-web Mode B). Keep titles, assertions and behaviour. Typecheck, then run
the feature's API tests.

## Mode C — Delete
Remove the Scenario (or its `Examples` row) by `@TC-NNN`, then orphan steps, service methods/endpoints/
interfaces, data entries, empty files (grep usages first — web/android steps may use the same service). Typecheck, run remaining tests, `npm run ci:catalog` if `ci/tc-catalog.ts` exists.

## Final report (tiếng Việt)
TCs written/changed/removed with results (`npm run summary`), files touched, discrepancies, missing
credential key names, how to re-run (`npx bddgen && npx playwright test --project=api --grep @<feature>`), reports (`npm run report`,
`npm run report:monocart`), CI: `/autotest-pw-jenkins`.
