---
name: autotest-credentials
description: Supporting skill — quy ước lưu credential ngoài repo cho mọi autotest-* skill (cùng cơ chế pqa-final-inspection). Credential công cụ (Confluence, Jenkins API, Vops/Telegram/MinIO, device farm STF) ở ~/.vds/sdlc-config.env; credential chạy test (tài khoản app, DB, SSH tunnel, device farm, TOTP) ở automation_test/.env (gitignore). Chưa có file → tự tạo sẵn đủ key; thiếu key → tự thêm; user tự điền value. Claude không đọc, không in, không nhận giá trị credential qua chat.
user-invocable: false
---

# Credential Supporting Skill

Skill hỗ trợ — không có slash command riêng. Được dùng bởi `autotest-project-docs`, `autotest-rf-web`, `autotest-rf-api`, `autotest-rf-android`, `autotest-rf-ios`, `autotest-rf-db`, `autotest-rf-jenkins` và bộ Playwright `autotest-pw-web`, `autotest-pw-api`, `autotest-pw-android`, `autotest-pw-jenkins` bất cứ khi nào cần credential. Playwright đọc cùng file `automation_test/.env` qua `config/env.ts` (dotenv, cùng thứ tự ưu tiên biến môi trường > `.env`, cùng `AUTOTEST_ENV_FILE`) — tên key giữ nguyên.

> **Ngôn ngữ giao tiếp:** mọi text hiển thị cho user viết bằng **tiếng Việt**, giữ nguyên thuật ngữ kỹ thuật.

Script dùng chung: `.claude/skills/autotest-credentials/scripts/cred_env.py` (dưới đây gọi tắt `cred_env.py`). Script **không bao giờ in giá trị** — chỉ in tên key và trạng thái.

> **Windows + macOS:** mọi thao tác credential đi qua `cred_env.py` (chỉ dùng thư viện chuẩn Python, tự ép output UTF-8 cho console Windows) — không dùng lệnh shell riêng của bash (`grep`, `[ -f ]`, `cp`, `sh -c`, `source`). Mỗi lệnh viết trên **1 dòng** (không dùng `\` xuống dòng — PowerShell không hiểu). Trên Windows gọi `python` (hoặc `py -3`, hoặc `${PYTHON}` đã resolve ở Step 0-env) thay cho `python3`. `~/.vds/...` tự phân giải thành `C:\Users\<user>\.vds\...`.

## Nguyên tắc bảo mật (bắt buộc, không ngoại lệ)

1. **Không hỏi giá trị credential trong chat** — không hỏi password/token/access key/secret, kể cả khi user chủ động đề nghị dán vào. Chỉ hỏi thông tin **không bí mật** (URL, endpoint, tên field, loại auth, có cần login không, bao nhiêu role...).
2. **Không đọc giá trị** — không `Read`/`cat`/`grep`/`source` file `.env`/`sdlc-config.env`; chỉ dùng `cred_env.py` (`check` in `SET`/`EMPTY`, `run` nạp giá trị thẳng vào env của lệnh con).
3. **Không ghi giá trị vào file nào khác** — không vào `global-data.md`, `*_variables.resource`, `data/*.yaml`, Jenkinsfile, log, report. Code chỉ tham chiếu **tên biến** (`${API_PASSWORD}`).
4. **Không tự điền hộ value, không điền value mẫu** — value bịa sẵn sẽ bị đọc như thật ở lần chạy sau.
5. **User lỡ dán credential vào chat** → không dùng, không ghi vào file nào; nhắc user tự điền vào đúng file và cân nhắc đổi mật khẩu/revoke token vì đã lộ trong lịch sử chat.
6. **Không có ngoại lệ.** Kể cả token Vops/Telegram và MinIO access key/secret của `autotest-rf-jenkins` cũng nằm ở `~/.vds/sdlc-config.env` (hoặc Jenkins credential inject biến môi trường cùng tên) — code sinh ra chỉ đọc theo tên key.
7. **Không truyền credential qua tham số dòng lệnh** (`--token`, `--password`...) — lộ trong `ps`, shell history, rule quyền đã duyệt và transcript. Script nào cần credential tự đọc file / biến môi trường.
8. **Lệnh nào sinh ra credential** thì ghi thẳng vào `~/.vds/sdlc-config.env`, không in giá trị ra stdout.

## 2 file credential

| File | Scope | Chứa |
|---|---|---|
| `~/.vds/sdlc-config.env` | Theo **người dùng**, dùng chung mọi project + VDS Skill Pack (vd `pqa-final-inspection`) | Credential **công cụ**: Confluence, Jenkins API |
| `automation_test/.env` | Theo **project** (gitignore, quyền 600) | Credential **chạy test**: tài khoản web/API/app, device farm, DB, SSH tunnel, TOTP secret |
| `automation_test/.env.example` | Theo project (**commit**, quyền 644) | Chỉ **tên key**, không có giá trị — để teammate biết cần điền gì |

`~` tự phân giải đúng trên macOS/Linux/Windows.

**Cơ chế (giống `pqa-final-inspection`):**
- **Chưa có file** → script tự tạo (quyền 600, `O_EXCL`) với **đủ bộ key chuẩn** bên dưới, mọi value để trống, kèm chú thích từng nhóm → user chỉ việc điền sau dấu `=`, không phải gõ tên key (gõ sai tên key không báo lỗi gì, chỉ lặng lẽ thành "chưa điền").
- **Đã có file, thiếu key** → script **thêm dòng key rỗng ở cuối file** (kèm chú thích nhóm). Không bao giờ sửa/xoá dòng đã có, không bao giờ điền value — kể cả với file dùng chung `~/.vds/sdlc-config.env`.
- **User tự điền value** theo hướng dẫn script in ra.

### Bộ key chuẩn (ghi sẵn khi tạo file)

**`automation_test/.env`** — tên key trùng tên biến RF (không có `${}`):

| Nhóm | Key | Dùng bởi |
|---|---|---|
| Web login | `WEB_USERNAME`, `WEB_PASSWORD` | autotest-rf-web |
| API login | `API_USERNAME`, `API_PASSWORD`, `API_KEY` | autotest-rf-api |
| App login | `APP_USERNAME`, `APP_PASSWORD` | autotest-rf-android / autotest-rf-ios |
| Device farm | `FARM_USERNAME`, `FARM_ACCESS_KEY` | autotest-rf-android / autotest-rf-ios |
| Database | `DB_USER`, `DB_PASS` | autotest-rf-db |
| SSH tunnel | `DB_TUNNEL_SSH_USER`, `DB_TUNNEL_SSH_KEY` (đường dẫn file private key) | autotest-rf-db |
| OTP | `TOTP_SECRET` | TC có OTP dạng TOTP |
| Proxy công ty | `PROXY_USERNAME`, `PROXY_PASSWORD` | autotest-rf-web (tải chromedriver qua proxy cần đăng nhập) |

Key **ngoài bộ chuẩn** được thêm khi cần (tự động qua `check`): nhiều role → `<WEB|APP|API>_<ROLE>_USERNAME` / `_PASSWORD` (vd `WEB_ADMIN_PASSWORD`).

**`~/.vds/sdlc-config.env`** — quy ước giống `pqa-final-inspection`: `VDS_<HỆ THỐNG>_<HOST_SLUG>_USER` / `_PASSWORD` / `_TOKEN`:

| Hệ thống | Key | Ghi sẵn khi tạo file? |
|---|---|---|
| Confluence | `VDS_CONFLUENCE_DIGITAL_VN_*`, `VDS_CONFLUENCE_10_254_136_35_*`, `VDS_CONFLUENCE_10_254_136_32_*` (mỗi host `_USER`, `_PASSWORD`, `_TOKEN` — điền TOKEN **hoặc** USER + PASSWORD) | Có |
| Confluence host khác | `VDS_CONFLUENCE_<SLUG>_*` | Thêm khi cần |
| Jenkins API (tạo job) | `VDS_JENKINS_<SLUG>_USER`, `VDS_JENKINS_<SLUG>_TOKEN` | Thêm khi cần (Step A4b của `autotest-rf-jenkins`) |
| Thông báo CI — Vops | `VDS_VOPS_TOKEN`, `VDS_VOPS_USER_ID` | Thêm khi cần (`autotest-rf-jenkins`, `autotest-pw-jenkins`) |
| Thông báo CI — Telegram | `VDS_TELEGRAM_BOT_TOKEN` | Thêm khi cần (`autotest-rf-jenkins`, `autotest-pw-jenkins`) |
| Report CI — MinIO/S3 | `VDS_MINIO_ACCESS_KEY`, `VDS_MINIO_SECRET_KEY` | Thêm khi cần (`autotest-rf-jenkins`) |
| Device farm MCloud (STF) | `VDS_STF_<SLUG>_USER`, `VDS_STF_<SLUG>_PASSWORD` (tài khoản Keycloak device farm **của chính người dùng**, do DevOps Trung tâm Vận hành Khai thác cấp, không dùng chung, không bật OTP) | Thêm khi cần (`autotest-pw-android`) — ADB key do skill tự đăng ký vào tài khoản này, không cần dán |

Fallback tương thích ngược cho Confluence: `VDS_CONFLUENCE_TOKEN` / `VDS_CONFLUENCE_USER` (bộ key cũ của VDS Skill Pack). Lấy đúng `<SLUG>` cho 1 host bất kỳ:

```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py slug --system confluence --url "<url bất kỳ trên host>"
# → VDS_CONFLUENCE_10_254_136_35_USER VDS_CONFLUENCE_10_254_136_35_PASSWORD VDS_CONFLUENCE_10_254_136_35_TOKEN
```

Host/port/DB name/base URL **không phải** credential → vẫn nằm ở `common_variables.resource` / `db_variables.resource` / `global-data.md` như cũ.

## Tạo sẵn key lần đầu (scaffold)

Khi 1 skill `autotest-*` scaffold framework cho project (lần đầu tạo `automation_test/common/`), hoặc `autotest-project-docs` tạo `automation_test/docs/` — tự chạy, không hỏi:

```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py init --scope project
```

→ tạo `automation_test/.env` với đủ bộ key chuẩn (nếu chưa có), đồng bộ `automation_test/.env.example`, thêm `automation_test/.env` vào `.gitignore` (bỏ qua nếu `.gitignore` đã cover), copy `automation_test/python_lib/env_secrets.py` nếu chưa có (không ghi đè). Còn lại chỉ cần thêm dòng `Variables` vào `common_variables.resource` (mục "Robot Framework đọc credential thế nào").

Gitignore file khác (vd `global-data.md`) — dùng lệnh chạy được trên cả Windows/macOS thay cho `grep ... >> .gitignore`:
```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py ignore --path automation_test/docs/global-data.md
```

Chỉ **thông báo một chiều**, không chặn gì: "Đã tạo sẵn `automation_test/.env` (gitignore) với các key credential chuẩn — điền value cho nhóm bạn dùng trước khi chạy test; nhóm không dùng để trống."

`autotest-project-docs` Mode A (Confluence) cũng chạy thêm `init --scope shared` để tạo `~/.vds/sdlc-config.env` nếu chưa có.

## Credential Gate — khi 1 bước cần credential

**1. Xác định key** việc đang làm cần (theo bảng). Không cần login/DB/farm → không gọi Gate.

**2. Chạy `check`** — tự thêm key còn thiếu vào file (tạo file đủ bộ chuẩn nếu chưa có), rồi báo trạng thái:

```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py check --scope project --keys API_USERNAME API_PASSWORD --comment "API login — autotest-rf-api"
python3 .claude/skills/autotest-credentials/scripts/cred_env.py check --scope shared  --keys VDS_JENKINS_<SLUG>_USER VDS_JENKINS_<SLUG>_TOKEN --comment "Jenkins API <host> — autotest-rf-jenkins"
```

- Exit `0` (mọi key `SET`, từ file hoặc biến môi trường) → tiếp tục.
- Exit `2` (có `EMPTY`) → script in khối **`HƯỚNG DẪN`** (đường dẫn file + đúng các dòng `KEY=` cần điền). **Chuyển nguyên khối đó cho user** như thông báo một chiều — không hỏi giá trị — rồi **dừng bước cần credential**:

  > Cần điền credential trước khi <việc đang làm>. Mở file **`<đường dẫn>`**, điền giá trị ngay sau dấu `=` cho: `API_USERNAME=`, `API_PASSWORD=`.
  > Không dán giá trị vào chat. Điền xong báo mình "xong" để kiểm tra lại.

  Các bước **không** cần credential (đọc docs, viết keyword/locator...) vẫn làm tiếp được; chỉ bước chạy test/gọi API/fetch bị chặn.

**3. User báo "xong"** → chạy lại `check`. Vẫn `EMPTY` → nhắc lại đúng key còn thiếu, không đoán.

**4. Lỗi xác thực lúc chạy** (401/403, login fail, DB access denied) khi `check` đã `SET` → báo user giá trị trong file có thể sai/hết hạn, chỉ rõ **tên key** liên quan để user tự sửa file — không hỏi giá trị, không thử đoán.

**Gọi lệnh ngoài cần credential** (vd curl Jenkins API) — không `source` file, không đặt giá trị trên command line:

```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py run --scope shared --curl-user VDS_JENKINS_<SLUG>_USER:VDS_JENKINS_<SLUG>_TOKEN -- curl -s -K - "<BASE_URL>/api/json"
```

`--curl-user` tự sinh dòng config `user = "u:p"` (đã escape) và pipe vào stdin của `curl -K -` — không cần shell, không lo quote → chạy y hệt trên PowerShell/cmd/bash/zsh (`curl.exe` có sẵn từ Windows 10 1803). Lệnh khác: `--keys K1 K2` nạp key vào env của lệnh con, `--stdin '<template {{KEY}}>'` pipe nội dung vào stdin.

Output của lệnh con (stdout + stderr gộp) đi qua `run` và **mọi giá trị vừa nạp được thay bằng `***`** trước khi in — lỡ lệnh con in lại credential thì chat cũng không thấy. Đây là lưới an toàn, không phải giấy phép: không dùng `run` với lệnh mà mục đích là in/biến đổi giá trị (`cat`, `printenv`, `echo`, `python -c ...`).

## Robot Framework đọc credential thế nào

`cred_env.py init --scope project` (và `check --scope project`) tự copy `templates/env_secrets.py` → `automation_test/python_lib/env_secrets.py` nếu chưa có (không ghi đè).

Rồi thêm **đúng 1 dòng** vào `*** Settings ***` của `automation_test/common/common_variables.resource` (và `db_variables.resource` nếu có):

```robotframework
*** Settings ***
Variables    ../python_lib/env_secrets.py
```

- `env_secrets.py` là variable file: expose mọi key trong `.env.example` ∪ `.env` thành biến RF (`${API_PASSWORD}`...). Ưu tiên: **biến môi trường > `.env` > rỗng** — CI inject bằng env var hoặc trỏ `AUTOTEST_ENV_FILE` tới 1 file khác (vd Jenkins Secret file) mà không phải sửa code.
- Biến đi xuyên chuỗi resource (`imports.resource` → `common_keywords.resource` → `common_variables.resource`) nên keyword/test dùng trực tiếp `${API_PASSWORD}` như cũ — đã kiểm chứng với RF 7.
- **Không** khai báo lại key credential trong `*** Variables ***` của `common_variables.resource`/`db_variables.resource` (placeholder sẽ đè giá trị thật). Rule "`imports.resource` không import variable file" vẫn giữ — variable file này import trong `common_variables.resource`, không phải `imports.resource`.
- Override tạm cho 1 lần chạy (user tự gõ trên terminal, không qua chat): macOS/Linux `API_PASSWORD=... robot ...`; PowerShell `$env:API_PASSWORD="..."; robot ...`.
- Đường dẫn `../python_lib/env_secrets.py` dùng `/` — Robot Framework tự xử lý đúng trên Windows.

**Trước khi chạy test**: Credential Gate với các key TC cần — exit 2 → thông báo một chiều, không chạy robot.

## Project cũ — phát hiện credential còn nằm trong repo

Khi skill đọc project đã có sẵn (state `COMPLIANT`/`PARTIAL`/`EXTERNAL`), chạy 1 lần:

```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py scan --files automation_test/docs/global-data.md automation_test/common/common_variables.resource automation_test/common/db_variables.resource automation_test/data/*.yaml
```

Script chỉ in `file:dòng` + tên key, **không in giá trị**. Có `SUSPECT` → chạy `init --scope project` (bảo đảm file `.env` có key tương ứng), rồi báo user (thông báo một chiều, không chặn các bước khác):

> Phát hiện **N chỗ** nghi còn credential literal trong repo: `<file:dòng>`... Đề nghị: (1) tự chép giá trị sang `automation_test/.env` (đã có sẵn key `<KEY>`), (2) báo mình "xong" để mình xoá literal ở các file trên và nối `env_secrets.py`. Nếu các file đó đã từng được commit/push → cân nhắc đổi mật khẩu/revoke token.

Chỉ xoá dòng literal (hoặc thay bằng tham chiếu key) **sau khi** user xác nhận đã chép xong — không tự chép giá trị hộ. Dòng `SUSPECT` là test data cố ý sai (vd `password: "wrongpass"` cho TC negative) → user xác nhận giữ, không phải credential thật.

## Rules

- Mọi credential thật chỉ nằm ở 2 file trên (hoặc env var/Jenkins Credentials lúc CI) — không bao giờ trong repo, không bao giờ trong chat, không bao giờ trên dòng lệnh. Không có ngoại lệ.
- Chưa có file → tạo sẵn đủ bộ key chuẩn; thiếu key → thêm dòng key rỗng ở cuối file; user tự điền value. Không sửa/xoá dòng có sẵn, không điền value.
- Chỉ dùng `cred_env.py` để tạo/kiểm tra/nạp; không mở file credential để đọc.
- Mọi lệnh phải chạy được trên cả Windows và macOS: chỉ `cred_env.py` / Python thuần, 1 lệnh 1 dòng, `python` thay `python3` trên Windows.
- Không hỏi giá trị credential trong chat; chỉ chuyển khối `HƯỚNG DẪN` (file + tên key) cho user.
- `automation_test/.env.example` commit được (chỉ tên key); `automation_test/.env` luôn gitignore.
