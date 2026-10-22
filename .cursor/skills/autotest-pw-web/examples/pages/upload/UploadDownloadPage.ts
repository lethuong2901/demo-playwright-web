import { expect, type Download, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/** https://rahulshettyacademy.com/upload-download-test/ — course upload-download.spec.js */
export class UploadDownloadPage extends BasePage {
  protected readonly path = '/upload-download-test/index.html';
  readonly downloadButton: Locator;
  readonly fileInput: Locator;

  constructor(page: Page) {
    super(page);
    this.downloadButton = page.getByRole('button', { name: 'Download' });
    this.fileInput = page.locator('#fileinput');
  }

  /** Bấm Download, lưu file vào thư mục output của test (không dùng đường dẫn tuyệt đối) */
  async download(saveDir: (name: string) => string): Promise<string> {
    const downloadPromise: Promise<Download> = this.page.waitForEvent('download');
    await this.downloadButton.click();
    const download = await downloadPromise;
    const file = saveDir(download.suggestedFilename());
    await download.saveAs(file);
    return file;
  }

  async upload(file: string): Promise<void> {
    await this.fileInput.setInputFiles(file);
  }

  /** Ô cột `columnId` của dòng chứa `rowText` */
  cell(rowText: string, columnId: string): Locator {
    return this.page.getByRole('row').filter({ has: this.page.getByText(rowText) }).locator(`#${columnId}`);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.downloadButton).toBeVisible();
  }
}
