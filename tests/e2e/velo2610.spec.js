// Velo-Ergänzungen (Noah 26.10.2026 «1 3 6 7 8 12a»), German UI:
// - the chain checker corrects the forecast on the page «Verschleiss»;
// - noise notes with FAQ tips, «It is gone», delete with Undo;
// - the year in review (km of this year), winter and spring checklists (tick, own point);
// - the calendar switch for part changes under Me › Connections.
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
// the lists from the app source (griff.js imports Svelte runes, so it is read as text)
const GRIFF = readFileSync(fileURLToPath(new URL('../../src/lib/griff.js', import.meta.url)), 'utf8');
const list = (name) => [...GRIFF.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\];`))[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
const WINTER_STD = list('WINTER_STD');
const SPRING_STD = list('SPRING_STD');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
// calendar days in Europe/Zurich
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const rep = (date, km) => ({ date, km, value: null, action: 'replace', result: 'done', by: 'self', note: '' });
// a fictional bike with 2600 km: the chain mounted at 1800 km, measured 0.3 % at 2300 km → it wears fast
Object.assign(BIKE, {
  km: 2600,
  parts: [{ key: 'chain', model: '', history: [rep(day(-60), 1800), { date: day(-20), km: 2300, value: 0.3, action: 'check', result: 'ok', by: 'self', note: '' }] }],
});
base.tables.kmBook = [...(base.tables.kmBook ?? []), { id: 'kb-test-1', bikeId: BIKE.id, date: today(), km: 42, kind: 'ride', source: 'manual', state: 'counted' }];

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
  const file = info.outputPath('velo.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('the chain checker counts in the forecast; a noise note with a tip, gone, delete with Undo', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  const chain = page.locator('[data-wear="chain"]');
  await expect(chain.locator('[data-wear-meas]')).toHaveAttribute('data-wear-meas', 'counts');
  await expect(chain.locator('[data-wear-meas]')).toContainText(T('the forecast follows your measurement'));
  await expect(chain).toHaveAttribute('data-wear-state', 'soon');

  const card = page.locator('[data-noises]');
  await card.locator('[data-noise-new]').fill('Knackt beim Antritt');
  await card.locator('[data-noise-add]').click();
  const note = card.locator('[data-noise]');
  await expect(note).toHaveCount(1);
  await expect(note.locator('[data-noise-tip="creak"]')).toBeVisible();
  await expect.poll(async () => (await bikeNow(page)).noises?.[0]?.km).toBe(2600);
  await note.locator('[data-noise-gone]').click();
  await expect(card.locator('[data-noise]')).toHaveCount(0);
  await expect(card.locator('[data-noise-done]')).toHaveCount(1);
  await card.getByText(T('Gone ({n})', { n: 1 })).click();
  await card.locator('[data-noise-done]').getByRole('button', { name: T('Delete {name}', { name: 'Knackt beim Antritt' }), exact: true }).click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(card.locator('[data-noise-done]')).toHaveCount(0);
  await page.getByRole('button', { name: /Rückgängig|Undo/ }).click();
  await expect(card.locator('[data-noise-done]')).toHaveCount(1);
  expect(await noSideways(page)).toBe(0);
});

test('year in review and winter and spring', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${BIKE.id}`);
  await page.locator('[data-griff-page="year"]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Year in review') })).toBeVisible();
  await expect(page.locator(`[data-year-pick="${today().slice(0, 4)}"]`)).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(`[data-year-bike="${BIKE.id}"] [data-year-km]`)).toHaveText('42');
  expect(await noSideways(page)).toBe(0);

  await page.goto(`./#/bikes?tab=care&view=season&bike=${BIKE.id}`);
  await expect(page.getByRole('heading', { level: 1, name: T('Winter and spring') })).toBeVisible();
  await page.locator('[data-season-tab="winter"]').click();
  const items = page.locator('[data-season-item]');
  await expect(items).toHaveCount(WINTER_STD.length);
  await expect(items.first()).toContainText(T(WINTER_STD[0]));
  await items.first().locator('[data-season-tick]').check();
  await expect(page.getByText(T('{n} of {m} done', { n: 1, m: WINTER_STD.length }))).toBeVisible();
  await page.locator('[data-season-new]').fill('Sattelstütze fetten');
  await page.locator('[data-season-add]').click();
  await expect(items).toHaveCount(WINTER_STD.length + 1);
  await page.locator('[data-season-tab="spring"]').click();
  await expect(items).toHaveCount(SPRING_STD.length);
  expect(await noSideways(page)).toBe(0);
});

test('the calendar switch for part changes', async ({ page }) => {
  await page.goto('./#/me/connections');
  const sw = page.locator('[data-own-wear]');
  await expect(sw).toBeChecked();
  await sw.uncheck();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'google.own')?.value?.wear).toBe(false);
});
