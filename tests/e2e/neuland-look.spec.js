// «Sammlungen mit Charakter» (Entdecken und Sammeln, Idee 2, Noah 04.11.2026): picture and tint per collection, templates.
// Fictional data only; no network.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Neuland: a collection gets a look of its own, a template starts an own collection', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  const main = page.locator('main');

  // 1. the list shows a picture before every name; the page shows the picture of the open collection
  await main.getByRole('button', { name: T('Choose collections') }).click();
  const sheet = page.locator('dialog.nl-cols');
  await expect(sheet).toBeVisible();
  const rows = sheet.locator('li.row');
  expect(await rows.count()).toBeGreaterThan(5);
  await expect(rows.first().locator('[data-nl-look]')).toBeVisible();

  // 2. the round picture of the passes opens the look window; a tap changes the picture at once
  await sheet.locator('[data-cols-look="passes"]').click();
  const look = page.locator('dialog[data-nl-look-sheet]');
  await expect(look).toBeVisible();
  await expect(look.locator('[data-look-reset]')).toHaveCount(0); // still the default
  await look.locator('[data-look-icon="bike"]').click();
  await look.locator('[data-look-tint="ok"]').click();
  await expect(look.locator('[data-look-icon="bike"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(look.locator('[data-look-tint="ok"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(look.locator('[data-look-reset]')).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'CH1-aussehen');
  await look.getByRole('button', { name: T('Done') }).click();
  await expect(sheet.locator('li.row', { hasText: T('Alpine passes') }).locator('[data-nl-look="bike.ok"]')).toBeVisible();

  // 3. a template starts an own collection with its name and look, and opens it
  await sheet.locator('[data-cols-template="viewpoints"]').scrollIntoViewIfNeeded();
  await noSideways(page);
  await shot(page, info, 'CH2-vorlagen');
  await sheet.locator('[data-cols-template="viewpoints"]').click();
  await expect(sheet).toHaveCount(0);
  await expect(main.locator('#nl-h')).toContainText(T('Viewpoints'));
  await expect(main.locator('#nl-h [data-nl-look="binoculars.warn"]')).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'CH3-sammlung');

  // 4. kept after a reload; the default comes back with «Back to the default»
  await page.reload();
  await ready(page);
  await main.getByRole('button', { name: T('Choose collections') }).click();
  await expect(sheet.locator('li.row', { hasText: T('Alpine passes') }).locator('[data-nl-look="bike.ok"]')).toBeVisible();
  await sheet.locator('[data-cols-look="passes"]').click();
  await look.locator('[data-look-reset]').click();
  await look.getByRole('button', { name: T('Done') }).click();
  await expect(sheet.locator('li.row', { hasText: T('Alpine passes') }).locator('[data-nl-look="mountain.hi"]')).toBeVisible();
  expect(errors).toEqual([]);
});
