// «Neue Sammlungen» (Träume und Neuland N18): Wasserfälle load once from OpenStreetMap (a fake answer here),
// a fictional route past one of them ticks it, the credit line shows. Fictional data only.
import { test, expect } from '@playwright/test';
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

const ANSWER = {
  elements: [
    { type: 'node', id: 1, lat: 47.25, lon: 8.6, tags: { waterway: 'waterfall', name: `${P}Tobelfall`, ele: '540' } },
    { type: 'node', id: 2, lat: 46.6, lon: 7.9, tags: { waterway: 'waterfall', name: `${P}Talfall` } },
    { type: 'node', id: 3, lat: 46.3, lon: 8.8, tags: { waterway: 'waterfall', name: `${P}Bergfall` } },
  ],
};

async function seed(page, trips) {
  await page.evaluate(
    (rows) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('trips', 'readwrite');
          for (const row of rows) tx.objectStore('trips').put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    trips,
  );
}

test('Neue Sammlungen: Wasserfälle load from OpenStreetMap once, a route ticks one', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let asked = 0;
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => {
    if (r.request().url().startsWith('https://overpass-api.de/')) {
      asked++;
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANSWER) });
    }
    return r.abort();
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  await seed(page, [{ id: `${P}tobel`, title: `${P}Tobel-Runde`, domain: 'bikepacking', startDate: dayBefore(10), days: 1, status: 'done', entries: [], route: { name: `${P}Tobel`, km: 30, line: [[47.3, 8.55], [47.25, 8.6], [47.2, 8.65]] } }]);
  await page.goto('./#/neuland?c=waterfalls');
  await page.reload();
  await ready(page);
  const main = page.locator('main');

  // 1. not loaded yet: a short explanation and one button
  const load = main.locator('[data-osm-load="waterfalls"]');
  await expect(load).toContainText(T('These places come from OpenStreetMap. Load them once (Switzerland, a few hundred places); then they are on this device and work offline.'));
  await noSideways(page);
  await shot(page, info, 'NS1-laden');

  // 2. one tap loads; the waterfall on the route is found, the credit line shows
  await load.locator('[data-osm-btn]').click();
  const list = main.getByRole('list', { name: T('Waterfalls') });
  await expect(list.locator('li')).toHaveCount(3);
  await expect(list.locator('li', { hasText: `${P}Tobelfall` }).getByRole('button', { pressed: true })).toBeVisible();
  await expect(list.locator('li', { hasText: `${P}Talfall` }).locator('button.tk[aria-pressed=false]')).toBeVisible();
  await expect(main.locator('[data-osm-credit]')).toContainText('OpenStreetMap');
  await expect(main.locator('[data-osm-load]')).toHaveCount(0);
  expect(asked).toBe(1);
  await noSideways(page);
  await shot(page, info, 'NS2-geladen');

  // 3. kept on this device: after a reload it is still there without asking again
  await page.reload();
  await ready(page);
  await expect(main.getByRole('list', { name: T('Waterfalls') }).locator('li')).toHaveCount(3);
  expect(asked).toBe(1);
  expect(errors).toEqual([]);
});
