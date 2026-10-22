# Run (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @todo
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=web-chromium --headed --trace on --grep @todo
@web @todo
Feature: TodoMVC — quản lý công việc

  @TC-001 @smoke
  Scenario: TC-001 — Thêm công việc vào danh sách
    Given mở ứng dụng TodoMVC
    When người dùng thêm công việc "Mua cà phê"
    And người dùng thêm công việc "Viết test tự động"
    Then danh sách có 2 công việc
    And danh sách hiển thị công việc "Viết test tự động"
