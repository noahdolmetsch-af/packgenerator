// «Neuland» (wish #1007 «Kantonskarte und Bingo» + #1006 «Was war neu?»): a fictional day trip over the
// Klausenpass colours in ZH, SZ, UR and GL, finds the pass, shows the bingo card; a tick by hand, an untick
// of a found canton, an own collection with an entry, rename and delete with Undo. Fictional data only.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
// today in Europe/Zurich, and a calendar day before it
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const dayBefore = (n) => ((d) => (d.setUTCDate(d.getUTCDate() - n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (page, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png`, fullPage: true });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

const KLAUSEN = [
  [47.3769, 8.5417], [47.295, 8.564], [47.238, 8.577], [47.082, 8.634], [47.0207, 8.653], [46.996, 8.606], [46.904, 8.623],
  [46.8804, 8.6444], [46.876, 8.665], [46.862, 8.77], [46.8686, 8.8546], [46.887, 8.9], [46.921, 8.997],
];

/** Puts fictional trips straight into the app's database (after the app made it). */
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

test('Neuland: found on the route, bingo, ticks by hand, own collection with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/neuland');
  await ready(page);
  const main = page.locator('main');

  // 1. no data yet: the page explains what to do
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(T('New ground'));
  await expect(main).toContainText(T('Nothing found yet. Upload a ride or give a trip a GPX route: the app then colours in where you were. You can also tick by hand.'));

  // 2. a fictional day trip over the Klausenpass
  const start = dayBefore(20);
  await seed(page, [{ id: `${P}klausen`, title: `${P}Klausen-Runde`, domain: 'bikepacking', startDate: start, days: 1, status: 'done', entries: [], route: { name: `${P}Klausen`, km: 120, line: KLAUSEN } }]);
  await page.reload();
  await ready(page);
  const count = main.getByTestId('nl-count');
  await expect(count).toHaveText(new RegExp(`^${T('{n} of {total}', { n: '[4-7]', total: 26 })}`)); // ZH, SZ, UR, GL and maybe ZG
  const list = main.getByRole('list', { name: T('Cantons') });
  for (const c of ['Uri', 'Glarus', 'Schwyz', 'Zürich']) await expect(list.locator('li', { hasText: T('Canton {name}', { name: c }) }).getByRole('button', { pressed: true })).toBeVisible();
  // the bingo card: the joker in the middle (ZH without a home place)
  const card = main.getByRole('list', { name: T('Canton bingo {year}', { year: start.slice(0, 4) }) });
  await expect(card.getByRole('button')).toHaveCount(25);
  await expect(card.getByRole('button', { name: T('Joker: {name}, your home canton', { name: 'Zürich' }) })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'NL1-kantone');

  // 3. one canton opened: the first visit and the trip; «not there» takes it away, a tick by hand brings Tessin
  await list.locator('li', { hasText: T('Canton {name}', { name: 'Uri' }) }).getByRole('button', { name: new RegExp(T('Canton {name}', { name: 'Uri' })) }).last().click();
  const sheet = page.locator('dialog.nl-item');
  await expect(sheet).toContainText(T('Found by the app on your route.'));
  await expect(sheet.getByRole('link', { name: T('On the trip «{name}»', { name: `${P}Klausen-Runde` }) })).toHaveAttribute('href', `#/debrief/${P}klausen`);
  await sheet.getByRole('button', { name: T('I was not there') }).click();
  await expect(sheet).toHaveCount(0);
  await expect(list.locator('li', { hasText: T('Canton {name}', { name: 'Uri' }) })).toContainText(T('Marked «not there»'));
  await list.locator('li', { hasText: T('Canton {name}', { name: 'Tessin' }) }).getByRole('button', { name: T('Tick: {name}', { name: T('Canton {name}', { name: 'Tessin' }) }) }).click();
  await expect(list.locator('li', { hasText: T('Canton {name}', { name: 'Tessin' }) })).toContainText(T('by hand'));

  // 4. the pass was found too
  await main.getByRole('group', { name: T('Collections') }).getByRole('button', { name: new RegExp(`^${T('Alpine passes')}`) }).click();
  const passes = main.getByRole('list', { name: T('Alpine passes') });
  await expect(passes.locator('li', { hasText: 'Klausenpass' }).getByRole('button', { pressed: true })).toBeVisible();
  await expect(passes.locator('li', { hasText: 'Albispass' }).locator('button.tk[aria-pressed=false]')).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'NL2-paesse');

  // 5. «Sammlungen wählen»: switch off the municipalities, add an own collection
  await main.getByRole('button', { name: T('Choose collections') }).first().click();
  const cols = page.locator('dialog.nl-cols');
  await cols.getByRole('switch', { name: T('Collect {name}', { name: T('Municipalities') }) }).uncheck();
  await expect(main.getByRole('group', { name: T('Collections') }).getByRole('button', { name: new RegExp(`^${T('Municipalities')}`) })).toHaveCount(0);
  await cols.getByRole('button', { name: T('Own collection') }).click();
  const rn = page.locator('dialog.rename');
  await rn.getByLabel(T('Name'), { exact: true }).fill(`${P}Lieblingscafés`);
  await rn.getByRole('button', { name: T('Save') }).click();
  await expect(cols.getByText(`${P}Lieblingscafés`, { exact: true })).toBeVisible();
  await noSideways(page);
  await shot(page, info, 'NL3-sammlungen');
  await cols.getByRole('button', { name: T('Done') }).click();
  await expect(cols).toHaveCount(0);

  // 6. the own collection is chosen: an entry with a place on the route is found
  await expect(main.getByRole('heading', { level: 2, name: `${P}Lieblingscafés` })).toBeVisible();
  await main.getByRole('button', { name: T('Add an entry') }).first().click();
  const ed = page.locator('dialog.nl-edit');
  await ed.getByLabel(T('Name'), { exact: true }).fill(`${P}Café Altdorf`);
  await ed.getByLabel(T('Place (optional)')).fill('46.8804, 8.6444');
  await ed.getByRole('button', { name: T('Save') }).click();
  const own = main.getByRole('list', { name: `${P}Lieblingscafés` });
  await expect(own.locator('li', { hasText: `${P}Café Altdorf` }).getByRole('button', { pressed: true })).toBeVisible();

  // 7. rename and delete the own collection; Undo brings it back with its entry
  await main.getByRole('button', { name: T('Choose collections') }).first().click();
  await cols.getByRole('button', { name: T('Rename: {name}', { name: `${P}Lieblingscafés` }) }).click();
  await rn.getByLabel(T('Name'), { exact: true }).fill(`${P}Cafés`);
  await rn.getByRole('button', { name: T('Save') }).click();
  await cols.getByRole('button', { name: T('Delete: {name}', { name: `${P}Cafés` }) }).click();
  const del = page.locator('dialog.gds');
  await expect(del).toContainText(T('Without collection'));
  await del.getByRole('button', { name: T('Delete') }).click();
  // the entry is kept in «Ohne Sammlung»
  await expect(cols.getByText(T('Without collection'), { exact: true })).toBeVisible();
  await page.getByRole('status').getByRole('button', { name: T('Undo') }).click();
  await expect(cols.getByText(`${P}Cafés`, { exact: true })).toBeVisible();
  await expect(cols.getByText(T('Without collection'), { exact: true })).toHaveCount(0);
  await cols.getByRole('button', { name: T('Done') }).click();

  expect(errors).toEqual([]);
});
