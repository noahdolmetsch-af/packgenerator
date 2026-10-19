// v0.162.0 Saisonstart-Check (Noah 15.10.2026 «5a»): on a ski tour's page in October and November a card
// with five things before the first tour of the winter; folded to one line on the phone, open on the
// computer; a tick keeps its date; hidden for the season with Undo. Not on a bike trip, not in December.
// Fictional data only (test_data_gtp_ records). The rows are read from the app source (skiseason.js): the
// start tasks of the Saison-Pflege, so a tick is stored as a season care entry ('ski.care').
import { test, expect } from '@playwright/test';
import { base, tr, mockWeather } from './home0460-fixture.js';
import { importAndSettle, settle } from './settle.js';
import { SKI_SEASON_KEY, seasonStartTasks } from '../../src/lib/skiseason.js';
import { CARE_KEY } from '../../src/lib/ski.js';

const SKI_SEASON_ITEMS = seasonStartTasks(null);
import DE from '../../src/lib/i18n/de/index.js';

const T = tr('de');
const ID = (s) => `test_data_gtp_${s}`;
// calendar days from a day (no clock arithmetic in milliseconds)
const plus = (d0, n) => {
  const [y, m, d] = d0.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
};
const entries = (n) => base.tables.items.slice(3, 3 + n).map((i) => ({ itemId: i.id, slot: 'pack', qty: 1, packed: false }));
const trip = (id, d0, domain = 'ski') => ({
  id: ID(id), title: `test_data_gtp_ ${id}`, domain, startDate: plus(d0, 5), days: 1, entries: entries(4), ready: [], status: 'planned', createdAt: `${plus(d0, -3)}T08:00:00.000Z`,
  ...(domain === 'ski' ? { packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }] } : { bikeId: 'bike-test', bike: 'test_data_gtp_ Scale', setup: { seat: 'bag-TA01' } }),
});
function data(trips) {
  const d = structuredClone(base);
  d.tables.trips = trips;
  d.tables.debriefs = [];
  d.tables.notes = [];
  d.tables.settings = [{ key: 'homePlace', value: { name: 'test_data_gtp_ Heimort', lat: 47.39, lon: 8.04 } }];
  return d;
}
async function open(page, context, d0, trips) {
  await context.route(/^https?:\/\/(?!localhost[:/])(?!.*open-meteo)/, (route) => route.abort());
  await mockWeather(context);
  await page.clock.setFixedTime(new Date(`${d0}T09:00:00+02:00`));
  await context.addInitScript((id) => { localStorage.setItem('lang', 'de'); localStorage.setItem('pack.currentTrip', id); }, trips[0].id);
  await page.goto('./#/');
  await importAndSettle(page, { name: 'saisonstart.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data(trips))) });
  await page.goto('./#/pack');
  await page.reload();
  await settle(page);
}
const stored = (page, key) =>
  page.evaluate((k) => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const get = req.result.transaction('settings').objectStore('settings').get(k);
      get.onsuccess = () => { req.result.close(); done(get.result); };
    };
  }), key);

test('ski tour in October: the card folds on the phone, ticks keep their date, hide has Undo', async ({ page, context }, info) => {
  const d0 = '2026-10-15';
  await open(page, context, d0, [trip('Piz', d0)]);
  const card = page.locator('[data-ski-season]');
  await expect(card).toBeVisible();
  await expect(card.locator('summary')).toContainText(T('Season start check'));
  await expect(page.locator('[data-ski-season-sum]')).toHaveText(T('{done} of {n} done before the first tour', { done: 0, n: SKI_SEASON_ITEMS.length }));
  const phone = info.project.name === 'phone';
  // phone: one folded line (Noah «2a»); computer: open
  await expect(card).toHaveJSProperty('open', !phone);
  if (phone) await card.locator('summary').click();
  for (const r of SKI_SEASON_ITEMS) await expect(card.locator(`[data-ski-season-item="${r.id}"]`)).toContainText(DE[r.task]);
  await card.locator('[data-ski-season-item="lvs"]').click();
  await card.locator('[data-ski-season-item="skins"]').click();
  await expect(page.locator('[data-ski-season-sum]')).toHaveText(T('{done} of {n} done before the first tour', { done: 2, n: SKI_SEASON_ITEMS.length }));
  await expect(card.locator('[data-ski-season-item="lvs"]')).toHaveAttribute('aria-pressed', 'true');
  const ticks = async () => ((await stored(page, CARE_KEY))?.value ?? []).map((e) => `${e.task} ${e.day} ${e.season}`).sort();
  await expect.poll(ticks).toEqual([`lvs ${d0} 2026/27`, `skins ${d0} 2026/27`]);
  // a second tap takes a tick away
  await card.locator('[data-ski-season-item="skins"]').click();
  await expect.poll(ticks).toEqual([`lvs ${d0} 2026/27`]);
  // the same list as Touren › Skitouren › Saison-Pflege
  await expect(card.locator('[data-ski-season-care]')).toHaveAttribute('href', '#/ski/care');
  // hidden for the season, with Undo
  await card.locator('[data-ski-season-hide]').click();
  await expect(card).toHaveCount(0);
  await page.getByRole('status').filter({ hasText: T('Season start check hidden until next October.') }).getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-ski-season]')).toBeVisible();
  await expect.poll(async () => (await stored(page, SKI_SEASON_KEY))?.value?.hidden).toBe(false);
});

test('not on a bike trip, and not on a ski tour in December', async ({ page, context }) => {
  await open(page, context, '2026-10-15', [trip('Jura', '2026-10-15', 'bikepacking')]);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('[data-ski-season]')).toHaveCount(0);
  await open(page, context, '2026-12-02', [trip('Dez', '2026-12-02')]);
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('[data-ski-season]')).toHaveCount(0);
});
