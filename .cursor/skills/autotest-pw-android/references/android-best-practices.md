# Playwright Android — best practices (TypeScript)

Engine: Playwright's **`_android`** API (`import { _android } from 'playwright'`, types `AndroidDevice`,
`AndroidSelector` from `@playwright/test`). It drives a real device or emulator over **ADB** with a
UiAutomator driver that Playwright installs on the device automatically. No Appium server, no Java client.

> The course covers Playwright only for browsers (incl. mobile **emulation** with `devices['Pixel 5']`).
> Native Android is Playwright's experimental `_android` API — this file fills that gap. Pin the
> Playwright version (`--save-exact`); experimental APIs can change between versions.

## 1. What can be tested and how

| Target | How | Locators / assertions |
|---|---|---|
| Native app screens | `app` fixture (`device` + `am start`) → function objects with `AndroidSelector` | `device.tap/fill/wait/info` + `BaseFunction.expectText` (`expect.poll`) |
| WebView inside the app | `const webview = await app.webView({ pkg: ANDROID.appPackage }); const page = await webview.page();` | full web Playwright: `getByRole`, web-first `expect` |
| Mobile Chrome (real device) | `const context = await device.launchBrowser(); const page = await context.newPage();` | full web Playwright |
| Responsive web only (no device) | NOT this skill — web project with `...devices['Pixel 7']` (autotest-pw-web) | — |

Not supported → STOP and tell the user (offer alternatives, never fake it): iOS (→ RF `/autotest-rf-ios`),
cloud device farms that only expose an Appium/WebDriver endpoint (MCloud is fine — it also exposes ADB, §9), Android < 7, biometric/camera hardware
flows (ask for a test bypass), apps that block UiAutomator (secure flag screens → screenshots are black).

Requirements check (Step 0-env of the skill):
```bash
adb version
adb devices                       # ≥ 1 line "<serial>\tdevice"; "unauthorized" → user accepts the USB-debugging prompt on the phone
adb -s <serial> shell getprop ro.build.version.release
```
Emulator: `emulator -list-avds` then `emulator -avd <name> -no-snapshot-load &` (ask the user before
starting one). Several devices → `ANDROID_SERIAL` (env / `.env` not needed — not a secret; put the default
in `config/android.ts` only if the team uses one fixed device).

## 2. Fixtures (templates/fixtures/android.fixture.ts)
- `device` — **worker-scoped**: connects once, optionally installs `APK_PATH`, closes at the end.
  Run android with **`--workers=1`** (one device = one worker; Jenkins locks the device).
- `device` also: checks the Playwright driver APKs in the cache (missing / truncated → `playwright install`, and if
  that fails — it crashes behind proxies that omit `Content-Length` — downloads `android.zip` itself through the
  proxy), connects with a 150 s guard (a driver that never starts no longer hangs forever), wakes the screen +
  `svc power stayon true`.
- `app` — per test: `am force-stop` (an `am start` on a running app only resumes the old screen) →
  `pm clear <pkg>` (when `APP_CLEAR_DATA=true`, default) → grant every denied runtime permission (notification /
  nearby-devices dialogs otherwise cover the first screen) → `am start -W -n pkg/activity`
  → test → failure screenshot saved to the test output (picked up by summary/collage) → `am force-stop`.
- Store/production apps that remember the account (password screen on every cold start, OTP on first login of a
  device): `APP_CLEAR_DATA=false` in `automation_test/.env`; the login function then handles every start screen it
  can meet — onboarding, guest home ("Đăng ký/Đăng nhập"), phone number, OTP popup, password — in one loop that
  re-reads the screen each round, never a fixed sequence.
- `functionManager` (depends on `app`) gives every function object via getters — `functions/FunctionManager.ts`, same pattern as the course's POManager (`functionManager.getHomeFunction()`).
- Logged-in start state: prefer a fast path (deep link `am start -a android.intent.action.VIEW -d "<scheme://...>"`,
  or API token + app debug hook) agreed with the dev team; otherwise log in through the UI in a fixture
  `loggedInApp` and set `APP_CLEAR_DATA=false` for that project only if login per test is too slow.
- Runtime permissions before launch: `await device.shell('pm grant <pkg> android.permission.CAMERA')`
  (or tap the system "Allow" button via `{ res: 'com.android.permissioncontroller:id/permission_allow_button' }`).

## 3. Selectors (`AndroidSelector`)
Priority — same idea as web (stable, semantic):
1. `{ res: '<pkg>:id/<name>' }` — resource-id (`id('btn_login')` helper in the screen file)
2. `{ desc: 'Đăng nhập' }` — content-description (accessibility label)
3. `{ text: 'Đăng nhập' }` — exact visible text (`RegExp` allowed: `{ text: /Số dư/ }`)
4. Combine to disambiguate: `{ clazz: 'android.widget.Button', text: 'Đăng nhập' }`,
   `{ res: /item_product/, hasDescendant: { selector: { text: 'Áo thun' } } }`,
   `{ scrollable: true }` for the list container.
Never use bounds/coordinates, index-only or `depth` alone. No id/desc/text at all → ask the dev team for a
resource-id (record it as a gap) and use a structural selector meanwhile with a `// TODO` comment.

Discovery (live, mandatory): `scripts/ui_dump.py --pkg <pkg> [--filter <text>] [--screenshot <png>]` prints
each node with the ready-to-paste selector and flags duplicates (`⚠ trùng`).

## 4. Actions
| Need | API |
|---|---|
| tap | `device.tap(sel)` (waits for the element) |
| type | `device.fill(sel, text)` — the only way to type non-ASCII (Vietnamese); `adb shell input text` types ASCII only. IME-sensitive fields that ignore setText → `device.tap(sel); device.input.type(text)` / `typeText` (ASCII). Auto-formatting fields (phone `xxxx-xxx-xxx`) that auto-submit when full: type all but the last char, read back + compare, then the last char |
| clear | `device.fill(sel, '')` |
| key | `device.press(sel, 'Enter')`, `device.input.press('Back')`, `device.shell('input keyevent 4')` |
| long press | `device.longTap(sel)` |
| scroll / find in list | `BaseFunction.scrollTo(target, 'end'|'start', container)` — swipes inside the container with `input swipe` computed from the container's bounds, waits 2.5 s after each swipe. **Don't use `device.scroll()`** (does not move ListViews on Android 14+) **nor `device.swipe()/fling()`** (hang/timeout) — verified on an Android 16 emulator |
| swipe (carousel, horizontal) | same `input swipe` approach with coordinates from the element's `bounds` (add a horizontal variant to BaseFunction when a TC needs it) |
| drag | `device.drag(sel, { x, y })` |
| pinch | `device.pinchOpen(sel, 0.5)` / `pinchClose` |
| wait visible / gone | `device.wait(sel)` / `device.wait(sel, { state: 'gone' })` |
| read | `(await device.info(sel)).text / .checked / .enabled / .selected / .bounds` |
| screenshot (evidence) | `await device.screenshot({ path: testInfo.outputPath('step.png') })` |
| push file for upload | `device.push(buffer, '/sdcard/Download/a.pdf')` |
| shell (setup only) | `device.shell('...')` — never to perform a TC step the user does via UI |

Default timeout 30 s per action → `device.setDefaultTimeout(TIMEOUTS.action)` in the `device` fixture if
the team wants faster failures.

## 5. Assertions (no web-first `expect` for native — use BaseFunction helpers)
Call these from screen-object `expectXxx()` methods used by `Then` steps (Cucumber style), e.g.
`Then('màn hình Trang chủ được hiển thị', async ({ homeFunction }) => homeFunction.expectLoaded())`.
```ts
await this.waitVisible({ text: 'Giao dịch thành công' });                       // element appears
await this.waitGone({ res: id('progress') });                                    // spinner disappears
await this.expectText(id('txt_balance'), /1\.000\.000/);                         // retrying text check
await expect.poll(async () => (await this.device.info(id('chk_terms'))).checked).toBe(true);
```
Never `expect((await device.info(sel)).text).toBe(...)` right after an action (no retry → flaky).
In WebView / Chrome pages use normal web-first assertions.

## 6. Mixing with API
`authedApi` / services (autotest-pw-api) work in android specs: create data before launching the app,
verify backend effects after a UI action with `expect.poll`, clean up after. Same rules as web.

## 7. Stability rules
- One device per worker, `--workers=1`. The `android` project retries **1** (env `ANDROID_RETRIES`): a dropped device
  connection fails the test, Playwright rebuilds the worker (release → acquire → reconnect) and the retry runs on the
  fresh connection. The `app` fixture runs `assertDeviceAlive()` first, so a drop between tests fails fast (15 s) with
  "Mất kết nối thiết bị …" instead of hanging until the 180 s test timeout.
- Each test starts from a known app state (`app` fixture). No dependency on the previous test.
- Emulator sizing: start it with `-cores 4 -memory 4096`; on an overloaded emulator (load > 8 in `adb shell
  uptime`) system apps ANR and every UiAutomator call takes seconds — tests time out for no app reason.
- Animations: ask the user once whether to disable them on the test device:
  `adb shell settings put global window_animation_scale 0` (same for `transition_animation_scale`,
  `animator_duration_scale`) — big stability win.
- Keyboard covering elements (incl. keyboard onboarding sheets like Gboard "Try out your stylus") → `BaseFunction.fill()` already calls `hideKeyboard()` (Back only if the IME is shown) and the `app` fixture hides it before launching; for a field typed with `device.input.type()` call `hideKeyboard(device)` yourself.
- System dialogs: the `app` fixture calls `dismissSystemDialogs()` after launch. It reads the focused window with `dumpsys window` (UiAutomator returns `NullPointerException` while an ANR window has focus): ANR/crash of ANOTHER app → `am force-stop` it; of the app under test → the test fails (possible real bug). Mid-scenario: call `dismissSystemDialogs(device)` in the screen method before retrying.
- Overloaded emulator (ANRs of system apps, every action several seconds): give it more RAM/CPU, close other emulators, disable animations, or use a real device / the farm.
- Farm latency: one `device.wait()` can take ~15 s to resolve even when the element is already shown → state probes
  in loops use ≥ 8 s, and a TC with login + OTP + a long flow needs a `@timeout:<ms>` tag (e.g. `@timeout:420000`).
- Screens that animate forever (lottie, shimmer, check-mark pulse): UiAutomator never idles → dumps fail with
  `could not get idle state` and waits are slow → 20–60 s timeouts for waits/taps on that screen only.

## 8. Anti-patterns
- Coordinates (`device.input.tap({x,y})`) for normal buttons; sleeps (`waitForTimeout`).
- XPath-like `depth`/index chains; selectors copied from another app version without re-dumping.
- Using `adb shell input` to perform TC steps (bypasses what the user does).
- Running android tests in parallel on one device; installing the APK in every test.
- Credentials typed through `adb shell input text` in a terminal (they end up in shell history) — only
  via `CREDENTIALS.app.*` inside a step (the .feature names the role, e.g. `tài khoản "APP"`).
- Writing function objects from the TC text alone and "fixing" them run by run — every wrong guess costs a full
  farm run (2–4 min). Walk the TC on the device first (Step 2), one dump per screen, then write the file once.
- "Fallback" gestures at fixed coordinates when an expected element is missing (seen: a blind
  `input swipe 540 1500 …` landed on the "2" key of a numeric keypad and filled a phone field with 2s). Unknown
  screen → dump it and handle it by selector, or fail with a screenshot.
- Wrapping `npx playwright test` in your own acquire/release script — the `device` fixture already does it.
- Debugging a hang by trying app-level fixes before `DEBUG=pw:android` shows whether the driver even connected.

## 9. Device farm MCloud (STF) — remote ADB, fully automated (one mode only)

MCloud (`http://10.207.247.201`) is an **STF/DeviceFarmer** farm. A device reserved in STF exposes **remote
ADB**, which is all Playwright `_android` needs. There is exactly **one** farm mode: the user fills the Keycloak device farm
account once (`VDS_STF_<HOST_SLUG>_USER` / `_PASSWORD` in `~/.vds/sdlc-config.env`, env vars override for Jenkins)
and gives the control link `http://<host>/#!/control/<serial>` via `ANDROID_DEVICE_URL`; `support/stf.ts` does
the rest. (Removed on purpose: manual "Use + paste Remote debug" mode, offline refresh tokens, manual key paste.)
Verified end-to-end on Pixel 4 + Realme C21, incl. a brand-new key and a key changed under a running adb server.

How `support/stf.ts` works (fixture calls `acquire()` once per worker, `release()` on teardown):
1. **Login** — Keycloak **password grant** with the farm Keycloak account → bearer token (realm/client/secret from the
   public `<host>/keycloak.json`). The account must not enforce OTP/2FA (use a service account if needed).
   > **Why the Keycloak account and not a token?** (settled — don't re-investigate) MCloud has two gateways: `/mcloud/wd/hub` is an
   > Appium/WebDriver grid (basic-auth `user:accesskey`), `/api/v1/*` is the STF REST API accepting **only** a
   > Keycloak bearer token — the STF access-token and the MCloud accesskey both get 403 there. Playwright
   > `_android` speaks raw ADB, not WebDriver, so it must take the REST path to get `adb connect host:port`.
2. **Register the ADB key** (`registerKey()`, before reserving — the farm injects the account's registered keys into
   the device, so no "Allow USB debugging"). Order:
   a. **Default key** `~/.android/adbkey` (`%USERPROFILE%\.android\adbkey`) — the same key the farm's manual guide
      creates (`adb keygen adbkey` + `adb pubkey adbkey > adbkey.pub`); created that way if missing, never regenerated
      (USB devices trust it). `POST /api/v1/user/adbPublicKeys {publickey, title: "<user>@<host>"}`.
   b. **Verify, don't trust the 200:** re-read `GET /api/v1/user` → `adbKeys[].fingerprint` (md5 of the base64 key,
      `aa:bb:…`). The farm returns `success` without storing a key already bound to ANOTHER farm account (measured).
   c. Default key not landable → dedicated keypair `~/.android/stf/adbkey` (title `autotest-<host>`), regenerated once
      if it does not land either. Nothing lands → connect anyway; on failure the error carries the manual guide.
   A key the user pastes on the web (`<farm>/#!/settings/keys` → ADB Keys) is the default key → used on the next run.
3. **Reserve + remote debug** — `POST /api/v1/user/devices {serial}` then `POST …/remoteConnect` → `host:port`.
   One person = one farm Keycloak account: owner email equal → own device (leftover → reuse); other account → refuse +
   list free devices. A shared account can't tell computers apart → two runs on the same device would collide.
4. **adb connect on the farm's own adb server** `FARM_ADB_PORT` (default 5038; next free port if taken) — never the
   shared 5037 that Android Studio / Appium / other runs restart. Environment per key: default key → normal env with
   only `ANDROID_USER_HOME=~/.android` (no HOME override — what works on Windows); dedicated key → `HOME` +
   `USERPROFILE` + `ANDROID_USER_HOME` = `~/.android/stf` (so the default key is not offered too). `ADB_VENDOR_KEYS`
   / `ANDROID_SDK_HOME` are stripped. adb loads keys only at server start → the key mode + fingerprint is stamped in
   `~/.android/stf/server-<port>.key`; changed, or a server serving no device → kill/start **before** connecting.
   **Handshake (measured + the farm vendor's docs):** `adb connect` prints `failed to authenticate to host:port` even
   when the connection then succeeds, and the state passes `offline` / `authorizing` / `unauthorized` — never
   disconnect or restart then (that cut handshakes short). Connected = `device` in `adb -P <port> devices`; a
   transport stuck `offline` cannot run any command. Wait ~30 s; not `device` → disconnect, restart the farm server,
   reopen the remote-debug session (DELETE + POST `…/remoteConnect`, new port), wait ~30 s more; still not → error
   with `manualKeyGuide()` (per-OS commands: Windows cmd `… | clip`, macOS `pbcopy`, Linux `xclip -sel clip`).
   Plain `adb devices` asks the DEFAULT server: a farm device there may show `offline` while the skill's connection
   on 5038 runs fine (seen on Windows) — check the skill with `adb -P 5038 devices -l`.
   adb missing → `ensureAdb()` downloads Google platform-tools into `~/.android/stf/platform-tools`, unzipping with
   unzip / tar / PowerShell / python3, or pure Node (zlib) when none exists (minimal Linux / Docker Jenkins agents).
   Verified from scratch: macOS (default key + dedicated-key fallback) and a bare `node:20-bookworm-slim` Linux
   container (no adb/unzip/python) all reach `device` on the real farm.
5. **Verify serial** (`ro.serialno` == link serial), run, then `DELETE …/remoteConnect` + `DELETE /user/devices`.

`acquire()` returns `lease.adbPort`; the fixture calls `_android.devices({ port: lease.adbPort })`. The Playwright
test process keeps the real `$HOME`, so `_android` still finds its driver cache. `prepareDevice()` disables Play
Protect adb-install scanning (`verifier_verify_adb_installs 0`) so the driver APK
(`com.microsoft.playwright.androiddriver.test`) is not blocked by "Đã chặn ứng dụng không an toàn".

**Check the whole chain in one command** (dev laptop, each Jenkins agent):
`npx tsx support/stf.ts doctor "<control link or http://host>"` → key → farm Keycloak creds → login → key registration →
reserve (a free device if only the host is given) → remote debug → adb connect → serial → release, stopping at the
first failing step. STF "online" in the web UI ≠ adb authorized.

CLI for live locator discovery while holding a device:
`npx tsx support/stf.ts acquire "<link>"` → prints `host:port`; then
`python3 scripts/ui_dump.py --port 5038 --serial <host:port>` (or `adb -P 5038 -s <host:port> …`);
`… release "<link>"` when done.

**Windows** — cross-platform: `stf.ts` (`doctor`/`acquire`/`status`/`release`), the fixture, `ui_dump.py` and all
`npm run` scripts run unchanged in PowerShell or cmd. `~` = `%USERPROFILE%` (default key
`%USERPROFILE%\.android\adbkey`). adb found on PATH / SDK or auto-downloaded. The manual key guide uses cmd syntax
(`%USERPROFILE%`, `| clip`) — tell the user to open Command Prompt, not PowerShell. Set `ANDROID_DEVICE_URL`, `RUN_MODE`… through `automation_test/.env` (or `$env:VAR="val"` on its own line).

Rules:
- The device is chosen by the user per run via the control link — never hard-coded anywhere.
- Secrets: the farm Keycloak account lives only in `~/.vds/sdlc-config.env` (or Jenkins credentials), never in chat/repo;
  never show the private `adbkey`.
- One farm device = one worker (`--workers=1`). Latency is higher than USB: keep `TIMEOUTS.action` defaults;
  the android project uses a 180 s test timeout for the slow first interaction.
- Jenkins: the farm run takes `ANDROID_DEVICE_URL` as a parameter and the farm Keycloak account via `withCredentials`; it
  locks a resource per device so two builds never share one.

---

## Hardened / production apps — IME, lock-on-start, OTP (verified on Viettel Money)

Real production apps (banking/fintech) break several naive assumptions. Lessons from an end-to-end run on the
MCloud farm against Viettel Money (`com.bplus.vtpay`):

**1. Playwright `_android` query HANGS/returns empty when the on-screen keyboard (IME) is up.**
On a screen with a focused input + IME, `device.fill` / `device.wait` / `device.info` by selector fail silently —
custom PIN/password fields stay empty and the step times out. `uiautomator dump` + `adb input` are NOT affected.
→ **Drive IME / custom-input screens with the SHELL driver** `support/ui.ts` (shipped by the android scaffold):
`dumpXml()` → `centerOf(xml, 'text'|'resource-id', value)` for the bounds centre → `tapXY()` + `typeText()`
(`input text`) + `hideKeyboardShell()`. Use Playwright selectors only on screens with no IME; use the shell
driver for login, PIN, OTP and search-with-keyboard. This was the single fix that turned a 100%-failing login
green. `functions/` methods take the `device` and call the `ui.ts` helpers.

**2. The app re-locks / logs out on every cold start**, and the `app` fixture force-stops it on teardown → every
run must log in again. Do **not** assume a warm home screen.

**3. Login state is non-deterministic** across cold starts (home / password / phone+password / OTP screen appear
in different orders). Write login as a **state-machine loop** keyed off the current activity
(`currentActivity()`) and the visible text, handling each screen until `MainActivity` — not a fixed sequence.
See `functions/auth/LoginFunction.ts` pattern (dump → branch on `Đồng ý` consent / `Xác thực OTP` / `Nhập mật khẩu`
/ `Tiếp tục` / home).
→ **Never resend credentials after an auth-failure screen — abort immediately.** If the loop sees a
"sai mật khẩu / wrong password / tài khoản bị khoá" dialog, `throw` and stop; do **not** loop back and type the
password again. A real account locks after a few wrong attempts, and the loop (or Playwright retries) can resend
silently — in one run the password went out 4× before this guard. Keep the login loop idempotent per screen and
tag the login/hardened scenarios **`@retries:0`** (playwright-bdd special tag — overrides the android project's
default retry), so a flaky assertion never re-drives a credential entry.

**4. OTP on login** arrives by SMS and shows a Google **SMS User Consent** popup (`com.google.android.gms …
UserConsentPromptActivity`). Tapping **Đồng ý** lets GMS auto-fill the OTP — simplest path. Fallback: use
`readOtp(device, { sender, length })` from `support/ui.ts` — it reads `content://sms/inbox`, filters by sender +
recency and returns **only the code**. On a **shared farm device the SMS inbox is mixed** (other testers' codes,
foreign OTPs) — always filter by the app's sender / the user's number and take the newest, never just "the last
OTP in the box".

**4b. Never log secrets or PII — mask before any output.** A failing run once printed the whole SMS body (OTP +
phone number) into the error message, and that output flows into CI logs / HTML reports. **Never** put a raw
SMS body, OTP, phone number, PIN, password, balance or dump into a log line, `throw new Error(...)`, screenshot
name or report. `readOtp()` never returns the body; for anything else coming off the device, wrap it with
`mask()` (redacts runs of ≥3 digits). Screenshots of OTP/SMS/account screens are evidence of a leak too — don't
attach them.

**5. Irreversible actions (real money transfer, real submit): stop before the point of no return.** The default,
safe scenario drives up to the confirmation / PIN screen and asserts it, **without** entering the PIN — so no
funds move and the run is idempotent/repeatable. Completing a real production transaction is a separate,
explicit opt-in (and the Claude Code harness will refuse to auto-run a real-money step anyway). Never let a test
move real money on reruns.

**6. Grant-SMS shortcut does NOT work** here: `pm grant <pkg> android.permission.READ_SMS` is rejected because
the app relies on the GMS SMS User Consent API, not a declared READ_SMS permission — so the consent popup can't
be bypassed; automate the tap instead.

**7. Farm teardown drops the adb connection** (`release`) → between manual
live-dump sessions you must re-`acquire`. Inside a single `playwright test` run this is handled by the fixture.

**8. `APP_CLEAR_DATA=true` (the default) runs `pm clear` and WIPES the saved account.** For a store/production
build that is already logged in (the common "tài khoản đã lưu sẵn trên app" case), SSO apps, or any app that
needs OTP to log back in, set **`APP_CLEAR_DATA=false`** so tests reuse the existing session — otherwise every
test forces a full re-login (+OTP) or loses the account. Only keep it `true` for test/dev apps that can self-login
from credentials in `.env`. Ask the user up front whether the app has a pre-provisioned/saved session before
leaving the default on.

**9. Run against the device that actually has the app.** Without `ANDROID_DEVICE_URL` /
`ANDROID_SERIAL`, the fixture picks `devices[0]` — the first entry in `adb devices`, often a local emulator that
does **not** have the production app, so login times out on a confusing "màn mật khẩu không hiện". The `app`
fixture now fails fast with `pm path` when the package isn't installed, naming the fix. For a farm-only app
(no local APK), make the **first** run-comment line on the `.feature` the device-farm command
(`ANDROID_DEVICE_URL='http://<host>/#!/control/<serial>' npx playwright test …`) with the **real serial of the
device you reserved while writing/verifying** pre-filled (not the `<serial>` placeholder), and put the plain
device-less command below it as the local variant. Or put `ANDROID_DEVICE_URL` in `.env`. Either way the plain
copy-pasted command must target the right device — don't leave the generic (device-less) line as the first thing
the user copies when the app lives only on the farm.
→ **Quote the farm URL with SINGLE quotes in the run-comment.** The control link contains `#!` and zsh runs
history expansion on `!` **even inside double quotes** → `zsh: event not found: /control/<serial>`. Single quotes
(or PowerShell `$env:ANDROID_DEVICE_URL="…"`) are safe; never emit the farm command with double quotes.
