import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

const port = Number(process.env.PREVIEW_PORT || 4174);
const url = `http://127.0.0.1:${port}/`;
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome';
process.env.CHROME_PATH = chromePath;

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });

const preview = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
  stdio: 'inherit',
  env: process.env,
});

async function waitForPreview() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* The preview server is still starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Production preview did not become ready at ${url}`);
}

try {
  await waitForPreview();
  const report = execFileSync(process.execPath, [
    'node_modules/lighthouse/cli/index.js', url,
    '--preset=perf', '--only-categories=performance', '--form-factor=mobile',
    '--screenEmulation.mobile=true', '--screenEmulation.width=390', '--screenEmulation.height=844', '--screenEmulation.deviceScaleFactor=2',
    '--throttling-method=simulate', '--output=json', '--output-path=stdout', '--chrome-flags=--headless --no-sandbox', '--quiet',
  ], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: { ...process.env, CHROME_PATH: chromePath } });
  const lhr = JSON.parse(report);
  const score = Math.round((lhr.categories.performance.score || 0) * 100);
  const metrics = Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift']
    .map((id) => [id, lhr.audits[id]?.displayValue || 'unavailable']));
  console.log(`\nMobile Lighthouse performance: ${score}/100`);
  console.log(`Category: performance | Form factor: mobile | Viewport: 390×844 @2x | Throttling: Lighthouse simulated mobile | URL: ${url}`);
  console.log('Metrics:', JSON.stringify(metrics));

  if (process.env.LIGHTHOUSE_REPORT_PATH) {
    await writeFile(process.env.LIGHTHOUSE_REPORT_PATH, JSON.stringify(lhr, null, 2));
    console.log(`Report: ${process.env.LIGHTHOUSE_REPORT_PATH}`);
  }
  if (score <= 88) throw new Error(`Mobile performance score must be above 88; received ${score}.`);
} finally {
  if (preview.exitCode === null && preview.signalCode === null) {
    preview.kill('SIGTERM');
    await Promise.race([once(preview, 'exit'), new Promise((resolve) => setTimeout(resolve, 5000))]);
    if (preview.exitCode === null && preview.signalCode === null) {
      preview.kill('SIGKILL');
      await once(preview, 'exit');
    }
  }
}
