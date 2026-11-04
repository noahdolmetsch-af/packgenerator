// «Warum zählt das?» (Entdecken und Sammeln, Idee 6, Noah 04.11.2026 «1a 2a 3a 4b 5a»): in Neuland a place the app
// found shows the proof (a little map, the distance), a hand tick says the app did not find it on a route.
// Fictional data only, no real network.
import { test, expect } from './clock.js';
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
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// a fictional day trip over the Klausenpass: the line passes about 150 m north of the pass
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

test('Neuland: «Warum zählt das?» shows where the app found a pass, and what a hand tick says', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  await seed(page, [{ id: `${P}klausen`, title: `${SHOTS ? '' : P}Klausen-Runde`, domain: 'bikepacking', startDate: dayBefore(20), days: 1, status: 'done', entries: [], route: { name: `${P}Klausen`, km: 80, line: LINE } }]);
  await page.reload();
  await ready(page);
  const main = page.locator('main');
  await main.getByRole('group', { name: T('Collections') }).getByRole('button', { name: new RegExp(`^${T('Alpine passes')}`) }).click();
  const passes = main.getByRole('list', { name: T('Alpine passes') });

  // 1. the pass the app found: the proof with the distance, the map and the key
  await passes.locator('li', { hasText: 'Klausenpass' }).locator('button.nm').click();
  const sheet = page.locator('dialog.nl-item');
  const proof = sheet.locator('[data-nl-proof]');
  await expect(proof).toBeVisible();
  await expect(proof.getByRole('heading', { name: T('Why does it count?') })).toBeVisible();
  const text = await proof.locator('[data-nlp-text]').textContent();
  expect(text).toMatch(/1[0-9]{2} m/); // about 150 m
  await expect(proof.locator('[data-nlp-level]')).toContainText(T('A clear hit: the line runs close to the place.'));
  await expect(proof.getByRole('img')).toBeVisible();
  await expect(proof.locator('svg path.line').first()).toBeVisible();
  await expect(proof.getByText(T('Closest point'))).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'NB1-gefunden');
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toHaveCount(0);

  // 2. a pass ticked by hand: the app did not find it on a route
  const row = passes.locator('li', { hasText: 'Albispass' });
  await row.locator('button.tk').click();
  await row.locator('button.nm').click();
  await expect(sheet.locator('[data-nl-proof]')).toContainText(T('The app did not find it on your routes. It counts because you ticked it.'));
  await shot(page, info, 'NB2-von-hand');
  await sheet.getByRole('button', { name: T('Close') }).click();

  // 3. «not there» keeps the proof visible on the unticked place
  await passes.locator('li', { hasText: 'Klausenpass' }).locator('button.nm').click();
  await sheet.getByRole('button', { name: T('I was not there') }).click();
  await main.getByPlaceholder(T('Search in {name}', { name: T('Alpine passes') })).fill('Klausen');
  await passes.locator('li', { hasText: 'Klausenpass' }).locator('button.nm').click();
  await expect(sheet.locator('[data-nl-proof] [data-nlp-text]')).toContainText(/ m /);
  expect(errors).toEqual([]);
});
