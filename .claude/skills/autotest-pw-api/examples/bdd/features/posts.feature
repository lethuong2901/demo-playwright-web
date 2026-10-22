# Run (trong automation_test/): npx bddgen && npx playwright test --project=api --grep @posts
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=api --trace on --grep @posts
@api @posts
Feature: JSONPlaceholder — Posts API

  @TC-001 @smoke
  Scenario: TC-001 — Lấy bài viết theo id
    When lấy bài viết id 1
    Then bài viết trả về có tiêu đề không rỗng

  @TC-002 @regression
  Scenario: TC-002 — Tạo bài viết mới
    When tạo bài viết từ dữ liệu "TC-002"
    Then bài viết được tạo có id hợp lệ
