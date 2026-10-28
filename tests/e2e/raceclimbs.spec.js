// Paket U2 «Anstiege» (Noah 19.10.2026 «2a»): the page Rennen › Anstiege with the sample race (made up, in the
// app source): more than 10 climbs, sort by steepness, one climb opens with its gradient bars, a note is
// written and deleted with Undo, and nothing scrolls sideways. Fictional data (home0460-fixture.js).
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

const noSideways = async (page, where = '') => {
  const over = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right + scrollX > w + 1);
    return { d: document.documentElement.scrollWidth - w, bad: bad.slice(0, 6).map((e) => `${e.tagName}.${e.className} ${Math.round(e.getBoundingClientRect().right)}`) };
  });
  expect(over.d, `${where} ${over.bad.join(' | ')}`).toBeLessThanOrEqual(1);
};
const table = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const rq = indexedDB.open('pack-generator');
        rq.onsuccess = () => {
          const g = rq.result.transaction('settings').objectStore('settings').get('races');
          g.onsuccess = () => resolve(g.result?.value?.races?.['race-sample'] ?? null);
        };
      }),
  );

test('Climbs: the list, sorting, one climb with its chart, a note with Undo, no sideways scroll', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/race/race-sample/climbs');
  await expect(page.locator('[data-page="race-climbs"]')).toBeVisible();

  // the list: more than 10 climbs, the totals and the bar row
  const rows = page.locator('[data-climbs-list] > li');
  await expect.poll(() => rows.count()).toBeGreaterThan(10);
  await expect(page.locator('[data-climbs-sum]')).toBeVisible();
  await expect(page.locator('[data-climbs-bars] rect').nth(10)).toBeAttached();
  await noSideways(page, 'list');
  // the fine, zoomable profile of the whole route is on the page too
  const prof = page.locator('[data-climbs-profile] [data-profile]');
  await expect(prof).toBeVisible();
  await expect(prof).toHaveAttribute('data-profile-fine', '');

  // sort by steepness: the first row is the steepest
  await page.locator('[data-climbs-sort="steep"]').click();
  await expect(page.locator('[data-climbs-sort="steep"]')).toHaveAttribute('aria-pressed', 'true');
  const maxes = await rows.evaluateAll((li) => li.map((x) => Number(x.dataset.climbMax)));
  expect(maxes[0]).toBe(Math.max(...maxes));
  expect([...maxes].sort((a, b) => b - a)).toEqual(maxes);

  // the minimum gain filters
  await page.locator('[data-climbs-min-in]').fill('1000');
  await page.locator('[data-climbs-min-in]').press('Tab');
  await expect.poll(() => rows.count()).toBeLessThan(maxes.length);
  await page.locator('[data-climbs-min="100"]').click();
  await expect.poll(() => rows.count()).toBe(maxes.length);

  // open one: the chart bars, the mini profile, the times and the map link
  const first = rows.first();
  const n = await first.getAttribute('data-climb-row');
  await first.locator('[data-climb-open]').click();
  const card = page.locator(`[data-climb-card="${n}"]`);
  await expect(card).toBeVisible();
  await expect(page.locator(`[data-climb-open="${n}"]`)).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => card.locator('[data-climb-bar]').count()).toBeGreaterThan(20);
  await expect(card.locator('[data-climb-mini]')).toBeVisible();
  await expect(card.locator('[data-climb-when]')).toBeVisible();
  await expect(card.locator('[data-climb-map]')).toHaveAttribute('href', /#\/race\/race-sample\/map\?km=\d/);
  // opening the climb zooms the profile to it
  const range = page.locator('[data-climbs-profile] [data-profile-range]');
  await expect.poll(async () => Number(await range.getAttribute('data-to')) - Number(await range.getAttribute('data-from'))).toBeLessThan(200);
  await noSideways(page, 'card');

  // a note: write, save, it is stored; delete asks, Undo brings it back
  await card.locator('[data-climb-note]').fill('test_data_gtp_ kleiner Gang ab der Brücke');
  await card.locator('[data-climb-note-save]').click();
  await expect.poll(async () => Object.values((await table(page))?.climbNotes ?? {})).toEqual(['test_data_gtp_ kleiner Gang ab der Brücke']);
  await card.locator('[data-climb-note-del]').click();
  const ask = page.getByTestId('ask-delete');
  await expect(ask).toBeVisible();
  await ask.getByRole('button', { name: T('Delete') }).click();
  await expect.poll(async () => Object.keys((await table(page))?.climbNotes ?? {}).length).toBe(0);
  await expect(card.locator('[data-climb-note-del]')).toHaveCount(0);
  const toast = page.locator('.rtoast');
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => Object.values((await table(page))?.climbNotes ?? {})).toEqual(['test_data_gtp_ kleiner Gang ab der Brücke']);
  await expect(card.locator('[data-climb-note]')).toHaveValue('test_data_gtp_ kleiner Gang ab der Brücke');

  // ?climb=<n> opens that climb directly
  await page.goto('./#/race/race-sample/climbs?climb=21');
  await page.reload();
  await expect(page.locator('[data-climb-card="21"]')).toBeVisible();
  await expect(page.locator('[data-climb-card="21"]')).toContainText(/2.?060 m/);
  await noSideways(page, 'climb 21');
});
