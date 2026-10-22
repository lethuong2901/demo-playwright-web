---
name: autotest-scenarios
description: Tạo mới hoặc cập nhật kịch bản kiểm thử cho một chức năng hoặc toàn bộ project — từ tài liệu domain knowledge, từ file Excel, hoặc chỉnh sửa file TC đã có.
user-invocable: true
argument-hint: "<yêu cầu bất kỳ>"
disable-model-invocation: true
---

# Test Scenarios Agent

> **Windows:** gọi `python` (hoặc `py -3`) thay cho `python3` — trên Windows `python3` thường trỏ tới bản giả của Microsoft Store. Claude Code trên Windows chạy lệnh qua Git Bash nên `&&`, `mkdir -p`, `/dev/null` vẫn dùng được; người dùng tự gõ trong PowerShell 5.1 thì tách từng lệnh (không `&&`, không `\` nối dòng).

Tạo mới hoặc cập nhật file kịch bản kiểm thử theo **chuẩn KBKTCN công ty** (xem `examples/KBKTCN_VC PAYDAY_Ký và hủy hợp đồng VC Payday_V1.0.md` — file mẫu thật, đối chiếu format với file này khi có nghi ngờ), sẵn sàng dùng với `/autotest-rf-web`, `/autotest-rf-android`, `/autotest-rf-ios`, `/autotest-rf-api` (Robot Framework) và `/autotest-pw-web`, `/autotest-pw-android`, `/autotest-pw-api` (Playwright TypeScript).

> **Ngôn ngữ giao tiếp:** Mọi text hiển thị cho user trong lúc làm việc — tiến trình, câu hỏi, cảnh báo, tóm tắt kết quả — viết bằng **tiếng Việt**. Giữ nguyên thuật ngữ kỹ thuật (TC, Excel, mapping...) không dịch.

> **Commit message:** Chỉ commit khi user yêu cầu (đúng git safety protocol chung). Khi commit, viết message bằng **tiếng Việt** theo format `<type>: <mô tả ngắn gọn>` (feat/fix/refactor/docs/test) — giữ nguyên thuật ngữ kỹ thuật không dịch.

> **Tương thích ngược:** `TC-NNN` (heading `### TC-NNN — <Title>`, zero-padded 3 chữ số) vẫn là ID chuẩn xuyên suốt — `autotest-rf-web/android/ios/api`, `autotest-pw-web/android/api` (tag `@TC-NNN`) và `autotest-strategy` đều dựa vào chuỗi literal này (Tags, argument parsing, delete/discrepancy, TC-XXX pattern). Không đổi sang `TC #N` như mẫu công ty dùng — mọi phần khác của format (D/E/F/G/H/I/Z, Suite/Màn hình, graph_refs) thì theo đúng mẫu.

## Argument Parsing

Nhận **structured argument** hoặc **ngôn ngữ tự nhiên** — không cần đúng format cố định.

```
/autotest-scenarios login                                  # structured — feature cụ thể
/autotest-scenarios viết kịch bản cho chức năng giỏ hàng  # ngôn ngữ tự nhiên
/autotest-scenarios thêm TC cho order                      # ngôn ngữ tự nhiên
/autotest-scenarios                                        # trống → toàn bộ project
```

Parse `$ARGUMENTS`:
- **Trống** → hỏi: "Bạn muốn tạo kịch bản cho chức năng nào? (hoặc mô tả yêu cầu)"
- **Có argument** → trích xuất tên chức năng (`SCOPE`) từ text; nếu mơ hồ → hỏi: "Chức năng nào?"

---

## Step 0 — Kiểm tra TC file đã tồn tại chưa

```python
import glob
hits = glob.glob(f'automation_test/docs/features/**/test-cases.md', recursive=True)
matches = [p for p in hits if SCOPE.lower() in p.lower()] if SCOPE != 'project' else hits
```

**Nếu chưa có TC file** → hỏi user một câu:

> Chưa có kịch bản kiểm thử cho **`<SCOPE>`**. Tạo bằng cách nào?
>
> **1** — AI tự viết từ tài liệu (domain knowledge)
> **2** — Convert từ file Excel có sẵn

- Chọn **1** → **Mode A: AI Generate**
- Chọn **2** → **Mode B: Excel Import**

**Nếu đã có TC file** → hỏi user một câu:

> Đã có kịch bản kiểm thử tại `<path>` (**N TCs**). Bạn muốn làm gì?
>
> **1** — Thêm TC mới vào file hiện có
> **2** — Sửa / cập nhật TC đã có (chỉ định TC-NNN cần sửa)
> **3** — Xoá TC (chỉ định TC-NNN cần xoá)
> **4** — Tạo lại hoàn toàn (xoá và viết mới)

- Chọn **1** → **Mode A: AI Generate** (chỉ thêm, không đụng TC cũ)
- Chọn **2** → **Mode E: Edit TC**
- Chọn **3** → **Mode D: Delete TC**
- Chọn **4** → xoá file cũ, quay lại hỏi nguồn (Mode A hoặc B) — luôn tạo mới 100% theo format chuẩn, không cần bước phát hiện format cũ bên dưới

### Phát hiện format cũ (chỉ áp dụng khi chọn 1 hoặc 2 ở trên)

```python
with open(path, encoding='utf-8') as f:
    content = f.read()
is_new_format = '**D (Trường hợp)**' in content
is_old_format = not is_new_format and ('**Preconditions**' in content or '**Steps**:' in content)
```

Nếu `is_old_format` → hỏi:

> File hiện tại đang ở format cũ (`Category`/`Priority P0-P3`/`Preconditions`/`Steps`...). Bạn có muốn convert toàn bộ file sang format chuẩn KBKTCN mới (D/E/F/G/H/I/Z, Suite/Màn hình) trước khi tiếp tục không?
>
> **1** — Có, convert toàn bộ file rồi mới thêm/sửa TC
> **2** — Không, giữ nguyên TC cũ — chỉ TC mới/TC vừa sửa dùng format mới (file sẽ lẫn 2 format)

- Chọn **1** → đọc toàn bộ TC cũ, re-render mỗi TC sang format mới (giữ nguyên nội dung — Title/Steps/Expected Results/Category/Priority/Severity — chỉ đổi label/field và bổ sung Suite/Màn hình theo phán đoán từ nội dung TC nếu rõ ràng, hỏi lại nếu không rõ TC nào thuộc màn hình/Suite nào), rồi tiếp tục Mode A/E bình thường trên file đã convert.
- Chọn **2** → bỏ qua, tiếp tục Mode A/E — TC mới dùng format mới, TC cũ giữ nguyên. Ghi rõ điều này trong thông báo kết quả cuối (Step A4/Mode E).

---

## Mode A — AI tự viết từ tài liệu

### Step A0 — Thông tin tài liệu KBKTCN (chỉ khi tạo file mới)

Bỏ qua bước này nếu đang **thêm TC vào file đã tồn tại** (header giữ nguyên từ lần tạo đầu, chỉ cập nhật lại **Tổng TC** ở Step A3/A4).

Tự suy ra tối đa, chỉ hỏi phần không suy ra được:
- **Người lập** ← `git config user.name`; không có → phần trước `@` trong `git config user.email` hoặc email biết được.
- **Ngày lập** ← hôm nay.
- **Loại chức năng** (`APP` | `WEB` | `API`) ← suy từ `automation_test/docs/global-data.md` / `system-overview.md`: có nhắc "device caps"/APK/IPA/Android/iOS → `APP`; chỉ có Base URL web, không nhắc app → `WEB`; chỉ liệt kê endpoint, không có UI/URL màn hình → `API`. Không suy được → hỏi.
- **Tổng TC** ← tự đếm sau khi hoàn tất Step A2, điền lúc ghi file.
- **Nguồn SRS** ← tìm link Confluence trong `global-data.md` (mục `## Confluence`) hoặc trong `business-scenario.md`/`detail-design.md`; không tìm thấy → để `(chưa xác định nguồn)`, không chặn tiến độ vì đây là metadata, không phải nội dung TC.

Chỉ hỏi 1 câu duy nhất, gộp mọi phần không suy ra được (thường chỉ còn **Mã tài liệu**, đôi khi thêm **Loại chức năng**):

> Tạo file kịch bản mới cho `<feature>` theo chuẩn KBKTCN — cần thêm:
> 1. **Mã tài liệu** (vd: `KBKTCN_<PROJECT>_<TenChucNang>_V1.0`)
> [chỉ hỏi nếu không suy ra được] 2. **Loại chức năng**: APP / WEB / API?
> 3. *(tuỳ chọn)* **File TC tham chiếu** để đối chiếu độ phủ (vd bộ KBKT Excel/md chuẩn của team khác cho cùng chức năng) — bỏ trống nếu không có

Lưu các giá trị, dùng dựng header khi ghi file ở Step A3. File tham chiếu (nếu có) lưu thành `REF_FILE` — chỉ dùng ở Step A2.6 để đối chiếu độ phủ, **không** phải nguồn nghiệp vụ: không copy TC từ đó sang, không dùng làm **Source**. `REF_FILE` là `.xlsx` → parse bằng `python3 .claude/skills/autotest-scenarios/scripts/tc_import.py "<REF_FILE>"` (JSON) trước khi đưa cho subagent. Khi thêm TC vào file đã có (bỏ qua Step A0), chỉ dùng `REF_FILE` nếu user nêu sẵn trong `$ARGUMENTS` — không hỏi thêm.

Header:

```
# KBKTCN — <PROJECT>_<Feature title> (V1.0)

- **Mã tài liệu**: <mã tài liệu>
- **Người lập**: <người lập>
- **Ngày lập**: <ngày lập>
- **Loại chức năng**: <APP | WEB | API>
- **Tổng TC**: <N>
- **Nguồn SRS**: <link hoặc "(chưa xác định nguồn)">

---
```

### Step A1 — Kiểm tra domain knowledge

```bash
python3 -c "
import glob
common = ['global-data.md', 'product-overview.md', 'api-reference.md', 'system-overview.md']
hits = [f'automation_test/docs/{f}' for f in common if glob.glob(f'automation_test/docs/{f}')] + glob.glob('automation_test/docs/features/**/*.md', recursive=True)
print('\n'.join(hits) or 'NONE')
"
```

**Nếu có docs** → đọc tất cả file liên quan đến `<feature>` (hoặc toàn bộ nếu không có feature):
- `business-scenario.md` — user flows, màn hình, business rules
- `detail-design.md` — API contracts, DB schema, constraints kỹ thuật
- `global-data.md` — URL, môi trường
- `product-overview.md` — mô tả sản phẩm tổng quan
- `api-reference.md` — danh sách endpoints (API project)

**File tồn tại nhưng trống/không có nội dung thực chất cho `<feature>`** (file rỗng, chỉ có tiêu đề, hoặc toàn bộ nội dung không liên quan gì đến feature đang xét) → coi như **không có docs**, xử lý y hệt nhánh bên dưới. Không suy đoán hay tự dựng nghiệp vụ từ tên feature để bù vào chỗ trống.

**Nếu không có docs** → hỏi user:

> Chưa tìm thấy tài liệu domain knowledge.
>
> Bạn có thể:
> 1. Paste nội dung tài liệu trực tiếp vào đây
> 2. Cung cấp link Confluence để tôi tự fetch (chạy `/autotest-project-docs <project>` trước)
> 3. Trả lời vài câu hỏi để tôi tạo domain knowledge cơ bản

Xử lý theo lựa chọn của user.

**Đọc bài học tích luỹ** — nếu `automation_test/docs/scenario-learnings.md` tồn tại, đọc toàn bộ trước khi sang Step A1.5. Đây là các bài học rút ra từ những lần user chỉnh sửa scenarios trước đó (xem mục "Scenario Learnings" ở cuối file) — áp dụng khi thiết kế TC ở Step A2 để không lặp lại lỗi cũ.

Sau đó tiếp tục Step A1.5.

### Step A1.5 — Đối chiếu tài liệu (consistency check)

Trước khi thiết kế TC, đối chiếu `business-scenario.md` (nghiệp vụ) với `detail-design.md` (kỹ thuật) — nếu cả hai đều tồn tại cho feature này:

- **Orphan** — business rule/flow nói trong business-scenario.md nhưng không có API/field/constraint tương ứng trong detail-design.md (hoặc ngược lại).
- **Conflict** — cùng 1 field/rule nhưng hai tài liệu mô tả khác nhau (vd maxlength, enum values, error code khác nhau).
- **Missing relationship** — một bước trong flow không rõ gọi API nào / field nào chịu trách nhiệm.
- **Logic Issues** — mâu thuẫn logic nội tại ngay trong 1 tài liệu (vd min > max, required=true nhưng enum liệt kê rỗng).
- **Completeness Gaps** — field/API/error thiếu metadata bắt buộc để viết TC (field không nêu kiểu dữ liệu, API không nêu method/path, error code không có message/điều kiện trigger).

Quét **toàn bộ** cả 2 tài liệu trước (không dừng ở phát hiện đầu tiên). Nếu có từ 1 điểm trở lên ảnh hưởng đến việc viết TC (không phải lỗi chính tả nhỏ) → DỪNG một lần duy nhất, gộp hết các điểm phát hiện được vào 1 câu hỏi:

> Phát hiện **N điểm** mâu thuẫn/thiếu nhất quán giữa tài liệu khi chuẩn bị viết TC cho `<feature>`:
>
> **1. <mô tả điểm 1: field/rule nào, hai tài liệu nói gì>**
> **2. <mô tả điểm 2>**
> ...
>
> Với mỗi điểm, xử lý thế nào? (trả lời theo format `<số điểm>: <số lựa chọn>`, vd `1: 1`, `2: 3`)
> 1. `business-scenario.md` là nguồn chính, bỏ qua phần liên quan trong detail-design.md
> 2. `detail-design.md` là nguồn chính, bỏ qua phần liên quan trong business-scenario.md
> 3. Tôi sẽ sửa lại tài liệu — dừng ở đây, chờ tôi cập nhật rồi chạy lại
> 4. Bỏ qua, không viết TC cho phần này

Ghi nhớ quyết định của user cho từng điểm thành 1 **decision log** giữ suốt phiên làm việc (điểm nào, user chọn gì). Trước khi viết bất kỳ TC nào ở Step A2 liên quan tới field/flow đã có quyết định, rà lại decision log để áp dụng nhất quán — không quay lại dùng thông tin đã bị user bác bỏ.

Ngay sau khi user trả lời, ghi toàn bộ N điểm vừa hỏi (kèm lựa chọn user chọn) vào **Doc Gaps Log**, mỗi điểm được gán 1 mã **AMB-NN** — xem mục "Doc Gaps Log" cuối file. TC nào bị ảnh hưởng bởi điểm đó thì ghi `AMB-NN resolved: <tóm tắt quyết định>` vào field **Z (Notes)** của TC đó ở Step A2 (đúng cách mẫu công ty dùng — vd "AMB-01 resolved: checkbox default = CHECKED"). Sau đó tiếp tục Step A2.

### Step A2 — Tạo kịch bản theo 6 góc nhìn

Áp dụng đủ 6 lenses cho mỗi feature (hoặc toàn project nếu không chỉ định):

| Lens | Câu hỏi |
|---|---|
| Happy Path | Luồng thành công bình thường là gì? |
| Business Rules | Quy tắc nghiệp vụ nào cần kiểm tra? |
| Security | Người dùng trái phép có thể làm gì? |
| Negative / Error | Dữ liệu sai, trạng thái sai xảy ra thế nào? |
| Edge Cases | Giá trị biên, giới hạn, trường hợp ngoại lệ? |
| UI State | Hiển thị có điều kiện, loading, empty state? |

**Coverage Matrix — liệt kê đầy đủ trước khi viết TC nào (đảm bảo không sót trường hợp):**

Trước khi thiết kế TC, quét toàn bộ tài liệu đã đọc và liệt kê ra 1 bảng nháp (giữ trong phiên làm việc, không lưu vào file) mọi phần tử cần test — không viết TC trực tiếp từ trí nhớ/cảm giác "đã đủ":

| Loại phần tử | Liệt kê từ đâu | Ví dụ 1 dòng |
|---|---|---|
| Field có ràng buộc | Mỗi field trong detail-design.md có kiểu dữ liệu/min/max/length/enum/required | `so_tien_vay: number, min=1.000.000, max=50.000.000, required` |
| Business rule | Mỗi rule nêu trong business-scenario.md/detail-design.md (kể cả rule kết hợp nhiều điều kiện) | "KH dưới 18 tuổi không được vay" |
| API endpoint + response/error code | Mỗi dòng trong api-reference.md — từng response code và error code liệt kê riêng cho endpoint đó | `POST /loan/apply → 200, 400 INVALID_AMOUNT, 403 UNDERAGE` |
| Status & transition | Mỗi trạng thái + mọi chuyển đổi hợp lệ/bị cấm nêu trong tài liệu | `pending_esigning → cert_success → disbursed`; cấm `pending → disbursed` (bỏ qua cert) |
| Control màn hình | Mỗi control (button/checkbox/field/tab) nêu trong business-scenario.md, cùng điều kiện enable/disable/hiển thị | `checkbox đồng ý: default checked, required để enable nút Ký` |
| Thuộc tính hành vi của control | **Mỗi mệnh đề hành vi** trong cột Mô tả/Ghi chú/Validate của control — 1 mệnh đề = 1 dòng riêng, không gộp theo control | combobox `Loại nguồn` → 3 dòng: `multi-select`, `tìm kiếm nhanh (type-ahead)`, `sort alphabet`; textbox `code` → 2 dòng: `tự động trim đầu-cuối`, `chặn khi vượt maxlength` |
| Alternate/exception flow | Mỗi nhánh phụ trong flow chính (timeout, retry, huỷ giữa chừng...) — **liệt kê riêng theo từng flow** (nhánh lỗi của flow Thêm mới và của flow Chỉnh sửa là 2 dòng khác nhau dù cùng mã lỗi) | "OTP sai quá 3 lần → khoá 5 phút"; "Thêm mới — server lỗi/timeout → popup lỗi, giữ dữ liệu đã nhập" |
| Danh sách liệt kê trong tài liệu | Mỗi danh sách cụ thể tài liệu nêu (bảng ràng buộc, enum, giá trị cho phép...) — ghi đủ từng phần tử, không ghi số lượng | `ràng buộc xoá: mapping_data.code, mapping_column.code, statistic_export_reconcile.bank_code (list phân tách dấu phẩy), ...` |

**Độ mịn của matrix:** thuộc tính chỉ áp dụng đúng field mà tài liệu nêu — không suy rộng sang field khác (vd tài liệu ghi "tự động trim" cho `code` và `group_code` nhưng không ghi cho `name` → không có dòng trim cho `name`). Thuộc tính lặp ở nhiều màn hình (vd combobox `type` ở cả Danh sách và Thêm mới đều "tìm kiếm nhanh") → mỗi màn hình 1 dòng.

**Danh sách liệt kê → TC phải nêu tên cụ thể:** khi tài liệu liệt kê danh sách phần tử, TC liên quan (D/E/G/Business Rule) phải nêu đủ tên các phần tử — hoặc tách thành nhiều TC, hoặc dùng **E (Data test)** dạng data-driven mỗi phần tử 1 dòng — không viết chung chung "15 bảng ràng buộc". Đếm lại chính xác số phần tử khi ghi (phân biệt số bảng và số cột nếu 1 bảng có nhiều cột). Phần tử có định dạng đặc biệt (vd cột lưu danh sách mã phân tách dấu phẩy) → thêm TC Error Guessing cho trường hợp khớp một phần (vd mã `HP01` và danh sách `HP011,XX` không được coi là tồn tại ràng buộc).

Sau khi liệt kê xong, với **mỗi dòng** áp đúng kỹ thuật tương ứng bên dưới để sinh TC (field ràng buộc → EP+BVA; business rule nhiều điều kiện → DT; ≥3 field độc lập → PW; status → ST; API error code → 1 TC/code; control UI → UI State lens; thuộc tính hành vi của control → 1 TC/thuộc tính, không gộp nhiều thuộc tính vào G của 1 TC; alternate flow → UCT, mỗi flow riêng; danh sách liệt kê → nêu đủ phần tử). Sau khi viết xong TC ở phần dưới Step A2, **quay lại bảng này** và đánh dấu TC-NNN tương ứng cạnh từng dòng — dòng nào chưa có TC nào map tới là **case bị sót**, phải bổ sung trước khi sang Step A2.5. Đây là cơ chế chính đảm bảo "đầy đủ, không sót trường hợp" — checklist ở Step A2.5 chỉ rà chất lượng TC đã viết, không tự phát hiện được case còn thiếu nếu không đối chiếu ngược lại bảng này.

**Kỹ thuật thiết kế bổ sung** (áp khi điền Negative / Edge Cases / Business Rules, không thay thế 6 lens mà làm dày thêm coverage):
- **Equivalence Partitioning (EP)** — mỗi field có ràng buộc (kiểu dữ liệu, enum, bắt buộc/không) → ít nhất 1 TC valid class + 1 TC invalid class.
- **Boundary Value Analysis (BVA)** — mỗi field có giới hạn số/độ dài (min/max/length) → liệt kê đủ 4 case biên: `min-1`, `min`, `max`, `max+1` (không chỉ 1-2 case đại diện).
- **Use Case / Flow Testing (UCT)** — mỗi flow có nhánh phụ (alternate/exception flow nêu trong business-scenario.md) → ít nhất 1 TC cho nhánh chính, 1 TC cho mỗi nhánh phụ quan trọng.
- **Decision Table (DT)** — rule kết hợp nhiều điều kiện (AND/OR, vd "nếu loại KH = X và số tiền > Y thì...") → sinh TC cho các tổ hợp điều kiện có ý nghĩa nghiệp vụ, không chỉ test từng điều kiện riêng lẻ.
- **Pairwise (PW)** — ≥3 field độc lập, không có quan hệ nhân-quả (khác DT), mỗi field nhiều giá trị hợp lệ → sinh TC theo cặp giá trị (mọi cặp giữa 2 field bất kỳ xuất hiện ít nhất 1 lần), không cần test full combination.
- **State Transition (ST)** — entity có vòng đời trạng thái (vd đơn vay: `pending → approved → disbursed → overdue → closed`) → 1 TC cho mỗi transition hợp lệ, 1 TC cho mỗi transition bị cấm (vd `closed → disbursed`).
- **Error Guessing (EG)** — danh mục lỗi kinh nghiệm không nằm sẵn trong tài liệu: input null/rỗng bất ngờ, ký tự đặc biệt/Unicode, race condition khi thao tác đồng thời → thêm 1-2 TC cho field/flow rủi ro cao (xem bảng risk bên dưới).

**Ví dụ áp dụng từng kỹ thuật** (minh hoạ nhanh để bám theo — không phải TC thật, không copy nguyên văn cho feature khác):

- **EP + BVA** — field `so_tien_vay` (number, min=1.000.000, max=50.000.000, required):
  - EP: 1 TC giá trị hợp lệ giữa khoảng (vd 10.000.000 — Happy Path), 1 TC để trống (Negative, required), 1 TC nhập chữ thay vì số (Negative, sai kiểu dữ liệu).
  - BVA: đủ 4 TC biên (Edge Case/Negative tuỳ kết quả) — `999.999` (invalid, min-1), `1.000.000` (valid, min), `50.000.000` (valid, max), `50.000.001` (invalid, max+1).
- **DT (Decision Table)** — rule "duyệt vay nếu (loại KH=VIP HOẶC số tiền≤20tr) VÀ điểm tín dụng≥600": không test rời từng điều kiện, sinh TC theo tổ hợp có ý nghĩa nghiệp vụ — (VIP, tiền cao, điểm cao)→duyệt; (thường, tiền thấp, điểm cao)→duyệt; (thường, tiền cao, điểm cao)→từ chối; (VIP, tiền thấp, điểm thấp)→từ chối.
- **Pairwise (PW)** — 3 field độc lập `loại_KH` (VIP/thường/mới) × `kênh_đăng_ký` (app/web/CTV) × `loại_sản_phẩm` (A/B/C): sinh bộ TC sao cho mọi cặp giá trị giữa 2 field bất kỳ xuất hiện ≥1 lần (không cần đủ 3×3×3=27 tổ hợp — dùng công cụ pairwise trong đầu hoặc liệt kê tay cho ≤3 field).
- **State Transition (ST)** — khoản vay: `pending_esigning → cert_success → disbursed` (transition hợp lệ, 1 TC/mũi tên); `pending_esigning → cancelled` (KH huỷ, hợp lệ); thử gọi thẳng API set `disbursed` khi đang `pending_esigning` (chưa qua `cert_success`) → phải bị chặn (1 TC transition bị cấm).
- **Error Guessing (EG)** — field text tự do: input toàn khoảng trắng, input Unicode tổ hợp (tiếng Việt có dấu + emoji), paste chuỗi rất dài (vượt UI hiển thị dù field không giới hạn length trong tài liệu). Chỉ dùng cho input bất thường mà tài liệu không cần liệt kê hết — nếu tài liệu đã nêu rõ rule/limit thì đó là EP/BVA, không phải EG.
- **UCT (Use Case/Flow)** — business-scenario.md nêu "OTP sai quá 3 lần → khoá 5 phút" là 1 alternate flow của flow xác thực OTP → viết TC riêng cho nhánh này (khác TC happy path nhập đúng OTP lần đầu), không gộp chung.

**Checklist mở rộng theo đặc điểm feature** (áp dụng có điều kiện — chỉ khi feature có đặc điểm tương ứng):

| Đặc điểm feature | Case bắt buộc thêm |
|---|---|
| ≥2 field liên quan nhau (min<max, dropdown cha-con, field bắt buộc có điều kiện) | Cross-field: tổ hợp giá trị hợp lệ/không hợp lệ giữa các field, dropdown con reset khi đổi cha, tổng field con khớp field tổng |
| Màn hình tìm kiếm có ≥2 điều kiện lọc | Tổ hợp: 1 TC nhập đồng thời các điều kiện → kết quả thoả **tất cả** điều kiện (AND), ngoài các TC lọc riêng lẻ từng điều kiện |
| Filter/combobox multi-select | 1 TC chọn ≥2 giá trị cùng lúc → kết quả gồm bản ghi thuộc **bất kỳ** giá trị đã chọn (OR); 1 TC bỏ chọn về mặc định |
| Combobox có tìm kiếm nhanh (type-ahead) | 1 TC gõ ký tự → danh sách option lọc đúng theo ký tự gõ; 1 TC gõ ký tự không khớp option nào |
| Flow Sửa/Xoá bản ghi (CRUD) và tài liệu có mã lỗi "không tìm thấy dữ liệu" | Concurrency qua UI: mở form Sửa (hoặc popup Xoá) ở tab 1, xoá bản ghi đó ở tab 2, quay lại tab 1 bấm Lưu/Xoá → hiển thị lỗi "không tìm thấy" (không chỉ test ở API bằng id giả) |
| Form Chỉnh sửa | Lưu khi không thay đổi field nào; field bị khoá không sửa được; validate negative của form (bỏ trống field bắt buộc, vượt maxlength...) có **ít nhất 1 TC reject riêng cho form Chỉnh sửa** — không mặc định "đã test ở Thêm mới". Tài liệu không nêu kết quả mong muốn (vd Lưu khi không đổi gì) → áp dụng Never Assume |
| Flow ghi dữ liệu tiền/số dư/giao dịch | Concurrency: double-submit không tạo trùng bản ghi; 2 request đồng thời trên cùng tài nguyên (vd cùng tài khoản) xử lý đúng, không overdraft. **Kết quả mong muốn phải nêu rõ trạng thái nghiệp vụ/dữ liệu sau hành động** (vd "trạng thái đơn chuyển thành DISBURSED", "số dư giảm đúng số tiền"), không chỉ thông báo hiển thị trên UI |
| Flow nhiều bước ghi DB | Rollback: fail giữa chừng → dữ liệu về đúng trạng thái trước giao dịch, không có record mồ côi |
| Có role/phân quyền | Permission matrix: mỗi cặp (role × action) — có quyền → thành công, không có quyền → bị chặn, đổi role → quyền cập nhật đúng |
| Màn hình danh sách/pagination | List rỗng, 1 item, đúng page size, vượt page size, trang cuối, page number invalid |
| Field text/date/currency | Tiếng Việt có dấu (search/sort/filter), format tiền tệ (dấu chấm ngăn nghìn, "đ"/VND), ký tự Unicode/emoji |

**Test pyramid — tránh trùng case biên qua nhiều layer**: nếu feature có cả TC lớp API và lớp App/Web (vd domain docs có cả `api-reference.md` và luồng UI trong `business-scenario.md`) cho cùng 1 rule/boundary, test **đủ toàn bộ biên/tổ hợp tại lớp API** (rẻ, nhanh, xác định); lớp App/Web chỉ cần 1 TC happy + 1 TC reject để chứng minh UI hiển thị đúng — không lặp lại toàn bộ case biên ở UI. Phạm vi áp dụng:
- **"1 happy + 1 reject" tính theo từng flow/màn hình**, không tính 1 lần cho cả file — cùng rule (vd trùng `code`) xuất hiện ở cả flow Thêm mới và flow Chỉnh sửa → mỗi flow có TC reject UI riêng.
- **Pyramid chỉ dùng để giảm trùng case biên/tổ hợp giá trị — không dùng để bỏ nhánh flow ở UI.** Nhánh nào của flow mà `business-scenario.md` mô tả hành vi hiển thị (popup/toast lỗi, giữ nguyên dữ liệu đã nhập, quay về màn hình nào) → **bắt buộc có TC lớp UI**, kể cả khi đã có TC tương đương ở lớp API — TC API không verify được hành vi hiển thị. Áp dụng cho **mọi** flow có nhánh đó (vd nhánh "server lỗi/timeout" có ở cả 4 flow Tra cứu/Thêm/Sửa/Xoá → 4 TC UI).
- **Ngược lại, rule về dữ liệu (sort, filter, nhánh "thành công nhưng 0 kết quả") assert tại lớp API** — TC API happy path phải kiểm tra rule tài liệu nêu (vd thứ tự `modified_date desc`), không chỉ sự tồn tại của field; mỗi nhánh kết quả của flow có response khác biệt (vd `totalElements = 0` do điều kiện lọc không khớp — khác cơ chế với `page` vượt tổng số trang) → 1 TC API riêng.

**Priority & Severity theo risk** — với mỗi TC, ước lượng Likelihood (1–3: hiếm khi / thỉnh thoảng / thường xuyên xảy ra) và Impact nếu bug xảy ra (1–3: nhỏ / trung bình / nghiêm trọng — mất tiền, sai số dư, lộ dữ liệu). `risk = Likelihood × Impact`: 6–9 → **H/I = HIGH / CRITICAL**; 3–5 → **MEDIUM / MAJOR**; 1–2 → **LOW / MINOR**. Severity đo mức độ hậu quả nếu fail, độc lập với Priority (1 edge case hiếm gặp vẫn có thể Severity CRITICAL nếu liên quan tiền/bảo mật).

> **Category của TC sinh từ EP/BVA theo kết quả mong đợi, không theo nguồn gốc rule** — giá trị hợp lệ (kể cả tại biên) mà hệ thống chấp nhận → **Business Rule** hoặc **Edge Case** tuỳ mức độ biên; giá trị không hợp lệ mà hệ thống từ chối/báo lỗi → luôn là **Negative**, dù rule đó nằm ở đâu trong tài liệu.

**Never Assume — block khi tài liệu thiếu thông tin:** nếu cần giá trị/quy tắc cụ thể cho 1 field, status, hay error code nhưng tài liệu không nêu rõ (vd không nói maxlength, không liệt kê hết mã lỗi) → DỪNG ngay tại đó, hỏi user:

> Tài liệu không nêu rõ **<field/behavior cụ thể>** cho `<feature>`. Bạn cung cấp giá trị/quy tắc, hay bỏ qua TC này?

Ngay sau khi user trả lời (dù là cung cấp giá trị hay chọn bỏ qua TC), ghi 1 entry (mã **AMB-NN**) vào **Doc Gaps Log** (xem mục cuối file) — kể cả khi user tự cung cấp giá trị, vì đó vẫn là 1 chỗ tài liệu gốc thiếu thông tin cần BA/dev bổ sung sau này. Nếu TC liên quan đã/đang được viết → ghi `AMB-NN resolved: <tóm tắt>` vào **Z (Notes)** của TC đó.

**Never Assume — tài liệu trống hoàn toàn:** nếu phát hiện giữa chừng khi viết TC rằng cả `business-scenario.md` lẫn `detail-design.md` (hoặc phần liên quan đến `<feature>`) không có nội dung thực chất nào — không phải thiếu 1 field/mã lỗi lẻ tẻ mà toàn bộ trang trống/không liên quan — DỪNG hoàn toàn việc sinh TC cho phần đó, không tự dựng cả kịch bản từ suy đoán tên feature. Quay lại xử lý như Step A1 nhánh "không có docs" (hỏi A/B/C), không hỏi từng field một. Ghi 1 entry vào Doc Gaps Log trước khi quay lại Step A1 (loại "Completeness Gap — toàn bộ tài liệu trống").

Không tự suy đoán rồi ghi chú giả định — luôn hỏi trước khi viết TC dựa trên thông tin đó.

**Dữ liệu test phải cụ thể** — cấm mô tả chung chung kiểu "giá trị không hợp lệ", "dữ liệu sai định dạng". `D`/`E`/`F` phải nêu giá trị thật, lấy đúng field/kiểu dữ liệu của feature đang viết (vd field email → `email = "abc@"`, field số nguyên có ràng buộc ≥ 0 → giá trị `-1`).

**Tổ chức file theo chuẩn KBKTCN** (thay cho numbering theo dải category của bản trước):

TC-NNN đánh số **liên tục toàn file**, không restart theo Suite/section. Nhóm theo 2 Suite:

- **`# Suite: Giao diện`** — mọi TC gắn với 1 màn hình/popup cụ thể, bất kể lens (kể cả lỗi/negative hay business rule nếu thể hiện qua thay đổi UI — enable/disable button, hiển thị/ẩn field, popup lỗi hiện ngay trên màn hình đó). Nhóm theo `## Màn hình <n> - <tên>`, `## Popup <tên>`, hoặc `## Popup phụ trợ`.
- **`# Suite: Chức năng`** — TC về business rule/status transition/flow không gắn 1 màn hình cụ thể (điều kiện trước khi vào flow, quy tắc kết hợp nhiều điều kiện, chuyển trạng thái entity, timeout/retry, rollback...). Nhóm theo `## <Tên nhóm chức năng>` mô tả ngắn gọn nghiệp vụ đang test (vd "Kiểm tra điều kiện trước ký", "Kiểm tra hủy hợp đồng").

Feature không có UI (API-only) → chỉ có Suite Chức năng, nhóm theo nhóm endpoint/business capability, bỏ Suite Giao diện.

6 lens ở trên vẫn quyết định **TC cần viết gì**; Suite/section chỉ quyết định **TC đó trình bày ở đâu trong file** (TC gắn 1 màn hình cụ thể → Giao diện dù lens là Negative/Business Rule; TC về rule/flow không gắn màn hình → Chức năng). Field **Category** vẫn ghi trên mỗi TC (xem format bên dưới) để `/autotest-strategy` group theo lens khi phân tích chiến lược — chỉ không còn dùng để quyết định số TC.

**Anchor TC mỗi màn hình** — TC đầu tiên của mỗi section `## Màn hình <n> - <tên>` phải là 1 TC mô tả tổng quan layout mặc định (đủ thành phần hiển thị) trước các TC theo trạng thái/scenario cụ thể; nên đánh dấu `(anchor)` ở cuối title, giống mẫu công ty (vd "Kiểm tra hiển thị Popup Cảnh giác chiêu thức lừa đảo (anchor)").

**graph_refs — registry nhất quán trong phiên chạy**: mỗi khi gặp 1 thực thể (màn hình, field, validation rule, flow step, business rule, status, activity flow) lần đầu khi đọc tài liệu, đặt 1 slug snake_case ngắn gọn (vd màn hình "Hợp đồng của bạn" → `mh01_xem_hop_dong_truoc_ky`) và lưu vào 1 registry giữ suốt phiên (giống decision log ở Step A1.5) — dùng lại đúng slug đó cho mọi TC khác nhắc tới cùng thực thể, không đặt slug mới mỗi lần. Loại tag:
- `ui_screen:<slug>` — màn hình/popup
- `field:<slug>` — 1 field/control cụ thể
- `validation_rule:<slug>` — rule validate 1 field/form
- `business_rule:<slug>` — quy tắc nghiệp vụ (không phải validate field đơn lẻ)
- `flow_step:<n>_<slug>` — 1 bước trong flow nếu tài liệu đánh số bước
- `status:<slug>` — trạng thái entity (vd trạng thái khoản vay)
- `activity_flow:<slug>` — tên luồng tổng (vd toàn bộ flow ký hợp đồng)

Mỗi TC ghi graph_refs là danh sách tag liên quan trực tiếp tới TC đó (không liệt kê tag không liên quan). Không có thực thể rõ ràng để tag (TC quá chung chung) → để trống graph_refs, không ép tag gượng gạo.

Format mỗi TC:
```
### TC-NNN — <Title>

**Category**: <Happy Path | Business Rule | Security | Negative | Edge Case | UI State>

**D (Trường hợp)**: TH: <mô tả tình huống/điều kiện — câu văn tự đủ nghĩa, không giả định "sau khi chạy TC-00X">

**E (Data test)**: (chỉ thêm khi TC có data cụ thể dạng key=value, sinh từ EP/BVA/DT/PW)
```
<key1>=<value1>
<key2>=<value2>
```

**F (Các bước)**:
1. <hành động 1>
2. <hành động 2>

**G (Kết quả mong muốn)**:
1. <kết quả bước 1>
2. <kết quả bước 2>

**H/I**: <HIGH|MEDIUM|LOW> / <CRITICAL|MAJOR|MINOR>

**Business Rule**: <rule cụ thể trích/diễn giải từ tài liệu>
**Source**: <file + mục/section cụ thể trong business-scenario.md hoặc detail-design.md làm căn cứ>

**Z (Notes)**: (chỉ thêm khi có giả định/ghi chú/tham chiếu AMB-NN — vd "AMB-01 resolved: ...")

**graph_refs**: `<tag1>, <tag2>, ...`
```

> Mỗi TC phải truy nguyên được về 1 rule/behavior/field cụ thể trong tài liệu, ghi rõ ở **Source**. Không tự bịa field, API, error code, hay status không có trong tài liệu đã đọc.

**Trước khi chốt mỗi TC** (tự kiểm, không cần hỏi user): TC này có đang test đúng 1 điều kiện/field/flow duy nhất không (không gộp nhiều case vào 1 TC)? D/F/G đã cụ thể chưa? Nếu câu trả lời đang là suy đoán (không có trong tài liệu, không có trong decision log) → áp dụng Never Assume, dừng hỏi user thay vì viết tiếp.

### Step A2.5 — Review nhanh trước khi lưu

Trước khi sang Step A3, tự rà lại toàn bộ TC vừa dựng theo checklist (âm thầm tự sửa, không cần hỏi user cho bước này — trừ trường hợp phát hiện thiếu thông tin thì áp dụng rule Never Assume ở Step A2):

**Khi thêm TC vào file đã có sẵn** (Step 0 chọn "Thêm TC mới vào file hiện có"): checklist dưới đây phải đối chiếu **cả TC mới lẫn TC đã lưu từ trước** (vd kiểm tra trùng rule/trùng test data giữa TC mới và TC cũ, màn hình đã có TC anchor chưa). Nhưng chỉ **tự sửa âm thầm các TC mới viết trong lượt chạy này**; nếu vấn đề nằm ở 1 TC **đã lưu từ trước** (không phải TC đang viết ở lượt này) → không tự sửa, liệt kê vấn đề cụ thể và hỏi user xác nhận trước khi đổi (cùng nguyên tắc với Mode B Step B4.5) — vì TC cũ có thể đã được dùng để automate, tự sửa mà không hỏi dễ làm lệch hoặc gãy test đã build.

- [ ] **Coverage Matrix** (lập ở đầu Step A2) — mọi dòng đã có ít nhất 1 TC-NNN map tới; dòng nào chưa có TC → bổ sung ngay, không chuyển sang Step A3 khi còn dòng trống.
- [ ] Mỗi TC có **Source** trỏ đúng về tài liệu đã đọc; không có field/API/error code nào không tồn tại trong docs.
- [ ] Business flow (từ business-scenario.md): có TC main success + ít nhất 1 TC mỗi nhánh phụ (alternate/exception) đã nêu trong tài liệu — **đếm riêng cho từng flow**; nhánh có mô tả hành vi hiển thị trên UI phải có TC lớp UI (TC API tương đương không thay thế được — xem Test pyramid).
- [ ] **Đối xứng UI ↔ API theo từng flow**: với mỗi flow, lập nhanh bảng nhánh (thành công / từng mã lỗi / timeout) × lớp (UI / API) — ô nào tài liệu có hành vi quan sát được ở lớp đó mà chưa có TC → bổ sung. Đặc biệt kiểm tra form Chỉnh sửa có TC reject riêng (không chỉ anchor + happy + Hủy).
- [ ] Mỗi **thuộc tính hành vi** của control (multi-select, tìm kiếm nhanh, sort, trim...) có TC riêng — không nằm gộp trong G của 1 TC tổng quát.
- [ ] TC tham chiếu danh sách liệt kê trong tài liệu (bảng ràng buộc, enum...) nêu đủ tên phần tử và số lượng đếm đúng — không viết "N bảng" chung chung.
- [ ] Integration flow (gọi API/hệ thống ngoài, từ detail-design.md): có TC happy path + lỗi mỗi actor liên quan + timeout/retry nếu tài liệu có nêu.
- [ ] Feature loại API: mỗi endpoint trong `api-reference.md` có TC cho từng response/error code tài liệu liệt kê riêng cho endpoint đó, không chỉ happy path. **Đây là bước đối chiếu các TC đã viết ở trên — không tạo thêm 1 TC riêng chỉ để "note" đã cover đủ** (TC không có F/G thật là phantom TC, vi phạm mục bên dưới).
- [ ] Không có TC nào dùng dữ liệu mô tả chung chung.
- [ ] **H/I** khớp đúng công thức risk (Likelihood × Impact) đã dùng ở Step A2 — không gán cảm tính.
- [ ] Số dòng **G (Kết quả mong muốn)** khớp đúng số bước **F (Các bước)** (1-1 mapping) — kết quả dòng thứ k là kết quả của bước thứ k.
- [ ] **F (Các bước)** chỉ mô tả hành động, không lẫn kết quả (không có "→", "sẽ hiển thị", "sẽ chuyển sang" trong F).
- [ ] **G (Kết quả mong muốn)** không tham chiếu số bước tài liệu gốc (vd "theo bước 3 luồng 3.1") **và không rò rỉ tham chiếu nội bộ của phiên làm việc** (vd "theo decision log", "theo Step A1.5 điểm 2") — decision log không được lưu vào file, tài liệu gốc tester không có sẵn khi thực thi; phải viết thẳng giá trị/hành vi cụ thể, tự đủ nghĩa. (Field `Business Rule`/`Source`/`Z` được phép ghi rationale/audit, vd "AMB-01 resolved: ..." — đây là field truy nguyên, không phải nội dung tester thực thi.)
- [ ] Không có ≥3 TC dùng chung hệt 1 bộ test data (pesticide paradox) — đa dạng hoá giá trị nếu có.
- [ ] Không có TC nào **F** rỗng hoặc có G không chứa assertion kiểm chứng được (phantom TC). TC 1 bước được phép khi bản chất chỉ có 1 thao tác (TC anchor, mở popup, gọi 1 API) và G có assertion cụ thể.
- [ ] Không có 2 TC test trùng đúng 1 rule/lỗi ở 2 category khác nhau **trong cùng 1 lớp (UI hoặc API) và cùng 1 flow** — gộp lại nếu trùng. TC UI và TC API cho cùng rule không tính là trùng.
- [ ] Section rủi ro cao (risk 6-9 / HIGH+CRITICAL) không có ít TC hơn section rủi ro thấp (priority inversion).
- [ ] Mỗi màn hình mới trong Suite Giao diện có 1 TC anchor đứng đầu section `## Màn hình <n> - <tên>`.
- [ ] **F thực hiện được**: mọi bước chỉ dùng control/filter/tham số thực sự tồn tại trên màn hình hoặc API đó theo tài liệu (vd không "lọc theo `group_code`" khi màn hình chỉ có filter Loại + Mã/Tên) — cần dựng data đặc thù thì đưa vào **D** (điều kiện dữ liệu), không bịa thao tác lọc.
- [ ] Mỗi bước trong **F** bắt đầu bằng động từ hành động cụ thể + đối tượng rõ ràng (không mơ hồ kiểu "thao tác", "thực hiện").
- [ ] TC không phụ thuộc trạng thái để lại bởi TC khác — **D (Trường hợp)** (và bước setup đầu của **F** nếu cần) tự đủ để chạy độc lập (không giả định "sau khi chạy TC-00X").

Sửa lại các TC vi phạm trước khi sang Step A2.6. Nếu sau **2 lần tự sửa** vẫn còn mục không đạt (do tài liệu không đủ thông tin để sửa đúng) → dừng, liệt kê rõ mục còn thiếu, hỏi user quyết định thay vì tiếp tục tự sửa.

### Step A2.6 — Audit độc lập bằng subagent (context mới)

Step A2.5 do chính context đang viết TC tự rà nên không phát hiện được case mà chính nó đã bỏ sót. Bước này giao cho **1 subagent context mới** (Agent tool, `general-purpose`) đóng vai tester review độc lập — chạy **1 vòng duy nhất**, không lặp.

1. Ghi bản nháp TC hiện tại (header + toàn bộ TC, kể cả TC cũ nếu đang thêm vào file có sẵn) ra 1 file tạm trong scratchpad/thư mục tạm của phiên — **không** ghi vào `test-cases.md` (chưa được user xác nhận ở Step A3).
2. Gọi subagent với prompt tự đủ nghĩa (subagent không có context phiên), gồm:
   - Đường dẫn file nháp TC, các domain docs đã đọc ở Step A1 (`business-scenario.md`, `detail-design.md`, `api-reference.md`...), `doc-gaps.md` của feature (để biết case nào đã được user quyết định bỏ qua — không đề xuất lại), và file TC tham chiếu nếu có (`REF_FILE`, xem Step A0).
   - Nhiệm vụ: rà **từng dòng** tài liệu gốc (bảng control, từng bước flow, bảng mã lỗi, danh sách liệt kê) và đối chiếu với TC — tìm case còn thiếu theo đúng các tiêu chí: (a) mỗi thuộc tính hành vi của control có TC riêng; (b) mỗi nhánh của mỗi flow có TC ở lớp UI nếu tài liệu mô tả hành vi hiển thị, và ở lớp API nếu response khác biệt; (c) tổ hợp điều kiện lọc AND/OR, multi-select, type-ahead; (d) concurrency Sửa/Xoá qua UI; (e) danh sách liệt kê nêu đủ phần tử, số đếm đúng; (f) TC gộp nhiều assertion không liên quan vào 1 G; (g) nếu có `REF_FILE`: case có trong file tham chiếu mà bản nháp chưa có.
   - Yêu cầu output: danh sách gap, mỗi gap gồm mô tả case thiếu, căn cứ (**file + dòng/mục** trong domain docs, hoặc TC ID trong `REF_FILE`), TC hiện có liên quan (nếu có), và đánh dấu `DOC` (căn cứ có trong domain docs) hoặc `REF_ONLY` (chỉ có trong file tham chiếu, domain docs không nêu). Cấm đề xuất case không có căn cứ ở 1 trong 2 nguồn.
3. Xử lý kết quả:
   - Gap `DOC` → kiểm lại căn cứ trong tài liệu (subagent có thể sai — vd đếm sai số phần tử); đúng thì tự bổ sung/tách TC như Step A2, chạy lại checklist A2.5 cho các TC vừa thêm/sửa. Vấn đề nằm ở TC **đã lưu từ trước** → không tự sửa, gộp vào câu hỏi xác nhận ở Step A3.
   - Gap `REF_ONLY` → gộp tất cả vào **1 câu hỏi** cho user: mỗi case chọn `thêm` (user cung cấp/xác nhận kết quả mong muốn — lấy theo file tham chiếu nếu có) hoặc `bỏ qua`. Mỗi case được thêm là 1 chỗ domain docs thiếu → ghi 1 entry **AMB-NN** vào Doc Gaps Log (Phát hiện tại: Step A2.6), TC ghi `AMB-NN resolved: ...` vào **Z**.
   - Gap subagent nêu mà căn cứ không đúng/không tồn tại → bỏ, không hỏi user.
4. Ở Step A3, thêm 1 dòng tóm tắt: "Audit độc lập bổ sung **K TC** (TC-xxx...), bỏ **L đề xuất** không có căn cứ."

### Step A3 — Xác nhận trước khi lưu

Hiển thị danh sách scenarios đã dựng:

> Tôi đã tạo **X scenarios** cho `<feature>`:
>
> | TC | Title | Category | Suite | H/I |
> |---|---|---|---|---|
> | TC-001 | ... | Happy Path | Giao diện | HIGH / CRITICAL |
> | ... | | | | |
>
> **Lưu vào `automation_test/docs/features/<feature>/test-cases.md` và tiếp tục?**
> 1. **Có** — lưu
> 2. **Sửa** — cho tôi biết cần thêm / bớt / đổi TC nào
> 3. **Không** — dừng

Nếu user chọn **Sửa** và lý do KHÔNG phải do thiếu domain knowledge (trường hợp đó đã xử lý bằng Never Assume) mà do cách thiết kế/viết TC của skill (vd thiếu TC anchor, TC gộp nhiều case, thiếu case biên, thiếu nhóm case theo bảng ở Step A2...) → sau khi sửa xong, tự ghi 1 entry vào `automation_test/docs/scenario-learnings.md` (xem mục "Scenario Learnings" cuối file), không cần hỏi user.

Chờ xác nhận → ghép header (Step A0) + nội dung → ghi file → báo kết quả (Step A4).

### Step A4 — Báo kết quả

```
Đã lưu X test cases → automation_test/docs/features/<feature>/test-cases.md
[Nếu có entry mới ghi trong lượt chạy này] Đã ghi N gap (AMB-NN...) vào automation_test/docs/features/<feature>/doc-gaps.md — gửi lại cho BA/dev bổ sung tài liệu gốc.
[Nếu Step 0 phát hiện format cũ và user chọn "Không convert"] ⚠️  File hiện lẫn 2 format (TC cũ giữ Category/Preconditions/Steps, TC mới theo D/E/F/G/H/I/Z) — chạy lại và chọn "Có, convert toàn bộ" nếu muốn đồng bộ hoá.

⚠️  Status codes và response fields trong TC là giả định từ tài liệu —
    verify lại với curl/Postman trước khi automate để tránh fail do sai expected.

Bước tiếp theo:
  /autotest-rf-web <feature>       # automate Web
  /autotest-rf-android <feature>   # automate Android
  /autotest-rf-ios <feature>       # automate iOS
  /autotest-rf-api <feature>       # automate API
  /autotest-pw-web <feature>    # automate Web — Playwright TS
  /autotest-pw-android <feature> # automate Android — Playwright TS
  /autotest-pw-api <feature>    # automate API — Playwright TS
```

---

## Mode B — Convert từ file Excel

### Step B1 — Xác nhận file và feature

Nếu đường dẫn file chưa có → hỏi:
> Đường dẫn đến file Excel?

Kiểm tra file tồn tại:
```python
import os
path = "<xlsx_path>"
print("OK" if os.path.isfile(path) else f"ERROR: không tìm thấy {path}")
```

Nếu không tìm thấy → STOP, yêu cầu kiểm tra lại đường dẫn.

Nếu `<feature>` chưa có → chạy parser để lấy thông tin, rồi hỏi:
> Tìm thấy **{total} test cases** từ sheet `{sheet}`.
> Tên feature? (ví dụ: `login` hoặc `lending/phan-loai-khach-hang`)
> File sẽ lưu vào: `automation_test/docs/features/<feature>/test-cases.md`

### Step B1.5 — Thông tin tài liệu KBKTCN

Cùng nguyên tắc Step A0 (tự suy tối đa, chỉ hỏi phần không suy ra được — Người lập/Ngày lập/Loại chức năng/Nguồn SRS). Mode B luôn ghi đè toàn bộ file (Step B4) nên bước này **luôn chạy**, không có nhánh "bỏ qua vì file đã tồn tại" như Step A0.

> Import Excel cho `<feature>` theo chuẩn KBKTCN — cần thêm:
> 1. **Mã tài liệu** (vd: `KBKTCN_<PROJECT>_<TenChucNang>_V1.0`)
> [chỉ hỏi nếu không suy ra được] 2. **Loại chức năng**: APP / WEB / API?

Lưu giá trị, truyền vào script ở Step B2/B4 qua `--doc-id`, `--author`, `--platform`, `--srs-source`.

### Step B2 — Cài đặt và parse

```bash
python3 -m pip install -q openpyxl
python3 .claude/skills/autotest-scenarios/scripts/tc_import.py "<xlsx_path>"
```

Nếu output chứa `"error"` → STOP. Hiển thị lỗi. Nguyên nhân thường gặp:
- File đang mở trong Excel (bị lock)
- Header row không có tên cột nhận dạng được (ID, Trường hợp kiểm thử, Các bước thực hiện, Kết quả mong muốn)

Script tự phát hiện thêm 2 cột **tuỳ chọn** nếu Excel gốc có sẵn: `Suite` (giá trị "Giao diện"/"Chức năng"...) và `Màn hình` — nếu có, output sẽ tự nhóm theo `# Suite: ...` / `## <màn hình>`. Nếu Excel không có 2 cột này, script **không tự suy đoán** Suite/Màn hình (giữ đúng nguyên tắc Mode B không tự dựng cấu trúc ngoài dữ liệu gốc) — output sẽ là danh sách TC phẳng như hiện tại, chỉ có field `Category`.

### Step B3 — Preview và xác nhận mapping

Hiển thị 3 TC đầu:
```
Preview (3 of N):

### TC-001 — <title>
**Category**: <category>
**D (Trường hợp)**: <rút gọn từ cột Data test/Điều kiện, hoặc từ Title nếu cột đó là data thô>
**F (Các bước)**: <số bước> steps
**G (Kết quả mong muốn)**: <80 ký tự đầu>...
```

Hỏi: **"Mapping đúng chưa? (yes / fix)"**
- **fix** → hỏi cột nào bị sai, điều chỉnh rồi parse lại
- **yes** → tiếp tục Step B4

### Step B4 — Ghi file

```bash
python3 .claude/skills/autotest-scenarios/scripts/tc_import.py "<xlsx_path>" --write "automation_test/docs/features/<feature>/test-cases.md" --feature "<feature>" --doc-id "<mã tài liệu>" --author "<người lập>" --platform "<APP|WEB|API>" --srs-source "<nguồn SRS nếu có>"
```

Nếu file đã tồn tại → ghi đè, thông báo:
> Đã ghi đè `automation_test/docs/features/<feature>/test-cases.md`

### Step B4.5 — Review theo checklist chất lượng (chỉ báo cáo, không tự sửa)

Đọc lại toàn bộ TC vừa import, rà theo phần checklist chất lượng dùng chung với Step A2.5 (bỏ qua các mục chỉ áp dụng riêng Mode A — Source/decision log, risk-based H/I, anchor TC theo Suite Giao diện, business/integration flow, graph_refs — vì Mode B import nguyên trạng từ Excel, không tự thiết kế theo lens và không đọc domain docs):

- [ ] **F/G** khớp 1-1 (số dòng bằng nhau)
- [ ] Không dữ liệu chung chung ("giá trị không hợp lệ", "dữ liệu sai định dạng"...)
- [ ] Không có ≥3 TC dùng chung hệt 1 bộ test data (pesticide paradox)
- [ ] Không có TC nào **F** rỗng hoặc G không có assertion kiểm chứng được (phantom TC)
- [ ] Không có 2 TC test trùng đúng 1 rule/lỗi trong cùng 1 lớp/flow — chỉ khác cách đặt tên/category

**Khác Mode A: KHÔNG tự sửa.** Mode B import nguyên trạng nội dung do người khác viết trong Excel — tự ý sửa có thể làm sai lệch ý đồ gốc. Nếu phát hiện vi phạm → chỉ phân tích và báo cáo, chờ user xác nhận:

> Rà lại **N TC** vừa import, phát hiện **M vấn đề**:
>
> **1. TC-xxx — `<vấn đề cụ thể>`**: đề xuất sửa thành `<nội dung đề xuất>`
> **2. ...**
>
> Áp dụng sửa đổi nào? (trả lời theo số, vd `1, 3` hoặc `tất cả`, hoặc `không` để giữ nguyên)

Chỉ sửa các TC được user đồng ý, ghi lại file. Nếu không phát hiện vấn đề gì → báo ngắn gọn "Không phát hiện vấn đề chất lượng" và tiếp tục Step B5.

### Step B5 — Báo kết quả

```
Đã lưu {total} test cases → automation_test/docs/features/<feature>/test-cases.md

Bước tiếp theo:
  /autotest-rf-web <feature>       # automate Web
  /autotest-rf-android <feature>   # automate Android
  /autotest-rf-ios <feature>       # automate iOS
  /autotest-rf-api <feature>       # automate API
  /autotest-pw-web <feature>    # automate Web — Playwright TS
  /autotest-pw-android <feature> # automate Android — Playwright TS
  /autotest-pw-api <feature>    # automate API — Playwright TS
```

---

## Column Mapping Reference (Mode B)

| Cột Excel (tiếng Việt) | TC field |
|---|---|
| ID / STT | Số thứ tự (không dùng làm label) |
| Mục đích kiểm thử | **Category** (merged cells → fill-down) |
| Trường hợp kiểm thử | Title trong heading (Snake_Case cho RF); dùng làm **D (Trường hợp)** khi cột Data test/Điều kiện chỉ chứa data thô (key=value) |
| Data test / Điều kiện | **D (Trường hợp)** (câu điều kiện) — nếu nội dung là data thô dạng `key=value` thì thay vào đó đưa vào **E (Data test)**, D lấy Title làm câu tình huống |
| Các bước thực hiện | **F (Các bước)** (tách theo line break) |
| Kết quả mong muốn | **G (Kết quả mong muốn)** |
| Ghi chú | **Z (Notes)** (bỏ qua nếu rỗng) |
| Suite *(tuỳ chọn, chỉ dùng nếu Excel gốc có)* | Suite (`# Suite: ...`) |
| Màn hình *(tuỳ chọn, chỉ dùng nếu Excel gốc có)* | Section màn hình (`## <màn hình>`) |

`H/I` mặc định **MEDIUM / MAJOR** (Excel thường không có cột priority/severity). `Business Rule` và `graph_refs` không được sinh ở Mode B — script chỉ thấy Excel, không đọc domain docs nên không thể ghi 2 field này mà không bịa. `Source` tự động ghi nguồn Excel (tên file + sheet + TC ID gốc nếu có) để vẫn truy vết được về đâu TC này đến.

---

## Mode E — Sửa / cập nhật TC đã có

### Step E1 — Xác định TC cần sửa

Hỏi:
> TC nào cần sửa? (vd: `TC-003`, hoặc mô tả vấn đề cần thay đổi)

Đọc TC file, tìm đúng TC được chỉ định. Phát hiện format của TC đó (xem "Phát hiện format cũ" ở Step 0) — nếu TC này đang ở format cũ, hỏi luôn trong cùng bước xác nhận ở E2 (xem bên dưới), không hỏi tách riêng.

### Step E2 — Hiển thị nội dung hiện tại và đề xuất

Hiện nội dung TC hiện tại. Nếu user mô tả vấn đề → đề xuất nội dung mới.

> **TC-003 hiện tại:**
> (nội dung)
>
> **Đề xuất sửa thành:**
> (nội dung mới)
>
> [Nếu TC hiện tại đang format cũ, thêm dòng:] Đồng thời convert TC này sang format chuẩn KBKTCN mới (D/E/F/G/H/I/Z)?
>
> Áp dụng? (có / sửa thêm / không)

Trước khi ghi, kiểm tra nhanh nội dung đề xuất có gây vi phạm checklist chất lượng (Step A2.5) với **các TC khác đã có trong file** không (vd sửa xong lại trùng test data/trùng rule với 1 TC khác, hoặc phá vỡ 1-1 mapping F/G). Nếu có → nêu rõ xung đột, hỏi user xử lý trước khi ghi, không tự ý điều chỉnh thêm TC khác ngoài phạm vi đang sửa.

Chờ xác nhận → ghi file.

---

## Mode D — Xoá TC

### Step D1 — Xác nhận trước khi xoá

Hiện TC cần xoá, hỏi xác nhận:

> **Xoá TC-NNN: `<title>`?**
> Hành động này không thể hoàn tác.
> (có / không)

Chờ xác nhận → xoá TC khỏi file, cập nhật file (cập nhật lại **Tổng TC** trong header).

---

## Doc Gaps Log (ghi lại các chỗ tài liệu thiếu/mâu thuẫn)

File riêng cho từng feature, cùng folder với domain docs của feature đó: `automation_test/docs/features/<feature>/doc-gaps.md`. Mục đích: mọi chỗ tài liệu gốc thiếu/mâu thuẫn mà skill từng phải dừng lại hỏi user đều được lưu vết lại — để BA/dev sau này bổ sung tài liệu gốc, không chỉ nằm trong lịch sử chat rồi mất.

**Chỉ áp dụng cho Mode A** (TC dựng từ domain docs — nơi duy nhất có khái niệm "gap trong tài liệu"). Mode B/D/E không ghi vào file này (Mode B import nguyên trạng từ Excel, không đối chiếu domain docs).

**Mỗi entry được gán 1 mã `AMB-NN`** (sequential, tăng dần, không tái sử dụng số cũ — đọc file hiện có để biết số lớn nhất đã dùng trước khi gán số mới cho feature này). TC nào bị ảnh hưởng bởi gap đó ghi `AMB-NN resolved: <tóm tắt quyết định>` vào field **Z (Notes)** của TC (xem Step A1.5/A2) — tạo truy vết 2 chiều giữa TC và gap log, đúng cách mẫu công ty dùng (vd "AMB-01 resolved: checkbox default = CHECKED").

**Ghi entry khi nào** (đúng 4 điểm skill dừng lại hỏi user vì tài liệu thiếu/mâu thuẫn):
1. **Step A1.5** — sau khi user trả lời câu hỏi đối chiếu tài liệu (Orphan/Conflict/Missing relationship/Logic Issues/Completeness Gaps) → ghi mỗi điểm thành 1 entry riêng, mỗi entry 1 mã AMB-NN.
2. **Step A2 — Never Assume (field/behavior cụ thể)** — sau khi user trả lời (cung cấp giá trị hoặc chọn bỏ qua TC) → ghi 1 entry, 1 mã AMB-NN.
3. **Step A2 — Never Assume (tài liệu trống hoàn toàn)** — trước khi quay lại Step A1 → ghi 1 entry loại Completeness Gap, 1 mã AMB-NN.
4. **Step A2.6 — gap `REF_ONLY`** — mỗi case chỉ có trong file TC tham chiếu mà user chọn `thêm` → 1 entry loại Completeness Gap (domain docs không mô tả hành vi này), 1 mã AMB-NN. Case user chọn `bỏ qua` không cần ghi.

**Format mỗi entry:**
```
### AMB-NN — <ngày> — <loại gap>
**Phát hiện tại**: Step A1.5 | Step A2 Never Assume | Step A2.6 Audit (REF_ONLY)
**Mô tả**: <field/rule/flow cụ thể, hai tài liệu nói gì (nếu là đối chiếu), hoặc thiếu thông tin gì>
**Quyết định của user**: <lựa chọn user chọn — nguồn nào là chính / giá trị user cung cấp / bỏ qua TC / dừng bổ sung tài liệu>
**Ảnh hưởng TC**: <TC-NNN liên quan, hoặc "chưa viết — bỏ qua" nếu user chọn bỏ qua>
```

- **Không hỏi user trước khi ghi** — đây là thao tác nội bộ ghi vết, giống cơ chế Scenario Learnings bên dưới. Chỉ báo số lượng entry mới thêm (kèm mã AMB-NN) ngắn gọn trong Step A4.
- **Không ghi đè entry cũ** — luôn append; nếu file chưa tồn tại thì tạo mới với heading `# Doc Gaps — <feature>`.
- **Không tự sửa tài liệu gốc** (`business-scenario.md`, `detail-design.md`) dựa trên entry này — file chỉ ghi lại gap để người khác xử lý sau, không phải cơ chế tự động vá tài liệu.

---

## Scenario Learnings (học tích luỹ qua các lần chạy)

File dùng chung mọi feature trong project: `automation_test/docs/scenario-learnings.md`.

- **Đọc trước khi thiết kế** — đầu Mode A (Step A1, trước A1.5), nếu file tồn tại → đọc toàn bộ, áp dụng mọi entry đã ghi khi viết TC ở Step A2, để không lặp lại lỗi đã bị user chỉ ra ở lần chạy trước.
- **Ghi sau khi sửa** — ở Step A3, khi user chọn **Sửa** vì lý do thuộc về cách skill thiết kế/viết TC (không phải do thiếu domain knowledge — trường hợp đó thuộc Never Assume), tự thêm 1 entry theo format:

```
### <ngày> — <feature>
**Issue**: <vấn đề user chỉ ra>
**Fix**: <cách đã sửa>
**Áp dụng khi**: <điều kiện để nhớ áp dụng lần sau, vd "mỗi màn hình mới trong Suite Giao diện">
```

- Chỉ ghi lỗi thuộc về cách thiết kế/viết TC (thiếu TC anchor, TC gộp nhiều case, thiếu nhóm case, sai Suite/section...). Không ghi lỗi do thiếu tài liệu — Never Assume đã xử lý riêng bằng cách hỏi ngay tại chỗ.
- Không hỏi user trước khi ghi — đây là thao tác nội bộ, chỉ báo ngắn gọn trong Step A4 nếu có entry mới được thêm.

---

## Rules

- **Tên TC là hợp đồng** — không đổi tên, không diễn giải lại. `snake_name` derive cơ học từ title gốc.
- **Format chuẩn KBKTCN công ty** — mọi TC Mode A/B/E dùng field `D/E/F/G/H/I/Z/graph_refs` (xem "Format mỗi TC" ở Step A2), tổ chức theo `# Suite: Giao diện` / `# Suite: Chức năng` → `## Màn hình`/`## <nhóm chức năng>`. Tham khảo `examples/KBKTCN_VC PAYDAY_Ký và hủy hợp đồng VC Payday_V1.0.md` khi cần đối chiếu format thật. TC-NNN (không phải `TC #N`) vẫn là ID chuẩn — giữ tương thích với `autotest-rf-web/android/ios/api` và `autotest-strategy`.
- **File cũ (Category/Priority P0-P3/Preconditions/Steps)** — khi Step 0 phát hiện file/TC đang ở format cũ và sắp bị thêm/sửa (Mode A "thêm TC", Mode E), luôn hỏi user có convert toàn bộ sang format mới không, không tự quyết định. Mode B luôn ghi đè bằng format mới (không có file cũ để lẫn).
- **Mode A**: mỗi TC phải truy nguyên được về 1 rule/behavior/field cụ thể trong tài liệu (ghi ở **Source**). Không tự bịa field, API, error code, hay status không có trong tài liệu.
- **Mode A — Never Assume**: thiếu thông tin cần cho TC (giá trị, giới hạn, mã lỗi) → hỏi user ngay tại chỗ, không tự suy đoán rồi ghi giả định. Nếu cả tài liệu (hay phần liên quan đến feature) trống hoàn toàn — không phải thiếu 1 chi tiết lẻ tẻ — dừng hẳn, quay lại hỏi như Step A1 "không có docs", không tự dựng kịch bản từ suy đoán tên feature.
- **Mode A — đối chiếu tài liệu**: nếu business-scenario.md và detail-design.md mâu thuẫn hoặc có orphan/logic issue/completeness gap ảnh hưởng đến TC → hỏi user chọn nguồn chính trước khi viết TC liên quan (Step A1.5), ghi lại thành decision log áp dụng nhất quán.
- **Mode A — Coverage Matrix**: trước khi viết TC, liệt kê đầy đủ field/rule/endpoint/status/control/alternate-flow từ tài liệu thành 1 bảng nháp (xem Step A2); sau khi viết xong, đối chiếu ngược — dòng nào chưa có TC-NNN map tới là case bị sót, phải bổ sung trước khi sang Step A2.5. Đây là cơ chế chính đảm bảo không sót trường hợp, không chỉ dựa vào 6 lens/checklist.
- **Mode A — matrix theo thuộc tính**: mỗi mệnh đề hành vi của control (multi-select, tìm kiếm nhanh, sort, trim...) là 1 dòng matrix và có TC riêng; chỉ áp cho đúng field tài liệu nêu. Danh sách liệt kê trong tài liệu (bảng ràng buộc, enum...) → TC nêu đủ tên phần tử, đếm đúng số lượng.
- **Mode A — test pyramid đúng phạm vi**: pyramid chỉ giảm trùng case biên/tổ hợp; "1 happy + 1 reject" ở UI tính theo từng flow/màn hình. Nhánh flow có mô tả hành vi hiển thị → bắt buộc có TC UI cho mọi flow có nhánh đó, TC API không thay thế. Rule dữ liệu (sort/filter/0 kết quả) assert tại lớp API.
- **Mode A — audit độc lập**: sau Step A2.5, luôn chạy 1 vòng audit bằng subagent context mới (Step A2.6). Gap có căn cứ trong domain docs → tự bổ sung; gap chỉ có trong file tham chiếu → hỏi user 1 lần, case được thêm ghi AMB-NN. Không lặp audit nhiều vòng.
- **Mode A — dữ liệu test cụ thể**: cấm mô tả chung chung ("giá trị không hợp lệ"); luôn nêu giá trị thật trong D/E/F.
- **Mode A — F/G 1-1**: số bước trong **F (Các bước)** phải khớp số dòng trong **G (Kết quả mong muốn)**, kết quả dòng thứ k tương ứng đúng bước thứ k.
- **Mode A — tách hành động khỏi kết quả**: **F** chỉ mô tả HÀNH ĐỘNG (nhập gì, bấm gì); cấm các cụm nối kết quả trong F ("→", "sẽ hiển thị", "sẽ chuyển sang", "thì sẽ") — phần đó phải chuyển sang **G**.
- **Mode A — G tự đủ nghĩa**: cấm viết dạng tham chiếu số bước tài liệu gốc ("theo bước 3 luồng 3.1") hoặc tham chiếu nội bộ phiên làm việc ("theo decision log", "theo Step A1.5"); phải diễn đạt bằng hành động/kết quả cụ thể để đọc độc lập không cần mở lại tài liệu hay biết bối cảnh phiên chạy. Field `Business Rule`/`Source`/`Z` vẫn được phép ghi rationale/audit (vd "AMB-01 resolved: chọn theo quyết định user ở Step A1.5") vì đây là field truy nguyên, không phải nội dung tester thực thi.
- **Mode A — anchor TC màn hình**: mỗi màn hình mới xuất hiện trong scope (Suite Giao diện), TC đầu tiên của section `## Màn hình <n> - <tên>` phải là 1 TC mô tả tổng quan layout mặc định (đủ thành phần hiển thị) trước các TC theo trạng thái/scenario cụ thể — nên đánh dấu `(anchor)` ở cuối title.
- **Mode A — scenario learnings**: đọc `automation_test/docs/scenario-learnings.md` (nếu có) trước khi thiết kế TC; ghi entry mới sau khi user chỉ ra lỗi thuộc cách thiết kế/viết TC (không phải thiếu tài liệu).
- **Mode A — doc gaps log**: mọi gap tài liệu (đối chiếu Step A1.5, Never Assume Step A2) đều ghi vào `automation_test/docs/features/<feature>/doc-gaps.md` ngay sau khi user trả lời, mỗi entry 1 mã AMB-NN — xem mục "Doc Gaps Log". TC bị ảnh hưởng ghi `AMB-NN resolved: ...` vào **Z (Notes)**. Không hỏi user trước khi ghi, không tự sửa tài liệu gốc dựa trên entry này.
- **Mode A — graph_refs**: best-effort, tự đặt slug từ thực thể đọc được trong domain docs, duy trì registry nhất quán trong phiên chạy (xem Step A2). Không ép tag khi TC không gắn với thực thể rõ ràng.
- **Mode B**: parser xử lý tự động merged cells, fill-down category, multi-row TC. Không đọc lại Excel thủ công. Field `Business Rule`/`graph_refs` không sinh ở Mode B (script không đọc domain docs). Suite/Màn hình chỉ nhóm khi Excel gốc có sẵn cột tương ứng — không tự suy đoán.
- **Mode B — review nhưng không tự sửa**: sau khi import, rà theo checklist chất lượng như Mode A (Step B4.5) nhưng chỉ phân tích + báo cáo cho user, không tự sửa âm thầm như Mode A — vì nội dung là do người khác viết trong Excel, sửa mà không hỏi có thể sai lệch ý đồ gốc. Chỉ sửa TC nào user xác nhận đồng ý.
- **TC đã lưu từ trước không tự sửa âm thầm**: khi thêm TC mới vào file đã có (Step A2.5) hoặc sửa 1 TC qua Mode E, nếu checklist phát hiện vấn đề ở 1 TC **khác đã lưu từ trước** (không phải TC đang viết/sửa ở lượt này) → không tự sửa, báo cáo và hỏi user xác nhận trước — vì TC cũ có thể đã dùng để automate. Chỉ tự sửa âm thầm các TC mới viết trong chính lượt chạy hiện tại.
- **H/I mặc định MEDIUM / MAJOR** cho Mode B — Excel thường không có cột priority/severity.
- **Không ghi đè mà không thông báo** — luôn hiện thông báo khi overwrite.
