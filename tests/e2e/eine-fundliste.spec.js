// «Eine Fundliste» (Träume und Neuland N10): a summit in the Gipfelbuch ticks the peak in New ground, and
// «Neuland» of the year in «Was mir gut tut» shows it once, next to an own entry. Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const dayBefore = (n) => ((d) => (d.setUTCDate(d.getUTCDate() - n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

async function putSettings(page, rows) {
  await page.evaluate(
    (list) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          for (const row of list) tx.objectStore('settings').put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    rows,
  );
}

test('Eine Fundliste: the Gipfelbuch ticks New ground, the year lists it once', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  // a summit entered by hand in the Gipfelbuch (this year, unless today is 1 or 2 January), and an own Neuland entry
  const day = today().slice(5) <= '01-03' ? today() : dayBefore(2);
  const year = day.slice(0, 4);
  await putSettings(page, [
    { key: 'gipfelbuch', value: { places: [{ id: `${P}g1`, name: 'Piz Corvatsch', sport: 'hike', ele: 3451, lat: 46.409, lon: 9.813, label: '', note: '', createdAt: `${day}T10:00:00.000Z` }], visits: [{ id: `${P}v1`, placeId: `${P}g1`, day, ref: 'hand', hm: null }], dismissed: [] } },
    { key: 'neulandYear', value: [{ id: `${P}n1`, name: `${P}Neues Café`, day }] },
  ]);

  // 1. New ground › Peaks: ticked, «from your summit book»
  await page.goto('./#/neuland?c=peaks');
  await page.reload();
  await ready(page);
  const main = page.locator('main');
  const peaks = main.getByRole('list', { name: T('Peaks over 3000 m') });
  const row = peaks.locator('li', { hasText: 'Piz Corvatsch' });
  await expect(row.getByRole('button', { pressed: true })).toBeVisible();
  await expect(row).toContainText(T('from your summit book'));
  await row.scrollIntoViewIfNeeded();
  await noSideways(page);
  await shot(page, info, 'FL1-neuland');

  // 2. Was mir gut tut › Neuland: the own entry and the summit, each once, the summit links to New ground
  await page.goto('./#/me/wohl');
  await ready(page);
  const list = page.locator('[data-wohl-neuland]');
  await expect(list.locator('li', { hasText: 'Piz Corvatsch' })).toHaveCount(1);
  await expect(list.locator('li', { hasText: `${P}Neues Café` })).toHaveCount(1);
  await expect(list.locator('li', { hasText: 'Piz Corvatsch' }).getByRole('link', { name: T('from New ground') })).toHaveAttribute('href', '#/neuland?c=peaks');
  // the summit also lies in a canton New ground had not found yet: it shows too, once
  await expect(list.locator('li', { hasText: T('Canton {name}', { name: 'Graubünden' }) })).toHaveCount(1);
  // only the own entry can be renamed and deleted here
  await expect(list.getByRole('button', { name: T('Delete «{name}»', { name: 'Piz Corvatsch · 3451 m' }) })).toHaveCount(0);
  await expect(list.getByRole('button', { name: T('Delete «{name}»', { name: `${P}Neues Café` }) })).toBeVisible();
  await list.scrollIntoViewIfNeeded();
  await noSideways(page);
  await shot(page, info, 'FL2-wohl');
  expect(year).toMatch(/^\d{4}$/);
  expect(errors).toEqual([]);
});
