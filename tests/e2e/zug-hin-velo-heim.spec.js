// «Zug hin, Velo heim» (Träume und Neuland N7, Noah 27.10.2026 «1-5 a»): on Touren › Träume three places in
// areas never reached, about the chosen ride from the (fictional) home; a tap asks the (faked) timetable and
// bike router once and shows the next trains and the way home; «Plan as a trip» makes the trip. No real network.
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
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const HOME = { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 };
const WAY = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: { 'track-length': '63400', 'filtered ascend': '710', 'total-time': '13000' }, geometry: { type: 'LineString', coordinates: [[7.9, 47.8, 480], [8.2, 47.6, 430], [8.5417, 47.3769, 410]] } }],
};
const CONN = {
  connections: [0, 1, 2].map((i) => ({
    from: { departure: `2026-10-31T${String(7 + i).padStart(2, "0")}:04:00+0100`, platform: '7', station: { name: `${P}Zürich HB` } },
    to: { arrival: `2026-10-31T${String(8 + i).padStart(2, "0")}:12:00+0100`, station: { name: `${P}Zielort` } },
    duration: '00d01:08:00',
    transfers: 1,
    sections: [{ journey: { category: 'IR', number: '36' } }, { journey: { category: 'S', number: '19' } }],
  })),
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

test('Train there, bike home: three new places, another distance, trains and the way home, plan it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const asked = [];
  await context.route(/transport\.opendata\.ch\/v1\/locations/, (r) => (asked.push(r.request().url()), r.fulfill({ json: { stations: [{ id: r.request().url().includes('x=47.3769') ? '8503000' : '8500000', name: r.request().url().includes('x=47.3769') ? `${P}Zürich HB` : `${P}Zielort`, distance: 400 }] } })));
  await context.route(/transport\.opendata\.ch\/v1\/connections/, (r) => (asked.push(r.request().url()), r.fulfill({ json: CONN })));
  await context.route(/brouter\.de/, (r) => (asked.push(r.request().url()), r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(WAY) })));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!brouter\.de)(?!transport\.opendata\.ch)/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  // without a home place the part stays away
  await expect(page.locator('[data-dreams-page], main').first()).toBeVisible();
  await expect(page.locator('[data-train-home]')).toHaveCount(0);

  await put(page, 'settings', [{ key: 'homePlace', value: HOME }]);
  await put(page, 'bikes', [BIKE]);
  await page.reload();
  await ready(page);

  // 1. three places with the train time (asked when shown) and the bike time (estimated)
  const sec = page.locator('[data-train-home]');
  const rows = sec.locator('[data-th-start]');
  await expect(rows).toHaveCount(3, { timeout: 20000 });
  await expect(rows.first()).toContainText(T('≈ {km} km home').split('{')[0].trim());
  const tm = rows.first().locator('[data-th-times]');
  await expect(tm).toContainText(T('about {time} by train', { time: T('{h} h {m} min', { h: 1, m: '08' }) }), { timeout: 20000 });
  await expect(tm).toContainText(T('about {time} by bike', { time: '' }).replace(/\s+/g, ' ').trim().split(' ').slice(-3).join(' '));
  expect(asked.filter((u) => u.includes('brouter'))).toEqual([]);
  await noSideways(page);
  await shot(sec, info, 'ZV1-orte');

  // 2. another distance: other places
  const first60 = await rows.first().getAttribute('data-th-start');
  await sec.getByRole('button', { name: '120 km', exact: true }).click();
  await expect(rows.first()).not.toHaveAttribute('data-th-start', first60);
  await sec.getByRole('button', { name: '60 km', exact: true }).click();
  await expect(rows.first()).toHaveAttribute('data-th-start', first60);

  // 3. trains and the way home, asked once on the tap
  await rows.first().locator('[data-th-open]').click();
  const dlg = page.locator('[data-train-sheet]');
  await expect(dlg.locator('[data-th-trains] li')).toHaveCount(3);
  await expect(dlg.locator('[data-th-trains] li').first()).toContainText('07:04 → 08:12');
  await expect(dlg.locator('[data-th-ride]')).toContainText('63 km');
  expect(asked.filter((u) => u.includes('brouter'))).toHaveLength(1);
  await noSideways(page);
  await shot(dlg, info, 'ZV2-zuege');

  // 4. plan it: a trip with the way home as its route
  await dlg.locator('[data-th-plan]').click();
  await expect(page).toHaveURL(/#\/pack/);
  expect(errors).toEqual([]);
});
