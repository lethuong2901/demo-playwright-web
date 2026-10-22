// Steps: bdd/features/api-demos.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=android --workers=1 --grep @api-demos
import { Given, When, Then } from './bdd';

Given('app ApiDemos đang mở', async ({ functionManager }) => {
  await functionManager.getHomeFunction().expectLoaded();
});

Then('hiển thị danh sách có các mục {string}', async ({ functionManager }, items: string) => {
  await functionManager.getHomeFunction().expectItems(items.split(/,\s*/));
});

When('người dùng bấm mục {string}', async ({ functionManager }, item: string) => {
  await functionManager.getHomeFunction().open(item);
});

When('người dùng vào {string} > {string} > {string}', async ({ functionManager }, a: string, b: string, c: string) => {
  const home = functionManager.getHomeFunction();
  for (const item of [a, b, c]) await home.open(item);
});

Then('hiển thị màn hình có ô nhập text và checkbox', async ({ functionManager }) => {
  await functionManager.getControlsFunction().expectLoaded();
});

When('người dùng nhập {string} vào ô text', async ({ functionManager }, text: string) => {
  await functionManager.getControlsFunction().typeText(text);
});

Then('ô text có giá trị {string}', async ({ functionManager }, text: string) => {
  await functionManager.getControlsFunction().expectTextValue(text);
});

When('người dùng tick {string}', async ({ functionManager }, _label: string) => {
  await functionManager.getControlsFunction().tickCheckbox1();
});

Then('{string} được tick', async ({ functionManager }, _label: string) => {
  await functionManager.getControlsFunction().expectCheckbox1Checked();
});

When('người dùng cuộn danh sách tới mục {string}', async ({ functionManager }, item: string) => {
  await functionManager.getHomeFunction().scrollToItem(item);
});

Then('mục {string} hiển thị trên màn hình', async ({ functionManager }, item: string) => {
  await functionManager.getHomeFunction().expectItemVisible(item);
});
