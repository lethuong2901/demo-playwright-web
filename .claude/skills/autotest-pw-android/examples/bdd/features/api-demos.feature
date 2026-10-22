# Chạy (trong automation_test/): npx bddgen && npx playwright test --project=android --workers=1 --grep @api-demos
# Nhiều log nhất (debug): npx bddgen && DEBUG=pw:api,pw:android npx playwright test --project=android --workers=1 --trace on --grep @api-demos
# Device farm: ANDROID_DEVICE_URL='http://<host>/#!/control/<serial>' npx playwright test --project=android --workers=1 --grep @api-demos
# Nguồn: automation_test/docs/features/api-demos/test-cases.md (KBKTCN-AD-01)
@android @api-demos
Feature: ApiDemos — điều hướng và điều khiển

  @TC-001 @smoke
  Scenario: TC-001 — Mở app hiển thị danh sách nhóm demo
    Given app ApiDemos đang mở
    Then hiển thị danh sách có các mục "Accessibility, Animation, App, Views"
    When người dùng bấm mục "Views"
    Then hiển thị danh sách có các mục "Buttons"

  @TC-002 @regression
  Scenario: TC-002 — Nhập text và tick checkbox ở màn hình Controls
    Given app ApiDemos đang mở
    When người dùng vào "Views" > "Controls" > "1. Light Theme"
    Then hiển thị màn hình có ô nhập text và checkbox
    When người dùng nhập "Xin chao Playwright" vào ô text
    Then ô text có giá trị "Xin chao Playwright"
    When người dùng tick "Checkbox 1"
    Then "Checkbox 1" được tick

  @TC-003 @regression
  Scenario: TC-003 — Cuộn danh sách Views tới mục cuối
    Given app ApiDemos đang mở
    When người dùng bấm mục "Views"
    Then hiển thị danh sách có các mục "Buttons"
    When người dùng cuộn danh sách tới mục "WebView"
    Then mục "WebView" hiển thị trên màn hình
