// «Verschleiss» (Noah 20.10.2026, «1 pro Teil, 2a+b, 3a, 4a+b, 5a» and «Verschleiss immer im Griff»), German UI:
// - Velopflege shows the chain at a glance (bike line and card), the page «Verschleiss» the bars, km left,
//   an own limit per part (e.g. the chain after 1000 km), back to the suggestion, off the page and back;
// - a workshop visit: another part «ersetzt» starts it at 0 km, «Service am ganzen Velo» sets the counter to 0,
//   Undo takes the visit and its counter point back.
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { newButton } from './newbutton.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
// calendar days in Europe/Zurich
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
// the thousands mark as the browser writes it (Node on GitHub writes ' where Chrome writes ’)
let SEP = '’';
const N = (n) => n.toLocaleString('en-US').replace(/,/g, SEP);
const rep = (date, km) => ({ date, km, value: null, action: 'replace', result: 'done', by: 'self', note: '' });
// a fictional bike with 2600 km: chain mounted at 1800 km (own limit 1000 km → 800 of 1000, soon), cassette and tyres fine
Object.assign(BIKE, {
  km: 2600,
  life: { chain: 1000 },
  parts: [
    { key: 'chain', model: 'Test chain', history: [rep(day(-60), 1800)] },
    { key: 'cassette', model: '', history: [rep(day(-200), 0)] },
    { key: 'rotorF', model: '', history: [rep(day(-200), 0)] },
    { key: 'tyres', model: '', history: [rep(day(-200), 0)] },
  ],
  service: { last: { day: day(-60), km: 1800, hours: null } },
});

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const bikeNow = async (page) => (await table(page, 'bikes')).find((b) => b.id === BIKE.id);
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.beforeEach(async ({ page, context }, info) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const file = info.outputPath('wear.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  SEP = await page.evaluate(() => (1000).toLocaleString('de-CH').charAt(1));
});

test('chain at a glance in Velopflege, the page with bars, own limit, back to the suggestion, off and back', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  await expect(page.locator('[data-chain-wear]').first()).toHaveText(T('Chain {km} of {life} km', { km: '800', life: N(1000) }));
  await expect(page.locator('[data-chain-wear]').first()).toHaveAttribute('data-chain-wear', 'soon');
  const card = page.locator('[data-wear-card]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-wear-mini]').first()).toHaveAttribute('data-wear-mini', 'chain');
  await expect(card.locator('[data-wear-mini="chain"]')).toContainText(T('{km} km left', { km: '200' }));
  await card.getByRole('link', { name: new RegExp(T('Wear|page')) }).click();

  await expect(page).toHaveURL(/view=wear/);
  await expect(page.getByRole('heading', { level: 1, name: T('Wear|page') })).toBeVisible();
  await expect(page.locator('[data-wear-counter]')).toContainText(T('{km} km in total', { km: N(2600) }));
  await expect(page.locator('[data-wear-since]')).toContainText('800');
  const chain = page.locator('[data-wear="chain"]');
  await expect(chain).toHaveAttribute('data-wear-state', 'soon');
  await expect(chain).toContainText(T('your value'));
  expect(await noSideways(page)).toBe(0);

  // back to the suggestion (3000 km): fine; Undo brings the 1000 back
  await chain.locator('[data-wear-std]').click();
  await expect(chain).toHaveAttribute('data-wear-state', 'ok');
  await expect(chain).toContainText(T('start value'));
  await page.getByRole('button', { name: /Rückgängig|Undo/ }).click();
  await expect.poll(async () => (await bikeNow(page)).life).toEqual({ chain: 1000 });

  // an own value typed in
  await chain.locator('[data-wear-edit]').click();
  await chain.locator('[data-wear-life]').fill('900');
  await chain.getByRole('button', { name: T('Save') }).click();
  await expect.poll(async () => (await bikeNow(page)).life.chain).toBe(900);
  await expect(chain).toContainText(T('{km} of {life} km', { km: '800', life: '900' }));

  // off the page, the history stays, and back
  await page.locator('[data-wear="tyres"] [data-wear-hide]').click();
  await expect(page.locator('[data-wear="tyres"]')).toHaveCount(0);
  await page.locator('[data-wear-show="tyres"]').click();
  await expect(page.locator('[data-wear="tyres"]')).toBeVisible();
  expect((await bikeNow(page)).parts.find((p) => p.key === 'tyres').history).toHaveLength(1);
});

test('workshop visit: a part replaced starts at 0 km, the whole bike counter to 0, Undo takes both back', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  await (await newButton(page, T('New'))).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: new RegExp(T('Workshop visit')) }).click();
  const dlg = page.getByRole('dialog', { name: T('Log a workshop visit') });
  await expect(dlg).toBeVisible();
  await dlg.locator('select').first().selectOption(BIKE.id);
  await dlg.getByLabel(T('km at the visit')).fill('2600');
  await dlg.getByLabel(T('Bike shop'), { exact: true }).fill('Test shop');
  // the front rotor is not one of the chips: «+ weiteres Teil», «ersetzt», «Hinzufügen»
  await dlg.locator('[data-visit-part]').selectOption('rotorF');
  await dlg.locator('[data-visit-act]').selectOption('replace');
  await dlg.locator('[data-visit-add]').click();
  await expect(dlg.locator('[data-visit-job="rotorF"]')).toContainText(T('replaced'));
  await expect(dlg.locator('[data-visit-whole]')).toBeChecked();
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();

  await expect.poll(async () => (await bikeNow(page)).service?.last?.km).toBe(2600);
  expect((await bikeNow(page)).service.past.map((p) => p.km)).toEqual([1800]);
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  await expect(page.locator('[data-wear="rotorF"]')).toContainText(T('{km} of {life} km', { km: '0', life: N(8800) })); // learned: start value 15000 and the old rotor's 2600 km
  await expect(page.locator('[data-wear="rotorF"]')).toContainText(T('learned from {n} change', { n: 1 }));
  await expect(page.locator('[data-wear-since]')).toContainText(T('Since the last service on {date}: {km} km · {days} days', { date: '', km: '0', days: '0' }).split(':')[0]);

  // removing the visit takes its counter point away (the service before is the last again)
  const visit = (await table(page, 'visits')).find((v) => v.shop === 'Test shop');
  await page.goto(`./#/bikes?tab=shop&bike=${BIKE.id}&visit=${visit.id}`);
  await page.getByRole('button', { name: T('Remove visit') }).click();
  await page.getByRole('dialog', { name: T('Remove the visit of {date}?', { date: visit.date }) }).getByRole('button', { name: T('Remove'), exact: true }).click();
  await expect.poll(async () => (await bikeNow(page)).service?.last?.km).toBe(1800);
  await page.getByRole('button', { name: /Rückgängig|Undo/ }).click();
  await expect.poll(async () => (await bikeNow(page)).service?.last?.km).toBe(2600);
});
