// «Velos ausmustern» (Noah 1.11.2026 «1-5 a»), German UI: a bike is retired from its «…» menu, leaves the bike
// row, waits folded at the bottom and comes back with «Zurückholen». Trips and km stay. Fictional fixture.
import { test, expect } from './clock.js';
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
base.tables.bikes.push({ ...BIKE, id: 'bike-zwei', name: 'test_data_gtp_ Zweitvelo', order: 5 });
const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);

test.beforeEach(async ({ page, context }, info) => {
  const file = info.outputPath('velo-ausmustern.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('retire a bike, find it folded, bring it back', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const trips = (await table(page, 'trips')).length;
  await page.goto(`./#/bikes?bike=bike-zwei`);
  await page.getByRole('button', { name: T('More for {title}', { title: 'test_data_gtp_ Zweitvelo' }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(T('Retire bike')) }).click();
  const sheet = page.locator('[data-retire-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-retire-reason="given"]').click();
  await sheet.locator('[data-retire-save]').click();
  await expect(sheet).toBeHidden();
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === 'bike-zwei')?.retired?.reason).toBe('given');
  const list = page.locator('[data-retired-list]');
  await expect(list).toContainText(T('{n} retired bike', { n: 1 }));
  await list.locator('summary').click();
  await expect(list.locator('[data-retired-row="bike-zwei"]')).toContainText(T('Given away'));
  expect((await table(page, 'trips')).length).toBe(trips);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await list.locator('[data-retired-restore]').click();
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === 'bike-zwei')?.retired ?? null).toBeNull();
  await expect(page.locator('[data-retired-list]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
