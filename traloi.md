# Tổng hợp Kiến thức - AutoTest Skills (Playwright)

> File này lưu lại các câu hỏi và câu trả lời trong phiên làm việc.

---

## 1. Quy trình 5 bước AutoTest Skills

**Câu hỏi:** Hướng dẫn về workflow 5 bước cho web demo browser theo Playwright?

**Trả lời:**

| Bước | Skill | Mô tả |
|------|-------|-------|
| 1 | `/autotest-project-docs` | Tạo tài liệu domain knowledge |
| 2 | `/autotest-scenarios` | Tạo kịch bản kiểm thử |
| 3 | `/autotest-strategy` | Phân tích + tinh chỉnh kịch bản, chọn công cụ |
| 4 | `/autotest-pw-web` | Viết automation test Playwright |
| 5 | `/autotest-pw-jenkins` | Thiết lập CI/CD pipeline |

**Cách chạy:**
- Full 5 bước: `vsaf autotest-skill/automation-test <yêu cầu>`
- Từng bước lẻ: `/autotest-project-docs`, `/autotest-scenarios`...

---

## 2. Đoạn code kiểm tra file tài liệu

**Câu hỏi:** Đoạn code `glob.glob('automation_test/docs/...')` dùng để làm gì?

**Trả lời:**
- **Mục đích:** Kiểm tra project đã có tài liệu domain knowledge chưa
- **Cách hoạt động:**
  - `existing` rỗng → Project mới → Tạo mới tài liệu
  - `existing` có file → Đã có tài liệu → Hỏi "Cập nhật" hay "Tạo lại"
- **Các file được kiểm tra:** `global-data.md`, `product-overview.md`, `api-reference.md`, `system-overview.md`, và tất cả `.md` trong `features/`

---

## 3. Bước 1 - Tạo tài liệu Domain Knowledge

**Câu hỏi:** Bước 1 workflow làm gì, các file đầu ra?

**Trả lời:**

**Mục đích:** Tạo tài liệu kiến thức nền về sản phẩm để các bước sau có căn cứ chính xác.

**Nguồn tài liệu:**
1. Confluence (paste link)
2. File/Text (.md, .txt, .pdf, .docx)
3. AI tự tạo (trả lời 5 câu hỏi)

**File đầu ra:**
```
automation_test/docs/
├── global-data.md           # URL, device caps, tên key credential
├── product-overview.md      # Mô tả tổng quan sản phẩm
├── api-reference.md         # Danh sách API endpoints
└── features/<feature>/
    ├── business-scenario.md # Luồng nghiệp vụ
    └── detail-design.md     # Thiết kế kỹ thuật
```

---

## 4. vsaf_next sau Bước 3

**Câu hỏi:** `vsaf_next` sau bước strategy có ý nghĩa gì?

**Trả lời:**
- **Mục đích:** Cơ chế điều phối workflow của VSAF
- **Chức năng:** Báo bước hiện tại đã hoàn thành, chuyển sang bước tiếp theo
- **Các tham số:**
  - `runId`: ID lượt chạy workflow
  - `projectPath`: Đường dẫn project
  - `nodeId`: Tên bước vừa xong (vd: "strategy")
  - `output`: Kết quả tóm tắt của bước đó

---

## 5. File package.json

**Câu hỏi:** File `package.json` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/package.json`
- **Chức năng:**
  - Khai báo dependencies (thư viện cần cài)
  - Pin version cố định để mọi máy giống nhau
  - Định nghĩa scripts (lệnh tắt)
- **Lệnh quan trọng:**
  - `npm install` - Cài dependencies
  - `npm run test` - Chạy test
  - `npm run report` - Mở HTML report
  - `npm run summary` - Xem tóm tắt kết quả

---

## 6. File config/env.ts

**Câu hỏi:** File `env.ts` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/config/env.ts`
- **Chức năng:**
  - Đọc credential từ file `.env` (username, password, API key)
  - Cấu hình môi trường (URL, timeout, chế độ chạy)
  - Export biến dùng chung cho toàn project
- **Lý do cần:** Tránh hardcode credential trong code, dễ đổi môi trường (dev/uat/prod)
- **Mối quan hệ:**
  - `.env` = Chứa giá trị thật (gitignored)
  - `env.ts` = Code đọc và export ra (commit)

---

## 7. File config/storage.ts

**Câu hỏi:** File `storage.ts` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/config/storage.ts`
- **Chức năng:** Quản lý session đăng nhập (storageState)
- **Cách hoạt động:**
  1. Test đầu tiên đăng nhập → Lưu cookies + localStorage vào file JSON
  2. Các test sau đọc file JSON → Bỏ qua màn đăng nhập
- **Lợi ích:** Đăng nhập 1 lần, dùng lại cho nhiều test → Chạy nhanh hơn
- **Hỗ trợ nhiều role:** `@auth:webUser`, `@auth:admin`... mỗi role 1 file session

---

## 8. Cấu hình slow trong timeout

**Câu hỏi:** Cấu hình `slow` trong file timeout dùng để làm gì?

**Trả lời:**
- **Chức năng:** Làm chậm các thao tác của Playwright (thêm delay giữa mỗi action)
- **Mục đích:** Dễ quan sát và debug khi test chạy
- **Khi nào dùng:**
  - ✅ Debug test fail
  - ✅ Demo cho khách hàng
  - ✅ Ghi video hướng dẫn
  - ❌ Chạy CI/CD (tắt slow)
- **Cách bật:** `SLOW_MODE=true npx playwright test --headed`

---

## 9. File playwright.config.ts

**Câu hỏi:** File `playwright.config.ts` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/playwright.config.ts`
- **Chức năng:** File cấu hình trung tâm của Playwright Test
- **Các cấu hình chính:**
  - **Projects:** Chạy trên browser nào (Chrome, Firefox, mobile...)
  - **Timeout:** Thời gian chờ tối đa
  - **Workers:** Chạy song song hay tuần tự
  - **Reporter:** Loại báo cáo (HTML, JUnit, JSON)
  - **Screenshot/Video:** Chụp ảnh, quay video khi fail
  - **Base URL:** URL gốc của ứng dụng
  - **StorageState:** Session đăng nhập
- **Mối quan hệ:** Import từ `env.ts`, `storage.ts`, `timeout.ts`

---

## 10. File fixtures/context.fixture.ts

**Câu hỏi:** File `context.fixture.ts` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/fixtures/context.fixture.ts`
- **Chức năng:** Định nghĩa và mở rộng fixtures của Playwright
- **Fixtures là gì:** Các thành phần được chuẩn bị sẵn trước test và tự động dọn dẹp sau test
- **Tác dụng:**
  - Mở rộng fixtures có sẵn (thêm POManager, ApiClient...)
  - Chia sẻ giữa các test (không cần khởi tạo lại)
  - Tự động cleanup sau test
  - Inject dependencies vào Page Object
- **Cách dùng:** Trong step file, import `test` từ fixture rồi dùng `{ poManager, apiClient }` trực tiếp
- **Lợi ích:** Code gọn, không lặp lại, tự động dọn dẹp

---

## 11. File fixtures/web.fixture.ts

**Câu hỏi:** File `web.fixture.ts` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/fixtures/web.fixture.ts`
- **Chức năng:** Fixture chuyên biệt cho Web testing, mở rộng từ `context.fixture.ts`
- **Khác biệt:**
  - `context.fixture.ts` = Fixtures chung (page, request, apiClient)
  - `web.fixture.ts` = Fixtures riêng web (POManager, storageState, homePage, loginPage...)
- **Tính năng chính:**
  - POManager: Quản lý tất cả Page Objects
  - StorageState: Tự động xử lý session theo tag `@auth:<role>`
  - Shortcut: Truy cập trực tiếp `{ homePage, loginPage }` thay vì qua POManager
- **Cách dùng:** Import `test` từ `web.fixture` trong các step file web

---

## 12. File pages/base/BasePage.ts

**Câu hỏi:** File `BasePage.ts` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/pages/base/BasePage.ts`
- **Chức năng:** Lớp cha trừu tượng (abstract class) cho tất cả Page Objects
- **Các thành phần:**
  - `path`: URL đường dẫn của trang (mặc định `/`, page con override)
  - `page`: Instance Page của Playwright
  - `open()`: Mở trang theo `path` (`page.goto(this.path)`)
  - `expectLoaded()`: Assert URL hiện tại chứa `path` (dùng regex)
  - `textOf(locator)`: Lấy text của element, trả về chuỗi đã trim
- **Cách dùng:** Page con kế thừa (`extends BasePage`), override `path` và dùng các method sẵn có
- **Đặc điểm:** `abstract` → Không tạo instance trực tiếp, chỉ để kế thừa

---

## 13. File bdd/steps/bdd.ts và cơ chế scaffold

**Câu hỏi:** Tại sao workflow tạo file `bdd/steps/bdd.ts` sau khi tạo `BasePage.ts`? File này sinh từ đâu?

**Trả lời:**
- **Nguồn template:** `.claude/skills/autotest-pw-web/templates/core/bdd/steps/bdd.ts`
- **Script copy:** `pw_scaffold.py` (Step 0b khi project ở trạng thái NEW)
- **Đích:** `automation_test/bdd/steps/bdd.ts`
- **Chức năng của file:**
  1. Export `Given/When/Then/Before/After` cho mọi step file import
  2. Xử lý tag `@auth:<role>` tự động (load session đã lưu)
- **Luồng scaffold:**
  - Step 0a: Kiểm tra state (NEW/EXTERNAL/PARTIAL/COMPLIANT)
  - Step 0b: Nếu NEW → chạy `pw_scaffold.py core` → copy toàn bộ `templates/core/` vào `automation_test/`
- **Thứ tự tạo:** BasePage.ts và bdd.ts đều được copy cùng lúc từ template trong bước scaffold

---

## 14. File pages/signup/SignupPage.ts

**Câu hỏi:** File `SignupPage.ts` dùng để làm gì?

**Trả lời:**
- **Trạng thái:** Chưa tồn tại trong project (chỉ có BasePage.ts)
- **Mục đích:** Page Object cho màn hình Đăng ký
- **Nội dung khi được tạo:**
  - Kế thừa từ `BasePage`
  - Locators: input username, email, password, button signup, error message...
  - Actions: `signup(username, email, password)`, điền form, submit
  - Assertions: `expectErrorMessage()`, `expectSignupSuccess()`
- **Khi nào tạo:** Khi chạy `/autotest-pw-web viết test cho chức năng đăng ký`
- **Vị trí:** `automation_test/pages/signup/SignupPage.ts`
- **Naming convention:** `pages/<feature>/<Name>Page.ts`

---

## 15. File pages/POManager.ts

**Câu hỏi:** File `POManager.ts` dùng để làm gì?

**Trả lời:**
- **Vị trí:** `automation_test/pages/POManager.ts`
- **Chức năng:** Quản lý tập trung tất cả Page Objects (Factory Pattern)
- **Cấu trúc file:**
  - Import tất cả Page Objects
  - Khai báo properties (`readonly signupPage`, `readonly loginPage`...)
  - Constructor: nhận `page` từ Playwright, khởi tạo tất cả Page Objects
  - Getter methods: `getSignupPage()`, `getLoginPage()`...
- **Cách dùng:** Step definitions nhận `poManager` từ fixture, gọi `poManager.getXxxPage()` để lấy Page Object
- **Lợi ích:**
  - Tạo Page Object 1 lần, dùng nhiều nơi
  - 1 instance duy nhất cho mỗi page
  - Quản lý tập trung, dễ maintain
- **Khi thêm Page mới:** Thêm import → thêm property → khởi tạo trong constructor → thêm getter

---

## 16. Bước Install npm packages

**Câu hỏi:** Bước "Install npm packages" có ý nghĩa gì?

**Trả lời:**
- **Lệnh:** `cd automation_test && npm install`
- **Mục đích:** Cài đặt tất cả thư viện (dependencies) cần thiết để chạy test
- **Quá trình:**
  1. Đọc `package.json` (danh sách thư viện)
  2. Tải thư viện từ npm registry
  3. Lưu vào `node_modules/`
  4. Tạo `package-lock.json` (lock version)
- **Thư viện chính:** `@playwright/test`, `playwright`, `playwright-bdd`, `typescript`, `dotenv`
- **Khi cần chạy lại:** Lần đầu clone, xóa node_modules, thêm thư viện mới, chuyển máy
- **Output:** Thư mục `node_modules/` chứa tất cả thư viện (gitignored)

---

## 17. Lệnh npm run bddgen 2>&1

**Câu hỏi:** Tại sao phải chạy `npm run bddgen`? Chạy để làm gì? Định nghĩa ở đâu trong skill?

**Trả lời:**
- **Tại sao:** Playwright không hiểu trực tiếp file `.feature` (Gherkin), cần chuyển đổi sang `.spec.ts`
- **Chức năng:** Chuyển đổi `bdd/features/*.feature` → `.features-gen/*.spec.ts`
- **Định nghĩa trong skill:**
  - File: `.claude/skills/autotest-pw-web/templates/core/package.json`
  - Script: `"bddgen": "bddgen"`
  - Thư viện: `playwright-bdd` (version 9.2.1)
- **`2>&1`:** Redirect stderr vào stdout để workflow bắt cả output và error
- **Khi cần chạy:** Thêm/sửa/xóa file `.feature`, thêm/sửa step definitions, trước mỗi lần test
- **Output khi thiếu step:** In ra snippet code cần implement
- **Lệnh liên quan:**
  - `npm run steps` = `bddgen export` (xem danh sách step đã có)
  - `npm run test` = `bddgen && playwright test` (tự chạy bddgen trước)

---

*Cập nhật lần cuối: Phiên làm việc hiện tại*
