// «Neuland liest die Strava-Linien» (Noah 21.11.2026 «Neuland und Heatmap scheinen unterschiedliche Daten zu nutzen»):
// a fictional Strava ride over the Klausenpass (its line as Strava sends it, one encoded text) is drawn on the
// Heatmap and ticks its cantons and the pass in Neuland. Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';
import { ready } from './settle.js';

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
const KLAUSEN = [
  [47.3769, 8.5417], [47.295, 8.564], [47.238, 8.577], [47.082, 8.634], [47.0207, 8.653], [46.996, 8.606], [46.904, 8.623],
  [46.8804, 8.6444], [46.876, 8.665], [46.862, 8.77], [46.8686, 8.8546], [46.887, 8.9], [46.921, 8.997],
];

async function seed(page, rows) {
  await page.evaluate(
    (list) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('activities', 'readwrite');
          for (const row of list) tx.objectStore('activities').put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    rows,
  );
}

test('a Strava ride is on the Heatmap and ticks its places in Neuland', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/heatmap');
  await ready(page);
  await seed(page, [{ id: 990001, day: dayBefore(12), type: 'Ride', name: 'test_data_gtp_Klausen', km: 120, line: encodePolyline(KLAUSEN) }]);

  // the Heatmap draws the ride
  await page.reload();
  await ready(page);
  const main = page.locator('main');
  await expect(main.getByTestId('heat-sum')).toContainText(/^1 \S+ /);
  await shot(page, info, 'NS1-heatmap');

  // Neuland ticks the places on the same ride
  await page.goto('./#/neuland');
  await ready(page);
  const list = main.getByRole('list', { name: T('Cantons') });
  for (const c of ['Uri', 'Glarus', 'Schwyz']) await expect(list.locator('li', { hasText: T('Canton {name}', { name: c }) }).getByRole('button', { pressed: true })).toBeVisible();
  await shot(page, info, 'NS2-neuland');
  expect(errors).toEqual([]);
});
