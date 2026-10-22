# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @upload-download
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=web-chromium --headed --trace on --grep @upload-download
# Khoá học: tests/upload-download.spec.js (download → sửa Excel bằng exceljs → upload → kiểm tra bảng).
@upload-download
Feature: Upload và download file Excel

  @TC-121 @regression
  Scenario: TC-121 — Sửa giá trong file Excel đã tải về rồi upload lại
    Given người dùng mở trang upload download
    When người dùng tải file Excel về
    And người dùng sửa giá của "Mango" thành "350" trong file Excel
    And người dùng upload file Excel đã sửa
    Then bảng hiển thị giá của "Mango" là "350"
