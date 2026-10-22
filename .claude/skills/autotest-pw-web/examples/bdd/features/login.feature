# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @login
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=web-chromium --headed --trace on --grep @login
# Ví dụ đã chạy xanh trên https://rahulshettyacademy.com (trang thực hành của khoá học).
# Quy ước: 1 file .feature / chức năng / nền tảng · Scenario = 1 TC, tiêu đề "TC-NNN — <Title nguyên văn>"
# · tag @TC-NNN + @smoke|@regression|@negative · @auth:<role> = bắt đầu ở trạng thái đã đăng nhập.
@login
Feature: Đăng nhập web

  @TC-002 @negative
  Scenario: TC-002 — Đăng nhập sai mật khẩu hiển thị thông báo lỗi
    Given người dùng mở trang đăng nhập
    When người dùng đăng nhập với email "not-exist@example.com" và mật khẩu "Wrong@123"
    Then hiển thị thông báo "Incorrect email or password."

  @TC-001 @smoke @auth:webUser
  Scenario: TC-001 — Đăng nhập thành công vào Dashboard
    Given người dùng đã đăng nhập
    When người dùng mở trang Dashboard
    Then danh sách sản phẩm được hiển thị

  @TC-004 @regression
  Scenario: TC-004 — Trang Orders rỗng khi API trả về không có đơn
    Given người dùng vào app bằng token API
    And API danh sách đơn hàng trả về rỗng
    When người dùng mở trang Dashboard
    And người dùng bấm nút ORDERS
    Then hiển thị thông báo "You have No Orders to show at this time."



  @TC-003 @smoke
  Scenario: TC-003 — Đăng nhập UI bằng tài khoản hợp lệ
    Given người dùng mở trang đăng nhập
    When người dùng đăng nhập bằng tài khoản "WEB"
    Then danh sách sản phẩm được hiển thị

