// Update-Check (Noah 20.10.2026 «2a»): a phone that has the app stored gets the new version.
// The test serves two builds of the app itself, an «older» one (built with APP_VERSION_OVERRIDE=0.0.1
// into dist-old/) and today's (dist/), at the same address /packgenerator/, with the service worker on:
// 1. the phone opens the old app; it is stored for offline use and shows 0.0.1 under Ich,
// 2. the address now serves the new build (as after going online),
// 3. after starting the app again, Ich shows today's version, and it also starts without network.
// The workflow .github/workflows/live.yml builds both folders first (LIVE=1); a pull request does not run it.
import { test, expect } from '@playwright/test';
import { appVersion } from '../../../scripts/news.mjs';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const NEW = appVersion(); // scripts/news.mjs (version at merge time)
const OLD = '0.0.1';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

let folder = 'dist-old';
let server;
let base;

test.use({ serviceWorkers: 'allow' });
test.setTimeout(5 * 60_000);

test.beforeAll(async () => {
  for (const f of ['dist-old', 'dist']) if (!existsSync(join(ROOT, f, 'index.html'))) throw new Error(`${f}/ fehlt: zuerst bauen (siehe live.yml)`);
  server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (!url.pathname.startsWith('/packgenerator/')) return res.writeHead(404).end();
    let file = normalize(join(ROOT, folder, decodeURIComponent(url.pathname.slice('/packgenerator/'.length)) || 'index.html'));
    if (!file.startsWith(join(ROOT, folder))) return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) return res.writeHead(404).end();
    // like GitHub Pages: short caching, so a new build is seen
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'max-age=0' });
    res.end(readFileSync(file));
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  base = `http://127.0.0.1:${server.address().port}/packgenerator/`;
});
test.afterAll(() => server?.close());

const version = async (page) => {
  await page.goto(`${base}#/me`);
  await page.reload(); // a real start of the app, not only a change of the address after the #
  await page.locator('main').waitFor({ timeout: 30_000 });
  await expect.poll(() => page.locator('main').innerText().then((s) => s.trim().length), { timeout: 30_000 }).toBeGreaterThan(20);
  return page.locator('main').innerText();
};

test('Update: the stored old app becomes the new one after the next start, and works offline', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  folder = 'dist-old';
  expect(await version(page)).toContain(`Version ${OLD}`);
  await expect.poll(() => page.evaluate(async () => !!(await navigator.serviceWorker?.ready)?.active), { timeout: 60_000 }).toBe(true);

  folder = 'dist'; // the new version is online
  let text = '';
  for (let i = 0; i < 12 && !text.includes(`Version ${NEW}`); i++) {
    text = await version(page);
    if (!text.includes(`Version ${NEW}`)) await page.waitForTimeout(5_000);
  }
  expect(text, 'nach dem Update zeigt Ich die neue Version').toContain(`Version ${NEW}`);

  await context.setOffline(true);
  expect(await version(page)).toContain(`Version ${NEW}`);
  await page.goto(`${base}#/`);
  await expect(page.locator('[data-error-page]')).toHaveCount(0);
  await context.setOffline(false);
  expect(errors).toEqual([]);
});

test('Update on an app left open: coming back to the screen brings the new version, without a new start', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  folder = 'dist-old';
  expect(await version(page)).toContain(`Version ${OLD}`);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker?.controller), { timeout: 60_000 }).toBe(true);

  folder = 'dist'; // the new version is online; the app stays open, nobody reloads it
  // the phone brings the app back to the screen (Android: back from the background)
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect.poll(() => page.locator('main').innerText(), { timeout: 60_000, message: 'die offene App lädt die neue Version von selbst' }).toContain(`Version ${NEW}`);
  expect(errors).toEqual([]);
});

// 07.11.2026 (Noah: «Jetzt laden» in the dark bar does nothing on his phone): the real tap on the bar, with a
// touch screen and the service worker on, brings the new version (and not the old one from the offline copy).
test('The bar «Load now»: a tap on a touch screen loads the new version, data stays', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 }, serviceWorkers: 'allow' });
  const page = await context.newPage();
  folder = 'dist-old';
  expect(await version(page)).toContain(`Version ${OLD}`);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker?.controller), { timeout: 60_000 }).toBe(true);
  await page.evaluate(() => localStorage.setItem('pg-keep', 'still here'));
  folder = 'dist';
  // the device has known for a long time that a newer version is online (the bar waits two minutes)
  await page.evaluate((v) => localStorage.setItem('pg-behind', JSON.stringify({ v, at: 1 })), NEW);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  const bar = page.locator('[data-behind-bar]');
  await expect(bar).toBeVisible({ timeout: 30_000 });
  const btn = bar.locator('button').first();
  const box = await btn.boundingBox();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('[data-behind-bar]')).toHaveCount(0, { timeout: 30_000 });
  await page.locator('main').waitFor({ timeout: 30_000 });
  await expect.poll(() => page.evaluate(() => document.body.innerText), { timeout: 30_000 }).not.toContain(`Version ${OLD}`);
  expect(await page.evaluate(() => localStorage.getItem('pg-keep'))).toBe('still here');
  await page.goto(`${base}#/me`);
  await expect(page.locator('[data-version-row]')).toContainText(`Version ${NEW}`, { timeout: 30_000 });
  await context.close();
});

