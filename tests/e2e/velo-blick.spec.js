// «Velopflege: Auf einen Blick» (Noah 21.11.2026 «1a 2a 3a 4a 5a»), German UI:
// - the block on top of a bike's care page shows the chain (km done, km left), the last service with its price,
//   the last check and the costs of the year, all from fictional data;
// - a bike without data says why each tile is empty.
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
// calendar days in Europe/Zurich
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const rep = (date, km, extra = {}) => ({ date, km, value: null, action: 'replace', result: 'done', by: 'self', note: '', ...extra });
Object.assign(BIKE, {
  km: 2600,
  life: { chain: 1000 },
  parts: [{ key: 'chain', model: 'Testkette', history: [rep(day(-60), 1900, { chf: 54 })] }],
  service: { last: { day: day(-40), km: 2200 } },
});
base.tables.visits = [{ id: 'test_data_blick_v1', bikeId: BIKE.id, date: day(-40), km: 2200, shop: 'Test-Werkstatt', totalChf: 189, parts: [] }];
base.tables.inspections = [{ id: 'test_data_blick_i1', bikeId: BIKE.id, level: 'monthly', date: day(-5), km: 2500, done: true, doneAt: `${day(-5)}T10:00:00.000Z`, results: [{ id: 'pressure', state: 'ok' }, { id: 'brakefeel', state: 'watch' }] }];

async function load(page, context, info, data) {
  const file = info.outputPath('blick.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(DE['Import backup']).setInputFiles(file);
  await panel.getByRole('button', { name: DE['Replace all data'] }).press('Enter');
  await settle(page);
}

test('the block shows chain, last service with price, last check and costs', async ({ page, context }, info) => {
  await load(page, context, info, base);
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  const g = page.locator('[data-glance]');
  await expect(g).toBeVisible();
  await expect(g.locator('[data-glance-chain]')).toContainText('700 km geleistet');
  await expect(g.locator('[data-glance-chain]')).toContainText('noch etwa 300 km');
  await expect(g.locator('[data-glance-chain]')).toContainText('CHF 54');
  await expect(g.locator('[data-glance-service]')).toContainText('Test-Werkstatt');
  await expect(g.locator('[data-glance-service]')).toContainText('CHF 189');
  await expect(g.locator('[data-glance-check="done"]')).toContainText('Monatlicher Check');
  await expect(g.locator('[data-glance-check="done"]')).toContainText('1 beobachten');
  await expect(g.locator('[data-glance-cost]')).toContainText('CHF 243');
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide).toBeLessThanOrEqual(0);
});

test('a bike without data says why each tile is empty', async ({ page, context }, info) => {
  const bare = structuredClone(base);
  Object.assign(bare.tables.bikes[0], { parts: [], service: {}, life: {} });
  bare.tables.visits = [];
  bare.tables.inspections = [];
  await load(page, context, info, bare);
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  const g = page.locator('[data-glance]');
  await expect(g.locator('[data-glance-chain="none"]')).toContainText('Noch kein Startpunkt');
  await expect(g.locator('[data-glance-service="none"]')).toContainText('Noch kein Service');
  await expect(g.locator('[data-glance-check="none"]')).toContainText('Noch kein Check');
  await expect(g.locator('[data-glance-cost]')).toContainText('noch keine Kosten');
});
