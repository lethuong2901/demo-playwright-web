/**
 * results/results.json (Playwright JSON reporter) → results/summary.json + short console report.
 * Usage: npx tsx ci/summarize.ts [--results results/results.json] [--out results/summary.json]
 */
import fs from 'fs';
import path from 'path';

interface PwAttachment { name: string; path?: string; contentType: string }
interface PwResult { status: string; duration: number; retry: number; error?: { message?: string }; attachments: PwAttachment[] }
interface PwTest { projectName: string; status: 'expected' | 'unexpected' | 'flaky' | 'skipped'; results: PwResult[]; annotations: { type: string; description?: string }[] }
interface PwSpec { title: string; file: string; line: number; tags: string[]; tests: PwTest[] }
interface PwSuite { title: string; file?: string; specs?: PwSpec[]; suites?: PwSuite[] }
interface PwReport { suites: PwSuite[]; stats: { startTime: string; duration: number } }

export interface FailureItem {
  tcId: string;
  title: string;
  project: string;
  file: string;
  error: string;
  screenshot?: string;
  trace?: string;
}

export interface Summary {
  env: string;
  account: string;
  startTime: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  skipped: number;
  knownIssue: number;
  failures: FailureItem[];
  knownIssues: FailureItem[];
  flakyTests: string[];
  reportUrl?: string;
  screenshotUrl?: string;
}

const ANSI = /\u001b\[[0-9;]*m/g;

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function* walk(suites: PwSuite[], parents: string[] = []): Generator<{ spec: PwSpec; path: string[] }> {
  for (const suite of suites) {
    const chain = suite.file && !parents.length ? [] : [...parents, suite.title];
    for (const spec of suite.specs ?? []) yield { spec, path: chain };
    yield* walk(suite.suites ?? [], chain);
  }
}

function toItem(spec: PwSpec, t: PwTest, chain: string[]): FailureItem {
  const last = t.results[t.results.length - 1];
  const shot = last?.attachments.find((a) => a.contentType === 'image/png' && a.path);
  const trace = last?.attachments.find((a) => a.name === 'trace' && a.path);
  const tcId = /TC-\d+/.exec(spec.title)?.[0] ?? spec.tags.find((x) => /^@?TC-\d+$/.test(x))?.replace(/^@/, '') ?? '';
  return {
    tcId,
    title: [...chain.filter(Boolean), spec.title].join(' › '),
    project: t.projectName,
    file: `${spec.file}:${spec.line}`,
    error: (last?.error?.message ?? '').replace(ANSI, '').split('\n').slice(0, 6).join('\n').trim(),
    screenshot: shot?.path,
    trace: trace?.path,
  };
}

export function summarize(report: PwReport): Summary {
  const s: Summary = {
    env: process.env.TEST_ENV ?? 'staging',
    account: process.env.TEST_ACCOUNT ?? '',
    startTime: report.stats.startTime,
    durationMs: Math.round(report.stats.duration),
    total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, knownIssue: 0,
    failures: [], knownIssues: [], flakyTests: [],
  };
  for (const { spec, path: chain } of walk(report.suites)) {
    for (const t of spec.tests) {
      if (t.projectName === 'setup' && t.status === 'expected') continue;
      s.total++;
      const expectedToFail = t.annotations.some((a) => a.type === 'fail');
      if (expectedToFail && t.status === 'expected') { s.knownIssue++; s.knownIssues.push(toItem(spec, t, chain)); }
      else if (expectedToFail && t.status === 'unexpected') {
        const item = toItem(spec, t, chain);
        item.error = `Known-bug test PASS bất ngờ — bug đã được sửa? Bỏ tag @fail @known-bug. ${item.error}`.trim();
        s.failed++; s.failures.push(item);
      }
      else if (t.status === 'expected') s.passed++;
      else if (t.status === 'skipped') s.skipped++;
      else if (t.status === 'flaky') { s.passed++; s.flaky++; s.flakyTests.push(spec.title); }
      else { s.failed++; s.failures.push(toItem(spec, t, chain)); }
    }
  }
  return s;
}

function main(): void {
  const resultsFile = path.resolve(arg('results', 'results/results.json'));
  const outFile = path.resolve(arg('out', 'results/summary.json'));
  if (!fs.existsSync(resultsFile)) {
    console.error(`Không thấy ${resultsFile} — test chưa chạy hoặc reporter json chưa bật.`);
    process.exit(1);
  }
  const summary = summarize(JSON.parse(fs.readFileSync(resultsFile, 'utf-8')) as PwReport);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));
  const status = summary.failed ? 'FAIL' : 'PASS';
  console.log(`## Kết quả test (${summary.env}) — ${status}`);
  console.log(`Tổng: ${summary.passed} passed / ${summary.failed} failed / ${summary.skipped} skipped / ${summary.knownIssue} known-bug / ${summary.flaky} flaky (${summary.total} total, ${(summary.durationMs / 1000).toFixed(1)}s)`);
  for (const f of summary.failures) console.log(`\n✗ [${f.project}] ${f.title}\n  ${f.file}\n  ${f.error.replace(/\n/g, '\n  ')}${f.screenshot ? `\n  screenshot: ${f.screenshot}` : ''}${f.trace ? `\n  trace: npx playwright show-trace ${f.trace}` : ''}`);
  for (const f of summary.knownIssues) console.log(`\n⚠ known-bug [${f.project}] ${f.title}`);
  if (summary.flakyTests.length) console.log(`\nFlaky (pass sau retry — cần sửa): ${summary.flakyTests.join(', ')}`);
  console.log(`\nsummary: ${path.relative(process.cwd(), outFile)}`);
}

if (require.main === module) main();
