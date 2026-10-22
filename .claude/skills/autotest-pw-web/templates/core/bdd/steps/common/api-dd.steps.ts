// Steps chung cho API data-driven — dùng bởi bdd/features/<bộ>.dd.feature (sinh từ data/api/<bộ>.csv bằng `npm run dd:sync`)
// Chạy (trong automation_test/): npm run dd:sync && npx bddgen && npx playwright test --project=api --grep @<bộ>
import { expect } from '@playwright/test';
import { When, Then } from '../bdd';
import { ApiClient } from '@services/base/ApiClient';
import { diffSubset, findDdRow, resolveDynamic, toQuery, type DdRow } from '@support/dd';

interface DdResult {
  row: DdRow;
  status: number;
  body: unknown;
}

async function sendRow(client: ApiClient, row: DdRow): Promise<DdResult> {
  const body = resolveDynamic(row.requestBody);
  const url = resolveDynamic(row.url);
  // Giống Mode D của Robot Framework: GET gửi request_body thành query params, method khác gửi JSON body.
  const options = row.method === 'GET' ? { params: toQuery(body) } : { data: body };
  const verb = row.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
  const response = await client[verb](url, { ...options, expectStatus: 'any' });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    // Không phải JSON: giữ nguyên chuỗi, bước Then so như chuỗi.
  }
  return { row, status: response.status(), body: parsed };
}

When('gửi request data-driven {string} của bộ {string}', async ({ authedApi, ctx }, tc: string, set: string) => {
  ctx.set<DdResult>('dd', await sendRow(authedApi, findDdRow(set, tc)));
});

When('gửi request data-driven không đăng nhập {string} của bộ {string}', async ({ api, ctx }, tc: string, set: string) => {
  ctx.set<DdResult>('dd', await sendRow(api, findDdRow(set, tc)));
});

Then('response khớp kỳ vọng của dòng data-driven', async ({ ctx }) => {
  const { row, status, body } = ctx.get<DdResult>('dd');
  const problems = status === row.status ? [] : [`status: mong đợi ${row.status}, thực tế ${status}`];
  if (row.expected !== undefined) problems.push(...diffSubset(body, row.expected));
  expect(problems, `${row.tc} — ${row.method} ${row.url}\n${problems.join('\n')}`).toEqual([]);
});
