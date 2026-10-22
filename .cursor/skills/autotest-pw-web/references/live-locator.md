# Live locator discovery — Playwright MCP or playwright-cli (mandatory for web before writing code)

Playwright counterpart of `autotest-rf-mcp-assist` (which is RobotMCP/SeleniumLibrary-only). Same contract:
**verify every manual step live before writing it into a file; reuse the live session while debugging
instead of re-running the suite; max 3 live attempts per step; Claude writes the final files itself**
(never paste raw generated code — it goes through page objects + steps).

## Engine choice (once per session)

1. **Playwright MCP** (course Section 25) — tools named `mcp__playwright__browser_*` are available in this
   session → use them (§A). Preferred: structured accessibility snapshot, no CLI parsing.
2. Not available → **register it for the project** (announce, don't ask — same as autotest-rf-mcp-assist), then
   continue THIS session with **playwright-cli** (§0–§7); the next session will have MCP:
   ```bash
   claude mcp add -s project playwright -- npx @playwright/mcp@latest
   ```
   This writes `.mcp.json` at the project root (commit it so the team gets the same server). Tell the user
   once: "Đã đăng ký Playwright MCP cho project (`.mcp.json`). Lần mở Claude Code tiếp theo, bấm Approve server
   `playwright` khi được hỏi; phiên này mình dùng playwright-cli." Headless runs:
   `claude -p --mcp-config .mcp.json --strict-mcp-config`. Not the `claude` CLI (IDE/other client) → write
   `.mcp.json` yourself: `{"mcpServers":{"playwright":{"command":"npx","args":["@playwright/mcp@latest"]}}}`.
   VS Code Copilot users (course): `.vscode/mcp.json` with `"servers": {"playwright": {...}}`.
3. Neither works (no network / npx blocked) → tell the user live verification is unavailable and ask
   whether to continue by running each new scenario right after writing it (slower loop). Never silently skip.

## A. Protocol with Playwright MCP

| Need | Tool |
|---|---|
| open / go to URL | `browser_navigate` (url) · back: `browser_navigate_back` |
| see the page (ARIA tree with `ref`s) | `browser_snapshot` |
| act | `browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_hover`, `browser_press_key`, `browser_drag`, `browser_file_upload` |
| JS alert / confirm | `browser_handle_dialog` (accept / dismiss, prompt text) |
| tabs (child window) | `browser_tabs` (list / select / close) |
| wait for text / element | `browser_wait_for` |
| check uniqueness / read values | `browser_evaluate` or `browser_run_code_unsafe` → `async (page) => page.getByRole('button', { name: 'Login' }).count()` |
| network calls of a step (what to mock / wait for) | `browser_network_requests`, `browser_network_request` |
| console errors | `browser_console_messages` |
| screenshot for a discrepancy report | `browser_take_screenshot` (save under `automation_test/results/`) |
| end | `browser_close` |

Flow per manual step: `browser_snapshot` → find the element (role + name) → act with its `ref` → the tool
returns the Playwright code it ran (e.g. `await page.getByRole('button', { name: 'Login' }).click()`) → that
**semantic locator** (never the ref) goes into the page object → `count()` must be 1 → compare the new
snapshot with the TC's expected result.

Logged-in start (`@auth:<role>` TCs): run `cd automation_test && npx playwright test --project=setup` once, then
either use playwright-cli `state-load automation_test/.auth/<role>.json` for that TC, or register a second MCP
server started with the session: `claude mcp add -s project playwright-auth -- npx @playwright/mcp@latest --isolated --storage-state automation_test/.auth/web-user.json`.
Credentials are never typed through MCP/CLI by the agent — sessions come from the setup project.

The rest of this file is the same protocol with **playwright-cli** (Bash-driven, no restart needed).

## 0. Availability (once per session)
```bash
npx -y @playwright/cli@latest --version
```
Fails (no network/registry) → tell the user live verification is unavailable, ask whether to continue by
running each new test right after writing it (slower loop). Never silently skip.

Use one named session per feature: `-s=<feature>` on every command. Commands below are abbreviated
`pwcli` = `npx -y @playwright/cli@latest`.

## 1. Open & reach the TC's starting state
```bash
pwcli -s=checkout open "<BASE_URL><path>"                 # headless; add --headed only if the user wants to watch
pwcli -s=checkout state-load automation_test/.auth/web-user.json   # when the TC starts logged in and setup already ran
```
Logged-in start without a storage file yet → perform the login steps live (credentials typed via
`pwcli fill eN "$WEB_USERNAME"` is NOT allowed — values never pass through the agent). Instead run the
setup project once: `cd automation_test && npx playwright test --project=setup` then `state-load`.

## 2. Snapshot → refs → act → harvest
```bash
pwcli -s=checkout snapshot            # writes .playwright-cli/page-<ts>.yml (ARIA tree with [ref=eN])
```
Read the YAML (Read tool / grep), find the element of the current manual step, act on it by ref:
```bash
pwcli -s=checkout click e40
pwcli -s=checkout fill e36 "Nguyen Van A"
pwcli -s=checkout select e52 "Vietnam"
pwcli -s=checkout check e61
```
Each action prints **"Ran Playwright code"** with a semantic locator, e.g.
`await page.getByRole('textbox', { name: 'email@example.com' }).fill(...)` → that locator (not the ref)
goes into the page object. Refs (`e36`) change every snapshot — **never write a ref into code**.

## 3. Verify uniqueness and the expected result
```bash
pwcli -s=checkout run-code "async page => await page.getByRole('button', { name: 'Place Order' }).count()"   # must be 1
pwcli -s=checkout run-code "async page => await page.locator('.hero-primary').textContent()"
pwcli -s=checkout eval "document.title"
```
- count 0 → wrong locator/state; count > 1 → narrow (scope, `filter`, `exact: true`) and re-check.
- Compare the real text/state with the manual TC's expected result **now**. Mismatch → STOP protocol of the
  calling skill (screenshot: `pwcli -s=checkout screenshot --filename=automation_test/results/discrepancy-TC-NNN.png`).

## 4. Other situations
| Situation | Command |
|---|---|
| iframe | `run-code "async page => await page.frameLocator('#x').getByRole('link', { name: 'Y' }).count()"` |
| JS dialog | `dialog-accept` / `dialog-dismiss` (after the click that opens it) |
| new tab | `tab-list`, `tab-select 1` |
| network calls of a step | `network` (inspect endpoints to mock / wait for) |
| console errors | `console error` |
| mock to reach a state | `route "**/api/orders*" --body='{"data":[]}' --content-type=application/json` |
| file upload | `upload ./automation_test/data/files/sample.xlsx` |
| keyboard | `press Enter`, `press ArrowDown` |
| zombie browsers | `close-all`, then `kill-all` |

## 5. Failure handling (max 3 live attempts per step)
Attempt = locator/approach change verified with `count()` + the action. After 3 failed attempts: keep the
session open, report what is actually on screen (snapshot excerpt + screenshot path) and apply the
"UI contradicts TC" protocol. Do not invent a locator that was never seen in a snapshot.

## 6. Close
```bash
pwcli -s=checkout close
```
`.playwright-cli/` (snapshots, logs) is scratch output — it is in `automation_test/.gitignore`; delete it
when done if it was created at the project root.

## 7. Debug loop reuse
When a written test fails: read `results/test-results/<test>/error-context.md` + screenshot first; if the
cause is a locator/state question, reopen the live session at that step (state-load + navigate) and fix
there — do not re-run the whole file repeatedly to probe.
