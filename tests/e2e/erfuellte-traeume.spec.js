// «Erfüllte Träume» (Träume und Neuland N17, Noah 27.10.2026 «1-5 a»): a dream planned as a trip whose debrief is done
// shows under «Fulfilled dreams» on Touren › Träume and in the year card of Past trips. Fictional data only.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const shift = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name, part = null) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const path = `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`;
  await (part ? part.screenshot({ path }) : page.screenshot({ path }));
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

test('Fulfilled dreams: on Dreams with its month, in the year card of Past trips', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  // the trip ended within this year (a week ago, or on 1 January early in the year)
  const start = shift(-8) >= `${today().slice(0, 4)}-01-01` ? shift(-8) : `${today().slice(0, 4)}-01-01`;
  await put(page, 'settings', [
    { key: 'dreams', value: { dreams: [{ id: `${P}d1`, title: `${P}Über die Furka`, kind: 'alps', days: 2, tripId: `${P}t1`, route: { line: [[46.57, 8.41], [46.56, 8.33]], km: 84, gainM: 1900, name: '' } }, { id: `${P}d2`, title: `${P}Noch offen`, kind: 'lowland', days: 1 }] } },
  ]);
  await put(page, 'trips', [{ id: `${P}t1`, title: `${P}Über die Furka`, domain: 'bikepacking', startDate: start, days: 2, status: 'done', finished: true, entries: [] }]);
  await put(page, 'debriefs', [{ tripId: `${P}t1`, status: 'done', rating: 5 }]);
  await page.reload();
  await ready(page);

  const sec = page.locator('[data-dreams-done]');
  await expect(sec).toContainText(`${P}Über die Furka`);
  await expect(sec).toContainText(T('Fulfilled in {when}', { when: '' }).trim());
  await expect(sec).toContainText('84 km');
  await expect(sec.locator('[data-dream-done]')).toHaveCount(1);
  await expect(page.locator(`[data-dream="${P}d1"]`)).toContainText(T('Fulfilled in {when}', { when: '' }).trim());
  await shot(page, info, 'ET1-traeume', sec);
  await expect(sec.locator('a')).toHaveAttribute('href', `#/debrief/${P}t1`);

  // the year card of Past trips
  await page.goto('./#/pack/past');
  const line = page.locator('[data-year-card] [data-dreams-done-line]');
  await expect(line).toContainText(T('Fulfilled dream {year}: {n}', { year: today().slice(0, 4), n: 1 }));
  await expect(line).toContainText(`${P}Über die Furka`);
  await shot(page, info, 'ET2-jahr', page.locator('[data-year-card]'));
  expect(errors).toEqual([]);
});
