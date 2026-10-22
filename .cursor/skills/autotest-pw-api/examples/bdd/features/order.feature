# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=api --grep @order
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=api --trace on --grep @order
# Ví dụ đã chạy xanh với API thực hành của khoá học. Minh hoạ: Background (tiền điều kiện chung),
# Scenario Outline + Examples (data-driven), DataTable (bảng dữ liệu trong 1 step), dọn dữ liệu bằng
# After hook có tag (bdd/steps/order.steps.ts).
@api @order
Feature: API đơn hàng

  Background:
    Given đã đăng nhập API

  @TC-020 @smoke
  Scenario: TC-020 — Tạo đơn hàng và xem chi tiết
    When tạo đơn hàng cho quốc gia "Cuba" với sản phẩm "6960eac0c941646b7a8b3e68"
    Then API trả về thông báo "Order Placed Successfully"
    And chi tiết đơn hàng có quốc gia "Cuba"

  @TC-021 @regression
  Scenario Outline: TC-021 — Tạo đơn cho quốc gia <country>
    When tạo đơn hàng cho quốc gia "<country>" với sản phẩm "6960eac0c941646b7a8b3e68"
    Then API trả về thông báo "Order Placed Successfully"

    Examples:
      | country |
      | India   |
      | Vietnam |

  @TC-022 @regression
  Scenario: TC-022 — Tạo đơn nhiều dòng sản phẩm
    When tạo đơn hàng gồm các dòng:
      | country | productOrderedId         |
      | India   | 6960eac0c941646b7a8b3e68 |
      | Cuba    | 6960eac0c941646b7a8b3e68 |
    Then API trả về thông báo "Order Placed Successfully"
    And đơn hàng có 2 mã đơn
