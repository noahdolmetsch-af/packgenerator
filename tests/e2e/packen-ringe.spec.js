// «Neuer Schwung» Packen (Noah 26.10.2026 S2 «Kacheln mit Tiefe», 27.10.2026 «2a 3a»: page by page with motion
// and the fitting blocks): on the packing day each bag is a tile with a ring that fills as you pack (block B4);
// the open bag is framed, a full bag shows ✓, the ring draws itself when the page opens and stays still with
// reduce motion. Fictional fixture; nothing leaves the preview server.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { STEP_BAR as BAR } from '../../src/lib/stepbar.js'; // the step bar's short names (Kurze Schritte)

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

async function packDay(page, context, info) {
  const file = info.outputPath('ringe-fixture.json');
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

test('Packen: every bag is a tile with a ring that fills, the open one is framed, a full one shows a tick', async ({ page, context }, info) => {
  await packDay(page, context, info);
  const tiles = page.locator('.pd ul.blist > li.brow');
  const n = await tiles.count();
  expect(n).toBeGreaterThan(1);
  await expect(page.locator('.pd ul.blist [data-bag-ring]')).toHaveCount(n);
  // the open bag is framed in the accent
  const open = page.locator('.pd ul.blist > li.brow.open');
  await expect(open).toHaveCount(1);
  expect(await open.evaluate((el) => getComputedStyle(el).borderTopColor)).not.toBe(await tiles.filter({ hasNot: page.locator('[aria-current]') }).first().evaluate((el) => getComputedStyle(el).borderTopColor));
  // the ring draws itself on opening
  expect(await open.locator('.bring .fg').evaluate((el) => getComputedStyle(el).animationName)).toMatch(/pk-ring$/);
  // a tick fills the ring a little and counts at once
  const ring = open.locator('[data-bag-ring]');
  const before = (await ring.locator('.rn').textContent()).trim();
  const [done, of] = before.split('/').map(Number);
  const offset0 = Number(await ring.locator('.fg').evaluate((el) => el.style.strokeDashoffset));
  await page.locator('.pd section.pbag.cur button.it[aria-pressed="false"]').first().click();
  await expect(ring.locator('.rn')).toHaveText(`${done + 1}/${of}`);
  expect(Number(await ring.locator('.fg').evaluate((el) => el.style.strokeDashoffset))).toBeLessThan(offset0);
  // «Whole bag packed»: that bag's tile shows a tick in a full ring
  const name = (await page.locator('.pd section.pbag.cur .bagh b').textContent()).trim();
  await page.locator('.pd section.pbag.cur').getByRole('button', { name: T('Whole bag packed') }).click();
  const doneTile = tiles.filter({ hasText: name });
  await expect(doneTile.locator('.bring.full')).toHaveCount(1);
  await expect(doneTile.locator('.bring.full .rn svg')).toHaveCount(1);
  // the tiles never push the page sideways
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('Packen with reduce motion: the rings do not draw', async ({ page, context }, info) => {
  await packDay(page, context, info);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.pd ul.blist .bring .fg').first().evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
