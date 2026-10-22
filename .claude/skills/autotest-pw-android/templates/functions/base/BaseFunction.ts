import { expect, type AndroidDevice, type AndroidSelector } from '@playwright/test';

/**
 * Ẩn bàn phím ảo (và các bảng giới thiệu của bàn phím, vd Gboard "Try out your stylus") — chúng che phần tử
 * phía dưới làm tap/wait timeout (đã gặp thật trên emulator). Chỉ bấm Back khi bàn phím ĐANG hiện, để không
 * vô tình quay về màn trước.
 */
export async function hideKeyboard(device: AndroidDevice): Promise<void> {
  const state = (await device.shell('dumpsys input_method')).toString();
  // Chỉ mInputShown phản ánh bàn phím đang hiện (mIsInputViewShown vẫn true sau khi đã ẩn — đã kiểm chứng)
  if (/mInputShown=true/.test(state)) {
    await device.input.press('Back');
  }
}

/**
 * Base cho các FUNCTION object của Android (Playwright _android, UiAutomator selectors) — mỗi function gói
 * một chức năng nghiệp vụ trải nhiều màn. Native selectors không có web-first expect → dùng
 * waitVisible/expectText (dựa expect.poll).
 */
export abstract class BaseFunction {
  constructor(protected readonly device: AndroidDevice) {}

  protected async tap(selector: AndroidSelector): Promise<void> {
    await this.device.tap(selector);
  }

  /**
   * Nhập text vào native EditText rồi ẩn bàn phím.
   * ⚠️ KHÔNG ĐÁNG TIN với ô nhập TÙY BIẾN (PIN/OTP 6-chấm, field có IME riêng): `device.fill`/`device.wait`
   * có thể treo/đọc rỗng khi bàn phím đang bật (đã gặp trên Viettel Money). Với các màn đó, dùng SHELL driver
   * `support/ui.ts` (`dumpXml` + `centerOf` + `tapXY` + `typeText`) — xem android-best-practices §"Hardened apps".
   */
  protected async fill(selector: AndroidSelector, text: string): Promise<void> {
    await this.device.fill(selector, text);
    await hideKeyboard(this.device);
  }

  protected async waitVisible(selector: AndroidSelector, timeout?: number): Promise<void> {
    await this.device.wait(selector, { timeout });
  }

  protected async waitGone(selector: AndroidSelector, timeout?: number): Promise<void> {
    await this.device.wait(selector, { state: 'gone', timeout });
  }

  protected async textOf(selector: AndroidSelector): Promise<string> {
    return (await this.device.info(selector)).text;
  }

  /** Retrying assertion for native text (equivalent of web-first toHaveText). */
  protected async expectText(selector: AndroidSelector, expected: string | RegExp): Promise<void> {
    const poll = expect.poll(() => this.textOf(selector).catch(() => ''), { message: `text of ${JSON.stringify(selector)}` });
    if (typeof expected === 'string') await poll.toBe(expected);
    else await poll.toMatch(expected);
  }

  /**
   * Vuốt bên trong container (toạ độ tính từ bounds của chính container — không gõ cứng toạ độ).
   * Dùng `input swipe` vì device.scroll() không cuộn được ListView trên Android 14+ và device.swipe()/fling()
   * hay treo (đã kiểm chứng trên emulator Android 16).
   * toward 'end' = xem phần BÊN DƯỚI, 'start' = quay lên đầu.
   */
  protected async swipeInside(container: AndroidSelector, toward: 'end' | 'start' = 'end'): Promise<void> {
    const b = (await this.device.info(container)).bounds;
    const x = Math.round(b.x + b.width / 2);
    const low = Math.round(b.y + b.height * 0.8);
    const high = Math.round(b.y + b.height * 0.2);
    const [from, to] = toward === 'end' ? [low, high] : [high, low];
    await this.device.shell(`input swipe ${x} ${from} ${x} ${to} 400`);
  }

  /** Cuộn container tới khi target hiện ra (tối đa maxSwipes lần vuốt). */
  protected async scrollTo(
    target: AndroidSelector,
    toward: 'end' | 'start' = 'end',
    container: AndroidSelector = { scrollable: true },
    maxSwipes = 10,
  ): Promise<void> {
    for (let i = 0; i < maxSwipes; i++) {
      try {
        // UiAutomator cần ~1–2s sau mỗi lần vuốt mới thấy phần tử mới → không đặt timeout quá ngắn
        await this.device.wait(target, { timeout: 2_500 });
        return;
      } catch {
        await this.swipeInside(container, toward);
      }
    }
    await this.device.wait(target);
  }
}
