# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @more-validations
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=web-chromium --headed --trace on --grep @more-validations
# Cập nhật ảnh chuẩn (TC-116) khi giao diện đổi CÓ CHỦ ĐÍCH:
#   npx bddgen && npx playwright test --project=web-chromium --grep "@TC-116\b" --update-snapshots
# Khoá học: tests/MoreValidations.spec.js (điều hướng, ẩn/hiện, alert, hover, iframe, screenshot, visual).
@more-validations
Feature: Kiểm tra nâng cao

  Background:
    Given người dùng mở trang luyện tập tự động hoá

  @TC-111 @regression
  Scenario: TC-111 — Điều hướng tới trang khác, quay lại, đi tiếp và tải lại
    When người dùng đi tới trang luyện tập đăng nhập
    And người dùng quay lại trang trước
    Then đang ở trang luyện tập tự động hoá
    When người dùng đi tiếp trang sau
    Then đang ở trang luyện tập đăng nhập
    When người dùng tải lại trang
    Then đang ở trang luyện tập đăng nhập

  @TC-112 @regression
  Scenario: TC-112 — Ẩn và hiện ô nhập liệu
    Then ô nhập liệu được hiển thị
    When người dùng bấm nút Hide
    Then ô nhập liệu bị ẩn
    When người dùng bấm nút Show
    Then ô nhập liệu được hiển thị

  @TC-113 @regression
  Scenario Outline: TC-113 — Hộp thoại JS [<button> - <action>]
    When người dùng nhập tên "Sang" rồi bấm "<button>" và chọn "<action>" trên hộp thoại
    Then hộp thoại có nội dung "<message>"

    Examples:
      | button  | action  | message                                                     |
      | Confirm | accept  | Hello Sang, Are you sure you want to confirm?               |
      | Confirm | dismiss | Hello Sang, Are you sure you want to confirm?               |
      | Alert   | accept  | Hello Sang, share this practice page and share your knowledge |

  @TC-114 @regression
  Scenario: TC-114 — Hover menu và thao tác trong iframe
    When người dùng rê chuột vào "Mouse Hover"
    Then menu hover có các mục "Top, Reload"
    When người dùng bấm link "All Access plan" trong iframe khoá học
    Then iframe hiển thị tiêu đề chứa "Happy Subscibers"

  @TC-115 @regression
  Scenario: TC-115 — Chụp ảnh ô nhập liệu và toàn trang làm bằng chứng
    When người dùng chụp ảnh ô nhập liệu "partial-screenshot"
    And người dùng bấm nút Hide
    And người dùng chụp ảnh toàn trang "full-page"
    Then ô nhập liệu bị ẩn

  @TC-116 @visual
  Scenario: TC-116 — Giao diện trang luyện tập đăng nhập khớp ảnh chuẩn
    When người dùng đi tới trang luyện tập đăng nhập
    Then giao diện trang khớp ảnh chuẩn "login-practise.png"
