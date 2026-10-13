// v0.123.0 «Trophäen-Vitrine» (mockups TV1–TV2, Noah 13.10.2026 «tv1-tv2 freigeben»): the link «Alle
// Trophäen ansehen» under the trophy shelf, the showcase with the stars by area (over all, Meditation),
// the year and area filters, «Nach Jahr» and «Als Nächstes erreichbar», on a phone and a computer, in
// German. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const TODAY = '2026-10-09'; // a Friday; the browser runs in Europe/Zurich
const D0 = `${TODAY}T09:00:00+02:00`;
/** Calendar-day arithmetic on YYYY-MM-DD (never «now + n × 24 h»). */
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
/** Write rows straight into the app's IndexedDB (then reload, so the app reads them). */
const put = (page, rows) =>
  page.evaluate(async (rows) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, rows);
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Trophäen-Vitrine: from the shelf to all stars by area and year', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/activity');
  await expect(page.locator('main [data-tile]')).toHaveCount(6); // seeded
  // twelve days of meditation up to today, and three in January 2025 (a fictional earlier year)
  const log = [
    ...Array.from({ length: 12 }, (_, i) => {
      const day = addDays(TODAY, -i);
      return { id: `test_tv_${i}`, actId: 'meditation', day, at: `${day}T06:30:00.000Z`, n: 1, min: 20 };
    }),
    ...['2025-01-10', '2025-01-11', '2025-01-12'].map((day, i) => ({ id: `test_tv_old_${i}`, actId: 'meditation', day, at: `${day}T06:30:00.000Z`, n: 1, min: 20 })),
  ];
  await put(page, { flowLog: log });
  await page.goto('./#/flow/milestones');
  await page.reload();
  const main = page.locator('main');

  // TV2: the link under the shelf
  const link = main.locator('[data-trophies]');
  await expect(link).toHaveText(T('See all trophies'));
  await link.click();
  await expect(page).toHaveURL(/#\/flow\/trophies$/);
  await expect(page.locator('.ptabs').getByRole('link', { name: T('Activity|tab'), exact: true })).toHaveAttribute('aria-current', 'page');

  // TV1: over all first, then Meditation; per milestone one badge, the next one dashed
  await expect(main.getByRole('heading', { level: 1, name: T('Trophy showcase') })).toBeVisible();
  const areas = main.locator('[data-area]');
  await expect(areas.first()).toHaveAttribute('data-area', 'cross');
  const med = main.locator('[data-area="meditation"]');
  await expect(med.locator('li[data-star^="meditation.daily:"]')).toHaveCount(1);
  await expect(med.locator('li.open')).toHaveCount(1);
  await expect(main.locator('[data-soon]').first()).toBeVisible();
  await fits(page, 'Vitrine');

  // by year: 2026 first, then 2025; the chip 2025 keeps only the stars of 2025
  const years = main.getByRole('heading', { name: T('By year') });
  await expect(years).toBeVisible();
  await main.locator('.chips').getByRole('link', { name: '2025', exact: true }).click();
  await expect(page).toHaveURL(/#\/flow\/trophies\?y=2025$/);
  await expect(main.locator('[data-area="meditation"] li.open')).toHaveCount(0);
  await expect(main.locator('[data-area="meditation"] small').first()).toContainText('2025');
  // an area: only Meditation
  await main.locator('.chips').getByRole('link', { name: T('All'), exact: true }).click();
  await main.locator('[data-area="meditation"]').waitFor();
  await page.goto('./#/flow/trophies?area=meditation');
  await expect(main.locator('[data-area]')).toHaveCount(1);
  await fits(page, 'Vitrine Meditation');
  expect(errors).toEqual([]);
});
