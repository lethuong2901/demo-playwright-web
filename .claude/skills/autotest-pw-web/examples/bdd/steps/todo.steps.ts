// Steps: bdd/features/todo.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @todo
import { Given, When, Then } from './bdd';

Given('mở ứng dụng TodoMVC', async ({ poManager }) => {
  await poManager.getTodoPage().open();
  await poManager.getTodoPage().expectLoaded();
});

When('người dùng thêm công việc {string}', async ({ poManager }, text: string) => {
  await poManager.getTodoPage().addTodo(text);
});

Then('danh sách có {int} công việc', async ({ poManager }, n: number) => {
  await poManager.getTodoPage().expectCount(n);
});

Then('danh sách hiển thị công việc {string}', async ({ poManager }, text: string) => {
  await poManager.getTodoPage().expectItemVisible(text);
});
