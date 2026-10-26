// Velo-Ideen 71–76 (996 Ideen, Noah 25.10.2026), the small ones in the browser, German UI:
//   72 «Fehlende Kilometer nachtragen»: a new reading far above the ledger asks first; rides outside the app.
//   73 «Setup zurückbauen»: a log entry keeps the measures; «Zurück zu diesen Massen» writes them back.
//   74 «Auffälliges Ereignis»: a noise marks the chain «prüfen»; «Geprüft, alles gut» takes it off.
// Fictional fixture; nothing leaves the preview server; service workers blocked (config).
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
// calendar days in Europe/Zurich
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const rep = (date, km) => ({ date, km, value: null, action: 'replace', result: 'done', by: 'self', note: '' });
Object.assign(BIKE, {
  km: 2600,
  kmDate: day(-5),
  fit: { seatHeight: 742, pressureF: 2.4, pressureR: 2.6 },
  parts: [
    { key: 'chain', model: 'Test chain', history: [rep(day(-30), 2400)] },
    { key: 'cassette', model: '', history: [rep(day(-200), 0)] },
  ],
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
const putBike = (page, bike) =>
  page.evaluate((b) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const tx = r.result.transaction('bikes', 'readwrite');
      tx.objectStore('bikes').put(b);
      tx.oncomplete = () => { r.result.close(); ok(); };
    };
  }), bike);
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.beforeEach(async ({ page, context }, info) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const file = info.outputPath('velo-ideen.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('72 km jump: rides outside the app, a smaller number is a typo first', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/');
  await page.locator('.wall [data-fn="km"]').click();
  const km = page.getByRole('dialog', { name: T('km for a bike') });
  const pick = km.locator('select').first();
  if (await pick.count()) await pick.selectOption(BIKE.id);
  await km.getByLabel(T('km on the counter')).fill('2800');
  await km.getByRole('button', { name: T('Save km') }).click();
  const gap = page.getByTestId('km-gap');
  await expect(gap).toBeVisible();
  await expect(gap.getByRole('heading')).toHaveText(T('{km} km more than the app knows', { km: '200' }));
  await expect(gap.locator('[data-km-gap="rides"]')).toBeChecked();
  await gap.locator('[data-km-gap-date]').fill(day(-2));
  expect(await noSideways(page)).toBe(0);
  await gap.locator('[data-km-gap-ok]').click();
  await expect(gap).toBeHidden();
  await expect.poll(async () => (await table(page, 'kmBook')).filter((e) => e.bikeId === BIKE.id && e.kind === 'ride').map((e) => [e.km, e.date, e.name])).toEqual([[200, day(-2), T('Rides outside the app')]]);
  await expect.poll(async () => (await bikeNow(page)).km).toBe(2800);

  // fewer km: «Tippfehler» is chosen first, nothing is saved, the km window stays open to type again
  await expect(km).toBeHidden();
  await page.locator('.wall [data-fn="km"]').click();
  if (await pick.count()) await pick.selectOption(BIKE.id);
  await km.getByLabel(T('km on the counter')).fill('280');
  await km.getByRole('button', { name: T('Save km') }).click();
  await expect(gap.locator('[data-km-gap="again"]')).toBeChecked();
  await gap.locator('[data-km-gap-ok]').click();
  await expect(km.getByText(T('Nothing saved. Type the km again.'))).toBeVisible();
  expect((await bikeNow(page)).km).toBe(2800);
  expect(errors).toEqual([]);
});

test('73 setup log keeps the measures and brings them back', async ({ page }) => {
  await page.goto(`./#/bikes?tab=rig&view=log&bike=${BIKE.id}`);
  await page.getByRole('button', { name: T('Write down a change') }).first().click();
  const dlg = page.getByRole('dialog', { name: T('Write down a change') });
  await dlg.getByLabel(T('What changed')).fill('test_data_gtp_ Sattel 8 mm hoeher');
  const keep = dlg.locator('[data-riglog-keep] input[type=checkbox]');
  await expect(keep).toBeChecked();
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await bikeNow(page)).setupLog?.[0]?.saved?.fit?.seatHeight).toBe(742);

  // the saddle goes up 8 mm, the pressure front changes
  const b = await bikeNow(page);
  await putBike(page, { ...b, fit: { ...b.fit, seatHeight: 750, pressureF: 2.2 } });
  await page.reload(); // a write beside the app: the page reads it fresh
  const saved = page.locator('[data-riglog-saved]').first();
  await saved.locator('summary').click();
  await expect(saved.locator('.sdiff li')).toHaveCount(2);
  await saved.locator('[data-riglog-restore]').click();
  await expect.poll(async () => (await bikeNow(page)).fit).toEqual({ seatHeight: 742, pressureF: 2.4, pressureR: 2.6 });
  await expect(saved.getByText(T('The bike has these measures now.'))).toBeVisible();
  expect(await noSideways(page)).toBe(0);
});

test('74 a noise marks the chain check until it is checked', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const chain = page.locator('[data-wear="chain"]');
  await expect(chain).toHaveAttribute('data-wear-state', 'ok');
  await chain.locator('[data-wear-flag]').click();
  const form = chain.locator('[data-wear-flag-form]');
  await form.getByLabel(T('Noise')).check();
  await form.locator('[data-wear-flag-note]').fill('test_data_gtp_ knackt bergauf');
  await form.locator('[data-wear-flag-save]').click();
  await expect(chain).toHaveAttribute('data-wear-state', 'soon');
  await expect(chain.locator('.badge')).toHaveText(T('check|wear'));
  await expect(chain.locator('[data-wear-flagged="noise"]')).toContainText('knackt bergauf');
  expect((await bikeNow(page)).parts.find((p) => p.key === 'chain').flag).toMatchObject({ why: 'noise', date: today() });
  expect(await noSideways(page)).toBe(0);
  await chain.locator('[data-wear-unflag]').click();
  await expect(chain).toHaveAttribute('data-wear-state', 'ok');
  await expect.poll(async () => 'flag' in (await bikeNow(page)).parts.find((p) => p.key === 'chain')).toBe(false);
});
