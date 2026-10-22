# Chạy: npx bddgen && npx playwright test --project=web-chromium --headed --grep @signup
# Debug: npx bddgen && DEBUG=pw:api npx playwright test --project=web-chromium --headed --trace on --grep @signup
@web @signup
Feature: Đăng ký tài khoản - Demoblaze

  @TC-001 @ui @smoke
  Scenario: TC-001 — Kiểm tra hiển thị nút Sign up trên header
    Given người dùng truy cập trang chủ Demoblaze
    Then nút Sign up hiển thị trên header

  @TC-002 @ui
  Scenario: TC-002 — Kiểm tra hiển thị popup Sign up khi click nút Sign up
    Given người dùng truy cập trang chủ Demoblaze
    When người dùng click nút Sign up trên header
    Then popup Sign up hiển thị với đầy đủ các thành phần

  @TC-003 @happy-path @regression
  Scenario: TC-003 — Đăng ký tài khoản thành công với username và password hợp lệ
    Given người dùng truy cập trang chủ Demoblaze
    When người dùng click nút Sign up trên header
    And người dùng nhập username ngẫu nhiên
    And người dùng nhập password "Test@123"
    And người dùng click nút Sign up trong popup
    Then alert hiển thị với message "Sign up successful."

  @TC-004 @negative @regression
  Scenario: TC-004 — Đăng ký thất bại khi username đã tồn tại
    Given người dùng truy cập trang chủ Demoblaze
    When người dùng click nút Sign up trên header
    And người dùng nhập username "admin"
    And người dùng nhập password "admin"
    And người dùng click nút Sign up trong popup
    Then alert hiển thị với message "This user already exist."

  @TC-005 @negative
  Scenario: TC-005 — Đăng ký thất bại khi bỏ trống Username
    Given người dùng truy cập trang chủ Demoblaze
    When người dùng click nút Sign up trên header
    And người dùng để trống username
    And người dùng nhập password "Test@123"
    And người dùng click nút Sign up trong popup
    Then alert hiển thị với message "Please fill out Username and Password."

  @TC-006 @negative
  Scenario: TC-006 — Đăng ký thất bại khi bỏ trống Password
    Given người dùng truy cập trang chủ Demoblaze
    When người dùng click nút Sign up trên header
    And người dùng nhập username "testuser_new"
    And người dùng để trống password
    And người dùng click nút Sign up trong popup
    Then alert hiển thị với message "Please fill out Username and Password."

  @TC-007 @ui
  Scenario: TC-007 — Đóng popup Sign up khi click nút Close
    Given người dùng truy cập trang chủ Demoblaze
    When người dùng click nút Sign up trên header
    And popup Sign up hiển thị với đầy đủ các thành phần
    And người dùng click nút Close trong popup
    Then popup Sign up đóng lại
