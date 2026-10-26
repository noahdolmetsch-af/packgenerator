// «Kette vorausschauend» (Noah 25.10.2026), German UI: the page «Verschleiss» says what the chain needs next.
// A fictional bike: new chain at 1000 km, measured 0.2 % at 2000 km, now 2700 km (700 km since the measurement)
// and oiled 200 km ago: «Kette ölen» and «Kette messen» stand on top; «Geölt» saves with Undo; a measurement
// in the window takes «messen» away and the forecast shows. Fictional fixture; nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const e = (date, km, action, value = null) => ({ date, km, value, action, result: 'done', by: 'self', note: '' });
Object.assign(BIKE, {
  km: 2700,
  parts: [{ key: 'chain', model: 'Test chain', history: [e(day(-120), 1000, 'replace'), { ...e(day(-40), 2000, 'check', 0.2), result: 'ok' }, e(day(-30), 2500, 'service')] }],
});
for (const b of base.tables.bikes.slice(1)) b.parts = [];
base.tables.visits = [];

const bikeNow = (page) =>
  page.evaluate((id) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('bikes').objectStore('bikes').get(id);
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), BIKE.id);

test.beforeEach(async ({ page, context }, info) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const file = info.outputPath('chain.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('chain next steps: oil and measure, oiled with undo, a measurement brings the forecast', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const card = page.locator('[data-chain-plan]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: T('Chain: what comes next') })).toBeVisible();
  await expect(card.locator('[data-chain-step="lube"]')).toContainText(T('Oil the chain'));
  await expect(card.locator('[data-chain-step="measure"]')).toContainText(T('{km} km since the last measurement. Measured often, the app sees early when it is time.', { km: '700' }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

  // «Geölt»: saved as a service of the chain, the step leaves, Undo brings it back
  await card.locator('[data-chain-oiled]').click();
  await expect(card.locator('[data-chain-step="lube"]')).toHaveCount(0);
  await expect.poll(async () => (await bikeNow(page)).parts.find((p) => p.key === 'chain').history.length).toBe(4);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(card.locator('[data-chain-step="lube"]')).toBeVisible();

  // a measurement: «messen» leaves, the forecast tells the stretch per 1000 km
  await card.locator('[data-chain-measure]').click();
  const dlg = page.getByRole('dialog');
  await dlg.getByLabel(T('Exact value in %')).fill('0.3');
  await dlg.locator('[data-messen-save]').click();
  await expect(card.locator('[data-chain-step="measure"]')).toHaveCount(0);
  await card.locator('[data-chain-history] summary').click();
  await expect(card.locator('[data-chain-rate]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the short card in Velopflege names the next chain step', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  await expect(page.locator('[data-chain-next]').first()).toContainText(T('Next|chain'));
});
