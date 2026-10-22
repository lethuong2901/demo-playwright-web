# Chạy: npx bddgen && npx playwright test --project=web-chromium --headed --grep @alert
# Example: Xử lý alert dialog (sync và async) - Demoblaze signup
@web @alert
Feature: Alert Handling — Sync vs Async patterns

  # Pattern A: Sync alert - client-side validation (empty fields)
  # Alert xuất hiện NGAY LẬP TỨC khi click, block click action
  @TC-ALERT-001 @sync
  Scenario: TC-ALERT-001 — Sync alert khi bỏ trống form (client-side validation)
    Given mở trang signup Demoblaze
    When click nút Sign up với form trống
    Then alert hiển thị message "Please fill out Username and Password."

  # Pattern B: Async alert - after API response
  # Alert xuất hiện SAU KHI API trả về, click hoàn thành trước
  @TC-ALERT-002 @async
  Scenario: TC-ALERT-002 — Async alert sau API response (user đã tồn tại)
    Given mở trang signup Demoblaze
    When điền username "admin" và password "admin"
    And click nút Sign up
    Then alert hiển thị message "This user already exist."

  # Pattern C: Universal - xử lý cả sync và async
  # Dùng khi không chắc alert xuất hiện sync hay async
  @TC-ALERT-003 @universal
  Scenario: TC-ALERT-003 — Universal pattern cho cả sync và async
    Given mở trang signup Demoblaze
    When điền username ngẫu nhiên và password "Test@123"
    And click nút Sign up
    Then alert hiển thị message "Sign up successful."
