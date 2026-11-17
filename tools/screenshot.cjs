// Renders index.html with Playwright.
//   node tools/screenshot.cjs                 -> telegram.png (1080x1350 poster at 2x)
//   node tools/screenshot.cjs --check <dir>   -> also desktop / phone / dark previews into <dir>
// Optional env for offline runs: D3_PATH (local d3.min.js), FONT_CACHE (dir with fonts.css + cached woff2 files).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pageUrl = 'file://' + path.join(root, 'index.html');
const args = process.argv.slice(2);
const checkDir = args[0] === '--check' ? args[1] : null;

async function routes(ctx) {
  if (process.env.D3_PATH) {
    await ctx.route('https://cdnjs.cloudflare.com/**', r => r.fulfill({ path: process.env.D3_PATH, contentType: 'application/javascript' }));
  }
  const fc = process.env.FONT_CACHE;
  if (fc) {
    await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ path: path.join(fc, 'fonts.css'), contentType: 'text/css' }));
    await ctx.route('https://fonts.gstatic.com/**', r => {
      const f = new URL(r.request().url()).pathname.slice(1).replace(/\//g, '_');
      r.fulfill({ path: path.join(fc, f), contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' } });
    });
  }
}

async function shot(browser, { file, viewport, dsf = 1, poster = false, dark = false, hash = '', fullPage = false }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: dsf, colorScheme: dark ? 'dark' : 'light' });
  await routes(ctx);
  if (poster) await ctx.addInitScript(() => { window.__POSTER = true; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(pageUrl + hash);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  await page.waitForTimeout(hash ? 1200 : 300);
  await page.screenshot({ path: file, fullPage });
  await ctx.close();
  if (errors.length) console.log(file, 'errors:', errors);
  console.log('wrote', file);
}

(async () => {
  const browser = await chromium.launch();
  await shot(browser, { file: path.join(root, 'telegram.png'), viewport: { width: 1080, height: 1350 }, dsf: 2, poster: true });
  if (checkDir) {
    fs.mkdirSync(checkDir, { recursive: true });
    await shot(browser, { file: path.join(checkDir, 'desktop.png'), viewport: { width: 1440, height: 900 } });
    await shot(browser, { file: path.join(checkDir, 'desktop-dark-slough.png'), viewport: { width: 1440, height: 900 }, dark: true, hash: '#slough' });
    await shot(browser, { file: path.join(checkDir, 'phone.png'), viewport: { width: 390, height: 844 }, dsf: 1, fullPage: true });
  }
  await browser.close();
})();
