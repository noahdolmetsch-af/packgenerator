// «Heute passt: Ausflugstipps» (Träume und Neuland N3, Noah 27.10.2026 «1-5 a»): at the top of Touren › Träume,
// three places never visited that fit the free time (from a fictional calendar entry), with the (faked) weather;
// the hours can be changed, «Round through it» asks the (faked) bike router. No real network.
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
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const plus = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
// the day the tips are for: after 17:00 in Zürich, tomorrow
const tipDay = () => (Number(new Date().toLocaleTimeString('de-CH', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Zurich' }).slice(0, 2)) >= 17 ? plus(1) : today());
const METEO = () => {
  const time = Array.from({ length: 7 }, (_, i) => plus(i - 1));
  return { daily: { time, temperature_2m_min: time.map(() => 8), temperature_2m_max: time.map(() => 18), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 5) } };
};
const ROUND = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: { 'track-length': '41200', 'filtered ascend': '520', 'total-time': '8600' }, geometry: { type: 'LineString', coordinates: [[8.5417, 47.3769, 410], [8.7, 47.45, 500], [8.6, 47.5, 450], [8.5417, 47.3769, 410]] } }],
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

test('Trip tips: three new places for the free time, the weather, other hours, a round through one', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const asked = [];
  await context.route(/api\.open-meteo\.com\/v1\/forecast/, (r) => r.fulfill({ json: METEO() }));
  await context.route(/brouter\.de/, (r) => (asked.push(r.request().url()), r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ROUND) })));
  await context.route(/^https?:\/\/(?!localhost[:/])(?!brouter\.de)(?!api\.open-meteo\.com)/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  const sec = page.locator('[data-trip-tips]');
  // without a home place: one button sets it
  await expect(sec.locator('[data-tt-home]')).toBeVisible();

  const day = tipDay();
  await put(page, 'settings', [{ key: 'homePlace', value: { name: `${P}Zürich`, lat: 47.3769, lon: 8.5417 } }]);
  await put(page, 'gEvents', [{ id: `${P}cal|1`, gid: '1', cal: `${P}cal`, title: `${P}Termin`, allDay: false, day, lastDay: day, start: `${day}T07:00:00Z`, end: `${day}T12:00:00Z`, busy: true }]);
  await page.reload();
  await ready(page);

  // 1. three tips from different directions, the weather and the free time
  const tips = sec.locator('[data-tt-tip]');
  await expect(tips).toHaveCount(3, { timeout: 15000 });
  await expect(sec.locator('[data-tt-wx]')).toContainText('18°');
  await expect(sec.locator('[data-tt-wx]')).toContainText(T('dry'));
  await expect(sec.locator('[data-tt-free]')).toContainText(T('Calendar: free {from}–{to}').split('{')[0].trim());
  await expect(tips.first()).toContainText(T('≈ {km} km there and back').split('}')[1].trim());
  await noSideways(page);
  await shot(sec, info, 'AT1-tipps');

  // 2. other hours, other places: 2 h stays close, 6 h goes further
  const ids = async () => (await tips.evaluateAll((els) => els.map((e) => e.getAttribute('data-tt-tip')))).join(',');
  await sec.getByRole('button', { name: T('{n} h', { n: 2 }), exact: true }).click();
  await expect(sec.getByRole('button', { name: T('{n} h', { n: 2 }), exact: true })).toHaveAttribute('aria-pressed', 'true');
  const two = await ids();
  await sec.getByRole('button', { name: T('{n} h', { n: 6 }), exact: true }).click();
  await expect.poll(ids).not.toBe(two);

  // 3. a round through the first place: one router request
  const name = (await tips.first().locator('b').textContent()).trim();
  await tips.first().locator('[data-tt-round]').click();
  const dlg = page.locator('dialog[data-spot-round][open]');
  await expect(dlg).toContainText(T('New ground round: {name}', { name }));
  await expect(dlg.locator('[data-sp-result]')).toContainText('41 km');
  expect(asked).toHaveLength(1);
  expect(errors).toEqual([]);
});
