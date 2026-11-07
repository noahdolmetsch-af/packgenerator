// «Sammel-Wand» (Neuer Schwung, Idee F, Noah 05.11.2026): Touren › Rückblick › Sammel-Wand shows stamps, passes, places and
// stars on one page, only to look at. A full wall with the numbers, «Zuletzt dazugekommen» and the shelves; an empty wall
// that says where things come from. German UI, phone and computer, no sideways scroll. Fictional data only.
import { test, expect } from '@playwright/test';
import { TODAY, D0, addDays, put } from './aktiv-fixture.js';

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

const day = (n) => addDays(TODAY, n);
const rows = {
  settings: [
    { key: 'tourenpass', value: { stamps: [{ id: 's-a', tripId: 'test_a', place: 'Testrunde Nord', date: day(-3), km: 84 }, { id: 's-b', tripId: '', place: 'Seeland Test', date: day(-30), km: 61 }], declined: [] } },
    { key: 'paesse', value: { list: [{ id: 'p-furka', key: 'furka', name: 'Furka Test', m: 2429, date: day(-60), ref: '' }], skipped: [] } },
    {
      key: 'gipfelbuch',
      value: {
        places: [{ id: 'g1', name: 'Test Horn', sport: 'hike', ele: 3100, lat: null, lon: null, label: '', note: '', createdAt: '2026-08-20T10:00:00.000Z' }],
        visits: [{ id: 'v1', placeId: 'g1', day: day(-40), ref: 'hand', hm: null }],
        dismissed: [],
      },
    },
  ],
  flowStars: [{ id: 'test:1', msId: 'test', day: day(-10) }],
};

test('Sammel-Wand: numbers, lately, shelves; the tiles lead to the lists; no sideways scroll', async ({ page, context }) => {
  const errors = await open(page, context, '#/debrief/tourenpass');
  await expect(page.locator('[data-tourenpass]')).toBeVisible();
  await put(page, rows);
  await page.reload();
  // the way in: «Als Nächstes» of the tour pass (the row on the Rückblick shows with trips, covered by absprung.test.js)
  const next = page.locator('[data-stamp-next]').getByRole('link', { name: 'Sammel-Wand' });
  await next.scrollIntoViewIfNeeded();
  await next.click();
  await expect(page).toHaveURL(/#\/debrief\/sammlung$/);
  const root = page.locator('[data-wand]');
  await expect(root).toBeVisible();
  await expect(root.locator('[data-wand-tile="stamps"] b')).toHaveText('2');
  await expect(root.locator('[data-wand-tile="passes"] b')).toHaveText('1');
  await expect(root.locator('[data-wand-tile="places"] b')).toHaveText('1');
  await expect(root.locator('[data-wand-tile="stars"] b')).toHaveText('1');
  // lately: the newest first (a stamp three days ago)
  await expect(root.locator('[data-wand-late]').first()).toContainText('Testrunde Nord');
  // the shelves
  await expect(root.locator('[data-shelf="stamps"] [data-stamp]')).toHaveCount(2);
  await expect(root.locator('[data-shelf="passes"] [data-pass-sign]')).toContainText('Furka Test');
  await expect(root.locator('[data-shelf="places"]')).toContainText('Test Horn');
  await expect(root.locator('[data-shelf="places"]')).toContainText('3’100 m');
  // nothing to do on the wall: no goal, no percentage
  await expect(root).not.toContainText('%');
  await fits(page, 'wall');
  // a number leads to its list
  await root.locator('[data-wand-tile="passes"]').click();
  await expect(page).toHaveURL(/#\/debrief\/paesse$/);
  await page.goBack();
  await expect(page.locator('[data-wand]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Sammel-Wand: empty, it says where things come from and offers the next step', async ({ page, context }) => {
  const errors = await open(page, context, '#/debrief/sammlung');
  const root = page.locator('[data-wand]');
  await expect(root).toBeVisible();
  await expect(root.locator('[data-empty]')).toContainText('Noch nichts an der Wand');
  await expect(root.getByRole('link', { name: 'Tourenpass öffnen' })).toBeVisible();
  await fits(page, 'empty wall');
  expect(errors).toEqual([]);
});
