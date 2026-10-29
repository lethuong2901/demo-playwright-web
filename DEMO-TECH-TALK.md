# Khung Demo Tech Talk — Playwright & AutoTest Skills

> **Buổi 2 — Tech Talk AutoTest Skills**
> Demo live 40 phút, full 5 bước workflow, so sánh Robot Framework vs Playwright

---

## Tổng quan

| Thông tin | Chi tiết |
|-----------|----------|
| Thời lượng demo | 40 phút |
| Hình thức | **Live demo** |
| Ứng dụng | [Demoblaze](https://www.demoblaze.com) — e-commerce mẫu |
| Chức năng demo | Đăng ký (Signup) |
| Đối tượng | QC chưa biết code + QC đã biết automation |
| So sánh | Playwright vs Robot Framework |

---

## Phân bổ thời gian

| # | Phần | Nội dung | Thời gian |
|---|------|----------|-----------|
| **0** | Mở đầu | Giới thiệu Demoblaze, mục tiêu demo, show project trống | 2 phút |
| **1** | Bước 1: Domain Docs | `/autotest-project-docs` — 3 nguồn tài liệu | 4 phút |
| **2** | Bước 2: Test Scenarios | `/autotest-scenarios` — AI phân tích 6 góc nhìn + 7 kỹ thuật | 5 phút |
| **3** | Bước 3: Strategy | `/autotest-strategy` — Đề xuất gộp/tách TC, chọn công cụ | 3 phút |
| **4a** | Bước 4: Playwright | `/autotest-pw-web` — Verify locator live, viết code, chạy test | 8 phút |
| **4b** | So sánh: RF | `/autotest-rf-web` cùng TC — So sánh code + report | 5 phút |
| **5** | Bước 5: Jenkins | `/autotest-pw-jenkins` — Jenkinsfile, tick TC, MinIO, Vops | 4 phút |
| **6** | Reports | Monocart vs log.html, trace viewer | 3 phút |
| **7** | Credential | `.env`, `~/.vds/sdlc-config.env` — bảo mật | 2 phút |
| **8** | Tổng kết | Bảng so sánh, khi nào dùng gì, Q&A | 4 phút |
| | **Tổng** | | **40 phút** |

---

## Chi tiết từng phần

### Phần 0: Mở đầu (2 phút)

**Hành động:**
1. Mở browser → `https://www.demoblaze.com`
2. Click vào "Sign up" để show form đăng ký
3. Mở terminal tại thư mục project demo

**Script nói:**
> "Hôm nay mình sẽ demo chức năng Đăng ký trên website Demoblaze — một website thương mại điện tử mẫu."
> "Project hiện tại trống hoàn toàn, chưa có gì. Mình sẽ chạy full 5 bước, AI tự làm hết từ đầu đến cuối."

**Lệnh kiểm tra:**
```bash
ls -la
# → Thấy project trống hoặc chỉ có .claude/
```

---

### Phần 1: Bước 1 — Domain Docs (4 phút)

**Lệnh:**
```bash
/autotest-project-docs tạo tài liệu cho demoblaze
```

**Demo 3 nguồn tài liệu:**

| Nguồn | Mô tả | Khi nào dùng |
|-------|-------|--------------|
| **Confluence** | Paste link → AI fetch toàn bộ trang + trang con | Có sẵn tài liệu trên Confluence |
| **File/Text** | Paste nội dung hoặc đường dẫn (.md, .pdf, .docx) | Có file tài liệu local |
| **AI tự tạo** | Trả lời 5 câu hỏi → AI sinh docs | Chưa có tài liệu |

**Trả lời câu hỏi của AI:**
- URL: `https://www.demoblaze.com`
- Mô tả: Website bán điện thoại, laptop, màn hình
- Xác thực: Có đăng ký/đăng nhập
- Tính năng chính: Signup, Login, Add to cart, Checkout

**Kết quả:**
```
automation_test/docs/
├── global-data.md          # URL, key credential (không có value)
├── product-overview.md     # Mô tả sản phẩm
└── features/signup/
    └── business-scenario.md
```

**Điểm nhấn cho khán giả:**
> "Credential chỉ có KEY, không có VALUE. AI không bao giờ hỏi mật khẩu trong chat."

---

### Phần 2: Bước 2 — Test Scenarios (5 phút)

**Lệnh:**
```bash
/autotest-scenarios viết kịch bản cho chức năng signup
```

**AI phân tích theo 6 góc nhìn:**

| Góc nhìn | Ví dụ TC |
|----------|----------|
| Happy Path | Đăng ký thành công với thông tin hợp lệ |
| Business Rules | Username tối thiểu 3 ký tự |
| Security | Không cho phép SQL injection |
| Negative | Đăng ký với username đã tồn tại |
| Edge Cases | Username chứa ký tự đặc biệt |
| UI State | Hiển thị lỗi khi để trống field |

**7 kỹ thuật thiết kế TC:**
- Equivalence Partitioning
- Boundary Value Analysis
- Use Case/Flow Testing
- Decision Table
- State Transition
- Pairwise
- Error Guessing

**Kết quả:**
```
automation_test/docs/features/signup/test-cases.md
```

**Bảng TC sinh ra:**

| TC | Title | Category | Priority |
|----|-------|----------|----------|
| TC-001 | Đăng ký thành công với username và password hợp lệ | Happy Path | High |
| TC-002 | Đăng ký thất bại khi username đã tồn tại | Negative | High |
| TC-003 | Đăng ký thất bại khi để trống username | Negative | Medium |
| TC-004 | Đăng ký thất bại khi để trống password | Negative | Medium |

**Điểm nhấn:**
> "Priority được tính theo công thức Risk = Likelihood × Impact, không phải cảm tính."
> "Mỗi TC có Source trỏ về tài liệu gốc để verify."

---

### Phần 3: Bước 3 — Strategy (3 phút)

**Lệnh:**
```bash
/autotest-strategy phân tích signup
```

**AI đề xuất:**
- Gộp TC sequential thành 1 flow
- Tách data-driven cho các case negative
- Ước tính effort
- **Hỏi chọn công cụ: Playwright hay Robot Framework?**

**Kết quả:**
```
automation_test/docs/features/signup/strategy.md
```

**Trả lời:**
> "Chọn Playwright trước, sau đó mình sẽ demo thêm Robot Framework để so sánh."

---

### Phần 4a: Bước 4 — Playwright (8 phút) ⭐ PHẦN CHÍNH

**Lệnh:**
```bash
/autotest-pw-web viết test cho signup
```

**Quy trình AI làm:**

| Bước | Hành động | Thời gian |
|------|-----------|-----------|
| 1 | Đọc TC file, hỏi chọn TC cần viết | 30s |
| 2 | **Verify locator LIVE** — mở browser thật, tìm element | 2 phút |
| 3 | Viết file .feature (Gherkin) | 1 phút |
| 4 | Viết steps.ts + Page Object | 2 phút |
| 5 | Chạy test headed | 2 phút |

**File sinh ra:**

```
automation_test/
├── bdd/features/signup.feature     # Gherkin
├── bdd/steps/signup.steps.ts       # Step definitions
├── pages/signup/SignupPage.ts      # Page Object
└── pages/POManager.ts              # Quản lý page objects
```

**Code mẫu — signup.feature:**
```gherkin
# Chạy: npx bddgen && npx playwright test --project=web-chromium --headed --grep @signup
@web @signup
Feature: Đăng ký tài khoản

  @TC-001 @smoke
  Scenario: TC-001 — Đăng ký thành công với username và password hợp lệ
    Given người dùng ở trang chủ Demoblaze
    When người dùng click nút "Sign up"
    And người dùng nhập username "testuser_123"
    And người dùng nhập password "Pass@123"
    And người dùng click nút đăng ký
    Then hiển thị thông báo đăng ký thành công
```

**Code mẫu — SignupPage.ts:**
```typescript
import { BasePage } from '../BasePage';

export class SignupPage extends BasePage {
  readonly path = '/';

  // Locators — semantic, verified live
  readonly signupLink = this.page.getByRole('link', { name: 'Sign up' });
  readonly usernameInput = this.page.locator('#sign-username');
  readonly passwordInput = this.page.locator('#sign-password');
  readonly signupButton = this.page.getByRole('button', { name: 'Sign up' });

  async signup(username: string, password: string) {
    await this.signupLink.click();
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signupButton.click();
  }
}
```

**Chạy test:**
```bash
cd automation_test && npx bddgen && npx playwright test --project=web-chromium --headed --grep @signup
```

**Điểm nhấn cho QC mới:**
> "Mình không viết code, AI tự viết. File .feature đọc được như tiếng Việt — BA, PO đều hiểu."

**Điểm nhấn cho QC đã biết automation:**
> "Locator semantic (getByRole, getByLabel) — không dùng XPath phức tạp."
> "Auto-waiting — không cần Sleep, Playwright tự chờ element sẵn sàng."
> "Page Object pattern với POManager — giống khóa học Playwright."

---

### Phần 4b: So sánh Robot Framework (5 phút)

**Lệnh:**
```bash
/autotest-rf-web viết test cho signup
```

**File sinh ra:**
```
automation_test/
├── tests/signup.robot
├── features/signup/signup_keywords.resource
└── features/signup/signup_locators.resource
```

**Code mẫu — signup.robot:**
```robot
*** Test Cases ***
TC-001 — Đăng ký thành công với username và password hợp lệ
    [Tags]    TC-001    smoke    signup
    Mở Trang Chủ Demoblaze
    Click Sign Up
    Nhập Username    testuser_123
    Nhập Password    Pass@123
    Click Nút Đăng Ký
    Verify Thông Báo Đăng Ký Thành Công
```

**Bảng so sánh trực tiếp:**

| Tiêu chí | Playwright | Robot Framework |
|----------|------------|-----------------|
| **File test** | `.feature` (Gherkin) | `.robot` (keyword) |
| **Ngôn ngữ** | TypeScript | Python/Keyword |
| **Locator** | `getByRole`, `getByLabel` | XPath, CSS |
| **Wait** | Auto-waiting | `Wait Until Element...` |
| **Verify locator** | Playwright MCP | RobotMCP |
| **Report** | Monocart + Trace | log.html + report.html |
| **Tốc độ** | Nhanh hơn | Chậm hơn |
| **iOS** | Không hỗ trợ | Có (Appium) |
| **Android** | Thử nghiệm (ADB) | Ổn định (Appium) |

**Chạy RF:**
```bash
cd automation_test && robot -d results tests/signup.robot
```

---

### Phần 5: Bước 5 — Jenkins (4 phút)

**Lệnh:**
```bash
/autotest-pw-jenkins tạo pipeline
```

**Kết quả:**
```
automation_test/
├── Jenkinsfile
├── ci/notify.ts
└── ci/tc-catalog.ts
```

**Tham số Build with Parameters:**

| Tham số | Mô tả |
|---------|-------|
| `ENV` | Môi trường (dev/uat/prod) |
| `FEATURES` | **Tick chọn feature** (checkbox) |
| `TC_LIST` | **Tick từng TC** của feature đã chọn |
| `GREP` | Lọc theo tag (@smoke, @regression) |
| `WORKERS` | Số worker parallel (1 = tuần tự) |

**Điểm nhấn:**
> "Không cần gõ tên TC, chỉ cần tick chọn trên Jenkins UI."
> "Danh sách TC tự sinh từ file .feature bằng `npm run ci:catalog`."

**Tính năng CI/CD:**
- Report đẩy lên MinIO (link trong Jenkins build)
- Thông báo Vops/Telegram kèm ảnh gộp lỗi
- JUnit XML cho Jenkins plugin

---

### Phần 6: Reports (3 phút)

**So sánh Report:**

| Report | Playwright | Robot Framework |
|--------|------------|-----------------|
| **Tổng hợp** | Monocart (`npm run report:monocart`) | report.html |
| **Chi tiết** | Trace viewer (screenshot + network + console) | log.html |
| **CI** | JUnit XML | output.xml |
| **Ảnh/Video** | Tự động đính kèm | Phải cấu hình |

**Demo Monocart:**
1. Mở `results/monocart-report/index.html`
2. Click vào TC → xem cây step
3. Click vào step fail → xem screenshot + trace
4. Filter theo tag (@smoke, @regression)

**Lệnh mở report:**
```bash
npm run report:monocart    # Monocart
npm run report             # Playwright HTML
npm run summary            # Tóm tắt pass/fail
```

---

### Phần 7: Credential (2 phút)

**2 file credential:**

| File | Chứa | Phạm vi |
|------|------|---------|
| `automation_test/.env` | Tài khoản test (WEB_USERNAME, DB_PASS...) | Project (gitignored) |
| `~/.vds/sdlc-config.env` | Token công cụ (Confluence, Jenkins, Vops) | Máy (dùng chung) |

**Quy tắc bảo mật:**
- Skill tạo sẵn file với KEY, user tự điền VALUE
- **Không bao giờ** hỏi/đọc/in credential trong chat
- Lỡ paste mật khẩu vào chat → đổi mật khẩu ngay
- Không truyền credential qua command line (lộ trong `ps`, history)

**Show file .env:**
```bash
cat automation_test/.env.example
# WEB_USERNAME=
# WEB_PASSWORD=
# → Chỉ có KEY, không có VALUE
```

---

### Phần 8: Tổng kết (4 phút)

**Bảng khi nào dùng gì:**

| Tình huống | Chọn |
|------------|------|
| Web/API, cần tốc độ | **Playwright** |
| Có iOS | **Robot Framework** |
| Android production | **Robot Framework** (Appium ổn định) |
| Android thử nghiệm | **Playwright** (qua ADB) |
| Team biết JS/TS | **Playwright** |
| Team biết Python | **Robot Framework** |
| BA/PO cần đọc test | **Playwright** (Gherkin) |
| Đã có RF code | **Giữ Robot Framework** |

**Tóm tắt workflow:**

```
Bước 1  /autotest-project-docs     → Tạo tài liệu
Bước 2  /autotest-scenarios        → Tạo TC
Bước 3  /autotest-strategy         → Chọn công cụ
Bước 4  /autotest-pw-web           → Viết test (Playwright)
        /autotest-rf-web           → Viết test (Robot Framework)
Bước 5  /autotest-pw-jenkins       → CI/CD
```

**Hoặc chạy full 1 lệnh:**
```bash
vsaf autotest-skill/automation-test viết test signup cho demoblaze bằng playwright
```

**Q&A**

---

## Checklist chuẩn bị trước demo

- [ ] Internet ổn định (hoặc có backup 4G)
- [ ] Node 20+ đã cài (`node --version`)
- [ ] `npm install` đã chạy xong trong `automation_test/`
- [ ] `npx playwright install chromium` đã cài browser
- [ ] Python 3.9+ đã cài (cho Robot Framework)
- [ ] Terminal font đủ lớn (14pt+) để khán giả đọc
- [ ] Browser sạch (không extension gây nhiễu)
- [ ] Demoblaze accessible (check mạng)
- [ ] Backup video demo phòng trường hợp lỗi mạng
- [ ] **Test thử 1 lần trước buổi demo**

---

## Xử lý sự cố khi demo

| Sự cố | Xử lý |
|-------|-------|
| Mạng chậm/mất | Chuyển sang video backup |
| Demoblaze down | Dùng localhost mock hoặc site khác (TodoMVC) |
| AI trả lời lâu | Giải thích trong lúc chờ, show code đã prepare |
| Test fail | Debug live — đây là cơ hội show khả năng AI debug |
| Browser bị block | Tắt extension, dùng incognito |

---

## Tài liệu tham khảo

- README chính: [README](./README)
- Skill Playwright Web: `.claude/skills/autotest-pw-web/SKILL.md`
- Best practices: `.claude/skills/autotest-pw-web/references/web-best-practices.md`
- Kế hoạch Tech Talk: `/Users/hieunv67/auto/frontend-slides/Kê hoạch teck talk playwright.md`
