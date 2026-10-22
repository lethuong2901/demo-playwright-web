// Steps: bdd/features/order.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=api --grep @order
import { expect } from '@fixtures/index';
import { DataTable } from 'playwright-bdd';
import { Given, When, Then, After } from './bdd';
import { OrderService, type CreateOrderResponse, type OrderLine } from '@services/order/OrderService';

Given('đã đăng nhập API', async ({ authedApi }) => {
  expect(authedApi).toBeTruthy(); // authedApi fixture is already logged in (one token per worker)
});

When('tạo đơn hàng cho quốc gia {string} với sản phẩm {string}', async ({ authedApi, ctx }, country: string, productOrderedId: string) => {
  ctx.set('order', await new OrderService(authedApi).create([{ country, productOrderedId }]));
});

When('tạo đơn hàng gồm các dòng:', async ({ authedApi, ctx }, table: DataTable) => {
  const lines = table.hashes() as unknown as OrderLine[];
  ctx.set('order', await new OrderService(authedApi).create(lines));
});

Then('API trả về thông báo {string}', async ({ ctx }, message: string) => {
  expect(ctx.get<CreateOrderResponse>('order').message).toBe(message);
});

Then('chi tiết đơn hàng có quốc gia {string}', async ({ authedApi, ctx }, country: string) => {
  const details = await new OrderService(authedApi).details(ctx.get<CreateOrderResponse>('order').orders[0]);
  expect(details.data.country).toBe(country);
});

Then('đơn hàng có {int} mã đơn', async ({ ctx }, count: number) => {
  expect(ctx.get<CreateOrderResponse>('order').orders).toHaveLength(count);
});

// Cleanup — tagged hook: only @order scenarios, runs even when a step failed
After({ tags: '@order' }, async ({ authedApi, ctx }) => {
  if (!ctx.has('order')) return;
  const orders = new OrderService(authedApi);
  for (const id of ctx.get<CreateOrderResponse>('order').orders) await orders.remove(id);
});
