// Steps: bdd/features/auth.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=api --grep @auth
import { expect } from '@fixtures/index';
import { When, Then } from './bdd';
import { AuthService } from '@services/auth/AuthService';
import { CREDENTIALS } from '@config/env';

When('gọi API đăng nhập bằng tài khoản {string}', async ({ api, ctx }, role: string) => {
  const creds = { API: CREDENTIALS.api }[role];
  if (!creds) throw new Error(`Role "${role}" chưa khai báo trong step — thêm getter vào CREDENTIALS`);
  ctx.set('token', await new AuthService(api).login(creds.username, creds.password));
});

Then('API đăng nhập trả về token', async ({ ctx }) => {
  expect(ctx.get<string>('token')).toBeTruthy();
});

When('gọi API đăng nhập với email {string} và mật khẩu {string}', async ({ api, ctx }, email: string, password: string) => {
  // Status is asserted by the Then step → no status check here
  const response = await new AuthService(api).loginResponse(email, password);
  ctx.set('response', { status: response.status(), body: (await response.json()) as { message: string } });
});

Then('API trả về mã {int} với thông báo {string}', async ({ ctx }, status: number, message: string) => {
  const res = ctx.get<{ status: number; body: { message: string } }>('response');
  expect(res.status).toBe(status);
  expect(res.body.message).toBe(message);
});
