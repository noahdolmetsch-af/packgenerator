// «Was die nächsten Monate kosten» (idea C1, Noah 02.11.2026 «3b»), German UI. Same fictional bike as verschleiss.spec.js.
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
import { test, expect } from './clock.js';
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
const rep = (date, km, chf) => ({ date, km, value: null, action: 'replace', result: 'done', by: 'self', note: '', ...(chf ? { chf } : {}) });
// a fictional bike with 2600 km: chain mounted at 1800 km (own limit 1000 km → 800 of 1000, soon), cassette and tyres fine
Object.assign(BIKE, {
  km: 2600,
  life: { chain: 1000 },
  parts: [
    { key: 'chain', model: 'Test chain', history: [rep(day(-60), 1800, 40)] },
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


test('the card lists the soon parts with the last price and the sum; one tap fills the shopping list; Undo takes it off', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const card = page.locator('[data-wear-costs]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-wear-cost="chain"]')).toContainText(T('CHF {chf}', { chf: '40' }));
  await expect(card.locator('[data-wear-costs-sum]')).toContainText(T('About CHF {chf}', { chf: '40' }));
  expect(await noSideways(page)).toBe(0);
  await card.locator('[data-wear-costs-shop]').click();
  const text = async () => JSON.stringify(((await table(page, 'settings')).find((s) => s.key === 'merken.lists') ?? {}).value ?? '');
  await expect.poll(text).toContain('Test chain');
  await page.getByRole('button', { name: /Rückgängig|Undo/ }).click();
  await expect.poll(text).not.toContain('Test chain');
});

test('a shorter time still keeps a part that is already soon', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const card = page.locator('[data-wear-costs]');
  await card.locator('[data-wear-costs-months="3"]').click();
  await expect(card.locator('[data-wear-cost="chain"]')).toBeVisible();
});
