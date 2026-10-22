/**
 * Send the run summary to Vops and/or Telegram (same message layout the team used with
 * the RF pipeline). Every secret comes from environment variables injected by Jenkins
 * withCredentials, or — for a local run — from ~/.vds/sdlc-config.env (VDS_VOPS_TOKEN, VDS_VOPS_USER_ID,
 * VDS_TELEGRAM_BOT_TOKEN). Nothing is hard-coded in the repo, nothing is pasted in chat.
 *
 *   npx tsx ci/notify.ts [--summary results/summary.json] [--collage results/merged_failures.png] [--dry-run]
 *
 * Env:
 *   VOPS_TOKEN, VOPS_USER_ID, VOPS_ROOM_ID, VOPS_GROUP_LINK    (all 4 set → Vops enabled; token/user id may come from sdlc-config.env)
 *   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID                       (both set → Telegram enabled; bot token may come from sdlc-config.env)
 *   REPORT_URL, SCREENSHOT_URL, SCENARIO_LINK                  (optional links in the message)
 *   NOTIFY_INSECURE_TLS=1                                      (only if the Vops host uses an internal CA)
 * A channel that is not configured is skipped silently; a channel that fails logs the error
 * and the script still exits 0 (a notification problem must not change the build result).
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import dotenv from 'dotenv';
import type { Summary } from './summarize';

const VOPS_API = 'https://vops.viettel.vn/api/v1';
const MAX_FAILURES_IN_MESSAGE = 15;

/** Secret: env var (Jenkins withCredentials) > env var VDS_<name> > ~/.vds/sdlc-config.env VDS_<name>. Never printed. */
function secret(name: string): string | undefined {
  const vdsName = `VDS_${name}`;
  if (process.env[name] || process.env[vdsName]) return process.env[name] || process.env[vdsName];
  const file = process.env.VDS_CONFIG_FILE || path.join(os.homedir(), '.vds', 'sdlc-config.env');
  return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file))[vdsName] || undefined : undefined;
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

export function formatMessage(s: Summary): string {
  const lines: string[] = [];
  lines.push(`\`${process.env.TEST_ACCOUNT || s.account || s.env.toUpperCase()}\``);
  if (process.env.SCREENSHOT_URL) lines.push(process.env.SCREENSHOT_URL);
  if (process.env.REPORT_URL) lines.push(process.env.REPORT_URL);
  if (process.env.SCENARIO_LINK) lines.push(process.env.SCENARIO_LINK);
  lines.push(
    `TOTAL: ${s.total} - pass: ${s.passed} :white_check_mark: - fail: ${s.failed} :x: - skip: ${s.skipped + s.knownIssue} :warning:`,
  );
  if (s.flaky) lines.push(`flaky: ${s.flaky} (pass sau retry)`);
  const failed = s.failures.slice(0, MAX_FAILURES_IN_MESSAGE);
  if (failed.length) lines.push('');
  for (const f of failed) lines.push(`:x: - ${f.title}`, `   ${f.error.split('\n')[0]}`);
  if (s.failures.length > failed.length) lines.push(`... và ${s.failures.length - failed.length} TC fail khác (xem report)`);
  for (const k of s.knownIssues) lines.push(`:warning: - ${k.title} (known-bug)`);
  return lines.join('\n');
}

async function sendVops(text: string, collage?: string): Promise<void> {
  const { VOPS_ROOM_ID, VOPS_GROUP_LINK } = process.env;
  const VOPS_TOKEN = secret('VOPS_TOKEN');
  const VOPS_USER_ID = secret('VOPS_USER_ID');
  if (!VOPS_TOKEN || !VOPS_USER_ID || !VOPS_ROOM_ID || !VOPS_GROUP_LINK) return;
  const headers = { Referer: VOPS_GROUP_LINK, 'X-Auth-Token': VOPS_TOKEN, 'X-User-Id': VOPS_USER_ID };
  // Same DDP-style payload as before, but built with JSON.stringify so quotes/backslashes in
  // failure messages cannot break it.
  const inner = { msg: 'method', id: '65', method: 'sendMessage', params: [{ _id: crypto.randomBytes(8).toString('hex'), rid: VOPS_ROOM_ID, msg: text }] };
  const res = await fetch(`${VOPS_API}/method.call/sendMessage`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: JSON.stringify(inner) }),
  });
  if (!res.ok) throw new Error(`Vops sendMessage HTTP ${res.status}: ${await res.text()}`);
  if (collage) {
    const form = new FormData();
    form.append('description', 'ảnh lỗi');
    form.append('file', new Blob([fs.readFileSync(collage)], { type: 'image/png' }), path.basename(collage));
    const up = await fetch(`${VOPS_API}/rooms.upload/${VOPS_ROOM_ID}`, { method: 'POST', headers: { ...headers, Origin: new URL(VOPS_API).origin }, body: form });
    const body = (await up.json().catch(() => ({}))) as { success?: boolean };
    if (!up.ok || body.success === false) throw new Error(`Vops upload thất bại: HTTP ${up.status}`);
  }
}

async function sendTelegram(text: string, collage?: string): Promise<void> {
  const { TELEGRAM_CHAT_ID } = process.env;
  const TELEGRAM_BOT_TOKEN = secret('TELEGRAM_BOT_TOKEN');
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  const api = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
  const res = await fetch(`${api}/sendMessage`, { method: 'POST', body: new URLSearchParams({ chat_id: TELEGRAM_CHAT_ID, text }) });
  if (!((await res.json()) as { ok?: boolean }).ok) throw new Error(`Telegram sendMessage thất bại: HTTP ${res.status}`);
  if (collage) {
    const form = new FormData();
    form.append('chat_id', TELEGRAM_CHAT_ID);
    form.append('caption', 'ảnh lỗi');
    form.append('photo', new Blob([fs.readFileSync(collage)], { type: 'image/png' }), path.basename(collage));
    const up = await fetch(`${api}/sendPhoto`, { method: 'POST', body: form });
    if (!((await up.json()) as { ok?: boolean }).ok) throw new Error(`Telegram sendPhoto thất bại: HTTP ${up.status}`);
  }
}

async function main(): Promise<void> {
  if (process.env.NOTIFY_INSECURE_TLS === '1') process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const summary = JSON.parse(fs.readFileSync(path.resolve(arg('summary', 'results/summary.json')), 'utf-8')) as Summary;
  const collagePath = path.resolve(arg('collage', 'results/merged_failures.png'));
  const collage = fs.existsSync(collagePath) ? collagePath : undefined;
  const text = formatMessage(summary);
  if (process.argv.includes('--dry-run')) {
    console.log(text);
    console.log(`\n[dry-run] collage: ${collage ?? '(không có)'}`);
    return;
  }
  for (const [name, send] of [['Vops', sendVops], ['Telegram', sendTelegram]] as const) {
    try {
      await send(text, collage);
    } catch (e) {
      console.error(`[notify] ${name}: ${(e as Error).message}`);
    }
  }
}

if (require.main === module) main();
