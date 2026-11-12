// «Untergrund» in «Wege hierher» (Entdecken und Sammeln, Idee 3, Noah 04.11.2026 «4b»): a tap looks up the ground of the
// run-up in OpenStreetMap (here a made-up answer), the answer stays on the device. Fictional data only, no real network.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_ug_';
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
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// a fictional day trip over the Klausenpass from the west: the line passes about 150 m north of the pass
const LINE = [
  [46.9, 8.7], [46.885, 8.78], [46.8702, 8.83], [46.8701, 8.8546], [46.8695, 8.885], [46.88, 8.93], [46.921, 8.997],
];

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

const BACK = [...LINE].reverse(); // the same road ridden from the east

// a made-up OpenStreetMap answer: asphalt on the west run-up, a gravel track the last stretch to the pass
const way = (id, tags, geometry) => ({ type: 'way', id, tags, geometry: geometry.map(([lat, lon]) => ({ lat, lon })) });
const SURFACE = { elements: [way(1, { highway: 'residential', surface: 'asphalt' }, [[46.885, 8.78], [46.8702, 8.83]]), way(2, { highway: 'track', tracktype: 'grade3' }, [[46.8702, 8.83], [46.8701, 8.87]])] };

test('Neuland: «Untergrund nachschlagen» asks only after a tap, shows asphalt and gravel, and keeps the answer', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  let mode = 'busy';
  let asked = 0;
  await context.route(/overpass/, (route) => {
    const body = decodeURIComponent(route.request().postData() ?? '');
    if (!body.includes('around:')) return route.fulfill({ json: { elements: [] }, headers: { 'access-control-allow-origin': '*' } }); // the weekly lookout towers
    asked += 1;
    if (mode === 'busy') return route.fulfill({ status: 503, body: 'busy', headers: { 'access-control-allow-origin': '*' } });
    return route.fulfill({ json: SURFACE, headers: { 'access-control-allow-origin': '*' } });
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  const trip = (id, title, n, line) => ({ id: `${P}${id}`, title: `${SHOTS ? '' : P}${title}`, domain: 'bikepacking', startDate: dayBefore(n), days: 1, status: 'done', entries: [], route: { name: `${P}${title}`, km: 80, line } });
  await seed(page, [trip('west', 'Klausen von Westen', 40, LINE), trip('ost', 'Klausen von Osten', 12, BACK)]);
  await page.reload();
  await ready(page);
  const main = page.locator('main');
  await main.getByRole('group', { name: T('Collections') }).getByRole('button', { name: new RegExp(`^${T('Alpine passes')}`) }).click();
  const passes = main.getByRole('list', { name: T('Alpine passes') });
  await passes.locator('li', { hasText: 'Klausenpass' }).locator('button.nm').click();
  const sheet = page.locator('dialog.nl-item');
  const box = sheet.locator('[data-way-ground]');

  // 1. nothing is asked by itself: only the button, the note and no rows
  await expect(box).toBeVisible();
  await expect(box.getByRole('button', { name: T('Look up the ground') })).toBeVisible();
  await expect(box.locator('[data-ground-day]')).toHaveCount(0);
  await expect(box).toContainText('OpenStreetMap');
  expect(asked).toBe(0);

  // 2. a busy server: it says so and keeps the button
  await box.getByRole('button', { name: T('Look up the ground') }).click();
  await expect(box.locator('[data-ground-why]')).toContainText(T('The map server is busy. Try again in a few minutes.'));
  await expect(box.getByRole('button', { name: T('Look up the ground') })).toBeVisible();

  // 3. it answers: asphalt and gravel with whole percents, for each day with a run-up
  mode = 'ok';
  await box.getByRole('button', { name: T('Look up the ground') }).click();
  await expect(box.locator('[data-ground-day]')).toHaveCount(2);
  const west = box.locator('[data-ground-day]', { hasText: T('From the west') });
  await expect(west).toContainText(`${T('Ground: paved')} `);
  await expect(west).toContainText(`${T('Ground: gravel')} `);
  await expect(west).toContainText('%');
  await expect(box.getByRole('button', { name: T('Look up again') })).toBeVisible();
  await box.scrollIntoViewIfNeeded();
  await noSideways(page);
  await shot(page, info, 'UG1-untergrund');
  const askedAfter = asked;

  // 4. it stays on the device: after a reload the rows are there and nothing is asked
  await sheet.getByRole('button', { name: T('Close') }).click();
  await page.reload();
  await ready(page);
  await main.getByRole('group', { name: T('Collections') }).getByRole('button', { name: new RegExp(`^${T('Alpine passes')}`) }).click();
  await passes.locator('li', { hasText: 'Klausenpass' }).locator('button.nm').click();
  await expect(sheet.locator('[data-way-ground] [data-ground-day]')).toHaveCount(2);
  expect(asked).toBe(askedAfter);
  expect(errors).toEqual([]);
});
