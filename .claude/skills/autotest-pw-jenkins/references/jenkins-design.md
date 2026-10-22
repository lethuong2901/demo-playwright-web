# autotest-pw-jenkins — design, setup checklist, troubleshooting

## 1. Why a new structure (vs the RF `autotest-rf-jenkins`)

| Problem in the RF pipeline | New design |
|---|---|
| ~900 lines of Groovy/Python transcribed by the model on every run → drift | Files are **copied** from `templates/` (tested); the skill only fills the `CFG` block |
| 6 Python helper files per project, positional argv (10 args), XML→stdout→`replaceAll`→`BUILD_TAG` string protocol | One JSON contract: Playwright JSON reporter → `ci/summarize.ts` → `results/summary.json` → description / notify |
| `robot` exit code ignored, parse errors print zeros → build always SUCCESS | `junit` step → UNSTABLE on failures; missing `results.json` → FAILURE |
| No `post{}` → notification skipped when a stage throws | Everything after the run is in `post { always }` |
| Fixed directory on the agent, per-user paths, concurrent builds overwrite `results_{env}_{account}` | `checkout scm` into the Jenkins workspace; `disableConcurrentBuilds`; per-build artifacts |
| Manual "rerun failed" checkbox overwriting output.xml | Playwright `retries` (flaky detection) + `TCS`/`GREP` to rerun specific TCs |
| No parallelism | `WORKERS` (in-process) + `SHARDS` (several agents, blob reports merged) |
| Active Choices cascades in 3–4 switch blocks typed by hand + `param_file.yaml` for cron | Checkbox `FEATURES` → `TC_LIST` (Active Choices) generated from `bdd/features` by `ci/tc-catalog.ts` into the `TC_CATALOG` block — never typed by hand; plus `PROJECT`, `TCS`, `GREP`; cron uses defaults + `cronGrep` |
| Vops/Telegram tokens + MinIO keys as literals in the repo, MinIO secret on the `mc` command line | Jenkins credentials (`withCredentials`), MinIO keys only in `MC_HOST_*` env |
| Vops payload built by string concatenation (quotes in error text break it) | `JSON.stringify` |
| No timeout / build discarder / timestamps | `options {}` |
| Android: no device lock | `lock(label:)` (Lockable Resources) → `ANDROID_SERIAL` |
| Logic only testable on Jenkins | `npx tsx ci/summarize.ts`, `ci/collage.ts`, `ci/notify.ts --dry-run` run locally |
| Only RF log/report | Playwright HTML (steps = Gherkin lines), **Monocart** (suite/scenario/step tree, tag filter, attachments), JUnit trend |

Kept on purpose (team contract): Vops endpoints/headers/DDP payload (`"id":"65"`, `rid`), `rooms.upload`
(`description`, `file`, `success:false` check), Telegram `sendMessage`/`sendPhoto`, message layout
(`` `account` `` line, report/screenshot/scenario links, `TOTAL: … - pass: … :white_check_mark: - fail: … :x: - skip: … :warning:`,
one `:x: - <TC>` block per failure), merged failure-screenshot collage ("ảnh lỗi"), silent skip of an
unconfigured channel, MinIO layout `<bucket>/<env>/<account>/<YYYY_MM_DD_HH_MM_SS>/…` with separate upload
and static hosts, `[KNOWN_ISSUE]` role (→ Gherkin tags `@known-bug @fail`), multibranch job with
`scriptPath` and branch include filter, Jenkins API job creation through `cred_env.py run --curl-user`.

## 2. Files

| File | Source | Edited by the skill? |
|---|---|---|
| `automation_test/Jenkinsfile` | `templates/Jenkinsfile.txt` | only the `CFG = [...]` block |
| `automation_test/ci/notify.ts` | `templates/ci/notify.ts` | no |
| `automation_test/ci/summarize.ts`, `collage.ts` | core (autotest-pw-web scaffold) | no |
| `templates/jenkins/multibranch-config.xml` | job creation via API only | placeholders filled in memory, never committed |

## 3. Jenkins prerequisites (checklist given to the user)

**Plugins:** Pipeline, Pipeline: Multibranch, Git, Credentials Binding, JUnit, HTML Publisher,
Pipeline Utility Steps (`readJSON`), Timestamper, **Active Choices** (`FEATURES`/`TC_LIST` checkboxes —
the RF pipeline already needs it). Optional: Lockable Resources (Android device lock), Docker Pipeline (`dockerImage`).

**Pipeline steps that matter for the Cucumber style:** `npm ci` → `npm run --if-present bddgen` (Gherkin →
`.features-gen/`, fails the build on missing/ambiguous steps) → `npm run typecheck` → `npx playwright test …`
→ post: summary, collage, JUnit, HTML Publisher (Playwright, Monocart), MinIO (html-report + monocart/), notify. Shards are merged with
`npx playwright merge-reports --config=playwright.config.ts` (same reporters as a normal run).

**Agent (label `CFG.agentLabel`):**
- Linux/macOS with Node ≥ 20, git, curl; `npx playwright install --with-deps chromium` done once as admin
  on Linux (system libraries), or use `dockerImage` = `mcr.microsoft.com/playwright:v<exact version>-noble`
  (version = `@playwright/test` in package-lock).
- `mc` (MinIO client) on PATH when MinIO is enabled.
- Android: adb on PATH, devices connected & authorized, animations disabled; one Lockable Resource per
  device with **name = adb serial** and a shared label (e.g. `android-device`).
- Android on device farm MCloud: only adb on PATH and a network route to the farm host — no device plugged in;
  the device comes from the `ANDROID_DEVICE_URL` build parameter (control link). The Jenkins user's
  `~/.vds/sdlc-config.env` holds the farm Keycloak account `VDS_STF_<HOST>_USER`/`_PASSWORD` (no OTP); the ADB key registers
  itself via the farm API. Check once per agent: `npx tsx support/stf.ts doctor "http://<farm host>"`.
- HTML Publisher shows reports without JS/CSS by default (Jenkins CSP). Either rely on the MinIO link,
  or ask the Jenkins admin to relax CSP for the HTML report (security decision — not done by the skill).

**Credentials (Manage Jenkins → Credentials) — the user creates them, the skill only references IDs:**
| ID (suggested) | Kind | Content |
|---|---|---|
| `<project>-autotest-env` | Secret file | the project's `automation_test/.env` (filled) |
| `<project>-git` | SSH username with private key / Username+token | repo access |
| `<project>-minio` | Username with password | username = access key, password = secret key |
| `<project>-vops` | Username with password | username = X-User-Id của Vops; password = mã xác thực Vops |
| `<project>-telegram` | Secret text | bot token |

## 4. Parameters

| Param | Meaning |
|---|---|
| `ENV` | environment (first = default, used by cron) → `TEST_ENV` |
| `PROJECT` | `all` or one Playwright project (web-chromium, api, android…) |
| `FEATURES` | checkbox of features (Active Choices, from `TC_CATALOG`) → `--grep "@login\b|@todo\b"`; combined with `GREP` as AND (feature login + `@smoke`) |
| `TC_LIST` | checkbox of the TCs of the ticked features (reactive on `FEATURES`); value `tag|TC-NNN` → `--grep "^(?=.*@todo\b)(?=.*@TC-001\b)|…"` — feature tag AND TC tag, because TC ids repeat across features |
| `TCS` | typed `TC-001, TC-003` → `--grep "@TC-001\b|@TC-003\b"` — wins over everything (API / remote triggers; matches that id in every feature) |
| `GREP` / `GREP_INVERT` | tag/title regex (`@smoke`, `@login`, `@slow`) |
| `WORKERS` | parallel workers (android forced to 1); `1` = run the whole suite sequentially |
| `RETRIES` | Playwright retries (pass after retry = flaky in summary) |
| `SHARDS` | >1 → N parallel branches on agents with the same label + `merge-reports` (not for android) |
| `APK_URL` | android: download & install before the run (`APK_PATH`) |
| `ANDROID_DEVICE_URL` | android on device farm MCloud: the device's STF control link `http://<host>/#!/control/<serial>` — the fixture logs in, registers the ADB key, reserves, connects, releases. Entered per build, never stored in the Jenkinsfile; the build locks `android-farm-<serial>`. Empty = device attached to the agent |
| `NOTIFY` | send Vops/Telegram |

Selection priority: `TCS` > `TC_LIST` > `FEATURES` (+ `GREP`) > `GREP` > `cronGrep` (timer builds — Active
Choices values are always empty on a build fired by cron).

**TC catalog (`TC_CATALOG` block in the Jenkinsfile):** written by `npm run ci:catalog` (`ci/tc-catalog.ts`) from
`bdd/features/**/*.feature` — feature key = the `@<feature>` tag on the Feature line (file name when missing),
one entry per Scenario with `@TC-NNN`. Re-run it whenever scenarios are added/renamed/removed and commit the
Jenkinsfile with the `.feature` files (the autotest-pw-web/-api/-android skills do this). The build prints a
warning (non-blocking) when the block is older than `bdd/features` (`ci/tc-catalog.ts --check`). Jenkins shows a
new list from the **next** build after the Jenkinsfile change (parameters are registered when a build runs).
Active Choices scripts run on the controller in the Groovy sandbox; the catalog is embedded in the script text,
so no script approval is needed.

Scheduled runs with different params per schedule need the *Parameterized Scheduler* plugin:
replace `triggers { cron(CFG.cron) }` with
`triggers { parameterizedCron('H 1 * * 1-5 %ENV=staging;GREP=@regression\nH 3 * * 6 %ENV=uat;PROJECT=api') }`
(only when the user asks for several schedules).

Different environments → `BASE_URL`/`API_BASE_URL` per env: put them in the Secret-file `.env` of a
per-env credential, or extend `CFG` with an `envUrls` map and `withEnv(["BASE_URL=..."])` — ask the user
which they prefer (URLs are not secrets).

## 5. Validation without running a build
```bash
# Local: CI scripts on the last local run
cd automation_test && npm run summary && npx tsx ci/collage.ts && npx tsx ci/notify.ts --dry-run
# Jenkins declarative linter (needs VDS_JENKINS_<SLUG>_USER/_TOKEN in ~/.vds/sdlc-config.env)
python3 .claude/skills/autotest-credentials/scripts/cred_env.py run --scope shared --curl-user VDS_JENKINS_<SLUG>_USER:VDS_JENKINS_<SLUG>_TOKEN -- curl -s -K - -X POST -F "jenkinsfile=<automation_test/Jenkinsfile" "<JENKINS_URL>/pipeline-model-converter/validate"
```
Linter output `Jenkinsfile successfully validated.` = OK; otherwise fix the reported line.

## 6. Troubleshooting
| Symptom | Cause / fix |
|---|---|
| `No such DSL method 'publishHTML' / 'readJSON' / 'lock'` | plugin missing (§3) |
| `CredentialId "x" could not be found` | wrong ID (use the ID column, not the display name) or credential in another folder scope |
| Build FAILURE "Không có results/results.json" | install/typecheck failed or `--reporter` was overridden — see the log above the post section |
| Browser executable missing on agent | run `npx playwright install --with-deps chromium` once on the agent (admin) or use `dockerImage` |
| `does not support chromium on mac13` | agent OS too old for the pinned version → pin the last supported version in package.json (framework.md §2) |
| Android `Không thấy thiết bị` | resource name ≠ adb serial, device offline/unauthorized on the agent |
| Android farm: `Chưa điền tài khoản farm` / `Đăng nhập Keycloak device farm thất bại` / `Máy farm … không kết nối` | farm Keycloak account missing or OTP-enabled in the Jenkins user's `~/.vds/sdlc-config.env`, or no route to the farm host → run `npx tsx support/stf.ts doctor "<link>"` on the agent |
| HTML report blank in Jenkins | CSP (§3) — use the MinIO link (Playwright/Monocart reports need JS) |
| `Missing step definitions` in the bddgen stage | a .feature line has no step — run `npx bddgen` locally and implement the snippet |
| Vops `success:false` | token expired → update the `<project>-vops` credential (no code change) |
| Cron build uses wrong env | first item of `CFG.environments` is the cron default |
