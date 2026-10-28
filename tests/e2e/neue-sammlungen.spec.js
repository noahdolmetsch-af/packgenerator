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

// ages the kept waterfalls to `old` (ISO) and forgets their try, as if a week had passed
const ageOsm = (page, old) =>
  page.evaluate(
    (at) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const st = r.result.transaction('meta', 'readwrite').objectStore('meta');
          const g = st.get('neuland.osm');
          g.onsuccess = () => {
            const rec = g.result;
            st.put({ ...rec, tried: { ...rec.tried, waterfalls: undefined }, waterfalls: { ...rec.waterfalls, at } }).onsuccess = () => (r.result.close(), ok());
          };
        };
      }),
    old,
  );

// Noah 28.10.2026 «5b»: the places load by themselves and once a week again; without internet one tap loads them
test('Neue Sammlungen: Wasserfälle load from OpenStreetMap by themselves, a route ticks one', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let online = false;
  let asked = 0;
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => {
    if (r.request().url().startsWith('https://overpass-api.de/')) {
      if (!online) return r.abort();
      asked++;
      const body = decodeURIComponent(r.request().postData() ?? '');
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body.includes('waterfall') ? ANSWER : { elements: [] }) });
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

  // 1. no internet: the try by itself fails quietly; a short explanation and one button stay
  const load = main.locator('[data-osm-load="waterfalls"]');
  await expect(load).toContainText(T('These places come from OpenStreetMap. They load by themselves (Switzerland, a few hundred places) and again once a week; then they are on this device and work offline.'));
  await expect(load.locator('[data-osm-btn]')).toBeEnabled();
  await noSideways(page);
  await shot(page, info, 'NS1-laden');

  // 2. back online: one tap loads; the waterfall on the route is found, the credit line names the weekly update
  online = true;
  await load.locator('[data-osm-btn]').click();
  const list = main.getByRole('list', { name: T('Waterfalls') });
  await expect(list.locator('li')).toHaveCount(3);
  await expect(list.locator('li', { hasText: `${P}Tobelfall` }).getByRole('button', { pressed: true })).toBeVisible();
  await expect(list.locator('li', { hasText: `${P}Talfall` }).locator('button.tk[aria-pressed=false]')).toBeVisible();
  await expect(main.locator('[data-osm-credit]')).toContainText(T('Places © OpenStreetMap contributors (ODbL), loaded {day}. They update by themselves once a week.', { day: '' }).split('{day}')[0].slice(0, 20));
  await expect(main.locator('[data-osm-load]')).toHaveCount(0);
  expect(asked).toBe(1);
  await noSideways(page);
  await shot(page, info, 'NS2-geladen');

  // 3. a week later: opening New ground loads the switched-on collections again by themselves, no tap
  await ageOsm(page, new Date(Date.now() - 8 * 864e5).toISOString());
  await page.reload();
  await ready(page);
  await expect.poll(() => asked, { timeout: 15000 }).toBe(2);
  await expect(main.getByRole('list', { name: T('Waterfalls') }).locator('li')).toHaveCount(3);
  // the towers and bridges (failed without internet just now) wait a while before the next try by themselves
  const after = asked;
  await page.reload();
  await ready(page);
  await page.waitForTimeout(1500);
  expect(asked).toBe(after);
  expect(errors).toEqual([]);
});
