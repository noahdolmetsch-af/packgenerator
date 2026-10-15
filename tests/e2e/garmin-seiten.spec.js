// v0.146.0 «Garmin-Seiten» (GA-A1–A3, Noah 14.10.2026 «1a 2b 3b 4a», «GA-A1–A3 freigegeben»): the bike page
// shows a «Garmin pages» card (GA-A1), a tap opens the pages of the profile (GA-A2), a page opens with both
// Edges and the reasons (GA-A3). Power pedals bring the power pages; the 540 shows at most 6 fields.
// Fictional fixture (test_data_gtp_), German UI.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const noOverflow = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('Garmin pages: card on the bike, pages per profile, one page in detail', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, fileURLToPath(new URL('./fixture.json', import.meta.url)));
  await page.goto('./#/bikes');

  // GA-A1: the card on the bike page, one row for the bike's own profile
  const card = page.locator('section.gcard');
  await expect(card.getByRole('heading', { name: T('Garmin pages') })).toBeVisible();
  await expect(card.locator('a.prof')).toHaveCount(1);
  await expect(card.locator('a.prof')).toContainText('Test gravel bike');
  expect(await noOverflow(page)).toBe(true);
  await card.locator('a.prof').click();

  // GA-A2: the pages of the profile; no power pedals yet, so no «Power in detail»
  await expect(page).toHaveURL(/tab=garmin/);
  const tiles = page.locator('.tile:not(.add)');
  await expect(tiles.first()).toBeVisible();
  await expect(page.getByRole('link', { name: `GA-6 ${T('Power in detail')}`, exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: T('Power pedals'), exact: true }).click();
  const ga6 = page.getByRole('link', { name: `GA-6 ${T('Power in detail')}`, exact: true });
  await expect(ga6).toBeVisible();
  const ga6tile = page.locator('.tile', { has: ga6 });
  await expect(ga6tile).toContainText('Connect IQ');
  await expect(ga6tile).not.toContainText(T('540: shortened'));

  // 2b: on the Edge 540 the long page is shortened
  await page.getByRole('button', { name: /Edge 540/ }).click();
  await expect(ga6tile).toContainText(T('540: shortened'));

  // a page switches off and on again
  const sw = ga6tile.getByRole('switch');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(await noOverflow(page)).toBe(true);

  // GA-A3: both Edges, the reasons, change a field, tick «set up»
  await ga6.click();
  await expect(page).toHaveURL(/page=GA-6/);
  await expect(page.locator('figure')).toHaveCount(2);
  await expect(page.getByRole('heading', { name: T('Why these values') })).toBeVisible();
  await expect(page.locator('figcaption').nth(1)).toContainText(T('without «{fields}»', { fields: 'IF' }));
  await page.getByRole('button', { name: T('Change fields') }).click();
  // the 540 is full: a 7th field is refused
  await page.getByRole('button', { name: T('{field} on the Edge {device}', { field: T('IF'), device: '540' }) }).click();
  await expect(page.locator('p.msg')).toBeVisible();
  const tick = page.getByRole('checkbox', { name: /Edge 1040/ });
  await tick.click();
  await expect(tick).toHaveAttribute('aria-checked', 'true');

  // stays after a reload
  await page.reload();
  await expect(page.getByRole('checkbox', { name: /Edge 1040/ })).toHaveAttribute('aria-checked', 'true');
  expect(await noOverflow(page)).toBe(true);
  expect(errors).toEqual([]);
});
