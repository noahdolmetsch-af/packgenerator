// «Wege hierher» (Entdecken und Sammeln, Idee 3, Noah 04.11.2026 «3a 4b»): in Neuland a pass shows from which side
// each ride came and names the sides not tried yet. Fictional data only, no real network.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_wege_';
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

test('Neuland: «Wege hierher» names the side each ride came from and the sides not tried yet', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
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

  // 1. the pass: two days, one from the west and one from the east, and the sides not tried yet
  await passes.locator('li', { hasText: 'Klausenpass' }).locator('button.nm').click();
  const sheet = page.locator('dialog.nl-item');
  const ways = sheet.locator('[data-nl-ways]');
  await expect(ways).toBeVisible();
  await expect(ways.getByRole('heading', { name: T('Ways here') })).toBeVisible();
  await expect(ways.locator('[data-way-side="W"]')).toContainText(T('From the west'));
  await expect(ways.locator('[data-way-side="E"]')).toContainText(T('From the east'));
  await expect(ways.locator('[data-way-side]')).toHaveCount(2);
  await expect(ways.locator('[data-way-missing]')).toContainText(`${T('the north')}, ${T('the south')}`);
  await ways.scrollIntoViewIfNeeded();
  await noSideways(page);
  await shot(page, info, 'NW1-wege');
  await sheet.getByRole('button', { name: T('Close') }).click();
  await expect(sheet).toHaveCount(0);

  // 2. a place with no line of yours (ticked by hand) has no such box
  const row = passes.locator('li', { hasText: 'Albispass' });
  await row.locator('button.tk').click();
  await row.locator('button.nm').click();
  await expect(sheet.locator('[data-nl-proof]')).toBeVisible();
  await expect(sheet.locator('[data-nl-ways]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
