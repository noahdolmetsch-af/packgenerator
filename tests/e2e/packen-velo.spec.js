// «Neuer Schwung» Packen 3 (drawn bike with bags, Noah 27.10.2026 «1a 2a 3a», «alle anderen Vorschläge umsetzen»):
// the bike with every bag of the trip at its place; a bag fills as you pack, a full one shows ✓, a tap opens it.
// Fictional fixture; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // the step bar's short names (Kurze Schritte)

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

async function packDay(page, context, info) {
  const file = info.outputPath('velo-fixture.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
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

test('Packen: the drawn bike shows each bag, fills as you pack and opens a bag on a tap', async ({ page, context }, info) => {
  await packDay(page, context, info);
  const bike = page.locator('[data-pack-bike]');
  await expect(bike).toBeVisible();
  await expect(bike).toHaveAttribute('aria-label', T('Your bike with the bags of this trip'));
  const bags = bike.locator('[data-bike-bag]');
  expect(await bags.count()).toBeGreaterThan(0);
  // the open bag is marked on the bike too
  const open = bike.locator('[data-bike-bag].open');
  await expect(open).toHaveCount(1);
  const key = await open.getAttribute('data-bike-bag');
  const fill = () => open.locator('.fill').evaluate((el) => Number(el.style.getPropertyValue('--fill')));
  const f0 = await fill();
  await page.locator('.pd section.pbag.cur button.it[aria-pressed="false"]').first().click();
  await expect.poll(fill).toBeGreaterThan(f0);
  // «Whole bag packed»: that bag on the bike shows a tick
  await page.locator('.pd section.pbag.cur').getByRole('button', { name: T('Whole bag packed') }).click();
  const done = bike.locator(`[data-bike-bag="${key}"]`);
  await expect(done).toHaveClass(/full/);
  await expect(done.locator('text')).toHaveText('✓');
  // a tap on another bag opens it below
  const other = bike.locator('[data-bike-bag]:not(.full)').first();
  const otherKey = await other.getAttribute('data-bike-bag');
  const label = await other.getAttribute('data-bag-name');
  await other.click();
  await expect(bike.locator(`[data-bike-bag="${otherKey}"]`)).toHaveClass(/\bopen\b/);
  await expect(page.locator('.pd section.pbag.cur .bagh b')).toHaveText(label);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('Packen with reduce motion: the bags on the bike do not grow in', async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await packDay(page, context, info);
  expect(await page.locator('[data-pack-bike] .fill').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
