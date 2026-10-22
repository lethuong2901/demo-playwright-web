/**
 * Sinh bdd/features/<bộ>.dd.feature từ data/api/<bộ>.csv — mỗi dòng CSV = 1 Scenario (tag @TC-NNN), nên
 * --grep, report, summary và danh mục TC của Jenkins (npm run ci:catalog) dùng được như Scenario viết tay.
 *
 *   npm run dd:sync              # mọi file trong data/api/
 *   npm run dd:sync -- orders    # chỉ data/api/orders.csv
 *
 * Chỉ ghi file có dòng đánh dấu TỰ SINH; file .dd.feature viết tay (không có dòng đó) không bị đụng tới.
 * CSV đã xoá → file .dd.feature tự sinh tương ứng bị xoá theo.
 */
import fs from 'fs';
import path from 'path';
import { AUTH } from '../config/env';
import { DD_DIR, loadDdRows, type DdRow } from './dd';

const FEATURES_DIR = path.resolve(__dirname, '..', 'bdd', 'features');
const MARKER = '# TỰ SINH bởi `npm run dd:sync`';
const LEVEL_TAG = /^@(smoke|regression|negative)$/i;

function scenario(set: string, row: DdRow, defaultAuth: boolean): string {
  const tags = [`@${row.tc}`, ...row.tags];
  if (!tags.some((t) => LEVEL_TAG.test(t))) tags.push(row.status >= 400 ? '@negative' : '@regression');
  const auth = row.auth ?? defaultAuth;
  const when = auth
    ? `When gửi request data-driven "${row.tc}" của bộ "${set}"`
    : `When gửi request data-driven không đăng nhập "${row.tc}" của bộ "${set}"`;
  const title = row.title.replace(/\s+/g, ' ');
  return [`  ${tags.join(' ')}`, `  Scenario: ${row.tc} — ${title}`, `    ${when}`, '    Then response khớp kỳ vọng của dòng data-driven'].join('\n');
}

export function renderFeature(set: string, rows: DdRow[], defaultAuth: boolean): string {
  return [
    `# Run (trong automation_test/): npm run dd:sync && npx bddgen && npx playwright test --project=api --grep @${set}`,
    `${MARKER} từ data/api/${set}.csv — sửa CSV rồi chạy lại lệnh, KHÔNG sửa file này.`,
    `@api @${set}`,
    `Feature: ${set} — data-driven (data/api/${set}.csv)`,
    '',
    rows.map((r) => scenario(set, r, defaultAuth)).join('\n\n'),
    '',
  ].join('\n');
}

function main(): void {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const sets = fs.existsSync(DD_DIR)
    ? fs.readdirSync(DD_DIR).filter((f) => f.endsWith('.csv')).map((f) => f.slice(0, -4))
    : [];
  const targets = only.length ? only : sets;
  if (!targets.length) {
    console.log('Không có file data/api/*.csv — bỏ qua.');
    return;
  }
  const defaultAuth = AUTH.loginEndpoint !== 'none';
  fs.mkdirSync(FEATURES_DIR, { recursive: true });

  for (const set of targets) {
    if (!/^[a-z0-9][a-z0-9_-]*$/i.test(set)) {
      console.log(`✗ data/api/${set}.csv: tên bộ dùng làm tag @${set} — chỉ chữ, số, - và _ (nên trùng slug feature).`);
      process.exitCode = 1;
      continue;
    }
    const out = path.join(FEATURES_DIR, `${set}.dd.feature`);
    if (fs.existsSync(out) && !fs.readFileSync(out, 'utf8').includes(MARKER)) {
      console.log(`✗ ${path.relative(process.cwd(), out)}: file viết tay (không có dòng TỰ SINH) — không ghi đè. Đổi tên CSV hoặc file .feature.`);
      process.exitCode = 1;
      continue;
    }
    let rows: DdRow[];
    try {
      rows = loadDdRows(set);
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`);
      process.exitCode = 1;
      continue;
    }
    fs.writeFileSync(out, renderFeature(set, rows, defaultAuth));
    console.log(`✓ ${path.relative(process.cwd(), out)}: ${rows.length} TC từ data/api/${set}.csv`);
  }

  if (!only.length) {
    for (const f of fs.readdirSync(FEATURES_DIR).filter((n) => n.endsWith('.dd.feature'))) {
      const full = path.join(FEATURES_DIR, f);
      if (!sets.includes(f.slice(0, -'.dd.feature'.length)) && fs.readFileSync(full, 'utf8').includes(MARKER)) {
        fs.unlinkSync(full);
        console.log(`- ${path.relative(process.cwd(), full)}: đã xoá (CSV không còn)`);
      }
    }
  }
}

if (require.main === module) main();
