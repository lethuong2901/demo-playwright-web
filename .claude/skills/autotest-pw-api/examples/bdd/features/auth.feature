# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=api --grep @auth
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api npx playwright test --project=api --trace on --grep @auth
# Ví dụ đã chạy xanh với API thực hành của khoá học. Scenario Outline + Examples = data-driven
# (khoá học: features/ErrorValidation.feature). Không bao giờ ghi credential thật vào .feature —
# chỉ tên role ("API"); giá trị nằm ở automation_test/.env.
@api @auth
Feature: API đăng nhập

  @TC-005 @smoke
  Scenario: TC-005 — Login API trả về token
    When gọi API đăng nhập bằng tài khoản "API"
    Then API đăng nhập trả về token

  @TC-030 @negative
  Scenario Outline: TC-030 — Login API sai dữ liệu [<case>]
    When gọi API đăng nhập với email "<email>" và mật khẩu "<password>"
    Then API trả về mã <status> với thông báo "<message>"

    Examples:
      | case             | email                 | password  | status | message                      |
      | sai mật khẩu     | not-exist@example.com | Wrong@123 | 400    | Incorrect email or password. |
      | email không tồn tại | nobody@nowhere.vn  | Abc@12345 | 400    | Incorrect email or password. |
