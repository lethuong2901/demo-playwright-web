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

## 18. Giải thích chi tiết toàn bộ các file trong project (automation_test)

> Mục này giải thích toàn diện tất cả các file trong thư mục `automation_test/` (ngoại trừ thư mục `.claude`, `node_modules`, `.features-gen`, `results`), kèm theo các file tài liệu quan trọng ở thư mục gốc. Mỗi file đều được phân tích theo 3 khía cạnh trọng tâm:
> 1. **Tại sao lại sinh ra file đấy?**
> 2. **File đấy được sinh ra từ skill nào? (Reference đến skill & template nguồn)**
> 3. **File đấy sinh ra để làm gì? (Chức năng, cơ chế hoạt động, liên kết luồng)**

---

### A. NHÓM TÀI LIỆU & ĐẶC TẢ NGHIỆP VỤ (`automation_test/docs/`)

#### 1. `automation_test/docs/global-data.md`
- **Tại sao lại sinh ra file đấy?**: Trong bất kỳ dự án kiểm thử nào, các dữ liệu dùng chung (như URL trang web, cấu hình màn hình thiết bị, danh sách tên các biến môi trường/credential cần dùng) cần được quy ước trước, tránh việc mỗi tester tự định nghĩa một kiểu.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-project-docs` (Bước 1 trong quy trình AutoTest 5 bước).
  - **Reference**: `.claude/skills/autotest-project-docs/`
- **Sinh ra để làm gì?**: 
  - Khai báo danh mục các biến cấu hình toàn cục: `BASE_URL=https://www.demoblaze.com`, `API_BASE_URL`, danh sách tên biến bí mật (`WEB_USERNAME`, `WEB_PASSWORD`).
  - Là căn cứ để tạo file `.env.example` và giúp `config/env.ts` biết được các key cần đọc mà không hardcode dữ liệu nhạy cảm vào repository.

#### 2. `automation_test/docs/product-overview.md`
- **Tại sao lại sinh ra file đấy?**: AI và các thành viên trong đội ngũ phát triển cần hiểu ngữ cảnh kinh doanh (business domain) của ứng dụng web được test trước khi bắt tay viết kịch bản kiểm thử.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-project-docs` (Bước 1).
  - **Reference**: `.claude/skills/autotest-project-docs/`
- **Sinh ra để làm gì?**: 
  - Tóm lược sản phẩm Demoblaze: loại hình ứng dụng (e-commerce demo), các module chức năng chính (Sign up, Log in, Browse catalog, Add to Cart, Place Order), đối tượng người dùng, tech stack mục tiêu.
  - Làm nguồn tri thức nền tảng (Domain Knowledge) cho các bước tạo kịch bản tiếp theo.

#### 3. `automation_test/docs/features/signup/business-scenario.md`
- **Tại sao lại sinh ra file đấy?**: Cần một bản đặc tả yêu cầu nghiệp vụ (SRS - Software Requirements Specification) chi tiết cho riêng tính năng Đăng ký (Signup) trước khi thiết kế các ca kiểm thử.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-scenarios` (Bước 2 trong quy trình).
  - **Reference**: `.claude/skills/autotest-scenarios/`
- **Sinh ra để làm gì?**:
  - Mô tả chi tiết: Luồng sự kiện chính (Main Flow), các luồng sự kiện thay thế (Alternative Flows: user đã tồn tại, để trống trường dữ liệu, hủy đăng ký).
  - Liệt kê bảng định danh các UI Elements (ID của nút `#signin2`, modal `#signInModal`, input `#sign-username`, `#sign-password`). Điều này giúp người viết Page Object sau này tìm đúng locator mà không bị đoán mò.

#### 4. `automation_test/docs/features/signup/test-cases.md`
- **Tại sao lại sinh ra file đấy?**: Đây là bảng Kịch bản kiểm thử chức năng (KBKTCN) chuẩn QA/Tester, phân rã các yêu cầu nghiệp vụ thành từng ca kiểm thử cụ thể, đo lường được mức độ bao phủ (coverage).
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-scenarios` (Bước 2).
  - **Reference**: `.claude/skills/autotest-scenarios/`
- **Sinh ra để làm gì?**:
  - Định nghĩa 7 Test Case (`TC-001` đến `TC-007`) đầy đủ các cột: Mục đích (D), Dữ liệu kiểm thử (E), Các bước thực hiện (F), Kết quả mong muốn (G), Mức độ ưu tiên/Nghiêm trọng (H/I), và Business Rules.
  - Là bản thiết kế gốc (Blueprint) để chuyển thể 1-1 thành file kịch bản BDD `signup.feature`.

#### 5. `automation_test/docs/features/signup/strategy.md`
- **Tại sao lại sinh ra file đấy?**: Cần xác định chiến lược kiểm thử cho tính năng: kiểm thử cái gì, dùng công cụ gì (Web UI hay API, Playwright hay RobotFramework), mức độ ưu tiên chạy ở đâu (CI hay local).
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-strategy` (Bước 3 trong quy trình).
  - **Reference**: `.claude/skills/autotest-strategy/`
- **Sinh ra để làm gì?**:
  - Đánh giá độ khả thi, chọn Playwright BDD làm framework thực thi cho Web UI.
  - Phân loại Test Suite: gán tag `@smoke` cho TC-001 (kiểm tra nhanh), `@regression` cho TC-003, TC-004, và phân luồng chạy song song hay tuần tự.

---

### B. NHÓM CẤU HÌNH CORE FRAMEWORK & MÔI TRƯỜNG

#### 6. `automation_test/package.json`
- **Tại sao lại sinh ra file đấy?**: Dự án dùng Node.js/TypeScript nên cần file quản lý dependencies và định nghĩa các lệnh chạy test tự động.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - Khởi tạo hạ tầng dự án qua scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/package.json`
- **Sinh ra để làm gì?**:
  - Khai báo các thư viện phụ thuộc: `@playwright/test`, `playwright-bdd`, `typescript`, `dotenv`, `tsx`, `monocart-reporter`.
  - Cung cấp các npm scripts thông dụng: `npm run bddgen` (sinh spec từ feature), `npm test` (sinh và chạy test), `npm run test:web`, `npm run summary`, `npm run ci:notify`.

#### 7. `automation_test/tsconfig.json`
- **Tại sao lại sinh ra file đấy?**: Thiết lập trình biên dịch TypeScript và định cấu hình alias path để code ngắn gọn, sạch sẽ, không bị dính đường dẫn tương đối dài ngoằng (`../../../`).
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/tsconfig.json`
- **Sinh ra để làm gì?**:
  - Thiết lập module resolution Node, target ES2022.
  - Khai báo Path Aliases tiện dụng:
    - `@pages/*` $\rightarrow$ `pages/*`
    - `@fixtures/*` $\rightarrow$ `fixtures/*`
    - `@config/*` $\rightarrow$ `config/*`

#### 8. `automation_test/playwright.config.ts`
- **Tại sao lại sinh ra file đấy?**: Là "trái tim" cấu hình của toàn bộ Playwright Test runner, kết hợp bộ chuyển đổi BDD của `playwright-bdd`.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/playwright.config.ts`
- **Sinh ra để làm gì?**:
  - Định nghĩa dự án BDD thông qua `defineBddProject` (đọc feature từ `bdd/features/**/*.feature`, steps từ `bdd/steps/**/*.ts`, sinh code tạm vào `.features-gen`).
  - Cấu hình Timeout từ `TIMEOUTS` (`config/timeouts.ts`), baseUrl từ `ENV.baseUrl` (`config/env.ts`).
  - Thiết lập cơ chế chạy: số lượng workers song song, chạy headed/headless, chụp ảnh/video/trace khi test lỗi (`only-on-failure`).
  - Khai báo các loại báo cáo: console `list`, `html`, `junit`, `json`, và `monocart-reporter`.

#### 9. `automation_test/.env` và `automation_test/.env.example`
- **Tại sao lại sinh ra file đấy?**: Phân tách mã nguồn khỏi dữ liệu nhạy cảm (Credentials, mật khẩu, API key, token). Tránh việc vô tình push mật khẩu lên Git.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-credentials` và `/autotest-pw-web`.
  - **Reference**: `.claude/skills/autotest-credentials/`
- **Sinh ra để làm gì?**:
  - `.env.example`: File mẫu (được commit vào Git) liệt kê các biến cần có: `BASE_URL`, `TEST_ENV`, `RUN_MODE`, `WEB_USERNAME`, `WEB_PASSWORD`.
  - `.env`: File thực tế chứa giá trị thật trên máy local hoặc CI (được cấu hình trong `.gitignore` để không bị push lên kho mã nguồn).

#### 10. `automation_test/config/timeouts.ts`
- **Tại sao lại sinh ra file đấy?**: Tránh việc hardcode các giá trị mili-giây (ví dụ `30000`, `5000`) rải rác trong các test step hay page object.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/config/timeouts.ts`
- **Sinh ra để làm gì?**:
  - Cung cấp hằng số `TIMEOUTS` tập trung phân chia thành 3 cấp độ:
    - `test: 60_000` (60s cho toàn bộ 1 kịch bản).
    - `navigation: 30_000` & `action: 15_000` (chuyển trang, click, nhập liệu).
    - `expect: 10_000` (thời gian tối đa chờ một assertion đúng).

#### 11. `automation_test/config/env.ts`
- **Tại sao lại sinh ra file đấy?**: Đóng vai trò là cổng truy xuất duy nhất (Single Entry Point) cho toàn bộ code TypeScript truy cập vào cấu hình môi trường.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/config/env.ts`
- **Sinh ra để làm gì?**:
  - Nạp biến từ `.env` bằng thư viện `dotenv`.
  - Cung cấp hàm `optionalEnv` (có giá trị fallback nếu thiếu) và `requireEnv` (báo lỗi nếu thiếu secret bắt buộc nhưng không để lộ giá trị secret).
  - Export các object dùng chung: `ENV` (baseUrl, isCI), `RUN` (chế độ parallel/serial, workers, headed), `CREDENTIALS`.

#### 12. `automation_test/config/storage.ts`
- **Tại sao lại sinh ra file đấy?**: Hỗ trợ cơ chế lưu và tái sử dụng session đăng nhập (StorageState) của Playwright.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/config/storage.ts`
- **Sinh ra để làm gì?**:
  - Định nghĩa đường dẫn lưu file cookies/localStorage JSON theo từng role người dùng (ví dụ: `webUser: '.auth/web-user.json'`).
  - Giúp các kịch bản cần đăng nhập không phải lặp lại bước gõ user/pass ở mỗi test case, giúp tăng tốc độ kiểm thử đáng kể.

---

### C. NHÓM FIXTURES & QUẢN LÝ CONTEXT (`automation_test/fixtures/`)

#### 13. `automation_test/fixtures/context.fixture.ts`
- **Tại sao lại sinh ra file đấy?**: Trong BDD Cucumber truyền thống, các bước kiểm thử chia sẻ dữ liệu qua biến `this` (Cucumber World). Tuy nhiên trong Playwright BDD, ta cần một cơ chế chia sẻ state an toàn theo từng kịch bản (Scenario Context).
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/fixtures/context.fixture.ts`
- **Sinh ra để làm gì?**:
  - Cung cấp class `ScenarioContext` với các hàm `set(key, value)`, `get(key)`, `has(key)`. Mỗi kịch bản test sẽ được cấp 1 instance `ctx` cô lập.
  - Ví dụ: Step trước tạo username ngẫu nhiên `ctx.set('username', randomUsername)`, step sau lấy ra để assert hoặc dùng lại.

#### 14. `automation_test/fixtures/web.fixture.ts`
- **Tại sao lại sinh ra file đấy?**: Cần một Fixture chuyên biệt cho Web UI để tự động khởi tạo đối tượng `POManager` mỗi khi một test bắt đầu chạy.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/fixtures/web.fixture.ts`
- **Sinh ra để làm gì?**:
  - Mở rộng Playwright test base bằng cách tiêm `poManager: async ({ page }, use) => use(new POManager(page))`.
  - Giúp các step definition chỉ cần khai báo `{ poManager }` là có thể truy cập ngay vào tất cả các màn hình mà không cần phải tự tạo instance thủ công.

#### 15. `automation_test/fixtures/index.ts`
- **Tại sao lại sinh ra file đấy?**: Gom tất cả các fixtures riêng rẽ (`bddBase`, `contextTest`, `webTest`) lại thành một đối tượng `test` và `expect` thống nhất.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/fixtures/index.ts`
- **Sinh ra để làm gì?**:
  - Sử dụng hàm `mergeTests` của Playwright để gộp mọi fixture lại với nhau.
  - Là điểm import duy nhất cho các file step: `import { expect } from '@fixtures/index'`.

---

### D. NHÓM PAGE OBJECT MODEL (`automation_test/pages/`)

#### 16. `automation_test/pages/base/BasePage.ts`
- **Tại sao lại sinh ra file đấy?**: Tuân thủ nguyên lý kế thừa (OOP) và DRY (Don't Repeat Yourself). Các màn hình web đều có chung một số thao tác cơ bản như: mở trang theo đường dẫn, kiểm tra URL tải trang thành công, lấy text của phần tử.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/pages/base/BasePage.ts`
- **Sinh ra để làm gì?**:
  - Là lớp cha trừu tượng (`abstract class BasePage`).
  - Chứa thuộc tính `page`, thuộc tính `path` và các hàm tiện ích: `open()`, `expectLoaded()`, `textOf(locator)`. Mọi Page Object cụ thể đều kế thừa từ class này.

#### 17. `automation_test/pages/signup/SignupPage.ts`
- **Tại sao lại sinh ra file đấy?**: Triển khai mô hình Page Object Model cho chức năng Đăng ký (Signup). Tách biệt hoàn toàn phần giao diện (Locators, thao tác DOM) khỏi phần logic kiểm thử (Step definitions).
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - Viết test chức năng dựa trên `business-scenario.md` & `test-cases.md`).
  - **Reference**: `.claude/skills/autotest-pw-web/`
- **Sinh ra để làm gì?**:
  - Quản lý các Locators của trang: `#signin2` (nút mở modal), `#signInModal`, `#sign-username`, `#sign-password`, nút đăng ký trong modal.
  - Cung cấp các phương thức nghiệp vụ: `clickSignupButton()`, `expectModalVisible()`, `fillUsername()`, `fillPassword()`, `clickSignupButtonInModal()`, `clickCloseButton()`, `expectModalHidden()`, và hàm sinh dữ liệu ngẫu nhiên `generateRandomUsername()`.

#### 18. `automation_test/pages/POManager.ts`
- **Tại sao lại sinh ra file đấy?**: Áp dụng mẫu thiết kế Factory / Manager Pattern để quản lý tập trung toàn bộ các Page Object của hệ thống.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/pages/POManager.ts` (được cập nhật thêm khi có page mới).
- **Sinh ra để làm gì?**:
  - Nhận `page` từ Playwright, khởi tạo sẵn `SignupPage` (và các page khác sau này như `LoginPage`, `CartPage`).
  - Cung cấp các hàm getter như `getSignupPage()`, giúp step definition gọi trực tiếp mà không cần khởi tạo lại nhiều lần.

---

### E. NHÓM BDD GHERKIN & STEP DEFINITIONS (`automation_test/bdd/`)

#### 19. `automation_test/bdd/features/signup.feature`
- **Tại sao lại sinh ra file đấy?**: Đặc tả các kịch bản kiểm thử dưới dạng ngôn ngữ tự nhiên (Gherkin tiếng Việt: Given, When, Then) để các bên liên quan (BA, Product Owner, QA, Dev) đều có thể đọc, hiểu và nghiệm thu.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - Chuyển thể từ `test-cases.md`).
  - **Reference**: `.claude/skills/autotest-pw-web/`
- **Sinh ra để làm gì?**:
  - Khai báo 7 kịch bản từ `TC-001` đến `TC-007` của chức năng Đăng ký tài khoản Demoblaze.
  - Phân loại bằng các Tag (`@web`, `@signup`, `@smoke`, `@regression`, `@happy-path`, `@negative`) để Playwright có thể chọn lọc kịch bản khi chạy qua CLI.

#### 20. `automation_test/bdd/steps/bdd.ts`
- **Tại sao lại sinh ra file đấy?**: Là cầu nối tích hợp giữa thư viện `playwright-bdd` và hệ thống fixtures riêng của dự án.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/bdd/steps/bdd.ts`
- **Sinh ra để làm gì?**:
  - Gọi hàm `createBdd(test)` (sử dụng fixture gộp từ `fixtures/index.ts`).
  - Xuất khẩu (export) các từ khóa BDD: `Given`, `When`, `Then`, `Before`, `After` để các file step definition khác import vào sử dụng.

#### 21. `automation_test/bdd/steps/signup.steps.ts`
- **Tại sao lại sinh ra file đấy?**: Hiện thực hóa (implement) hành động kỹ thuật phía sau từng câu lệnh tiếng Việt trong file `signup.feature`.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4).
  - **Reference**: `.claude/skills/autotest-pw-web/`
- **Sinh ra để làm gì?**:
  - Ánh xạ các câu:
    - `Given('người dùng truy cập trang chủ Demoblaze')` $\rightarrow$ gọi `poManager.getSignupPage().open()`.
    - `When('người dùng nhập username ngẫu nhiên')` $\rightarrow$ sinh username ngẫu nhiên và lưu vào `ctx.set('username', ...)`.
    - `When('người dùng click nút Sign up trong popup')` $\rightarrow$ lắng nghe sự kiện browser `page.once('dialog')`, click nút, tự động accept dialog và lưu nội dung alert vào context.
    - `Then('alert hiển thị với message {string}')` $\rightarrow$ lấy nội dung alert từ context ra assert với giá trị kỳ vọng.

#### 22. `automation_test/bdd/steps/common/common.steps.ts`
- **Tại sao lại sinh ra file đấy?**: Chứa các bước kiểm thử dùng chung giữa nhiều tính năng khác nhau, tránh lặp lại code trong từng feature riêng lẻ.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/bdd/steps/common/common.steps.ts`
- **Sinh ra để làm gì?**:
  - Định nghĩa các step kiểm tra chung, ví dụ: `Then('hiển thị thông báo {string}', async ({ page }, message) => ...)` giúp tái sử dụng cho mọi màn hình.

---

### F. NHÓM CI/CD, THÔNG BÁO & BÁO CÁO (`automation_test/ci/` & Pipeline)

#### 23. `automation_test/Jenkinsfile`
- **Tại sao lại sinh ra file đấy?**: Tự động hóa quá trình kiểm thử trong quy trình tích hợp liên tục (CI/CD), tự động kích hoạt khi có commit mới hoặc chạy theo lịch hẹn.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-jenkins` (Bước 5 trong quy trình AutoTest 5 bước).
  - **Reference**: `.claude/skills/autotest-pw-jenkins/`
- **Sinh ra để làm gì?**:
  - Định nghĩa pipeline chạy trên Jenkins agent gồm các stage: Checkout mã nguồn, Cài đặt dependencies (`npm install`), Chuyển đổi BDD (`npm run bddgen`), Thực thi Playwright test, Tổng hợp báo cáo kết quả, Publish HTML Report, Ghép ảnh lỗi và Gửi thông báo đến chat group.

#### 24. `automation_test/ci/summarize.ts`
- **Tại sao lại sinh ra file đấy?**: File kết quả thô của Playwright (`results/results.json`) rất lớn và phức tạp. Cần một script rút gọn dữ liệu thành bản tóm tắt ngắn gọn.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/ci/summarize.ts`
- **Sinh ra để làm gì?**:
  - Đọc `results/results.json`, trích xuất số lượng: tổng số test, số test passed, failed, flaky, skipped.
  - Liệt kê danh sách các ca lỗi kèm theo thông tin mã TC, đường dẫn ảnh chụp màn hình bị fail và trace file; xuất ra file `results/summary.json`.

#### 25. `automation_test/ci/collage.ts`
- **Tại sao lại sinh ra file đấy?**: Khi có nhiều test case bị fail, việc xem từng ảnh screenshot riêng lẻ rất mất thời gian.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/ci/collage.ts`
- **Sinh ra để làm gì?**:
  - Sử dụng chính trình duyệt Chromium headless của Playwright để kết xuất một trang HTML lưới (Grid) ghép tối đa 12 ảnh screenshot lỗi lại thành 1 ảnh duy nhất (`results/merged_failures.png`) có gắn nhãn mã Test Case. Không cần cài thêm thư viện xử lý ảnh nặng nề như Sharp hay Pillow.

#### 26. `automation_test/ci/notify.ts`
- **Tại sao lại sinh ra file đấy?**: Cần bắn kết quả chạy test tự động lên các kênh chat của dự án (Telegram, Vops Viettel) ngay khi build hoàn tất.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/ci/notify.ts`
- **Sinh ra để làm gì?**:
  - Đọc dữ liệu từ `results/summary.json`, định dạng thành tin nhắn tóm tắt đẹp mắt (gồm số lượng pass/fail, tỷ lệ phần trăm, link xem HTML report).
  - Đính kèm ảnh lưới lỗi `merged_failures.png` và gửi qua Bot Telegram hoặc webhook Vops. Đảm bảo bảo mật token (đọc từ biến môi trường của Jenkins).

#### 27. `automation_test/ci/tc-catalog.ts`
- **Tại sao lại sinh ra file đấy?**: Cần có một công cụ tự động quét mã nguồn để tổng hợp danh mục toàn bộ các Test Case hiện có trong dự án thành một bảng theo dõi tập trung.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-pw-web` (Bước 4 - scaffold core).
  - **Reference**: `.claude/skills/autotest-pw-web/templates/core/ci/tc-catalog.ts`
- **Sinh ra để làm gì?**:
  - Quét qua toàn bộ các file `.feature` và `.md` trong thư mục `docs/features/`.
  - Đối chiếu mã TC, tiêu đề, tag và xuất ra bảng danh mục test cases giúp quản lý tiến độ và độ bao phủ của dự án.

#### 28. `automation_test/python_lib/env_secrets.py`
- **Tại sao lại sinh ra file đấy?**: Cung cấp cơ chế nạp biến môi trường/credentials cho các công cụ phụ trợ hoặc dự án lai hỗ trợ Robot Framework/Python.
- **Sinh ra từ skill nào?**:
  - **Skill**: `/autotest-credentials` (quản lý credential).
  - **Reference**: `.claude/skills/autotest-credentials/`
- **Sinh ra để làm gì?**:
  - Phân tích file `.env` và biến môi trường của hệ điều hành, ưu tiên thứ tự nạp an toàn và trả về dictionary biến cấu hình cho các script Python trong pipeline.

---

### G. CÁC FILE TÀI LIỆU Ở THƯ MỤC GỐC REPO

#### 29. `DEMO-TECH-TALK.md`
- **Tại sao & sinh ra từ đâu?**: File kịch bản chuẩn bị cho buổi Tech Talk/Demo chia sẻ kiến thức về giải pháp Playwright BDD trong nội bộ đội ngũ.
- **Sinh ra để làm gì?**: Hướng dẫn chi tiết từng bước demo trực tiếp: từ kiểm tra domain doc, chạy bddgen, chạy test headed, xem báo cáo Monocart đến kích hoạt pipeline.

#### 30. `CONTEXT.md`
- **Tại sao & sinh ra từ đâu?**: File tóm tắt ngữ cảnh hoạt động của dự án.
- **Sinh ra để làm gì?**: Giúp các công cụ AI (như Antigravity/Claude) khi mở workspace có thể nắm bắt ngay quy tắc kiến trúc và các câu lệnh quan trọng của dự án.

#### 31. `README`
- **Tại sao & sinh ra từ đâu?**: Tài liệu hướng dẫn sử dụng chính của kho mã nguồn.
- **Sinh ra để làm gì?**: Hướng dẫn cài đặt môi trường (`Node >= 20`), cài đặt thư viện (`npm install`), các câu lệnh chạy test, debug và xem báo cáo kiểm thử.

---

*Cập nhật lần cuối: Đã bổ sung mục 18 giải thích chi tiết toàn bộ các file trong project.*
