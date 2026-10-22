import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Data-driven API (tương đương "Mode D" của autotest-rf-api / Robot Framework DataDriver).
 *
 * Dữ liệu: automation_test/data/api/<bộ>.csv — mỗi dòng = 1 TC, tester sửa được bằng Excel (lưu CSV UTF-8).
 *   tc,title,method,url,request_body,response_status_code,response_body,auth,tags
 *   TC-001,Tạo đơn hợp lệ,POST,/orders,"{""qty"": 1, ""ref"": ""INPUT_DATA:uuid""}",201,"{""status"": ""NEW""}",,@smoke
 *
 * - tc, title, method, url, response_status_code: bắt buộc. tc không trùng trong 1 file.
 * - request_body: JSON (POST/PUT/PATCH = body; GET/DELETE = query params). Trống hoặc {} = không gửi.
 * - response_body: JSON CHỈ gồm phần cần kiểm (so khớp một phần, lồng nhau, mảng theo vị trí). Trống = chỉ kiểm status.
 * - auth: yes | no — trống = yes khi API có login (EP_LOGIN), ngược lại no.
 * - tags: thêm tag cho Scenario, vd "@smoke @negative".
 * - INPUT_DATA:<kiểu> trong request_body hoặc url → sinh lúc chạy: uuid | timestamp (YYYY/MM/DD HH:mm:ss) |
 *   iso | epoch | number:<độ dài> | string:<độ dài>.
 *
 * `npm run dd:sync` sinh bdd/features/<bộ>.dd.feature từ CSV (mỗi dòng 1 Scenario); step chung ở
 * bdd/steps/common/api-dd.steps.ts. Không viết service/step riêng cho từng TC.
 */

export const DD_DIR = path.resolve(__dirname, '..', 'data', 'api');
export const DD_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type DdMethod = (typeof DD_METHODS)[number];

export interface DdRow {
  tc: string;
  title: string;
  method: DdMethod;
  url: string;
  requestBody?: unknown;
  status: number;
  expected?: unknown;
  /** undefined = theo mặc định (có login thì yes). */
  auth?: boolean;
  tags: string[];
}

/** CSV theo RFC 4180: dấu phẩy, "..." bao giá trị, "" = dấu nháy, xuống dòng trong ô có nháy; bỏ BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function parseJson(raw: string, where: string): unknown {
  const text = raw.trim();
  if (!text || text === '{}') return undefined;
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`${where}: JSON không hợp lệ (${(e as Error).message}) — trong CSV dùng "" thay cho mỗi dấu " bên trong ô.`);
  }
}

/** Đọc và kiểm tra data/api/<bộ>.csv. Lỗi nêu đúng file:dòng:cột để tester tự sửa. */
export function loadDdRows(set: string, dir = DD_DIR): DdRow[] {
  const file = path.join(dir, `${set}.csv`);
  if (!fs.existsSync(file)) throw new Error(`Không có file dữ liệu ${file}`);
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
  } catch {
    // Excel trên Windows: "CSV (Comma delimited)" lưu theo bảng mã ANSI → tiếng Việt vỡ. Báo rõ thay vì gửi chữ lỗi lên server.
    throw new Error(`${file} không phải UTF-8 — mở bằng Excel rồi Save As → "CSV UTF-8 (Comma delimited)".`);
  }
  const [header, ...body] = parseCsv(text);
  if (!header) throw new Error(`${file} rỗng`);
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const required = ['tc', 'title', 'method', 'url', 'response_status_code'];
  const missing = required.filter((c) => col(c) < 0);
  if (missing.length) throw new Error(`${file}: thiếu cột ${missing.join(', ')} (header phải có: ${required.join(', ')})`);
  const get = (r: string[], name: string) => (col(name) >= 0 ? (r[col(name)] ?? '').trim() : '');
  const seen = new Set<string>();

  return body.map((r, i) => {
    const where = `${path.basename(file)}:${i + 2}`;
    const tc = get(r, 'tc').toUpperCase();
    if (!/^TC-\d+$/.test(tc)) throw new Error(`${where}: cột tc phải dạng TC-NNN, nhận "${get(r, 'tc')}"`);
    if (seen.has(tc)) throw new Error(`${where}: trùng ${tc} trong file`);
    seen.add(tc);
    const method = get(r, 'method').toUpperCase() as DdMethod;
    if (!DD_METHODS.includes(method)) throw new Error(`${where}: method "${get(r, 'method')}" — chỉ nhận ${DD_METHODS.join('/')}`);
    const status = Number(get(r, 'response_status_code'));
    if (!Number.isInteger(status)) throw new Error(`${where}: response_status_code phải là số, nhận "${get(r, 'response_status_code')}"`);
    const auth = get(r, 'auth').toLowerCase();
    if (auth && !['yes', 'no'].includes(auth)) throw new Error(`${where}: auth chỉ nhận yes / no / để trống`);
    return {
      tc,
      title: get(r, 'title') || tc,
      method,
      url: get(r, 'url'),
      requestBody: parseJson(get(r, 'request_body'), `${where} request_body`),
      status,
      expected: parseJson(get(r, 'response_body'), `${where} response_body`),
      auth: auth ? auth === 'yes' : undefined,
      tags: get(r, 'tags').split(/\s+/).filter(Boolean).map((t) => (t.startsWith('@') ? t : `@${t}`)),
    };
  });
}

export function findDdRow(set: string, tc: string): DdRow {
  const row = loadDdRows(set).find((r) => r.tc === tc.toUpperCase());
  if (!row) throw new Error(`data/api/${set}.csv không có ${tc} — chạy lại \`npm run dd:sync\` nếu vừa sửa CSV.`);
  return row;
}

const pad = (n: number) => String(n).padStart(2, '0');

function randomChars(len: number, alphabet: string): string {
  return Array.from(crypto.randomBytes(len), (b) => alphabet[b % alphabet.length]).join('');
}

/** Giá trị cho 1 placeholder INPUT_DATA:<kiểu>; kiểu lạ → báo lỗi (tránh gửi chuỗi placeholder lên server). */
export function dynamicValue(type: string): string {
  const [kind, arg] = type.split(':');
  const len = Number(arg);
  const now = new Date();
  switch (kind) {
    case 'uuid':
      return crypto.randomUUID();
    case 'timestamp':
      return `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    case 'iso':
      return now.toISOString();
    case 'epoch':
      return String(now.getTime());
    case 'number':
      if (!len) break;
      return randomChars(1, '123456789') + randomChars(len - 1, '0123456789');
    case 'string':
      if (!len) break;
      return randomChars(len, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
  }
  throw new Error(`INPUT_DATA:${type} không hỗ trợ — dùng uuid | timestamp | iso | epoch | number:<n> | string:<n>`);
}

const PLACEHOLDER = /INPUT_DATA:([a-z]+(?::\d+)?)/g;

/** Thay mọi INPUT_DATA:<kiểu> trong chuỗi / object / mảng (đệ quy). */
export function resolveDynamic<T>(value: T): T {
  if (typeof value === 'string') return value.replace(PLACEHOLDER, (_m, type: string) => dynamicValue(type)) as T;
  if (Array.isArray(value)) return value.map((v) => resolveDynamic(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveDynamic(v)])) as T;
  }
  return value;
}

function short(v: unknown): string {
  const s = JSON.stringify(v);
  return s === undefined ? 'undefined' : s.length > 120 ? `${s.slice(0, 120)}…` : s;
}

/**
 * So khớp một phần: mọi key trong expected phải có trong actual với giá trị khớp (đệ quy). Mảng so theo vị trí,
 * expected được phép ngắn hơn. Giá trị đơn so như chuỗi (200 khớp "200", giống Should Be Equal As Strings).
 * Trả về danh sách sai khác dạng "data.items[0].status: mong đợi "NEW", thực tế "DONE"".
 */
export function diffSubset(actual: unknown, expected: unknown, at = 'response'): string[] {
  if (expected === null || typeof expected !== 'object') {
    if (actual !== null && typeof actual === 'object') return [`${at}: mong đợi ${short(expected)}, thực tế là ${Array.isArray(actual) ? 'mảng' : 'object'}`];
    return String(actual) === String(expected) ? [] : [`${at}: mong đợi ${short(expected)}, thực tế ${short(actual)}`];
  }
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return [`${at}: mong đợi mảng, thực tế ${short(actual)}`];
    if (actual.length < expected.length) return [`${at}: mong đợi ít nhất ${expected.length} phần tử, thực tế ${actual.length}`];
    return expected.flatMap((e, i) => diffSubset(actual[i], e, `${at}[${i}]`));
  }
  if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) return [`${at}: mong đợi object, thực tế ${short(actual)}`];
  const obj = actual as Record<string, unknown>;
  return Object.entries(expected as Record<string, unknown>).flatMap(([k, e]) =>
    k in obj ? diffSubset(obj[k], e, `${at}.${k}`) : [`${at}.${k}: thiếu trong response`],
  );
}

/** GET/DELETE: request_body thành query params (giá trị đơn). */
export function toQuery(body: unknown): Record<string, string | number | boolean> | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;
  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : (v as string | number | boolean)]),
  );
}
