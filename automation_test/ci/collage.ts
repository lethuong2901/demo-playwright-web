/**
 * Merge failure screenshots into one labelled grid image (results/merged_failures.png) —
 * rendered by Playwright's own Chromium, so no image library (Pillow/sharp) is needed.
 *
 *   npx tsx ci/collage.ts [--summary results/summary.json] [--out results/merged_failures.png] [--max 12]
 */
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';
import type { Summary } from './summarize';

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export async function buildCollage(summary: Summary, outFile: string, max = 12): Promise<string | undefined> {
  const items = [...summary.failures, ...summary.knownIssues].filter((f) => f.screenshot && fs.existsSync(f.screenshot)).slice(0, max);
  if (!items.length) return undefined;
  const cells = items
    .map((f) => {
      const b64 = fs.readFileSync(f.screenshot!).toString('base64');
      return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${esc(f.tcId || f.title)}</figcaption></figure>`;
    })
    .join('');
  const html = `<html><body style="margin:0;background:#111"><div id="g" style="display:grid;grid-template-columns:repeat(${Math.min(3, items.length)},480px);gap:6px;padding:6px">${cells}</div>
<style>figure{margin:0;background:#000}img{width:480px;display:block}figcaption{color:#fff;font:bold 18px sans-serif;padding:6px 8px;background:#000}</style></body></html>`;
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html);
    await page.locator('#g').screenshot({ path: outFile });
  } finally {
    await browser.close();
  }
  return outFile;
}

async function main(): Promise<void> {
  const summary = JSON.parse(fs.readFileSync(path.resolve(arg('summary', 'results/summary.json')), 'utf-8')) as Summary;
  const out = await buildCollage(summary, path.resolve(arg('out', 'results/merged_failures.png')), Number(arg('max', '12')));
  console.log(out ? `collage: ${path.relative(process.cwd(), out)}` : 'collage: không có ảnh lỗi');
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
