/**
 * Danh mục TC cho giao diện "Build with Parameters" của Jenkins (tham số FEATURES / TC_LIST).
 *
 * Đọc mọi bdd/features/**\/*.feature → ghi khối TC_CATALOG (giữa 2 dòng đánh dấu) vào Jenkinsfile.
 * Chạy lại mỗi khi thêm / sửa / xoá Scenario, rồi commit Jenkinsfile cùng file .feature:
 *
 *   npx tsx ci/tc-catalog.ts              # cập nhật Jenkinsfile (và Jenkinsfile.playwright nếu có)
 *   npx tsx ci/tc-catalog.ts --check      # chỉ kiểm tra: exit 1 nếu danh mục trong Jenkinsfile đã cũ
 *   npx tsx ci/tc-catalog.ts --print      # in danh mục ra màn hình, không ghi file
 *
 * Quy ước (bdd-gherkin.md): tag @<feature> trên dòng Feature, mỗi Scenario có @TC-NNN và tiêu đề
 * "TC-NNN — <Title>". Scenario không có mã TC không chọn được trên Jenkins → in cảnh báo.
 */
import fs from 'fs';
import path from 'path';

export interface CatalogTc {
  id: string;
  title: string;
}

export interface CatalogFeature {
  /** Tag @<feature> (không có @); '' nếu file thiếu tag → lọc theo mã TC. */
  tag: string;
  file: string;
  title: string;
  tcs: CatalogTc[];
}

const FEATURES_DIR = 'bdd/features';
const BEGIN = '// TC_CATALOG:BEGIN';
const END = '// TC_CATALOG:END';
/** Tag không phải tên feature: nền tảng, mức độ, trạng thái, tag điều khiển của bdd.ts. */
const NON_FEATURE_TAG = /^(web|api|android|ios|mobile|smoke|regression|negative|visual|known-bug|fail|skip|fixme|slow|only|auth:.*|timeout:.*|TC-\d+)$/i;
const TC_TAG = /^TC-\d+$/i;

function listFeatureFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return listFeatureFiles(full);
      return e.name.endsWith('.feature') ? [full] : [];
    })
    .sort();
}

function tagsOf(line: string): string[] {
  return line
    .split(/\s+/)
    .filter((t) => t.startsWith('@'))
    .map((t) => t.slice(1));
}

export function parseFeature(file: string, text: string, warn: (m: string) => void): CatalogFeature | undefined {
  const base = path.basename(file, '.feature');
  let pending: string[] = [];
  let feature: CatalogFeature | undefined;
  const seen = new Set<string>();

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    if (line.startsWith('@')) {
      pending.push(...tagsOf(line));
      return;
    }
    const kw = /^(Feature|Rule|Background|Scenario Outline|Scenario Template|Scenario|Example):\s*(.*)$/.exec(line);
    if (!kw) {
      pending = [];
      return;
    }
    const [, keyword, rest] = kw;
    if (keyword === 'Feature') {
      const candidates = pending.filter((t) => !NON_FEATURE_TAG.test(t));
      const tag = candidates.find((t) => t === base) ?? candidates[0] ?? '';
      if (!tag) warn(`${file}: dòng Feature thiếu tag @${base} — TC của file này được lọc theo mã TC.`);
      feature = { tag, file: file.split(path.sep).join('/'), title: rest.trim(), tcs: [] };
    } else if (feature && /^Scenario|^Example/.test(keyword)) {
      const id = pending.find((t) => TC_TAG.test(t))?.toUpperCase() ?? /^(TC-\d+)/i.exec(rest)?.[1]?.toUpperCase();
      if (!id) {
        warn(`${file}:${i + 1}: Scenario "${rest.trim()}" không có tag @TC-NNN — không chọn được trên Jenkins.`);
      } else if (!seen.has(id)) {
        seen.add(id);
        const title = rest.replace(/^TC-\d+\s*[—–:-]?\s*/i, '').trim();
        feature.tcs.push({ id, title });
      }
    }
    pending = [];
  });
  return feature && feature.tcs.length ? feature : undefined;
}

export function buildCatalog(root = '.', warn: (m: string) => void = (m) => console.warn(`⚠ ${m}`)): CatalogFeature[] {
  const files = listFeatureFiles(path.join(root, FEATURES_DIR));
  const parsed = files
    .map((f) => parseFeature(path.relative(root, f), fs.readFileSync(f, 'utf8'), warn))
    .filter((f): f is CatalogFeature => !!f)
    // File viết tay trước file .dd.feature sinh từ CSV → mục gộp lấy tiêu đề Feature thật.
    .sort((a, b) => Number(a.file.endsWith('.dd.feature')) - Number(b.file.endsWith('.dd.feature')));
  // Cùng tag @<feature> ở nhiều file (vd orders.feature viết tay + orders.dd.feature sinh từ CSV) → 1 mục trên Jenkins.
  const merged: CatalogFeature[] = [];
  for (const f of parsed) {
    const same = f.tag ? merged.find((m) => m.tag === f.tag) : undefined;
    if (!same) {
      merged.push(f);
      continue;
    }
    for (const tc of f.tcs) {
      if (same.tcs.some((t) => t.id === tc.id)) warn(`${f.file}: ${tc.id} trùng với ${same.file} (cùng tag @${f.tag}) — đổi mã TC.`);
      else same.tcs.push(tc);
    }
  }
  return merged;
}

/** Chuỗi Groovy nháy đơn: chỉ cần thoát \ và '. */
function g(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function renderBlock(catalog: CatalogFeature[]): string {
  const lines = [
    `${BEGIN} — tự sinh bởi \`npm run ci:catalog\` từ bdd/features, KHÔNG sửa tay`,
    '// Không có `def`: TC_CATALOG là biến binding, các hàm helper bên dưới mới thấy được.',
    'TC_CATALOG = [',
  ];
  for (const f of catalog) {
    lines.push(`  [tag: ${g(f.tag)}, file: ${g(f.file)}, title: ${g(f.title)}, tcs: [`);
    for (const tc of f.tcs) lines.push(`    [id: ${g(tc.id)}, title: ${g(tc.title)}],`);
    lines.push('  ]],');
  }
  lines.push(']', END);
  return lines.join('\n');
}

const BLOCK_RE = new RegExp(`${BEGIN}[\\s\\S]*?${END}`);

/** Thay khối TC_CATALOG trong nội dung Jenkinsfile. undefined = file không có khối đánh dấu. */
export function replaceBlock(jenkinsfile: string, block: string): string | undefined {
  return BLOCK_RE.test(jenkinsfile) ? jenkinsfile.replace(BLOCK_RE, () => block) : undefined;
}

function main(): void {
  const mode = process.argv.includes('--check') ? 'check' : process.argv.includes('--print') ? 'print' : 'write';
  const catalog = buildCatalog();
  const block = renderBlock(catalog);
  const total = catalog.reduce((n, f) => n + f.tcs.length, 0);

  if (mode === 'print') {
    console.log(block);
    return;
  }
  const targets = ['Jenkinsfile', 'Jenkinsfile.playwright'].filter((f) => fs.existsSync(f));
  let found = 0;
  let stale = 0;
  for (const file of targets) {
    const current = fs.readFileSync(file, 'utf8');
    // Windows + git core.autocrlf: Jenkinsfile là CRLF → ghi khối cùng kiểu xuống dòng, --check mới so đúng.
    const eol = current.includes('\r\n') ? '\r\n' : '\n';
    const next = replaceBlock(current, eol === '\n' ? block : block.replace(/\n/g, eol));
    if (next === undefined) continue;
    found++;
    if (next === current) {
      console.log(`✓ ${file}: danh mục đã khớp (${catalog.length} feature, ${total} TC)`);
    } else if (mode === 'check') {
      stale++;
      console.log(`✗ ${file}: danh mục TC cũ hơn bdd/features — chạy \`npm run ci:catalog\` rồi commit Jenkinsfile`);
    } else {
      fs.writeFileSync(file, next);
      console.log(`✓ ${file}: cập nhật danh mục (${catalog.length} feature, ${total} TC)`);
    }
  }
  if (!found) {
    console.log('Không thấy Jenkinsfile có khối TC_CATALOG (pipeline cũ hoặc chưa tạo bằng /autotest-pw-jenkins) — bỏ qua.');
    return;
  }
  if (stale) process.exit(1);
}

if (require.main === module) main();
