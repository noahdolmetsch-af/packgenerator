// «Neue Kilometer» (Träume und Neuland N4, Noah 27.10.2026 «1-5 a»): on Neuland, each year with its km on roads
// ridden for the first time, and the latest rides with new km. Fictional Strava rides only, no real network.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { encodePolyline } from '../../src/lib/spur/polyline.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const dayBefore = (n) => ((d) => (d.setUTCDate(d.getUTCDate() - n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// a fictional straight road: 0.04° north ≈ 4.4 km, and the same road twice as long
const SHORT = [[47.0, 8.3], [47.02, 8.3], [47.04, 8.3]];
const LONG = [[47.0, 8.3], [47.04, 8.3], [47.08, 8.3]];

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

test('New kilometres: per year and the latest rides on roads ridden for the first time', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  const card = page.locator('[data-new-km]');
  await expect(card).toContainText(T('No ride with a line yet. Connect Strava or upload a ride, then the app counts your new km.'));

  // last year the short road; this year the same road again (nothing new) and the long one (half new)
  const last = dayBefore(400).slice(0, 4);
  const now = dayBefore(2).slice(0, 4);
  await put(page, 'activities', [
    { id: '9101', day: dayBefore(400), type: 'Ride', name: `${P}Erste Runde`, km: 4.4, line: encodePolyline(SHORT) },
    { id: '9102', day: dayBefore(3), type: 'Ride', name: `${P}Wieder gleich`, km: 4.4, line: encodePolyline(SHORT) },
    { id: '9103', day: dayBefore(2), type: 'GravelRide', name: `${P}Weiter hinaus`, km: 8.9, line: encodePolyline(LONG) },
    { id: '9104', day: dayBefore(1), type: 'Run', name: `${P}Lauf`, km: 5, line: encodePolyline([[46.9, 8.2], [46.94, 8.2]]) },
  ]);
  await page.reload();
  await ready(page);
  await expect(card.locator(`[data-nk-year="${last}"]`)).toContainText(T('{km} km new', { km: '4' }));
  await expect(card.locator(`[data-nk-year="${last}"]`)).toContainText('100 %');
  if (now !== last) await expect(card.locator(`[data-nk-year="${now}"]`)).toContainText(T('{km} km new', { km: '4' }));
  const rides = card.locator('[data-nk-ride]');
  await expect(rides).toHaveCount(2); // «Wieder gleich» brought nothing new, the run does not count
  await expect(rides.first()).toContainText(`${P}Weiter hinaus`);
  await expect(rides.first()).toContainText(T('{km} of {all} km new', { km: '4', all: '9' }));
  await expect(card).not.toContainText(`${P}Wieder gleich`);
  await expect(card).not.toContainText(`${P}Lauf`);
  await card.scrollIntoViewIfNeeded();
  await shot(card, info, 'NK1-neue-km');
  await noSideways(page);

  // the way to the heatmap
  await card.getByRole('link', { name: T('Heatmap') }).click();
  await expect(page).toHaveURL(/#\/heatmap/);
  expect(errors).toEqual([]);
});
