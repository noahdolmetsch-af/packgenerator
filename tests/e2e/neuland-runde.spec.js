// «Neuland-Runde» (Träume und Neuland N2, Noah 27.10.2026 «1-5 a»): on Touren › Träume › White spots, a place
// you have never been offers «Round through it»; the (faked) bike router answers once per tap, «Other side»
// asks again, «Plan as a trip» makes a trip with the round. Fictional data only, no real network.
import { test, expect } from './clock.js';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
// a fictional round as the bike router would answer it
const ROUND = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: { 'track-length': '24300', 'filtered ascend': '180', 'total-time': '5200' }, geometry: { type: 'LineString', coordinates: [[8.5417, 47.3769, 410], [8.58, 47.4, 430], [8.6, 47.42, 445], [8.56, 47.41, 420], [8.5417, 47.3769, 410]] } }],
};

async function put(page, store, rows) {
  await page.evaluate(
    ([name, list]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(name, 'readwrite');
          for (const row of list) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}

test('New ground round: a white spot, the round through it, other side, plan as a trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const asked = [];
  await context.route(/brouter\.de/, (r) => (asked.push(r.request().url()), r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROUND) })));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!brouter\.de)/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  await put(page, 'settings', [{ key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } }]);
  await put(page, 'bikes', [BIKE]);
  await page.reload();
  await ready(page);

  // 1. tap the nearest place never visited: «Round through it» asks the router once
  const ws = page.locator('[data-white-spots]');
  const first = ws.locator('[data-ws-row]').first();
  await expect(first).toBeVisible({ timeout: 15000 });
  const name = (await first.locator('span').textContent()).trim();
  await first.click();
  await ws.locator('[data-ws-round]').click();
  const dlg = page.locator('dialog[data-spot-round][open]');
  await expect(dlg).toContainText(T('New ground round: {name}', { name }));
  await expect(dlg.locator('[data-sp-result]')).toContainText('24 km');
  await expect(dlg.locator('[data-sp-result]')).toContainText('180');
  expect(asked).toHaveLength(1);
  expect(asked[0]).toContain('lonlats=8.54170,47.37690|');
  await noSideways(page);
  await shot(page, info, 'NR1-runde');

  // 2. the other side asks once more, with another way back
  await dlg.locator('[data-sp-again]').click();
  await expect.poll(() => asked.length).toBe(2);
  expect(asked[1]).not.toBe(asked[0]);
  await expect(dlg.locator('[data-sp-result]')).toContainText('24 km');

  // 3. plan it as a trip: the window closes and the trip carries the round
  await dlg.locator('[data-sp-plan]').click();
  await expect(dlg).toBeHidden();
  await expect.poll(() => page.evaluate(() => location.hash)).toContain('#/pack');
  const trip = await page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('trips').objectStore('trips').getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result.map((x) => ({ title: x.title, km: x.route?.km ?? null, hours: x.hours }))));
        };
      }),
  );
  const made = trip.find((x) => x.title?.includes(name));
  expect(made).toBeTruthy();
  expect(made.km).toBeGreaterThan(5);
  expect(made.hours).toBe(1.5);
  expect(errors).toEqual([]);
});
