// Paket B «Packen fühlt sich echt an» (Noah 03.11.2026 «a», Idee 11): the open bag shows a small drawn bag whose
// top rolls shut when the bag is full (also on the drawn bike); the click is a short buzz that follows the same
// switch as the tick buzz and stays off with reduce motion. Fictional fixture; nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

async function packDay(page, context, info) {
  const file = info.outputPath('roll-fixture.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    window.__buzz = [];
    navigator.vibrate = (p) => (window.__buzz.push(p), true);
  });
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert/)).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
  await expect(page.locator('.made-card')).toBeVisible();
  await page.locator('.trip-band nav a').filter({ hasText: T(BAR.pack) }).click();
  await expect(page.locator('.pd .pbag.cur')).toBeVisible();
}

// the bag moves on 0.7 s after it is full, so a slow poll could miss the closed look: a watcher remembers it
const watchClosed = (page) =>
  page.evaluate(() => {
    window.__closed = false;
    new MutationObserver(() => {
      if (document.querySelector('.pd section.pbag.cur [data-bag-roll].closed')) window.__closed = true;
    }).observe(document.querySelector('.pd'), { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  });
const sawClosed = (page) => expect.poll(() => page.evaluate(() => window.__closed)).toBe(true);

test('Packen: the small bag stands open, rolls shut when the bag is full, and the click buzzes', async ({ page, context }, info) => {
  await packDay(page, context, info);
  const roll = page.locator('.pd section.pbag.cur [data-bag-roll]');
  await expect(roll).toBeVisible();
  await expect(roll).not.toHaveClass(/closed/);
  // tick all but the last open item: still open
  const open = page.locator('.pd section.pbag.cur button.it[aria-pressed="false"]');
  const n = await open.count();
  for (let i = 0; i < n - 1; i++) (await open.first().click(), await page.waitForTimeout(450)); // a second tap within 0.4 s on the same spot counts as the first
  await expect(roll).not.toHaveClass(/closed/);
  await page.evaluate(() => (window.__buzz.length = 0));
  await watchClosed(page);
  // the last one: the top rolls shut ...
  await open.first().click();
  await sawClosed(page);
  // ... and the buckle clicks (a double buzz after the tick buzz)
  await expect.poll(() => page.evaluate(() => window.__buzz.some((p) => Array.isArray(p)))).toBe(true);
});

test('Packen: with reduce motion nothing rolls and nothing clicks', async ({ page, context }, info) => {
  await packDay(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const roll = page.locator('.pd section.pbag.cur [data-bag-roll]');
  expect(await roll.locator('.top').evaluate((el) => getComputedStyle(el).transitionDuration)).toMatch(/^0s/);
  await page.evaluate(() => (window.__buzz.length = 0));
  const open = page.locator('.pd section.pbag.cur button.it[aria-pressed="false"]');
  const n = await open.count();
  for (let i = 0; i < n - 1; i++) (await open.first().click(), await page.waitForTimeout(450)); // a second tap within 0.4 s on the same spot counts as the first
  await watchClosed(page);
  await open.first().click();
  await sawClosed(page); // it changes, but without rolling and without a click
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.__buzz.some((p) => Array.isArray(p)))).toBe(false);
});

test('Packen: a full bag on the drawn bike has its top rolled shut', async ({ page, context }, info) => {
  await packDay(page, context, info);
  const bike = page.locator('[data-pack-bike]');
  await expect(bike).toBeVisible();
  const key = await bike.locator('[data-bike-bag].open').getAttribute('data-bike-bag');
  const bag = bike.locator(`[data-bike-bag="${key}"]`);
  const scale = () => bag.locator('.roll').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d);
  expect(await scale()).toBeLessThan(0.05);
  await page.locator('.pd section.pbag.cur').getByRole('button', { name: T('Whole bag packed') }).click();
  await expect(bag).toHaveClass(/full/);
  await expect.poll(scale).toBeGreaterThan(0.95);
});
