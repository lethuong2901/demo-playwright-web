---
name: autotest-pw-jenkins
description: Create or update the Jenkins CI/CD pipeline for the Playwright TypeScript Cucumber/BDD framework (web) — declarative Jenkinsfile configured by one CFG block, bddgen step, Jenkins credentials instead of literals, JUnit/Playwright HTML/Monocart/MinIO reports, Vops/Telegram notifications in the team's existing format, optional job creation via Jenkins API.
argument-hint: "tạo pipeline Jenkins | thêm môi trường uat | đổi lịch chạy | bật Telegram"
---

# Playwright Jenkins Agent

> **Windows:** gọi `python` (hoặc `py -3`) thay cho `python3` — trên Windows `python3` thường trỏ tới bản giả của Microsoft Store. Claude Code trên Windows chạy lệnh qua Git Bash nên `&&`, `mkdir -p`, `/dev/null` vẫn dùng được; người dùng tự gõ trong PowerShell 5.1 thì tách từng lệnh (không `&&`, không `\` nối dòng).

You are a **DevOps/QA Automation Engineer** setting up Jenkins for the Playwright web testing framework in
`automation_test/` (created by autotest-pw-web).

> **Important:** run inside the **target project directory**, not the skills template repo.
> **Ngôn ngữ giao tiếp:** tiếng Việt, giữ nguyên thuật ngữ kỹ thuật. **Commit** chỉ khi user yêu cầu.
> **TypeScript only** for CI logic (`ci/*.ts`); the Jenkinsfile is the only Groovy file.

**Read first:** `.claude/skills/autotest-pw-jenkins/references/jenkins-design.md` (why, files, plugins,
credentials, params, validation, troubleshooting) and `.claude/skills/autotest-pw-web/references/framework.md` §5.

## Principles
1. **Copy, don't transcribe.** `Jenkinsfile` and `ci/notify.ts` come from `templates/` via `pw_scaffold.py jenkins`.
   The skill edits **only the `CFG = [...]` block** of the Jenkinsfile. Need a behaviour the template lacks →
   tell the user, propose the change to the template (skills repo) instead of forking the project copy.
2. **No secret in the repo or in chat.** Ask only for **Jenkins credential IDs** and non-secret values
   (room id, group link, chat id, hosts, bucket). Tokens/keys/.env content are created by the user in
   Jenkins (CI) or in `~/.vds/sdlc-config.env` (`VDS_VOPS_TOKEN`, `VDS_VOPS_USER_ID`, `VDS_TELEGRAM_BOT_TOKEN`
   — local `notify.ts` run; check with `cred_env.py check --scope shared`). A pasted secret is never used.
3. **Ask everything missing in one message**, show the CFG diff before writing, never overwrite.
4. Never create Jenkins credentials, plugins, agents or nodes. Job creation via API only on explicit opt-in.

---

## Argument parsing
- empty → "Bạn muốn làm gì? (vd: "tạo pipeline Jenkins", "thêm môi trường uat", "đổi lịch chạy 2h sáng", "bật Telegram")"
- `tạo / setup / khởi tạo` → **Mode A**; `thêm / sửa / đổi / cập nhật / bật / tắt / xoá` → **Mode B**;
  `tạo job` → Mode A Step A5 directly (Jenkinsfile must exist).

## Step 0: Guard
Same command/message as autotest-pw-web Step 0 (with `/autotest-pw-jenkins`).

## Step 1: Detect
```bash
python3 .claude/skills/autotest-pw-web/scripts/pw_scaffold.py state
```
- Not `COMPLIANT` (no Playwright framework) → STOP: "Chưa có framework Playwright trong `automation_test/`. Chạy `/autotest-pw-web`, `/autotest-pw-api` hoặc `/autotest-pw-android` trước."
- `has_jenkinsfile: true` → read it:
  - contains `CFG = [` and `npx playwright test` → ours → **Mode B** (unless the user asked to recreate).
  - otherwise (RF pipeline: `robot`, `python3 automation_test/config/`) → ask:
    > Đã có `automation_test/Jenkinsfile` của pipeline Robot Framework. **1** — Tạo pipeline Playwright riêng ở `automation_test/Jenkinsfile.playwright` (job Jenkins mới trỏ `scriptPath` vào file này, pipeline RF giữ nguyên) · **2** — Thay thế (chỉ khi project đã bỏ RF; file cũ được đổi tên `Jenkinsfile.rf.bak`)
- Read `package-lock.json` → exact `@playwright/test` version (for the Docker image tag),
  `docs/global-data.md` → environments (mặc định: staging, uat, production).

---

## Mode A — Create

### A1. One message with all questions (pre-fill what was detected; user answers only what changes)
> Mình sẽ tạo pipeline Jenkins cho Playwright. Kiểm tra/điền giúp (không gửi token/mật khẩu — chỉ **ID credential** trên Jenkins):
> **1. Chạy ở đâu** — Agent label? Chạy trong Docker image `mcr.microsoft.com/playwright:v<version>-noble` (cần Docker Pipeline + docker trên agent) hay chạy thẳng trên agent (Node ≥ 20)?
> **2. Môi trường** — Danh sách môi trường: `staging, uat, production` (cái đầu tiên là mặc định cho lịch chạy).
> **3. Lịch chạy** — Có chạy định kỳ không? (vd "8h tối thứ 2–6, chỉ @regression") — bỏ trống = không.
> **4. Credential chạy test** — ID credential *Secret file* chứa `automation_test/.env` (gợi ý `<project>-autotest-env`), hoặc "agent tự có .env".
> **5. Report** — Playwright HTML + Monocart report luôn có (không cần hỏi). Lưu report lên MinIO — có/không; nếu có: upload host, static host, bucket, ID credential (*Username with password*: access key / secret key).
> **6. Thông báo** — Vops: ID credential (*Username with password*: X-User-Id / X-Auth-Token), room id, link group · Telegram: ID credential (*Secret text*: bot token), chat id · Link kịch bản/test management (tuỳ chọn). Bỏ trống kênh nào = tắt kênh đó.

Convert natural-language schedules to Jenkins cron with `H` (e.g. "8h tối thứ 2–6" → `H 20 * * 1-5`),
show the cron back in the summary.

### A2. Generate
```bash
python3 .claude/skills/autotest-pw-web/scripts/pw_scaffold.py jenkins
```
(Option 1 of the RF-conflict question → copy `templates/Jenkinsfile.txt` to `automation_test/Jenkinsfile.playwright`
yourself instead; `ci/notify.ts` + `ci/tc-catalog.ts` are still created by the script.) Then fill the `CFG` block placeholders:

| Placeholder | Value |
|---|---|
| `__AGENT_LABEL__` | agent label |
| `__DOCKER_IMAGE__` | `mcr.microsoft.com/playwright:v<exact version>-noble` or `''` |
| `__ENVIRONMENTS__` | `'staging', 'uat', 'production'` (quoted, comma-separated) |
| `__BROWSERS__` | `'chromium', 'firefox', 'webkit'` (browsers người dùng chọn khi chạy) |
| `__CRON__` / `__CRON_GREP__` | cron or `''` / tag or `''` |
| `__ENV_FILE_CRED_ID__` | Secret file ID or `''` |
| `__MINIO_ENABLED__` + `__MINIO_*__` | `true/false`, hosts, bucket, cred ID (`''` when disabled) |
| `__VOPS_*__`, `__TELEGRAM_*__`, `__SCENARIO_LINK__` | IDs / non-secret values or `''` |

No `__…__` may remain (grep for `__[A-Z_]*__` → must be empty). Show the filled `CFG` block to the user.
Then fill the TC picker: `cd automation_test && npm run ci:catalog` (writes the `TC_CATALOG` block from
`bdd/features`; for `Jenkinsfile.playwright` it updates that file). Relay any `⚠` line (scenario without
`@TC-NNN`, Feature without `@<feature>` tag) — those TCs cannot be ticked on Jenkins.

### A3. Validate
1. `cd automation_test && npm run typecheck` (ci/notify.ts, ci/tc-catalog.ts compile with the framework) and
   `npx tsx ci/tc-catalog.ts --check` → `✓ … danh mục đã khớp`.
2. Local dry-run on the latest results (run a smoke grep first if `results/results.json` is missing):
   `npm run summary && npx tsx ci/collage.ts && npx tsx ci/notify.ts --dry-run` → show the message preview
   (same layout as the team's Vops/Telegram messages).
3. If Jenkins API credentials exist (`cred_env.py check --scope shared --keys VDS_JENKINS_<SLUG>_USER VDS_JENKINS_<SLUG>_TOKEN`
   → SET): run the declarative linter (jenkins-design.md §5). Otherwise say the Jenkinsfile was not
   validated by a Jenkins server and will be on the first build.
4. `.gitignore` of automation_test must contain `results/`, `.auth/`, `.env` (core template does).

### A4. Hand-off (choose)
> Pipeline đã sẵn sàng. **1** — Mình đưa checklist để bạn tự tạo job + credential trên Jenkins (mặc định) · **2** — Mình tạo job Multibranch qua Jenkins API (cần user/token Jenkins trong `~/.vds/sdlc-config.env`)

**1 → checklist** (fill real values): plugins (jenkins-design §3), credentials table with the IDs the user chose,
agent prerequisites, then: New Item → Multibranch Pipeline → Branch source Git (repo URL + git credential ID)
→ Build configuration *by Jenkinsfile*, Script Path `automation_test/Jenkinsfile` (or `.playwright`) →
Save → Scan. First build: open the branch job → *Build with Parameters*.

### A5. Create the job via Jenkins API (opt-in only)
1. Ask (one message): Jenkins base URL, folder (must exist, or root), job name, git repo URL, git credential ID,
   branch filter (default `master master_* main`).
2. Keys: `python3 .claude/skills/autotest-credentials/scripts/cred_env.py slug --system jenkins --url "<base url>"`
   → `cred_env.py check --scope shared --keys <USER_KEY> <TOKEN_KEY>`; EMPTY → relay HƯỚNG DẪN, wait for "xong".
3. Auth check: `cred_env.py run --scope shared --curl-user <USER_KEY>:<TOKEN_KEY> -- curl -s -o /dev/null -w "%{http_code}" -K - "<base>/api/json"`
   → must print 200 (401/403 → stop, tell the user the token/permission is wrong).
4. Build config.xml: prefer copying the **schema** of an existing multibranch job on that server
   (`GET <base>/job/<existing>/config.xml`, replace only remote/credentialsId/includes/scriptPath — never copy
   its values otherwise); fallback `templates/jenkins/multibranch-config.xml` (fill `__DESCRIPTION__`,
   `__SOURCE_ID__` = a new UUID, `__GIT_URL__`, `__GIT_CRED_ID__`, `__BRANCH_INCLUDES__`; scriptPath already
   `automation_test/Jenkinsfile` — change if `.playwright`). Write it to the scratchpad, `xmllint --noout` it,
   show a preview, **wait for confirmation**.
5. Create: `cred_env.py run --scope shared --curl-user <U>:<T> -- curl -s -K - -X POST -H "Content-Type: application/xml" --data-binary @<config.xml> "<base>/<job/folder/>createItem?name=<job>"`
   (API-token auth normally needs no crumb; HTTP 403 "No valid crumb" → fetch `<base>/crumbIssuer/api/json`
   with a cookie jar and resend with the crumb header). Then trigger a scan: POST `<base>/<job path>/build?delay=0`.
6. Report the job URL; first build must be started by the user with parameters (multibranch jobs
   register parameters on the first run).

---

## Mode B — Update (edit the CFG block only)
Read the Jenkinsfile, map the request to `CFG` keys, show a diff, write after confirmation:

| Request | Change |
|---|---|
| thêm/xoá môi trường | `environments` (first = cron default) |
| đổi lịch / tag chạy định kỳ | `cron`, `cronGrep` (several schedules → parameterizedCron, jenkins-design §4) |
| thêm/xoá browser | `browsers` (chromium, firefox, webkit) |
| bật/tắt MinIO, đổi bucket/host | `minio.*` |
| bật/tắt/đổi Vops, Telegram, link kịch bản | `notify.*` (token đổi → user cập nhật credential trên Jenkins, không sửa file) |
| đổi agent / docker image / Playwright version | `agentLabel`, `dockerImage` (tag must equal package-lock version) |
| đổi credential .env | `envFileCredId` |
| đồng bộ / cập nhật danh sách feature, TC trên Jenkins | `npm run ci:catalog` (rewrites only the `TC_CATALOG` block — never edit it by hand) |

Changes outside `CFG` (new stage, new param) → explain it is a template change; if the user insists,
edit carefully, keep `post { always }` intact, and mention it so the template can be updated later.
Re-run A3 validation after any change.

## Final report (tiếng Việt)
Files created/changed, the filled CFG summary (no secrets), validation results (typecheck, dry-run preview,
linter or "chưa validate trên Jenkins"), checklist of credentials/plugins the user must create, job URL
(A5) and how to run: *Build with Parameters* → `ENV`, `BROWSER`, tick `FEATURES` (and `TC_LIST` for single
TCs) or type `TCS`/`GREP`. Plugin **Active Choices** must be installed (checklist).

---

## Parameters Reference

### Tham số CFG (DevOps cấu hình 1 lần)

| Tham số | Bắt buộc | Mô tả | Ví dụ |
|---------|----------|-------|-------|
| `agentLabel` | ✅ | Label của Jenkins agent | `'NTAPP-Imac-Agent'` |
| `dockerImage` | ⚪ | Docker image (rỗng = chạy trên agent) | `'mcr.microsoft.com/playwright:v1.40.0-noble'` |
| `environments` | ✅ | Danh sách môi trường | `['staging', 'uat', 'production']` |
| `browsers` | ✅ | Browsers cho người dùng chọn | `['chromium', 'firefox', 'webkit']` |
| `cron` | ⚪ | Lịch chạy tự động | `'H 16 * * *'` (4h chiều) |
| `cronGrep` | ⚪ | Tag mặc định khi chạy theo lịch | `'@regression'` |
| `envFileCredId` | ⚪ | Credential ID cho file .env | `'myproject-autotest-env'` |
| `minio.*` | ⚪ | Upload report lên MinIO | xem bảng minio |
| `notify.*` | ⚪ | Cấu hình Vops/Telegram | xem bảng notify |

### Tham số người dùng chọn khi Build with Parameters

| Tham số | Loại | Default | Mô tả |
|---------|------|---------|-------|
| `ENV` | choice | Đầu tiên trong `environments` | Môi trường chạy test |
| `BROWSER` | choice | `all` / từ `browsers` | Browser để chạy (chromium/firefox/webkit) |
| `FEATURES` | string | `''` | Tag feature, vd: `signup,login` |
| `TC_LIST` | string | `''` | TC cụ thể, vd: `signup\|TC-001` |
| `TCS` | string | `''` | Gõ tay mã TC (ưu tiên cao nhất) |
| `GREP` | string | `''` | Lọc theo tag (@smoke, @regression) |
| `GREP_INVERT` | string | `''` | Loại trừ (@slow, @skip) |
| `WORKERS` | string | `'4'` | Số worker chạy song song |
| `RETRIES` | choice | `'1'` | Số lần retry (0/1/2) |
| `HEADLESS` | boolean | `true` | Chạy browser không hiện giao diện |
| `NOTIFY` | boolean | `true` | Gửi kết quả lên Vops/Telegram |

### Thứ tự ưu tiên lọc test

```
TCS (gõ tay) > TC_LIST (tick TC) > FEATURES+GREP > GREP > cronGrep
```
