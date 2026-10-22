import { expect, type FrameLocator, type Locator, type Page } from '@playwright/test';
import { BasePage } from '@pages/base/BasePage';

/** https://rahulshettyacademy.com/AutomationPractice/ — course MoreValidations.spec.js (ẩn/hiện, alert, hover, iframe, ảnh). */
export class AutomationPracticePage extends BasePage {
  protected readonly path = '/AutomationPractice/';
  readonly displayedText: Locator;
  readonly hideButton: Locator;
  readonly showButton: Locator;
  readonly confirmButton: Locator;
  readonly alertButton: Locator;
  readonly nameInput: Locator;
  readonly mouseHover: Locator;
  readonly hoverMenu: Locator;
  readonly coursesFrame: FrameLocator;

  constructor(page: Page) {
    super(page);
    this.displayedText = page.locator('#displayed-text');
    this.hideButton = page.locator('#hide-textbox');
    this.showButton = page.locator('#show-textbox');
    this.confirmButton = page.locator('#confirmbtn');
    this.alertButton = page.locator('#alertbtn');
    this.nameInput = page.locator('#name');
    this.mouseHover = page.locator('#mousehover');
    this.hoverMenu = page.locator('.mouse-hover-content');
    this.coursesFrame = page.frameLocator('#courses-iframe');
  }

  /**
   * JS alert/confirm: đăng ký handler TRƯỚC khi click, trả về nội dung dialog.
   * action 'accept' = bấm OK, 'dismiss' = bấm Cancel.
   */
  async clickAndHandleDialog(button: Locator, action: 'accept' | 'dismiss'): Promise<string> {
    const dialogPromise = this.page.waitForEvent('dialog');
    const clickPromise = button.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await (action === 'accept' ? dialog.accept() : dialog.dismiss());
    await clickPromise;
    return message;
  }

  /** Link trong iframe — không cần "switch", page chính vẫn dùng bình thường */
  frameLink(name: string): Locator {
    return this.coursesFrame.getByRole('link', { name }).first();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.displayedText).toBeVisible();
  }
}
