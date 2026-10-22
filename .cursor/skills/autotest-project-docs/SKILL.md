---
name: autotest-project-docs
description: Tạo mới hoặc cập nhật domain knowledge cho project — từ Confluence, từ file/text, hoặc AI tự tạo từ câu hỏi. Quản lý cấu trúc automation_test/docs/ cho các skill autotest-*.
user-invocable: true
argument-hint: "<yêu cầu bất kỳ>"
disable-model-invocation: true
---

# Project Docs Agent

> **Windows:** gọi `python` (hoặc `py -3`) thay cho `python3` — trên Windows `python3` thường trỏ tới bản giả của Microsoft Store. Claude Code trên Windows chạy lệnh qua Git Bash nên `&&`, `mkdir -p`, `/dev/null` vẫn dùng được; người dùng tự gõ trong PowerShell 5.1 thì tách từng lệnh (không `&&`, không `\` nối dòng).

Khởi tạo domain knowledge cho project mới. Chạy **một lần duy nhất** khi bắt đầu project.

> **Ngôn ngữ giao tiếp:** Mọi text hiển thị cho user trong lúc làm việc — tiến trình, câu hỏi, cảnh báo, tóm tắt kết quả — viết bằng **tiếng Việt**. Giữ nguyên thuật ngữ kỹ thuật (Confluence, API, endpoint...) không dịch.

> **Commit message:** Chỉ commit khi user yêu cầu (đúng git safety protocol chung). Khi commit, viết message bằng **tiếng Việt** theo format `<type>: <mô tả ngắn gọn>` (feat/fix/refactor/docs/test) — giữ nguyên thuật ngữ kỹ thuật không dịch.

> **Vị trí lưu trữ:** Toàn bộ domain knowledge nằm trong `automation_test/docs/` — file chung (`global-data.md`, `product-overview.md`, `api-reference.md`, `system-overview.md`) nằm ngay trong `automation_test/docs/`; file riêng cho từng chức năng (`business-scenario.md`, `detail-design.md`) nằm trong `automation_test/docs/features/<feature>/`. Thư mục này độc lập với `.vsaf/` của VSAF framework (`planning-artifacts/`, `srs/`, `testcases/`...) — autotest-project-docs chỉ quản lý `automation_test/docs/`, không đụng tới `.vsaf/`.
>
> **Feature identifier có thể lồng nhau** (vd: `farm/product-management`, không chỉ `<feature>` phẳng) khi module hierarchy của project cần — các skill đọc `automation_test/docs/features/` sẽ duyệt dần các prefix ngắn hơn để tìm doc gần nhất, nên độ sâu nesting linh hoạt.

### Ví dụ mẫu (tham khảo cấu trúc)

Layout thật của `automation_test/docs/` cho một project B2B Agritech (Freso — kết nối nhà cung cấp nông sản với nhà hàng):

```
automation_test/docs/
  global-data.md              # Environment, URL, test account (chỉ tên key — giá trị ở automation_test/.env)
  system-overview.md          # Kiến trúc & luồng tổng quan
  api-reference.md            # Endpoint catalog
  features/
    farm/product-management/
      business-scenario.md    # Business rules & test scenarios
      detail-design.md        # Technical specs, API & DB schema
    restaurant/home-page/product-listing-page-by-category/
      business-scenario.md
      detail-design.md
```

Đoạn mẫu ngắn cho từng loại file:

**`global-data.md`**
```markdown
# Global Test Data & Environment Configurations

## 1. Staging Environment
### Restaurant Module (Buyer)
- **Login URL:** `http://gw-staging.digital.vn/freso/buyer/chon-chi-nhanh`
- **Tài khoản test:** role Buyer — credential ở `automation_test/.env`: `WEB_BUYER_USERNAME`, `WEB_BUYER_PASSWORD`
```

**`api-reference.md`**
```markdown
## Authentication (No Auth Required)
| Method | Endpoint            | Body                 | Response                       |
|--------|----------------------|----------------------|--------------------------------|
| POST   | /api/auth/login      | { email, password }  | { token, user: { id, email } } |
```

**`system-overview.md`**
```markdown
## 2. General Description & Target Users
Nền tảng thương mại điện tử nông sản với 3 nhóm user chính:
* **Farm/Supplier:** phân phối & bán nông sản trên platform.
* **Restaurant:** mua nông sản qua app/web.
* **VDS (Viettel Digital Services):** admin, CSKH, phát triển kinh doanh.
```

**`features/<feature>/business-scenario.md`**
```markdown
## Luồng nghiệp vụ: Farm Onboarding
1. Business staff khởi tạo danh mục hồ sơ yêu cầu.
2. Farm đăng ký tài khoản, upload hồ sơ.
3. Business staff review & ký hợp đồng.
4. Hệ thống tạo admin account, gửi credentials cho Farm.
```

**`features/<feature>/detail-design.md`**
```markdown
## Data Entities
* **PRODUCT:** `product_id`, `name`, `description`, `category_id`, `wallet_id`.
* **FARM:** `farm_id`, `name`, `address`, `category`.
```

> Đây chỉ là ví dụ minh hoạ cấu trúc — không phải nơi lưu domain knowledge thật của project hiện tại.

## Argument Parsing

Nhận **tên project** hoặc **ngôn ngữ tự nhiên** — không cần đúng format cố định.

```
/autotest-project-docs viettelmoney                              # structured
/autotest-project-docs tạo tài liệu cho project shopee          # ngôn ngữ tự nhiên
/autotest-project-docs                                           # trống → hỏi tên project
```

Parse `$ARGUMENTS`:
- **Trống** → hỏi: "Tên project là gì? (vd: viettelmoney, shopee, saucedemo)"
- **Có argument** → trích xuất `PROJECT_NAME` (chỉ dùng để hiển thị/label, không ảnh hưởng đường dẫn lưu file); nếu không xác định được → hỏi như trên

---

## Step 0 — Kiểm tra domain docs đã tồn tại chưa

```python
import glob
existing = (
    glob.glob('automation_test/docs/global-data.md')
    + glob.glob('automation_test/docs/product-overview.md')
    + glob.glob('automation_test/docs/api-reference.md')
    + glob.glob('automation_test/docs/system-overview.md')
    + glob.glob('automation_test/docs/features/**/*.md', recursive=True)
)
print('\n'.join(existing) or 'NONE')
```

**Nếu đã có** → hỏi:

> Đã tìm thấy domain docs trong `automation_test/docs/`
>
> **1** — Cập nhật / bổ sung thêm tài liệu
> **2** — Tạo mới hoàn toàn (xoá và tạo lại)

- Chọn **1** → bỏ qua Step 1, vào Step 2 ngay (thêm tài liệu vào docs hiện có)
- Chọn **2** → xoá các file domain docs cũ trong `automation_test/docs/`, tạo lại từ đầu (thư mục `.vsaf/` của VSAF framework — `planning-artifacts/`, `srs/`, `testcases/`, `KNOWLEDGE.md`, `STATUS.md`... — nằm ngoài `automation_test/docs/` nên không bị ảnh hưởng)

**Nếu chưa có** → tạo thư mục, rồi tiếp tục Step 1:

```bash
mkdir -p automation_test/docs/features
python3 .claude/skills/autotest-credentials/scripts/cred_env.py ignore --path automation_test/docs/global-data.md
```

Tạo sẵn file credential chạy test với đủ bộ key chuẩn (không hỏi, chỉ báo một chiều — xem `autotest-credentials`):
```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py init --scope project
```

(Tạo `.gitignore` ở root project nếu chưa có. `global-data.md` vẫn gitignore vì chứa URL/môi trường nội bộ — nhưng **không còn chứa credential**, xem `autotest-credentials`.)

**Nếu đã có** `global-data.md` → chạy `cred_env.py scan` (mục "Project cũ" trong `.claude/skills/autotest-credentials/SKILL.md`) trên file này — còn token/password literal (vd section `## Confluence` kiểu cũ có `**Token:**`) → thông báo user chuyển sang file credential theo đúng hướng dẫn skill đó.

---

## Step 1 — Chọn nguồn tài liệu

Hỏi user **một câu**:

> Khởi tạo domain knowledge cho **`<PROJECT_NAME>`** — bạn có tài liệu spec không?
>
> **1** — Có trên Confluence (truyền link, tôi tự fetch)
> **2** — Có file hoặc text (paste nội dung vào đây, hoặc cho đường dẫn file)
> **3** — Chưa có — để AI hỏi và tạo

- Chọn **1** → **Mode A: Confluence**
- Chọn **2** → **Mode B: File / Text**
- Chọn **3** → **Mode C: AI Generate**

---

## Mode A — Từ Confluence

### Step A1 — Base URL + credential Confluence

**Base URL** (không bí mật): đọc `automation_test/docs/global-data.md` section `## Confluence` → `**Base URL:**`. Chưa có → suy từ link user paste ở Step A2 (phần `scheme://host[:port]`), hoặc hỏi. Lưu vào `global-data.md`:
```markdown
## Confluence
- **Base URL:** `<base_url>`
- **Credential:** `~/.vds/sdlc-config.env` → `VDS_CONFLUENCE_<HOST_SLUG>_TOKEN` (hoặc `_USER` + `_PASSWORD`)
```

**Credential** — theo Credential Gate của `.claude/skills/autotest-credentials/SKILL.md` (scope `shared`), **không hỏi token trong chat, không ghi token vào `global-data.md`**:
```bash
python3 .claude/skills/autotest-credentials/scripts/cred_env.py slug --system confluence --url "<base_url>"
python3 .claude/skills/autotest-credentials/scripts/cred_env.py init  --scope shared --keys VDS_CONFLUENCE_<SLUG>_USER VDS_CONFLUENCE_<SLUG>_PASSWORD VDS_CONFLUENCE_<SLUG>_TOKEN --comment "Confluence <host> — điền TOKEN (PAT: Settings → Personal Access Tokens) HOẶC USER + PASSWORD"
```
Không dùng `check` ở đây (user có thể điền TOKEN, hoặc USER + PASSWORD, hoặc key legacy `VDS_CONFLUENCE_TOKEN` từ VDS Skill Pack) — `confluence_fetch.py` tự thử lần lượt các cách. Cứ fetch ở Step A2: script trả `{"error": "missing_credential", ...}` (exit 3) thì gửi thông báo một chiều: mở `~/.vds/sdlc-config.env`, điền 1 trong 2 cách ở `fill_one_of`, báo "xong" để chạy lại. HTTP 401/403 → báo credential sai/hết hạn/thiếu quyền space, user tự sửa file — không hỏi giá trị.

### Step A2 — Nhận link và fetch đệ quy theo cây trang + tham chiếu trong nội dung

Hỏi:
> Paste link Confluence (có thể nhiều link, mỗi link 1 dòng):

> **Nguyên tắc bắt buộc — đọc TOÀN BỘ nội dung trang, không bỏ sót thành phần nào.**
> Một trang Confluence không chỉ có text: nó còn có macro (info/note/expand/panel/code), bảng, **sơ đồ draw.io nhúng qua macro**, file đính kèm, trang con, link tham chiếu. Mọi thành phần đều phải được đọc và tổng hợp vào docs. Không được bỏ qua một thành phần chỉ vì nó không nằm trong text thuần của body — đặc biệt là sơ đồ draw.io: nội dung sơ đồ **không nằm trong body**, nên nếu chỉ đọc `markdown` thì mất trắng toàn bộ sơ đồ. Trước khi sang Step A3 cho một trang, kiểm tra đã xử lý hết: `markdown` + `diagrams` + `attachments` + `children` + `referenced_pages`.

Mỗi trang fetch về (`confluence_fetch.py`) trả kèm 4 nguồn dữ liệu bổ sung ngoài `markdown`:
- `children` — trang con thật trong **cây phân cấp Confluence** (luôn có mặt, kể cả khi trang cha không rỗng — vd trang tổng quan feature có 2 trang con business-scenario/detail-design).
- `referenced_pages` — trang được **nhắc đến trong nội dung** (link dán tay hoặc macro chèn link của Confluence). Mỗi phần tử có `id` (đã xác định được) hoặc chỉ có `title` kèm `resolved: false` (script không tự tìm ra id — thường do link trỏ tới trang ở space khác/tên trùng).
- `diagrams` — **sơ đồ draw.io / Gliffy nhúng trong trang** (macro `drawio`, hoặc file `.drawio` đính kèm). Mỗi phần tử có `diagram_name`, `owner_page_id`, `source_attachment`, `download_url`, `extract_command`. Nội dung sơ đồ KHÔNG nằm trong `markdown` (chỗ đó chỉ có placeholder `**[SƠ ĐỒ ...]**`) → **bắt buộc chạy Step A2b** để trích, không được bỏ qua.
- `attachments` — danh sách file đính kèm trong trang (`title`, `media_type`, `file_size`, `download_url`). Script **không tự tải nội dung file** (chỉ liệt kê metadata) — nếu có file quan trọng (Excel TC, PDF spec, ảnh/diagram kiến trúc), báo cho user ngay khi phát hiện, kèm `download_url`. Nếu user xác nhận là tài liệu cần dùng: `.pdf`/`.docx` → tải về rồi xử lý như Mode B (Step B1); `.xlsx` chứa test case → gợi ý dùng `/autotest-scenarios` Mode B để convert; ảnh/diagram → chỉ cần biết tên file tồn tại, không cần trích nội dung.

**Bảng trong trang Confluence** (`markdown` đã xử lý sẵn, nhưng khi tổng hợp vào docs phải giữ nguyên):
- **Ô gộp dòng/cột (merge row / merge column)** — giá trị của ô gộp được **lặp lại ở mọi dòng/cột mà ô đó phủ**, nên mỗi dòng trong bảng markdown là một dòng dữ liệu đầy đủ, không bị lệch cột. Ngay dưới bảng có khối `> **Ô gộp (merge) trong bảng trên**` liệt kê ô nào gộp bao nhiêu dòng/cột — **giữ lại khối này khi copy bảng vào docs**, đừng gộp ô lại hay bỏ các giá trị lặp (lặp là cố ý, để đọc từng dòng độc lập).
- **Dòng trống / ô trống** — được giữ nguyên thành dòng `|  |  |` hoặc ô rỗng, **không được bỏ**. Dòng trống thường là ranh giới nhóm; xoá nó làm các dòng bên dưới bị hiểu sai là thuộc nhóm trên.
- **Bảng không có `<th>`** — header được sinh là `Cột 1 | Cột 2 | ...`, dòng dữ liệu đầu tiên **vẫn là dữ liệu** (không bị biến thành header). Nếu bảng kiểu header dọc (nhãn ở cột đầu), diễn giải lại thành `nhãn: giá trị` khi viết vào docs.
- **Nội dung nhiều dòng trong 1 ô** (đoạn văn, bullet list, bảng lồng) → nối bằng `<br>` trong cùng ô, không tràn ra ngoài bảng. Ký tự `|` trong nội dung được escape `\|`.
- Khi viết lại bảng vào `test-cases.md` / `detail-design.md`: **số dòng dữ liệu phải khớp bảng gốc**. Đếm lại nếu bảng có ô gộp; thiếu dòng là mất test case/business rule.

`markdown` giờ giữ nguyên toàn bộ nội dung bên trong các macro Confluence (info/note/warning/tip/panel/expand/code, bảng, ảnh, link, task-list...) thay vì bị lược bỏ — không cần lo dữ liệu trong macro bị mất khi đọc `markdown`.

Duy trì trong lúc chạy:
- `visited` = tập `page_id` đã fetch (rỗng lúc bắt đầu).
- `queue` = danh sách link/`page_id` cần fetch, khởi tạo bằng các link user vừa paste.
- `unresolved` = danh sách các tham chiếu không tự fetch được (chỉ có title, không có id).
- `fetched_count` = 0.

Lặp cho đến khi `queue` rỗng:

1. Lấy 1 phần tử ra khỏi `queue`. Nếu `page_id` của nó đã có trong `visited` → bỏ qua, sang phần tử kế.
2. Fetch:
   ```bash
   python3 .claude/skills/autotest-project-docs/scripts/confluence_fetch.py \
     --base-url "<base_url>" \
     --url "<url_hoặc_page_id>"
   ```
3. Thêm `page_id` vào `visited`, tăng `fetched_count`.
4. Nếu `diagrams` không rỗng → **chạy Step A2b ngay cho trang này** (trích nội dung sơ đồ) trước khi classify/lưu, để nội dung sơ đồ được ghép vào doc thay vì placeholder.
5. Nếu **không** `is_index` (trang có nội dung thật) → classify + lưu ngay (Step A3). Nếu `is_index: true` (trang rỗng, chỉ là container) → không lưu trang này như 1 doc (không có nội dung), chỉ dùng để lấy `children`.
6. Với mỗi phần tử trong `children` — nếu `id` chưa có trong `visited` và chưa có trong `queue` → thêm vào `queue`.
7. Với mỗi phần tử trong `referenced_pages`:
   - `resolved: true` (có `id`) và chưa có trong `visited`/`queue` → thêm `id` vào `queue`.
   - `resolved: false` (chỉ có `title`) → thêm vào `unresolved` (không tự fetch được), không lặp lại nếu title đã có trong `unresolved`.
8. **Giới hạn an toàn: dừng khi `fetched_count` chạm 30** (tính cả trang gốc user paste + mọi trang tự phát hiện qua children/referenced_pages) — kể cả `queue` còn phần tử. Báo user:
   > Đã fetch 30 trang (giới hạn an toàn, tránh kéo cả space Confluence). Còn **N** trang trong hàng đợi chưa fetch: `<liệt kê title/url còn lại trong queue, tối đa 10 dòng>`. Bạn có muốn tôi tiếp tục fetch thêm không?
   - User đồng ý → tiếp tục thêm 1 đợt tối đa 30 trang nữa từ `queue` hiện có, lặp lại cảnh báo nếu vẫn còn dư.
   - User từ chối → dừng, sang Step A3 tổng kết với những gì đã fetch.

### Step A2b — Trích nội dung sơ đồ draw.io nhúng trong trang (bắt buộc khi `diagrams` không rỗng)

Sơ đồ vẽ bằng tiện ích/macro draw.io trên Confluence **không có một dòng nội dung nào trong body trang** — toàn bộ shape, label, mũi tên nằm trong file đính kèm (mxfile XML, thường bị nén deflate+base64, có khi nhúng trong `.png`/`.svg`). Trước đây các sơ đồ này bị skip hoàn toàn và không vào docs. Nay mỗi sơ đồ phát hiện được đều phải trích:

```bash
# Trích 1 sơ đồ theo tên (dùng luôn extract_command mà confluence_fetch.py trả về)
python3 .claude/skills/autotest-project-docs/scripts/drawio_extract.py \
  --base-url "<base_url>" --page-id <owner_page_id> --name "<diagram_name>"

# Trích mọi sơ đồ draw.io của một trang (bỏ --name)
python3 .claude/skills/autotest-project-docs/scripts/drawio_extract.py \
  --base-url "<base_url>" --page-id <page_id>

# File .drawio/.xml/.png/.svg đã tải về local
python3 .claude/skills/autotest-project-docs/scripts/drawio_extract.py --file <path>
```

Output markdown mỗi sơ đồ gồm **Thành phần** (shape có label, giữ 1 cấp lồng trong swimlane/container) và **Luồng / quan hệ** (`A → B` kèm label trên mũi tên). Dùng `--format json` nếu cần `nodes`/`edges` thô.

Xử lý output:
- **Trích được** → chèn nội dung này vào doc tại đúng vị trí placeholder `**[SƠ ĐỒ ...]**` trong `markdown` của trang (thay placeholder, giữ nguyên thứ tự nội dung), rồi mới classify + lưu ở Step A3. Diễn giải sơ đồ thành câu nghiệp vụ nếu nó mô tả luồng (phù hợp `business-scenario.md`) hoặc kiến trúc (`system-overview.md`/`detail-design.md`) — nhưng **luôn giữ lại cả khối thành phần/luồng gốc** để không mất chi tiết.
- **`error: not_found`** (không thấy attachment nguồn — vd sơ đồ lưu ở trang khác, hoặc chỉ có bản render `.png`) → giữ placeholder, báo user kèm `diagram_name` + link trang, hỏi có muốn export sơ đồ ra `.drawio`/ảnh rồi paste/đưa file để xử lý theo Mode B.
- **`error: missing_credential`** → cùng cách xử lý như Step A1 (user tự điền file credential, không hỏi giá trị trong chat).
- **`error` khác** (không giải được mxfile, attachment chỉ là ảnh thường) → giữ placeholder và báo user; tuyệt đối không âm thầm xoá placeholder để doc trông "đủ".

Ghi nhận trong tổng kết Step A3 rõ: sơ đồ nào đã trích, sơ đồ nào chưa trích được.

### Step A3 — Classify và lưu

Auto-classify dựa trên title + ancestors + content:

| Tín hiệu | Doc type | Lưu vào |
|---|---|---|
| "API", "endpoint", "REST", "Swagger" | `api-reference` | `automation_test/docs/api-reference.md` |
| "tổng quan", "overview", "giới thiệu sản phẩm" | `product-overview` | `automation_test/docs/product-overview.md` |
| "kiến trúc", "architecture" | `system-overview` | `automation_test/docs/system-overview.md` |
| "nghiệp vụ", "luồng", "user story", "kịch bản" | `business-scenario` | `automation_test/docs/features/<feature>/business-scenario.md` |
| "thiết kế kỹ thuật", "technical design", "DB schema" | `detail-design` | `automation_test/docs/features/<feature>/detail-design.md` |

**Nếu ambiguous** → hỏi user classify. **Nếu rõ ràng** → lưu thẳng, thông báo:
> Auto-saved: `<path>` (classified as `<type>`)

Sau khi `queue` rỗng (hoặc dừng theo giới hạn an toàn ở Step A2) → báo tổng kết, **phân biệt rõ nguồn gốc từng trang** để user biết cái gì được tự động kéo thêm:

> **Đã fetch <fetched_count> trang từ Confluence:**
> - Trang bạn paste trực tiếp: `<danh sách title>`
> - Tự phát hiện qua cây trang (children): `<danh sách title>` — nếu không có thì bỏ dòng này
> - Tự phát hiện qua tham chiếu trong nội dung (link/mention): `<danh sách title>` — nếu không có thì bỏ dòng này
> - Phát hiện tham chiếu nhưng KHÔNG tự fetch được (thiếu id, chỉ có tên trang): `<danh sách title từ unresolved>` — nếu quan trọng, paste link cụ thể của trang này để tôi fetch thêm
> - Sơ đồ draw.io đã trích và ghép vào docs: `<diagram_name> (trang: <title>)` — nếu không có thì bỏ dòng này
> - Sơ đồ draw.io phát hiện nhưng CHƯA trích được: `<diagram_name> (trang: <title>, lý do: <error>)` — nếu không có thì bỏ dòng này; nội dung sơ đồ này đang thiếu trong docs, cần user export file hoặc cho link trang chứa sơ đồ
> - File đính kèm phát hiện được (`attachments`, gộp từ mọi trang): `<tên file> (<media_type>, trang: <title>)` — nếu không có thì bỏ dòng này; hỏi user có cần tải/convert file nào trong danh sách không

Tiếp tục Step 3.

---

## Mode B — Từ file hoặc text

### Step B1 — Nhận nội dung

Hỏi:
> Paste nội dung tài liệu vào đây, hoặc cho đường dẫn file (`.md`, `.txt`, `.pdf`, `.docx`):

**Nếu là đường dẫn file:**
```python
import os
path = "<input>"
exists = os.path.isfile(path)
ext = os.path.splitext(path)[1].lower()
```

- `.md` / `.txt` → đọc trực tiếp
- `.pdf` → dùng `pdfminer` hoặc `pypdf2`:
  ```bash
  python3 -m pip install pypdf2 -q
  python3 -c "import PyPDF2; r=PyPDF2.PdfReader('<path>'); print('\n'.join(p.extract_text() for p in r.pages))"
  ```
- `.docx` → dùng `python-docx`:
  ```bash
  python3 -m pip install python-docx -q
  python3 -c "import docx; d=docx.Document('<path>'); print('\n'.join(p.text for p in d.paragraphs))"
  ```

**Nếu là text paste** → dùng trực tiếp.

### Step B2 — Classify và lưu

Phân tích nội dung → auto-classify → lưu vào đúng file trong `automation_test/docs/` (theo bảng phân loại ở Step A3).

Nếu một đoạn text chứa nhiều loại (vd: vừa có tổng quan vừa có API list) → tách thành nhiều file.

Thông báo mỗi file đã lưu. Hỏi:
> Bạn có thêm tài liệu nào khác không? (paste tiếp, hoặc gõ **xong**)

Lặp lại đến khi user gõ "xong" → tiếp tục Step 3.

---

## Mode C — AI tự tạo

### Step C1 — Hỏi 5 câu trong 1 message

> **Tạo domain knowledge cho `<PROJECT_NAME>`**
>
> Trả lời những gì bạn biết — gõ **skip** để bỏ qua:
>
> 1. **Mô tả sản phẩm** — sản phẩm này làm gì, đối tượng người dùng là ai?
> 2. **Base URL** — URL của môi trường test (vd: `https://staging.example.com`)
> 3. **Xác thực** — cách login: username/password? OAuth? API key? Không cần auth?
>    - Nếu có login: endpoint login, tên field username/password trong request, tên field token trong response
>    - **Không gửi username/password/token thật ở đây** — mình sẽ tạo sẵn file `automation_test/.env` để bạn tự điền
> 4. **Tính năng chính** — liệt kê các module/feature chính của project (vd: login, products, cart, checkout)
> 5. **Thông tin bổ sung** — platform (web/android/ios/api), môi trường, bất kỳ context nào thêm

Chờ user trả lời.

### Step C2 — Tạo domain files

Từ câu trả lời → tạo các file:

**`automation_test/docs/global-data.md`**:
```markdown
# Global Data — <PROJECT_NAME>

## Environment
- **Base URL:** `<base_url>`
- **Platform:** <web | android | ios | api>

## Authentication
- **Login endpoint:** `<ep_login>` (hoặc `none` nếu không cần)
- **Username field:** `<field>`
- **Password field:** `<field>`
- **Token field:** `<field>`

## Test Credentials
- Giá trị ở `automation_test/.env` (gitignore) — key: `<API|WEB|APP>_USERNAME`, `<API|WEB|APP>_PASSWORD`
```

Nếu có login → chạy `cred_env.py check --scope project --keys <PREFIX>_USERNAME <PREFIX>_PASSWORD` (tự thêm key nếu thiếu — `autotest-credentials`), rồi chuyển khối `HƯỚNG DẪN` cho user một chiều: mở `automation_test/.env` điền giá trị. Không chặn việc tạo domain docs — chỉ bước chạy test sau này mới cần.

**`automation_test/docs/product-overview.md`** (nếu user cung cấp mô tả):
```markdown
# Product Overview — <PROJECT_NAME>

<tóm tắt từ câu trả lời Q1>

## Tính năng chính
<list từ Q4>
```

---

## Step 3 — Báo kết quả và hướng dẫn bước tiếp

```
✅ Domain knowledge đã sẵn sàng cho project <PROJECT_NAME>

Files đã tạo:
  automation_test/docs/
    global-data.md          ← environment & URL (đã gitignore, không chứa credential)
    product-overview.md     ← (nếu có)
    api-reference.md        ← (nếu có)
    system-overview.md      ← (nếu có)
    features/
      <feature>/
        business-scenario.md  ← (nếu có)
        detail-design.md      ← (nếu có)

Bước tiếp theo:
  /autotest-scenarios <feature>    ← tạo kịch bản kiểm thử
  /autotest-strategy <feature>       ← phân tích & chiến lược
  /autotest-rf-web <feature>              ← automate RF (hoặc /autotest-rf-api / /autotest-rf-android / /autotest-rf-ios)
  /autotest-pw-web <feature>           ← automate Playwright TS (hoặc /autotest-pw-api / /autotest-pw-android)
```

---

## Rules

- **Không ghi đè global-data.md mà không xác nhận.**
- **gitignore `automation_test/docs/global-data.md` ngay khi tạo.**
- **Credential không bao giờ nằm trong `automation_test/docs/`** — token Confluence ở `~/.vds/sdlc-config.env`, tài khoản test ở `automation_test/.env`; không hỏi giá trị credential trong chat (xem `autotest-credentials`).
- **Auto-classify khi đủ tín hiệu** — chỉ hỏi user khi thực sự ambiguous.
- **Mode B hỗ trợ nhiều lần paste** — user có thể truyền từng tài liệu một cho đến khi gõ "xong".
- **Mode A có thể nhận nhiều link** — fetch và classify từng link, không giới hạn số lượng.
- **Mode A tự đệ quy theo cây trang + tham chiếu trong nội dung** — không chỉ fetch đúng link user paste. Mỗi trang fetch về đều tự phát hiện `children` (trang con trong cây Confluence) và `referenced_pages` (link/mention trong nội dung), tự fetch tiếp cho tới khi hết hàng đợi hoặc chạm giới hạn an toàn 30 trang (Step A2). Luôn báo user rõ trang nào tự động kéo thêm, và trang nào phát hiện tham chiếu nhưng không tự fetch được.
- **Đọc TOÀN BỘ nội dung một trang Confluence — không bỏ sót bất kỳ thành phần nào.** Với mỗi trang fetch về, phải xử lý đủ 5 nguồn: `markdown` (text + macro + bảng), `diagrams` (sơ đồ draw.io/Gliffy nhúng), `attachments` (file đính kèm), `children` (trang con), `referenced_pages` (link/mention). Không được coi một trang là "đã đọc xong" khi mới chỉ đọc `markdown`.
- **Sơ đồ draw.io luôn phải được trích, không bao giờ skip** — macro `drawio` không có nội dung trong body trang; nội dung nằm trong attachment mxfile (nén deflate+base64, có thể nhúng trong `.png`/`.svg`). `confluence_fetch.py` đặt placeholder `**[SƠ ĐỒ ...]**` vào `markdown` và liệt kê trong `diagrams`; bắt buộc chạy Step A2b (`drawio_extract.py`) để lấy thành phần + luồng rồi ghép vào doc. Không trích được → giữ placeholder và báo user, **không xoá placeholder** để tránh doc trông đầy đủ nhưng thiếu cả sơ đồ.
- **Bảng Confluence phải vào docs đủ dòng, đúng cột.** `confluence_fetch.py` xử lý `rowspan`/`colspan` theo đúng mô hình bảng HTML (ô gộp được lặp giá trị ra mọi vị trí nó phủ), giữ dòng trống/ô trống, giữ bảng lồng trong ô, escape `|`, và không biến dòng dữ liệu đầu thành header khi bảng không có `<th>`. Khi tổng hợp vào docs: **không gộp lại ô, không xoá dòng trống, không bỏ giá trị lặp**, giữ khối ghi chú ô gộp ngay dưới bảng, và đối chiếu số dòng với bảng gốc trước khi lưu.
- **Mode A không bỏ sót nội dung trong macro Confluence** — `confluence_fetch.py` render đầy đủ nội dung bên trong macro info/note/warning/tip/panel/expand/code (kể cả code block bọc trong CDATA), bảng lồng trong macro, ảnh, link nội bộ, task-list — không còn tình trạng cả khối nội dung biến mất chỉ vì nó nằm trong macro. File đính kèm (`attachments`) luôn được liệt kê kèm `download_url` dù không tự tải nội dung — luôn báo cho user biết file nào tồn tại, đừng âm thầm bỏ qua.
- **Đường dẫn cố định `automation_test/docs/`** — không tạo folder riêng theo tên project; một repo chỉ có một bộ domain docs. File chung ở top-level, file theo feature ở `automation_test/docs/features/<feature>/`.