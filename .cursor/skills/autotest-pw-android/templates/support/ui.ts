import type { AndroidDevice } from '@playwright/test';

/**
 * Shell-based UI driver cho các màn Android mà Playwright `_android`/uiautomator query bị kẹt khi bàn phím
 * IME bật (màn login, ô nhập của Viettel Money). Dùng `uiautomator dump` + `input tap/text` qua device.shell —
 * đúng cơ chế adb đã chạy ổn định. Dùng cho màn có IME; màn thường vẫn có thể dùng selector Playwright.
 */

export async function dumpXml(device: AndroidDevice): Promise<string> {
  await device.shell('uiautomator dump /sdcard/__ui.xml').catch(() => undefined);
  return (await device.shell('cat /sdcard/__ui.xml').catch(() => '')).toString();
}

function unescape(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export interface Point {
  x: number;
  y: number;
}

/** Tâm của node đầu tiên có attr khớp value (exact hoặc contains). null nếu không có. */
export function centerOf(xml: string, attr: 'text' | 'resource-id', value: string, contains = false): Point | null {
  for (const node of xml.match(/<node\b[^>]*>/g) ?? []) {
    const m = new RegExp(`${attr}="([^"]*)"`).exec(node);
    if (!m) continue;
    const val = unescape(m[1]);
    if (contains ? val.includes(value) : val === value) {
      const b = /bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/.exec(node);
      if (b) return { x: Math.round((+b[1] + +b[3]) / 2), y: Math.round((+b[2] + +b[4]) / 2) };
    }
  }
  return null;
}

export function hasText(xml: string, value: string): boolean {
  return xml.includes(`text="${value}`) || xml.includes(value);
}

export async function currentActivity(device: AndroidDevice): Promise<string> {
  const out = (await device.shell('dumpsys window').catch(() => '')).toString();
  const m = /mCurrentFocus=\S+\s+\S+\s+([\w./]+)}/.exec(out) || /mCurrentFocus=.*?([\w./]+Activity)/.exec(out);
  return m ? m[1] : '';
}

export async function tapXY(device: AndroidDevice, p: Point): Promise<void> {
  await device.shell(`input tap ${p.x} ${p.y}`);
}

export async function typeText(device: AndroidDevice, text: string): Promise<void> {
  await device.shell(`input text ${text}`);
}

export async function hideKeyboardShell(device: AndroidDevice): Promise<void> {
  const shown = (await device.shell('dumpsys input_method').catch(() => '')).toString();
  if (/mInputShown=true/.test(shown)) await device.shell('input keyevent 111'); // ESC đóng IME
}

/**
 * Che dữ liệu nhạy cảm (OTP, số điện thoại, số thẻ, số dư…) trước khi log / đưa vào Error.
 * Thay mọi dãy từ 3 chữ số liên tiếp trở lên bằng `***`. BẮT BUỘC bọc qua đây mọi chuỗi lấy từ
 * thiết bị (nội dung SMS, dump màn hình, text dialog) khi in ra output — output có thể vào CI log/report.
 */
export function mask(s: string): string {
  return s.replace(/\d{3,}/g, '***');
}

/**
 * Đọc OTP mới nhất từ SMS inbox một cách AN TOÀN: chỉ trả về đúng mã số, KHÔNG BAO GIỜ trả về / log
 * nguyên nội dung tin nhắn (tránh lộ OTP + số điện thoại ra output như đã từng xảy ra).
 * Trên máy farm dùng chung, inbox lẫn OTP của người khác → lọc theo `sender` (số/brandname gửi OTP) rồi
 * lấy tin mới nhất; không có `sender` thì chỉ xét tin trong `withinMs` gần nhất. Lỗi đều đã mask.
 */
export async function readOtp(
  device: AndroidDevice,
  opts: { sender?: string; length?: number; withinMs?: number; timeout?: number } = {},
): Promise<string> {
  const len = opts.length ?? 6;
  const within = opts.withinMs ?? 180_000;
  const timeout = opts.timeout ?? 30_000;
  const codeRe = new RegExp(`\\b(\\d{${len}})\\b`);
  const end = Date.now() + timeout;
  do {
    const raw = (
      await device
        .shell('content query --uri content://sms/inbox --projection address:body:date --sort "date DESC"')
        .catch(() => '')
    ).toString();
    for (const row of raw.split(/\r?\n/)) {
      const addr = /address=([^,]*)/.exec(row)?.[1] ?? '';
      const date = Number(/date=(\d+)/.exec(row)?.[1] ?? '0');
      if (opts.sender && !addr.includes(opts.sender)) continue;
      if (date && Date.now() - date > within) continue;
      const code = codeRe.exec(/body=(.*)$/.exec(row)?.[1] ?? '')?.[1];
      if (code) return code; // chỉ mã số, không kèm body/sender
    }
    await new Promise((r) => setTimeout(r, 1500));
  } while (Date.now() < end);
  throw new Error(`Không đọc được OTP ${len} số${opts.sender ? ` từ "${mask(opts.sender)}"` : ''} sau ${timeout / 1000}s`);
}

/** Chờ node (attr=value) xuất hiện rồi trả về tâm. null nếu quá thời gian. */
export async function waitFor(
  device: AndroidDevice,
  attr: 'text' | 'resource-id',
  value: string,
  opts: { timeout?: number; contains?: boolean } = {},
): Promise<Point | null> {
  const timeout = opts.timeout ?? 15_000;
  const end = Date.now() + timeout;
  do {
    const p = centerOf(await dumpXml(device), attr, value, opts.contains);
    if (p) return p;
    await new Promise((r) => setTimeout(r, 1000));
  } while (Date.now() < end);
  return null;
}

/** Chờ rồi tap. Throw nếu không thấy. */
export async function waitTap(
  device: AndroidDevice,
  attr: 'text' | 'resource-id',
  value: string,
  opts: { timeout?: number; contains?: boolean } = {},
): Promise<void> {
  const p = await waitFor(device, attr, value, opts);
  if (!p) throw new Error(`Không thấy phần tử ${attr}="${value}" sau ${(opts.timeout ?? 15_000) / 1000}s`);
  await tapXY(device, p);
}
