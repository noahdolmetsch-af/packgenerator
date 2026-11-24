// «Tipp → Minuten» (Noah 24.11.2026 «1-3»): in «Heute passt: Ausflugstipps» (Touren › Träume) «Gemacht» adds the chosen time to
// the challenge «Draussen» of today, with Undo; without a running challenge the button is not there. Fictional data, no real network.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SHOTS = process.env.SHOTS_DIR ?? null;
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plus = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const METEO = () => {
  const time = Array.from({ length: 7 }, (_, i) => plus(i - 1));
  return { daily: { time, temperature_2m_min: time.map(() => 8), temperature_2m_max: time.map(() => 18), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 5) } };
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
const handOf = (page) =>
  page.evaluate(
    () =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('settings').objectStore('settings').get('outdoor');
          q.onsuccess = () => (r.result.close(), ok(q.result?.value?.hand ?? {}));
        };
      }),
  );

test('«Did it» on a trip tip adds the chosen time to Outdoors, Undo takes it back; no challenge, no button', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill({ json: METEO() }));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!api\.open-meteo\.com)/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  await put(page, 'settings', [{ key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } }]);
  await page.reload();
  await ready(page);
  const sec = page.locator('[data-trip-tips]');
  await expect(sec.locator('[data-tt-tip]').first()).toBeVisible({ timeout: 15000 });
  await expect(sec.locator('[data-tt-did]')).toHaveCount(0); // no challenge yet

  const d = today();
  await put(page, 'settings', [{ key: 'outdoor', value: { name: 'Outdoors', goalMin: 90, from: plus(-3), until: plus(40), hand: {}, stopped: false, closed: false, no: null } }]);
  await page.reload();
  await ready(page);
  await sec.getByRole('button', { name: T('{n} h', { n: 2 }), exact: true }).click();
  const did = sec.locator('[data-tt-did]');
  await expect(did).toContainText(T('Did it · +{n} min', { n: 120 }));
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await sec.screenshot({ path: `${SHOTS}/tipp-minuten-${info.project.name === 'phone' ? '390' : '1440'}.png` });
  }
  await did.click();
  await expect.poll(() => handOf(page).then((h) => (h[d] ?? []).reduce((a, b) => a + b, 0))).toBe(120);
  await page.getByRole('button', { name: /Rückgängig/ }).first().click();
  await expect.poll(() => handOf(page).then((h) => (h[d] ?? []).reduce((a, b) => a + b, 0))).toBe(0);
  expect(errors).toEqual([]);
});
