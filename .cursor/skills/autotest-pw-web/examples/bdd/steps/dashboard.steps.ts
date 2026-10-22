// Steps: bdd/features/login.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @login
import { When, Then, Given } from './bdd';

// Course WebAPIPart1: token lấy qua API → localStorage trước khi app chạy → bỏ qua màn đăng nhập
Given('người dùng vào app bằng token API', async ({ page, apiToken }) => {
  await page.addInitScript((token) => window.localStorage.setItem('token', token), apiToken);
});

// Course NetworkTest: giả lập response — đăng ký route TRƯỚC thao tác gọi API
Given('API danh sách đơn hàng trả về rỗng', async ({ page }) => {
  await page.route('**/api/ecom/order/get-orders-for-customer/*', (route) => route.fulfill({ json: { data: [], message: 'No Orders' } }));
});

When('người dùng mở trang Dashboard', async ({ poManager }) => {
  await poManager.getDashboardPage().open();
});

When('người dùng bấm nút ORDERS', async ({ poManager }) => {
  await poManager.getDashboardPage().ordersButton.click();
});

Then('danh sách sản phẩm được hiển thị', async ({ poManager }) => {
  await poManager.getDashboardPage().expectLoaded();
});
