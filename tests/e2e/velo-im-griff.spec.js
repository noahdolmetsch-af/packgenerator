// «Velo im Griff» (Noah 19.10.2026, #193 #1009 #327), German UI:
// - the whole-bike service on a bike's care page: due by km, «Service gemacht» records it (Undo), the sheet
//   changes the interval, the switch turns the reminder off; the kind of the bike is stored on the bike;
// - «Teilevorlage»: a part switched off for a kind, an own part added, moved, renamed, deleted and back with Undo;
// - «Werkstatt-Spick»: the torque note, an own row added, its value changed, deleted and back; a breakdown opens.
// Fictional fixture plus test_data_gtp_ data; nothing leaves the preview server; service workers blocked (config).
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

function fixture(path) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  bike.km = 5000;
  bike.kmDate = day(-1);
  bike.service = { last: { day: day(-60), km: 1900, hours: null } }; // 3100 km ago: due (3000 km)
  writeFileSync(path, JSON.stringify(data));
}

const table = (page, name) =>
  page.evaluate((n) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction(n).objectStore(n).getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), name);
const setting = async (page, key) => (await table(page, 'settings')).find((s) => s.key === key)?.value;
const stored = async (page) => (await table(page, 'bikes')).find((b) => b.id === BIKE.id);

test.beforeEach(async ({ page, context }, info) => {
  page.on('dialog', (d) => { throw new Error(`browser dialog: ${d.message()}`); });
  const file = info.outputPath('vig.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('bike service: due by km, Service done with Undo, the sheet and the switch, the kind', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  const card = page.locator('[data-velo-card]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-velo-service]')).toContainText(T('Service due'));
  await expect(card.locator('[data-velo-hours]')).toContainText('≈');
  // the due point stands with the other due points of the bike
  await expect(page.locator('[data-due-service]')).toContainText(T('Bike service'));

  await card.locator('[data-service-done]').click();
  await expect.poll(async () => (await stored(page)).service?.last?.day).toBe(today());
  await expect(page.locator('[data-due-service]')).toHaveCount(0);
  await expect(card.locator('[data-velo-service]')).toContainText(T('Next service'));
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await stored(page)).service?.last?.day).toBe(day(-60));

  // the sheet: every 4000 km, no hours
  await card.locator('[data-service-edit]').click();
  const sheet = page.locator('[data-service-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-service-km]').fill('4000');
  await sheet.locator('[data-service-hours]').fill('');
  await sheet.locator('[data-service-save]').click();
  await expect.poll(async () => (await stored(page)).service).toMatchObject({ everyKm: 4000, everyHours: null });
  await expect(card.locator('[data-velo-service]')).toContainText(T('Next service'));

  // the switch: no reminder
  await card.getByRole('switch', { name: T('Reminder: bike service') }).click();
  await expect.poll(async () => (await stored(page)).service).toMatchObject({ everyKm: null, everyHours: null, everyDays: null });
  await expect(card.locator('[data-velo-service]')).toContainText(T('off: no reminder'));

  // the kind of the bike
  await card.getByRole('button', { name: T('Road bike') }).click();
  await expect.poll(async () => (await stored(page)).kind).toBe('road');
});

test('part template: switch a part off, own parts added, moved, renamed, deleted and back', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  await page.locator('[data-link-templates]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Part template') })).toBeVisible();
  await expect(page.locator('[data-tpl-bikes]')).toContainText(BIKE.name);

  const charger = page.locator('[data-tpl-part="charger"]').getByRole('switch');
  await expect(charger).toHaveAttribute('aria-checked', 'true');
  await charger.click();
  await expect.poll(async () => (await setting(page, 'partTemplates'))?.gravel?.drop).toEqual(['charger']);

  for (const name of ['test_data_gtp_ Klingel', 'test_data_gtp_ Licht']) {
    await page.locator('[data-tpl-new]').fill(name);
    await page.locator('[data-tpl-add]').click();
    await expect(page.locator('[data-tpl-own]').filter({ hasText: name })).toBeVisible();
  }
  await page.getByRole('button', { name: T('Move {name} up', { name: 'test_data_gtp_ Licht' }) }).click();
  await expect.poll(async () => (await setting(page, 'partTemplates')).gravel.own.map((p) => p.name)).toEqual(['test_data_gtp_ Licht', 'test_data_gtp_ Klingel']);

  await page.getByRole('button', { name: T('Rename {name}', { name: 'test_data_gtp_ Klingel' }) }).click();
  const ren = page.getByRole('dialog', { name: T('Rename part') });
  await ren.getByRole('textbox').fill('test_data_gtp_ Glocke');
  await ren.getByRole('textbox').press('Enter');
  await expect.poll(async () => (await setting(page, 'partTemplates')).gravel.own.map((p) => p.name)).toEqual(['test_data_gtp_ Licht', 'test_data_gtp_ Glocke']);

  await page.getByRole('button', { name: T('Delete {name}', { name: 'test_data_gtp_ Licht' }) }).click();
  const ask = page.getByRole('dialog', { name: T('Delete "{name}"?', { name: 'test_data_gtp_ Licht' }) });
  await ask.getByRole('button', { name: T('Delete') }).click();
  await expect.poll(async () => (await setting(page, 'partTemplates')).gravel.own.map((p) => p.name)).toEqual(['test_data_gtp_ Glocke']);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await setting(page, 'partTemplates')).gravel.own.map((p) => p.name)).toEqual(['test_data_gtp_ Licht', 'test_data_gtp_ Glocke']);

  // the bike's care page shows the own part of the template
  await page.goto(`./#/bikes?tab=compare&bike=${BIKE.id}`);
  await expect(page.getByText('test_data_gtp_ Glocke').first()).toBeVisible();
});

test('workshop cheat sheet: the torque note, own rows, a breakdown', async ({ page }) => {
  await page.goto(`./#/bikes?tab=care&bike=${BIKE.id}&open=1`);
  await page.locator('[data-link-spick]').click();
  await expect(page.getByRole('heading', { level: 1, name: T('Workshop cheat sheet') })).toBeVisible();
  await expect(page.locator('[data-spick-note]')).toContainText(T('Typical values only. The value printed on the part always wins.'));
  await expect(page.locator('[data-torque="axle"]')).toContainText('12–15');

  await page.locator('[data-torque-new]').fill('test_data_gtp_ Vorbau');
  await page.locator('[data-torque-newnm]').fill('5-6');
  await page.locator('[data-torque-add]').click();
  await expect.poll(async () => await setting(page, 'torqueOwn')).toMatchObject([{ name: 'test_data_gtp_ Vorbau', nm: '5–6' }]);

  const value = page.locator('[data-torque-own] [data-torque-value]');
  await value.fill('7');
  await value.press('Enter');
  await value.blur();
  await expect.poll(async () => (await setting(page, 'torqueOwn'))[0].nm).toBe('7');

  await page.locator('[data-torque-delete]').click();
  await page.getByRole('dialog', { name: T('Delete "{name}"?', { name: 'test_data_gtp_ Vorbau' }) }).getByRole('button', { name: T('Delete') }).click();
  await expect.poll(async () => (await setting(page, 'torqueOwn')).length).toBe(0);
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await setting(page, 'torqueOwn')).length).toBe(1);

  const chain = page.locator('[data-breakdown="chain"]');
  await chain.locator('summary').click();
  await expect(chain).toContainText(T('Push the damaged link out with the chain tool.'));
});
