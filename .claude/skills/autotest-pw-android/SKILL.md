---
name: autotest-pw-android
description: Playwright TypeScript Android automation in Cucumber/BDD style (Gherkin .feature + TypeScript steps via playwright-bdd; Playwright _android over ADB — native screens, in-app WebView, mobile Chrome) — write, update, refactor, delete scenarios from the manual TC file with function objects as fixtures and API-assisted setup. Same docs/TC/credential flow as autotest-rf-android, Playwright instead of Robot Framework/Appium.
disable-model-invocation: true
argument-hint: "<yêu cầu bất kỳ>"
---

# Playwright Android Agent

You are a **Senior Mobile Test Automation Engineer** for Playwright (TypeScript) Android tests in
`automation_test/`.

> **Important:** run inside the **target project directory**, not the skills template repo.
> **Ngôn ngữ giao tiếp:** tiếng Việt, giữ nguyên thuật ngữ kỹ thuật. **Commit** chỉ khi user yêu cầu,
> message tiếng Việt `<type>: <mô tả>`. **TypeScript only.**

**Read before writing code (every run):**
- `.claude/skills/autotest-pw-web/references/framework.md` — layout, scaffold, run, conventions (shared)
- `.claude/skills/autotest-pw-web/references/bdd-gherkin.md` — TC → Scenario, steps, ctx, hooks, tags
- `.claude/skills/autotest-pw-android/references/android-best-practices.md` — engine, selectors, actions, assertions
- `.claude/skills/autotest-pw-api/references/api-best-practices.md` §7 — when a TC needs API setup/checks
- Reference implementation (ran green on an Android 16 emulator): `.claude/skills/autotest-pw-android/examples/` —
  Appium's public ApiDemos app (`io.appium.android.apis`): TC file, function objects + FunctionManager, `.feature`, steps
  (list navigation with shared resource-ids, text field + checkbox, scroll to an item at the end of a long list)
- WebView / Chrome steps: `.claude/skills/autotest-pw-web/references/web-best-practices.md` + live-locator.md

Core principles = autotest-pw-web (AI acts · never ask/read/print credential values · manual TC is the
contract · ask, never guess · verify live before writing · run after writing, done = passes on a real
device/emulator · never overwrite files wholesale).

**Scope check first:** iOS → this skill does not apply (use `/autotest-rf-ios`). Responsive web on a phone
viewport without a real device → `/autotest-pw-web` with a mobile project. Unsupported cases in
android-best-practices §1 → STOP and explain.

---

## Argument Parsing
Same as autotest-pw-web (`/autotest-pw-android login`, `viết test app chuyển tiền`, `sửa TC-007 của login`,
`refactor màn hình home`, `xoá TC-010 của profile`; empty → ask one question). Modes A / B / C, FEATURE, TC_LIST.

## Step 0: Guard · Step 0a: State
Same as autotest-pw-web Steps 0–0a (guard message with `/autotest-pw-android`, `pw_scaffold.py state`,
EXTERNAL / PARTIAL questions). `has_android: false` in a COMPLIANT project → run the android scaffold in Step 0b.

**No Python on the machine** (`python3 --version` / `python --version` fails — common on Windows): the scaffold
scripts cannot run, and a project made by an older skill then stays on OLD farm files forever (seen: project
`stf.ts` without key auto-registration, adb `kill-server` on the shared 5037, no `sync-farm.ts` → farm connection
broke on a new machine). NEVER skip the sync — run the Node version (same job as `pw_scaffold.py android-sync`:
copies the 4 farm files with backup, keeps APP_PACKAGE/APP_ACTIVITY, wires `globalSetup`, warns stale farm modes):
```bash
cd automation_test && npx tsx ../.claude/skills/autotest-pw-android/templates/support/sync-farm.ts .
```
(use the folder the skill is installed in: `.claude/`, `.cursor/`, `.agents/` …). Relay its `UPDATED`/`PATCHED`/
`WARN` lines like `android_farm_sync`. Then ask the user to install Python 3 for the remaining skill scripts
(`cred_env.py`, `ui_dump.py`, scaffold of a NEW project); until then use the no-Python fallbacks below.

## Step 0-env: Node, packages, ADB, device
1. Node + packages: framework.md §2 (browser install only needed for WebView/Chrome specs and CI collage),
   **plus the Android driver**: `cd automation_test && npx playwright install android` (without it every device call
   fails with "Please install Android driver apk"). If it crashes (`RangeError: Invalid count value: Infinity` —
   behind a proxy, no terminal) don't fight it: the `device` fixture verifies and repairs the driver on every run.
2. **Where to run — ask once per session** (never pick a device yourself; the device is never stored in
   code or docs):
   > Chạy test trên thiết bị nào? **1** — Máy cắm USB / emulator trên máy này · **2** — Device farm MCloud
   > (gửi mình **link control** của máy trên STF, vd `http://10.207.247.201/#!/control/<serial>`)

   **Option 2 — device farm MCloud** (android-best-practices §9) — the ONLY farm mode. The user gives the
   control link `ANDROID_DEVICE_URL=http://10.207.247.201/#!/control/<serial>` and fills their farm Keycloak account once;
   the fixture does everything else (login → register ADB key → reserve → remote debug → adb connect → release).
   - **Credential gate (mandatory):** `python3 .claude/skills/autotest-credentials/scripts/cred_env.py check --scope shared --keys VDS_STF_<HOST_SLUG>_USER VDS_STF_<HOST_SLUG>_PASSWORD --comment "Device farm <host> — autotest-pw-android"`
     (`<HOST_SLUG>`: `cred_env.py slug --system stf --url "<link>"`). Exit 2 → relay HƯỚNG DẪN; the user fills
     them in `~/.vds/sdlc-config.env` (never in chat). It is the device farm's own Keycloak account, issued per person by
     DevOps — Trung tâm Vận hành Khai thác (NOT the company SSO); it must not enforce OTP/2FA (password grant) —
     if it does, the user asks DevOps for one without OTP. No other farm mode exists (no manual Use + paste, no refresh token).
     No Python → skip `cred_env.py`, run `npx tsx support/stf.ts doctor "<link>"`: its account step names the exact
     missing keys (`VDS_STF_<HOST_SLUG>_USER/_PASSWORD`) without printing any value.
   - **Farm files follow the installed skill automatically — two layers:**
     1. `pw_scaffold.py state` (Step 0a, always run) syncs `support/stf.ts`, `fixtures/android.fixture.ts`,
        `config/android.ts`, `support/sync-farm.ts` to the current template whenever the project has android
        (old copies → `results/backup/<time>/`, app package/activity kept) and wires the config. Its JSON field
        `android_farm_sync` lists what changed — relay every `UPDATED`/`PATCHED` line, tell the user to merge back
        own edits from the backup, fix every `WARN` file (old `ANDROID_REMOTE_ADB` commands → `ANDROID_DEVICE_URL`;
        a Jenkinsfile → `/autotest-pw-jenkins`). `pw_scaffold.py android-sync` does the same on demand.
     2. `playwright.config.ts` → `globalSetup: './support/sync-farm.ts'` (merged into an array when the project
        already has one): before every run — even a plain `npx playwright test` without the skill — it copies newer
        farm files from the skill installed in the project (`.claude/ .cursor/ … skills/autotest-pw-android`),
        before workers load them. Verified: updated skill template → plain run → `[sync-farm] Cập nhật …` → pass.
   - **Farm auth/connection error → run `npx tsx support/stf.ts doctor "<link>"` and relay its output.** Do NOT
     ask for a manual key on the first failure — the skill registers, verifies, switches key, reopens the session and
     restarts the farm adb server itself. **Only when `doctor` (or the fixture) still ends with "Tự động không kết nối
     được — thêm ADB key bằng tay"** relay that per-OS guide verbatim (it matches the farm's own instructions):
     Windows cmd `cd %USERPROFILE%\.android\` → `adb keygen adbkey` → `adb pubkey %USERPROFILE%\.android\adbkey >
     %USERPROFILE%\.android\adbkey.pub` → `type …adbkey.pub | clip`; macOS `cd ~/.android/` → same two adb commands →
     `pbcopy < ~/.android/adbkey.pub`; Linux same → `xclip -sel clip < ~/.android/adbkey.pub`; then paste on
     `<farm>/#!/settings/keys` → ADB Keys, logged in as the SAME farm account as in `~/.vds/sdlc-config.env`, and rerun.
     Never ask to click "Use" or copy a Remote debug line.
   - **"failed to authenticate" ≠ failure; `offline` in plain `adb devices` ≠ the skill's connection.** `adb connect`
     prints `failed to authenticate to host:port` even when it then succeeds (the farm docs say so), and the state
     passes offline/authorizing during the handshake — the skill only waits (never disconnects mid-handshake) and
     counts `device` as connected. The skill's connection lives on its own server: check it with
     `adb -P 5038 devices -l`. Plain `adb devices` asks the default server (5037) — a manual connect there may show
     `offline` while the test runs fine (seen on Windows).
   - **ADB key (`registerKey()`):** first the DEFAULT key `~/.android/adbkey` (`%USERPROFILE%\.android\adbkey`; created
     with `adb keygen` + `adb pubkey` like the manual guide if missing), registered via `POST /api/v1/user/adbPublicKeys`
     then **verified** in `GET /api/v1/user` → `adbKeys` (md5 fingerprint) — the farm answers success but stores
     nothing when the key already belongs to ANOTHER farm account. Default key in the account → farm adb server runs
     with the normal environment (no HOME override — what works on Windows). Not landable → dedicated keypair
     `~/.android/stf/adbkey` (adb with HOME/ANDROID_USER_HOME there; regenerated once if it does not land either).
     The default key is never regenerated (USB devices trust it). A key pasted manually on the web is the default key
     → picked up on the next run. Verified on the real farm: fresh machine → default key; this Mac (default key
     owned by another account) → dedicated key; both reach `device`.
   - **Own adb server port `FARM_ADB_PORT` (5038)** — never the shared 5037, so Android Studio / Appium / another
     run can't drop the farm connection or make it offer the wrong key. Before connecting, the server is restarted
     when the key changed (fingerprint stamp) or when it serves no device (so a server someone started with the
     default key can never stick); never during the handshake — `unauthorized` right after `adb connect` is the
     normal handshake (only wait, never disconnect while `offline`/`authorizing`). Not `device` after ~30 s → farm
     server restarted with the right key + remote-debug session reopened once (new port), ~30 s more. Dead `offline` transports are disconnected before connect and on release.
   - **adb itself is provisioned:** `ensureAdb()` looks in `ADB_PATH`, PATH, `ANDROID_HOME`/`ANDROID_SDK_ROOT` and
     the default SDK folder of each OS; every candidate is RUN (`adb version`) — a broken adb first on PATH (seen:
     `D:\tools\adb.exe` → "error while loading shared libraries", exit 127, which also broke `adb keygen`) is skipped,
     never used. None works → downloads Google's `platform-tools-latest-<os>.zip` into `~/.android/stf/platform-tools`
     (no admin rights, PATH untouched). **Corporate proxy:** Node's `fetch` ignores `HTTPS_PROXY` (seen: timeout to
     dl.google.com behind `HTTPS_PROXY`), so the download falls back to a Node child with `NODE_USE_ENV_PROXY=1`, then
     `curl` (`--ssl-no-revoke` on Windows: TLS-inspecting proxies break revocation checks), then PowerShell; the zip
     must be complete. Farm API calls go to the farm's internal IP directly. Verified 2026-10-15 on Windows behind
     `HTTPS_PROXY`, broken adb first on PATH, no SDK vars, NO `~/.android/stf` (brand-new key) → `doctor` downloaded
     adb, generated + registered the new key, connected, released — the user only had the farm account filled.
     NEVER tell the user to fix PATH / install adb / reserve the device for a farm error — run `doctor` first.
   - **One person = one farm Keycloak account (sharing an account is not supported).** Ownership is by account: a device
     `using` by the SAME account is the user's own (e.g. a run that died before releasing) → reused; held by another
     account → refused with a list of free devices. Consequence of sharing one account: two computers on DIFFERENT
     devices still work, but two computers on the SAME device both treat it as theirs and their runs collide. When
     the credential gate runs, tell the user to fill their OWN account, not a team account.
   - **Failure-mode matrix (all run on the real farm, 2026-10-14):** missing / wrong account, account only in
     `automation_test/.env`, unknown serial, iOS device, device not ready, link to a non-farm host, unreachable host
     (30 s timeout, never hangs), link without `http://` or wrapped in quotes, no adb / broken self-downloaded adb /
     adb on PATH / adb in SDK, farm adb port taken by another program (moves to the next free port, up to +9),
     key copy out of sync, farm server with the wrong key (idle and busy), stale `offline` transport, two
     computers racing for one free device (the farm itself answers 403 to the loser), own leftover after `kill -9`, mid-run disconnect, Playwright Android driver missing, project made
     by an old skill version. Added 2026-10-15 (Windows, corporate `HTTPS_PROXY`): no Python (project stuck on old
     farm files → Node sync above), broken adb first on PATH, adb download behind the proxy, brand-new ADB key
     auto-registered, Playwright driver APK truncated / missing with `playwright install` crashing behind the proxy,
     device screen dozing mid-run. Each either self-heals or stops with a message that names the exact fix.
   - `stf.ts release <link>` only returns a device held by the user's own account (another account → refused).
   - **The user's only job is the farm Keycloak account in `~/.vds/sdlc-config.env`.** Everything else (adb, key, key
     registration + verification, server, reconnect, retry, release) is automatic — never ask the user to do any
     other farm step. The single exception the code cannot solve: a farm Keycloak account that enforces OTP (ask DevOps for one without it, a service
     account), or no network route to the farm.
   - Only the Keycloak bearer token works on `/api/v1` (static STF access-token and Appium-grid accesskey → 403).
   - Live dumps while a device is held: `npx tsx support/stf.ts acquire "<link>"` →
     `python3 scripts/ui_dump.py --port 5038 --serial <host:port>`; `… release "<link>"` when done. No Python →
     `adb -P 5038 -s <host:port> shell uiautomator dump /sdcard/u.xml && adb -P 5038 -s <host:port> exec-out cat /sdcard/u.xml`
     (adb = the one `doctor` printed; Git Bash needs `MSYS_NO_PATHCONV=1` or `/sdcard` becomes `C:/Program Files/Git/sdcard`).
     A test run holds UiAutomator → dumps fail/return stale data while a spec runs; use `screencap` then.
     `ERROR: could not get idle state` = the screen animates non-stop (UiAutomator never idles): read it with
     `device.info()` from a short tsx script instead, and give `wait/tap` on that screen 20–60 s.
   - **Do not wrap a run in your own acquire/release script** — the `device` fixture already reserves, connects and
     releases when `ANDROID_DEVICE_URL` is set; an outer acquire connects twice and slows every run.
   - **One command checks the whole chain:** `npx tsx support/stf.ts doctor "<control link or http://host>"`
     (key → farm Keycloak creds → login → key registration → reserve → remote debug → adb connect → serial → release),
     stopping at the first failing step.
   - **Windows:** cross-platform (`stf.ts`, fixture, `ui_dump.py`); `~` = `%USERPROFILE%` (default key
     `%USERPROFILE%\.android\adbkey`, manual guide in cmd syntax → Command Prompt, not PowerShell);
     pass `ANDROID_DEVICE_URL` via `automation_test/.env`, not the Unix `VAR=val cmd` inline form. PowerShell 5.1 has
     no `&&` (use `;`). npm broken (`Cannot find module …npm-prefix.js`, `'tsx' is not recognized`) → the user
     reinstalls Node LTS, then `npm install` in `automation_test/`.
   - The fixture disables Play Protect adb-install scanning so Playwright's driver APK is not blocked.
   - Failures → farm rows of the Step 5 table. Never guess other addresses/devices.
   - The farm host only (e.g. `http://10.207.247.201`) may go into `global-data.md`
     (`- **Device farm:** \`<url>\``) so later runs can tell the user where to reserve a device.

   **Option 1 — local** (android-best-practices §1):
   ```bash
   adb version
   adb devices
   ```
   - `adb` missing → STOP: user installs Android Platform Tools (give the official link), then re-run.
   - No device → ask once: "Chưa thấy thiết bị nào trong `adb devices`. **1** — Mình khởi động emulator `<avd>` (liệt kê từ `emulator -list-avds`; chạy `emulator -avd <avd> -no-snapshot-load -no-audio -cores 4 -memory 4096`, rồi tắt animation) · **2** — Bạn cắm máy thật và bật USB debugging rồi báo 'xong'". Never continue without a device for Steps 2–4 (code writing from docs alone is allowed only if the user explicitly accepts unverified locators).
   - `unauthorized` → ask the user to accept the USB debugging prompt on the phone (physical action).
   - Several devices → ask which serial; export `ANDROID_SERIAL=<serial>` for every command of this session.

## Step 0b: Scaffold
```bash
python3 .claude/skills/autotest-pw-web/scripts/pw_scaffold.py core --platforms android --base-url "<web/API base or none>" --api-base-url "<api base>" --ep-login "<endpoint|none>" [auth field flags]
python3 .claude/skills/autotest-pw-web/scripts/pw_scaffold.py android --app-package "<appPackage>" --app-activity "<appActivity>"
python3 .claude/skills/autotest-credentials/scripts/cred_env.py init --scope project
```
(`core` first only when the project is NEW. **`--platforms android`** keeps the project lean — drops the web UI
layer (`pages/`, `web.fixture`) and the web test project. The **API layer stays** (`services/`, `api.fixture`,
`apiTest` in the fixture chain) so steps can preset/verify data over API — it's a shared support layer, not a
separate project. Add `--platforms android,api` only if you also want API as its own test target (an `api`
project + `bdd/features/`); `--platforms android,web` to also run web tests. The android sub-command is
idempotent: copies `config/android.ts`,
`fixtures/android.fixture.ts`, `functions/base/BaseFunction.ts`, `support/stf.ts`, `support/ui.ts` (shell UI driver),
regenerates `fixtures/index.ts` for the scaffolded platforms, adds the `android` project.) Then `npm run typecheck`.

## Step 0c: Environment & domain docs
`global-data.md` exists → read appPackage, appActivity, APK source, environments, API base/auth (for
API-assisted steps). Several environments → ask which one, wait.

Missing → ask in ONE message (groups 2–4 accept "skip"):
> **1. App** — appPackage? appActivity (màn hình mở đầu)? Cài app từ đâu (APK link/đường dẫn, hay đã cài sẵn trên máy)? Có cần đăng nhập không, bao nhiêu role? Có API backend dùng để tạo dữ liệu test không (API base URL, endpoint login, kiểu auth, field username/password/token)? *(Không gửi username/password ở đây — mình tạo sẵn `automation_test/.env` để bạn tự điền.)*
> **2. product-overview** · **3. business-scenario** · **4. detail-design** — hoặc "skip"

Unknown package/activity → derive it yourself from the device when the app is installed
(`adb shell cmd package resolve-activity --brief <pkg>` or `adb shell dumpsys window | grep mCurrentFocus`
while the user has the app open) instead of asking.
Write docs as autotest-pw-web Step 0c. Credential gate: `cred_env.py check --scope project --keys APP_USERNAME APP_PASSWORD`
(+ roles, + `API_*` if API is used).

---

## Mode A — Write / update

### Step 1a–1b2: TC file, reading, TC selection
Exactly autotest-pw-web Steps 1a, 1b, 1b2 (same fallback question, same mandatory TC-selection question —
wait for a real answer).

### Step 1c: Reuse scan — `npm run steps` (existing step sentences), `functions/`, `fixtures/android.fixture.ts`, `services/`.

### Step 1d: Special signals (STOP and ask)
- OTP/SMS → mechanism: fixed test OTP · API/service returning it · SIM auto-fill · read SMS via
  `adb shell content query --uri content://sms/inbox` (emulator/test SIM only, with the user's consent) ·
  manual. Timestamp rule: only codes newer than the trigger.
- Camera / QR / eKYC / biometrics / NFC → ask for a test bypass; otherwise mark Pending (not automated).
- Push notifications → `adb shell cmd notification` / open the shade with `device.input.swipe` — confirm approach first.
- DB → as autotest-pw-web Step 1d.

### Step 2: Live verification (mandatory)
Launch the app to the TC's start state (`adb shell am start -W -n <pkg>/<activity>`, perform preconditions),
then for **each step**:
```bash
python3 .claude/skills/autotest-pw-android/scripts/ui_dump.py --pkg <pkg> --filter "<label of the step>" --screenshot automation_test/results/live-TC-NNN.png
```
→ pick the selector (priority android-best-practices §3; never one flagged `⚠ trùng` without disambiguation)
→ perform the step on the device to reach the next state (`adb shell input tap <center of bounds>` /
`input text` for NON-secret values only; for secret fields stop dumping there and continue the flow by
running a partial spec instead) → dump again and compare with the TC's expected result.
Max 3 attempts per step. WebView/Chrome steps → `webview.page()` and the web live-locator protocol via a
web live-locator qua Playwright MCP / playwright-cli (xem autotest-pw-web/references/live-locator.md).

UI contradicts the TC → screenshot, **STOP, no code for that TC**, report in the same format as
autotest-pw-web Step 2; confirmed bug → Scenario tags `@known-bug @fail` + `# BUG-<id>: <reason>` comment.

### Step 3: Write files
1. `functions/<feature>/<Name>Function.ts` — extends `BaseFunction`; selectors as readonly fields (`id()` helper
   for resource-ids); business methods; `expectLoaded()`; checks via `waitVisible/waitGone/expectText`.
2. `functions/FunctionManager.ts` — register the new screen (import, field, `new` in constructor, getter
   `getXxxFunction()`), same pattern as the course POManager — see `examples/functions/FunctionManager.ts`.
   Steps use `functionManager.getXxxFunction()`.
3. API services if the TC needs backend setup/cleanup (autotest-pw-api).
4. `bdd/features/<feature>.feature` — Feature tags `@android @<feature>`; one Scenario per TC
   (`Scenario: TC-NNN — <Title verbatim>`, `@TC-NNN` + `@smoke|@regression|@negative`), F/G → When/Then
   pairs, credentials as roles (`tài khoản "APP"`) — example `examples/bdd/features/login.feature`.
5. `npx bddgen` → snippets → `bdd/steps/<feature>.steps.ts`: `functionManager.getXxxFunction()` calls;
   `Then` = screen checks; values between steps in `ctx`. Reuse sentences (`npm run steps`). First line of
   the `.feature` and steps file = run-command comment (`--project=android --workers=1`).
6. `npx bddgen` (no missing/ambiguous) → `npm run typecheck`. 7. If `ci/tc-catalog.ts` exists (Jenkins pipeline from `/autotest-pw-jenkins`) → `npm run ci:catalog` so the Jenkins `FEATURES`/`TC_LIST` checkboxes list the new/changed/removed TCs; relay its `⚠` lines.

### Step 4: Run (one device, one worker)
For a farm-only app (production/store app not on local emulators), the **device-farm command goes FIRST** in the
`.feature` run-comment, with the **real serial pre-filled** — use the serial of the device you actually reserved
while writing/verifying the test, not `<serial>`. Quote the link with **single quotes** (URL has `!` → zsh
history expansion). Keep the plain/local command second (only works on a device that has the app installed).
```bash
# device farm (nháy ĐƠN vì URL có '!'; thay serial = máy đã dùng khi viết test):
cd automation_test && npx bddgen && ANDROID_DEVICE_URL='http://<host>/#!/control/<serial>' npx playwright test --project=android --workers=1 --grep "@TC-010\b"
#   PowerShell: $env:ANDROID_DEVICE_URL="http://<host>/#!/control/<serial>"; npx playwright test …
# local (chỉ khi thiết bị/emulator đã cài app):
cd automation_test && npx bddgen && npx playwright test --project=android --workers=1 --grep "@TC-010\b"
# nhiều log nhất (debug): thêm DEBUG=pw:api,pw:android trước lệnh test + --trace on (xem: npx playwright show-trace results/test-results/*/trace.zip)
#   npx bddgen && DEBUG=pw:api,pw:android npx playwright test --project=android --workers=1 --trace on --grep "@TC-010\b"
cd automation_test && npm run summary
```
Shared-file warning and "never run the whole suite automatically" as autotest-pw-web Step 4.

### Step 5: Debug until green
Read summary + failure screenshot (`test-failed-android.png`) + a fresh `ui_dump.py`.

| Error | Fix |
|---|---|
| `Không thấy thiết bị Android` | `adb devices`; serial mismatch → `ANDROID_SERIAL` |
| `Please install Android driver apk` | `npx playwright install android` (Step 0-env.1) |
| run hangs before any step, screen frozen on the app; `DEBUG=pw:android` shows `Written driver bytes: Failure [INSTALL_PARSE_FAILED_NOT_APK …]` then endless `Polling the socket` / fixture error `Playwright không khởi động được driver Android` | driver APK in the Playwright cache is truncated (download cut off, yet `INSTALLATION_COMPLETE` exists so `install` skips it). The fixture checks both APKs (zip end record) every worker and repairs them itself: `playwright install`, and when that fails — it CRASHES with `RangeError: Invalid count value: Infinity` (progress bar) when run without a terminal behind a proxy that sends no `Content-Length` — it downloads `android.zip` from the registry URLs through the proxy-aware downloader of `stf.ts`. Diagnose any hang FIRST with `DEBUG=pw:android` — not by guessing at app screens |
| screen black / `mWakefulness=Dozing`, everything times out mid-run | farm device screen turned off → fixture `prepareDevice` wakes it + `svc power stayon true`; mid-run: `adb shell input keyevent KEYCODE_WAKEUP` |
| system dialog "Cho phép … gửi thông báo / thiết bị ở gần" covers the app | fixture `app` grants every denied runtime permission (`pm grant`) before launch |
| test starts on a screen left by an earlier run / manual exploration | `am start` only resumes a running app → fixture `app` force-stops first (session kept when `APP_CLEAR_DATA=false`) |
| Vietnamese text typed as nothing / garbage | `adb shell input text` cannot type non-ASCII → `device.fill()` (UiAutomator setText); custom fields that reject `fill` → ASCII only via `typeText` |
| auto-formatting field (phone `xxxx-xxx-xxx`) holds wrong digits; app auto-submits when full | type all but the last char, read the field back and compare, then type the last char — the app may send an OTP/request the instant the field is full (seen: OTP sent to a stranger's number) |
| `adb có thiết bị chưa sẵn sàng …` (fixture) | an `offline`/`unauthorized` entry in `adb devices` makes Playwright hang → `adb disconnect <host:port>` (farm) or fix the USB device |
| `androidDevice.info/wait: java.lang.NullPointerException … androidx.test.uiautomator` | a system ANR/crash window has focus (`adb shell dumpsys window \| grep mCurrentFocus`); the fixture force-stops the other app — if it keeps coming back the device is overloaded (emulator: more cores/RAM, disable animations / the noisy app) |
| tap/wait timeout right after typing | the keyboard (or its onboarding sheet, e.g. Gboard "Try out your stylus") covers the element → `BaseFunction.fill()` hides it; check other input paths call `hideKeyboard()` |
| list does not move / item never found | use `BaseFunction.scrollTo()` (input swipe inside the list bounds); `device.scroll()`/`swipe()`/`fling()` don't work reliably |
| every step 5–30 s, first one > 30 s | overloaded emulator (check `adb shell uptime` load) → restart it with `-cores 4 -memory 4096`, close heavy host apps; the android project already has a 180 s test timeout |
| farm: `Chưa điền tài khoản farm` | fill `VDS_STF_<HOST_SLUG>_USER` / `_PASSWORD` in `~/.vds/sdlc-config.env` (credential gate above) |
| farm: `Đăng nhập Keycloak device farm thất bại … OTP/2FA` | the account enforces OTP → password grant impossible; ask DevOps — Trung tâm Vận hành Khai thác for a farm Keycloak account without OTP |
| farm: `… Tự động không kết nối được — thêm ADB key bằng tay` | every automatic step failed → relay the per-OS guide in the message (create key, copy, paste on `<farm>/#!/settings/keys` under the same farm account), rerun |
| farm: stays `unauthorized` / `offline`, `failed to authenticate`, then `Connection refused` | a farm adb server running with an old key (fixed automatically by the key-fingerprint stamp), a dead `offline` transport left from an earlier run on the same port (always disconnected before connect and on release), or a closed remote-debug port (reopened once automatically). `failed to authenticate` right after connect is normal. Still failing after ~60 s → the error carries the manual key guide; `doctor` reproduces it. STF "online" in the web UI ≠ adb authorized |
| plain `adb devices -l` shows the farm device `offline` but the test runs | normal — that is the default server (5037); the skill's connection is on `adb -P 5038 devices -l` |
| farm: Play Protect "Đã chặn ứng dụng không an toàn" covers the screen | the fixture's `prepareDevice` disables `verifier_verify_adb_installs`; if it still appears, it blocks the Playwright driver APK — rerun (driver already installed → no reinstall) |
| `Mất kết nối thiết bị …` (fixture `app`) | device dropped between tests (farm network, farm reclaimed the device, cable). The worker reconnects from scratch and the test reruns once (`ANDROID_RETRIES`, default 1; login/hardened scenarios carry `@retries:0`). Frequent → `stf.ts doctor` + check the network path to the farm |
| farm: `Máy … đang được <người khác> dùng` / `không có/offline` | pick another free device on STF and send its control link |
| farm: `… timed out` / no route | VPN / network to the farm host — user checks connectivity |
| farm: device disappears mid-run | STF session timed out or someone took the device → user re-reserves; rerun only the failed TCs |
| `Timeout … waiting for selector` | re-dump the screen at that step; wrong selector/state, keyboard covering, needs `scrollTo` |
| text mismatch in `expectText` | real difference → TC discrepancy protocol |
| app not starting / wrong screen | package/activity wrong (`resolve-activity`), app not installed, `APP_CLEAR_DATA` lost login |
| `INSTALL_FAILED_*` | APK/version/signature issue → report to user, don't uninstall user apps without asking |
| driver install errors | device locked/screen off → wake (`adb shell input keyevent 224`), unlock (physical) |
| `ERROR: could not get idle state` (dump) / waits slow on one screen | that screen animates non-stop → `device.info()` instead of dump; 20–60 s timeouts for waits/taps on it |
| flaky taps | disable animations (ask once), wait for the target before tapping, avoid coordinates |

Repeat until each selected TC passes on the device (or is an expected-failure `@known-bug`).

## Mode B — Refactor
Coordinates → selectors; index/depth chains → res/desc/text; `device.*` calls in steps → function objects;
`new XxxFunction` in steps → `FunctionManager` getters; near-duplicate step sentences → parameterised steps; non-retrying reads used as assertions → BaseFunction helpers / `expect.poll`;
sleeps; hardcoded data/credentials; missing `@TC-NNN`; `any`; JS → TS. Keep behaviour and selector values.
Typecheck; offer to run.

## Mode C — Delete
As autotest-pw-web Mode C with `bdd/features/`, `bdd/steps/`, `functions/`, `fixtures/android.fixture.ts`.

## Final report (tiếng Việt)
TCs + results (`npm run summary`), files touched, device used (local, or device farm `<host:port>` + model + Android version),
discrepancies, missing credential key names, how to re-run
(`npx bddgen && npx playwright test --project=android --workers=1 --grep @<feature>`), CI: `/autotest-pw-jenkins`
(needs an agent with adb + the device, locked per build).
