# Test Strategy — Signup Feature

## Scope
- **Feature**: Signup (Đăng ký tài khoản)
- **Platform**: Web
- **Framework**: Playwright TypeScript
- **Test Cases**: 7 TCs (từ test-cases.md)

## Automation Scope

| TC ID | Tên TC | Automate | Ghi chú |
|-------|--------|----------|---------|
| TC-001 | Kiểm tra hiển thị nút Sign up | YES | UI verification |
| TC-002 | Kiểm tra hiển thị popup Sign up | YES | Modal verification |
| TC-003 | Đăng ký thành công | YES | Happy path |
| TC-004 | Đăng ký thất bại - username tồn tại | YES | Negative |
| TC-005 | Đăng ký thất bại - username trống | YES | Negative |
| TC-006 | Đăng ký thất bại - password trống | YES | Negative |
| TC-007 | Đóng popup Sign up | YES | UI interaction |

## Technical Approach

### Framework Stack
- **Test Runner**: Playwright Test
- **BDD**: playwright-bdd (Gherkin syntax)
- **Page Object**: POM pattern với POManager

### Key Implementation Notes
- Handle `window.alert()` bằng `page.on('dialog')`
- Bootstrap modal cần wait for visible
- Random username để tránh duplicate: `testuser_${Date.now()}`

## Environment
- **URL**: https://www.demoblaze.com
- **Browser**: Chromium (default)

## Estimation
- **Total TCs**: 7
- **Automatable**: 7 (100%)
