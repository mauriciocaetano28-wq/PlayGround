#!/usr/bin/env bash
set -euo pipefail

CAPTURE_URL="${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
CAPTURE_DIR="${CAPTURE_DIR:?Set CAPTURE_DIR to an evidence directory}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "$(realpath -m "$CAPTURE_DIR")" == "$PROJECT_DIR" || "$(realpath -m "$CAPTURE_DIR")" == "$PROJECT_DIR"/* ]]; then
  echo "Capture evidence must be stored outside the project directory." >&2
  exit 1
fi

/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
/usr/bin/time -p node --input-type=commonjs <<'NODE'
(async () => {
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const { pathToFileURL } = require('node:url');

const url = process.env.CAPTURE_URL;
const output = process.env.CAPTURE_DIR;
if (!url || !output) throw new Error('CAPTURE_URL and CAPTURE_DIR are required.');
let parsedUrl;
try { parsedUrl = new URL(url); } catch { throw new Error(`Invalid CAPTURE_URL: ${url}`); }
if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('CAPTURE_URL must use HTTP or HTTPS.');

const runtime = path.join(process.env.HOME, '.local/share/omgithub-playwright');
const runtimeRequire = createRequire(path.join(runtime, 'package.json'));
let chromium, config;
try {
  ({ chromium } = runtimeRequire('playwright'));
  const configPath = path.join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error(`Browser setup is unavailable: ${error.message}`);
  process.exit(75);
}
if (process.platform === 'linux') {
  try { process.env.DISPLAY ||= ':' + fs.readFileSync(path.join(runtime, 'display'), 'utf8').trim(); }
  catch (error) { console.error(`Browser display is unavailable: ${error.message}`); process.exit(75); }
}

const temporaryStatus = status => !status || [408, 429, 500, 502, 503, 504].includes(status);
let browser;
let exitCode = 0;
try {
  try { browser = await chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }); }
  catch (error) { console.error(`Temporary browser launch failure: ${error.message}`); process.exitCode = 75; }

  if (browser) {
    for (const [name, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
      let page;
      try {
        page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
        page.setDefaultTimeout(30000);
        const defects = [];
        page.on('pageerror', error => defects.push(`Browser rendering error: ${error.message}`));
        page.on('response', response => {
          try {
            if (response.status() >= 400 && new URL(response.url()).origin === parsedUrl.origin) {
              defects.push(`HTTP ${response.status()} for ${response.url()}`);
            }
          } catch {}
        });
        let response;
        try { response = await page.goto(url, { waitUntil: 'load', timeout: 45000 }); }
        catch (error) {
          console.error(`Temporary navigation failure for ${name}: ${error.message}`);
          process.exitCode = 75;
          break;
        }
        if (!response || !response.ok()) {
          const status = response?.status();
          console.error(`Preview returned HTTP ${status ?? 'no response'} (${name}).`);
          process.exitCode = temporaryStatus(status) ? 75 : 1;
          break;
        }
        try {
          await page.locator('body').waitFor({ state: 'visible', timeout: 30000 });
          await page.waitForFunction(() => document.fonts.status === 'loaded', { timeout: 30000 });
          await page.waitForFunction(() => {
            const text = document.body?.innerText?.trim() || '';
            const visual = [...document.querySelectorAll('canvas,img,video,svg')].some(element => {
              const box = element.getBoundingClientRect();
              return box.width > 80 && box.height > 60 && getComputedStyle(element).display !== 'none';
            });
            return text.length >= 20 || visual;
          }, { timeout: 15000 });
        } catch (error) {
          console.error(`Rendered-content check failed for ${name}: ${error.message}`);
          process.exitCode = 1;
          break;
        }
        await page.waitForTimeout(500);
        const title = await page.title();
        const textLength = await page.locator('body').evaluate(body => body.innerText.trim().length);
        if (!title.trim() && textLength < 20) {
          console.error(`The ${name} page is blank or has no identifiable rendered content.`);
          process.exitCode = 1;
          break;
        }
        if (defects.length) {
          console.error(`${name} page defects: ${defects.join('; ')}`);
          process.exitCode = 1;
          break;
        }
        try { await page.screenshot({ path: path.join(output, `final-${name}.png`), fullPage: true, timeout: 30000 }); }
        catch (error) {
          console.error(`Screenshot capture failed for ${name}: ${error.message}`);
          process.exitCode = browser.isConnected() ? 1 : 75;
          break;
        }
        console.log(`Captured ${name} ${width}x${height}: ${title || 'rendered page'}`);
        await page.close();
      } catch (error) {
        console.error(`Capture script/rendering failure for ${name}: ${error.stack || error.message}`);
        process.exitCode ||= 1;
        try { await page?.close(); } catch {}
        break;
      }
    }
  }
} finally {
  if (browser) {
    try { await browser.close(); }
    catch (error) {
      console.error(`Could not close capture browser cleanly: ${error.message}`);
      if (!process.exitCode) process.exitCode = 75;
    }
  }
}
process.exit(process.exitCode || 0);
})().catch(error => {
  console.error(`Capture script defect: ${error.stack || error.message}`);
  process.exit(1);
});
NODE
