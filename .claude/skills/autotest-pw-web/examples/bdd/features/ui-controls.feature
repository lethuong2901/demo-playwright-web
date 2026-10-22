# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @ui-controls
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=web-chromium --headed --trace on --grep @ui-controls
# Khoá học: tests/UIBasicstest.spec.js (dropdown, radio, checkbox, child window) + tests/llc.spec.js
# (locator đặc biệt getByLabel/getByPlaceholder/getByRole/filter, ghi đè timeout).
@ui-controls
Feature: Điều khiển giao diện

  @TC-101 @regression
  Scenario: TC-101 — Chọn dropdown, radio button và checkbox
    Given người dùng mở trang luyện tập đăng nhập
    When người dùng chọn vai trò "consult" trong dropdown
    Then dropdown vai trò có giá trị "consult"
    When người dùng chọn loại tài khoản "User"
    Then radio "User" được chọn
    When người dùng tick ô đồng ý điều khoản
    Then ô đồng ý điều khoản được tick
    When người dùng bỏ tick ô đồng ý điều khoản
    Then ô đồng ý điều khoản không được tick
    And link tài liệu có class "blinkingText"

  @TC-102 @regression
  Scenario: TC-102 — Mở link ở tab mới (child window) và dùng dữ liệu ở tab cũ
    Given người dùng mở trang luyện tập đăng nhập
    When người dùng mở link tài liệu ở tab mới
    Then tab mới hiển thị email có domain "rahulshettyacademy.com"
    When người dùng nhập domain lấy được vào ô username ở tab cũ
    Then ô username có giá trị "rahulshettyacademy.com"

  # @timeout:90000 = ghi đè TEST timeout cho riêng scenario này (course: test.setTimeout / timeout cấp test)
  @TC-103 @regression @timeout:90000
  Scenario: TC-103 — Submit form Angular bằng locator đặc biệt
    Given người dùng mở trang form Angular
    When người dùng tick "Check me out if you Love IceCreams!" và chọn "Employed"
    And người dùng chọn giới tính "Female" và nhập mật khẩu "abc123"
    And người dùng bấm nút "Submit"
    Then form hiển thị thông báo thành công "Success! The Form has been submitted successfully!."
    When người dùng vào Shop và thêm "Nokia Edge" vào giỏ
    Then nút Checkout trên header hiển thị "1"
