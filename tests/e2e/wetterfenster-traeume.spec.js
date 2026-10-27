// «Wetterfenster für Träume» (Träume und Neuland N15, Noah 27.10.2026 «1-5 a»): a dream that fits now gets «dry …»
// on Träume and on Touren › Übersicht when the (faked) forecast has dry days in a row. Fictional data, no real network.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plus = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const wd = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('de-CH', { weekday: 'short', timeZone: 'UTC' }).replace(/\.$/, '');
// today rain, then three dry days, then rain again
const METEO = () => {
  const time = Array.from({ length: 8 }, (_, i) => plus(i));
  const wet = (i) => i === 0 || i >= 4;
  return { daily: { time, temperature_2m_min: time.map(() => 6), temperature_2m_max: time.map(() => 17), precipitation_sum: time.map((_, i) => (wet(i) ? 6 : 0)), precipitation_probability_max: time.map((_, i) => (wet(i) ? 80 : 10)) } };
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

test('Weather window: a dream that fits now says which dry days come, on Dreams and the overview', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let asked = 0;
  await context.route(/api\.open-meteo\.com\/v1\/forecast/, (r) => (/latitude=46\.57/.test(r.request().url()) && asked++, r.fulfill({ json: METEO() })));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!api\.open-meteo\.com)/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  const month = Number(today().slice(5, 7));
  await put(page, 'settings', [
    { key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } },
    { key: 'dreams', value: { dreams: [{ id: `${P}d1`, title: `${P}Über die Furka`, kind: 'alps', days: 3, months: [month], route: { line: [[46.57, 8.41], [46.56, 8.33]], km: 84, gainM: 1900, name: '' } }, { id: `${P}d2`, title: `${P}Später`, kind: 'alps', days: 1, months: [(month % 12) + 1] }] } },
  ]);
  await page.reload();
  await ready(page);

  const range = `${wd(plus(1))}–${wd(plus(3))}`;
  const row = page.locator('[data-dream]').filter({ hasText: `${P}Über die Furka` });
  await expect(row).toContainText(T('Fits now, dry {days}', { days: range }));
  await expect(page.locator('[data-dream]').filter({ hasText: `${P}Später` })).not.toContainText(T('dry {days}', { days: '' }).trim());
  await shot(row, info, 'WT1-traum');
  expect(asked).toBe(1); // one place: the start of the dream's map

  // the overview: the dream row adds the dry days; the kept forecast is used, nothing asked again
  await page.goto('./#/trips');
  await ready(page);
  await expect(page.locator('[data-dream-now-wx]')).toHaveText(T('dry {days}', { days: range }));
  await shot(page.locator('[data-dream-now]'), info, 'WT2-uebersicht');
  expect(asked).toBe(1);
  expect(errors).toEqual([]);
});
