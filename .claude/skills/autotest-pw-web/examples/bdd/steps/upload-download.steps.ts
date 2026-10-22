// Steps: bdd/features/upload-download.feature — chạy (trong automation_test/): npx bddgen && npx playwright test --project=web-chromium --headed --grep @upload-download
import { expect } from '@fixtures/index';
import { Given, When, Then } from './bdd';
import { updateCellNextTo } from '@support/excel';

const PRICE_COLUMN = { rowChange: 0, colChange: 2 }; // cột giá cách cột tên 2 ô (course: writeExcelTest)

Given('người dùng mở trang upload download', async ({ poManager }) => {
  await poManager.getUploadDownloadPage().open();
});

When('người dùng tải file Excel về', async ({ poManager, ctx, $testInfo }) => {
  // File lưu trong thư mục output của test — không dùng đường dẫn tuyệt đối như khoá học
  ctx.set('excelFile', await poManager.getUploadDownloadPage().download((name) => $testInfo.outputPath(name)));
});

When('người dùng sửa giá của {string} thành {string} trong file Excel', async ({ ctx }, fruit: string, price: string) => {
  await updateCellNextTo(ctx.get<string>('excelFile'), fruit, price, PRICE_COLUMN);
});

When('người dùng upload file Excel đã sửa', async ({ poManager, ctx }) => {
  await poManager.getUploadDownloadPage().upload(ctx.get<string>('excelFile'));
});

Then('bảng hiển thị giá của {string} là {string}', async ({ poManager }, fruit: string, price: string) => {
  await expect(poManager.getUploadDownloadPage().cell(fruit, 'cell-4-undefined')).toContainText(price);
});
