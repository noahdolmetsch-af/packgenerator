// v0.125.0 A-J1 «Ein Weg zum Erfassen: Problem, km, Werkstatt» (mockup A-J1, Noah 13.10.2026 «aj-aj5 ok», answer 1a):
// «Neu › Werkstattbesuch» opens the real visit window (no note in the Inbox any more), with the km from the
// km book and the last workshop filled in on a green field with its origin, always changeable. After saving:
// the bike's «Werkstatt & Belege» with «Werkstattbesuch gespeichert.» and Undo. «Problem melden» left Ich
// (a quiet hint for 30 days); it stays in Neu and at the bike (Velos › Pflege).
// Fictional data only (test_data_gtp_), German UI, Europe/Zurich, service workers blocked (config).
// SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';
import { newButton } from './newbutton.js';

const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
// calendar days in Europe/Zurich (noon UTC of today's Zurich date, moved by whole days)
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const phone = (info) => info.project.name === 'phone';
const BIKE = 'test_data_gtp_gravel';
const SHOP_A = 'test_data_gtp_ Werkstatt A';
const SHOP_B = 'test_data_gtp_ Werkstatt B';

function fixtureFile(info) {
  mkdirSync(info.project.outputDir, { recursive: true });
  const path = `${info.project.outputDir}/aj1-fixture-${info.testId}.json`;
  const data = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const visit = (id, bikeId, date, shop, chf) => ({ id, bikeId, date, shop, invoice: null, km: null, totalChf: chf, parts: [], photos: [], source: 'Today' });
  data.tables.visits.push(visit('test_data_gtp_v1', BIKE, day(-40), SHOP_A, 120), visit('test_data_gtp_v2', 'test_data_gtp_spark', day(-10), SHOP_B, 60), visit('test_data_gtp_v3', BIKE, day(-200), SHOP_A, 90));
  writeFileSync(path, JSON.stringify(data));
  return path;
}

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(fixtureFile(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  await page.goto('./#/');
  await settle(page);
  return errors;
}

const dbAll = (page, store) =>
  page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction(name).objectStore(name).getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
    store,
  );
const bikeKm = async (page) => (await dbAll(page, 'bikes')).find((b) => b.id === BIKE).km;

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${phone(info) ? 390 : 1440}.png` });
}
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Neu › Werkstattbesuch opens the real visit with km and last workshop, saves it on the bike, Undo removes it', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const notesBefore = (await dbAll(page, 'notes')).length;

  await (await newButton(page, T('New'))).click();
  const sheet = page.getByRole('dialog', { name: T('New') });
  const opt = sheet.getByRole('button', { name: new RegExp(T('Workshop visit')) });
  await expect(opt).toContainText(T('Opens the visit, km already filled in'));
  await shot(page, info, 'aj1-neu');
  await opt.click();

  const dlg = page.getByRole('dialog', { name: T('Log a workshop visit') });
  await expect(dlg).toBeVisible();
  await expect(sheet).toBeHidden();
  await dlg.locator('select').first().selectOption(BIKE);
  // km of today from the km book, green with its origin
  const km = dlg.getByLabel(T('km at the visit'));
  await expect(km).toHaveValue(String(await bikeKm(page)));
  await expect(km).toHaveClass(/\bpre\b/);
  await expect(dlg.getByText(T('from the km book · you can change it'))).toBeVisible();
  // the shop of the bike's newest visit (not the newer visit of another bike), green, the known shops as chips
  const shop = dlg.getByLabel(T('Bike shop'), { exact: true });
  await expect(shop).toHaveValue(SHOP_A);
  await expect(shop).toHaveClass(/\bpre\b/);
  await expect(dlg.locator('#bq-shopfrom')).toContainText(T('from your last visit on {date} · you can change it').split('{date}')[0].trim());
  const shops = dlg.getByRole('group', { name: T('Known bike shops') });
  await expect(shops.getByRole('button', { name: new RegExp(SHOP_A) })).toHaveAttribute('aria-pressed', 'true');
  await expect(shops.getByRole('button', { name: new RegExp(SHOP_A) })).toContainText(T('(last)'));
  expect(await noSideways(page)).toBe(0);
  await shot(page, info, 'aj1-werkstatt');

  // everything stays changeable: another shop by one tap, the km typed by hand (no longer green)
  await shops.getByRole('button', { name: new RegExp(SHOP_B) }).click();
  await expect(shop).toHaveValue(SHOP_B);
  await expect(shop).not.toHaveClass(/\bpre\b/);
  await km.fill('8123');
  await expect(km).not.toHaveClass(/\bpre\b/);
  await expect(dlg.getByText(T('from the km book · you can change it'))).toHaveCount(0);
  await dlg.getByRole('group', { name: T('What was done?') }).getByRole('button', { name: T('Chain replaced') }).click();
  await dlg.getByLabel(T('Cost CHF (optional)')).fill('85');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();

  // a real visit on the bike, no note in the Inbox
  await expect(page).toHaveURL(new RegExp(`tab=shop&bike=${BIKE}`));
  await expect.poll(async () => (await dbAll(page, 'visits')).filter((v) => v.bikeId === BIKE && v.shop === SHOP_B).map((v) => [v.km, v.totalChf, v.parts.map((p) => p.part).join()])).toEqual([[8123, 85, 'chain']]);
  expect((await dbAll(page, 'notes')).length).toBe(notesBefore);
  await expect(page.locator('.lrow[data-visit-id]').filter({ hasText: SHOP_B })).toBeVisible();
  const toast = page.locator('.rtoast');
  await expect(toast).toContainText(T('Workshop visit saved.'));
  await shot(page, info, 'aj1-gespeichert');
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await dbAll(page, 'visits')).filter((v) => v.shop === SHOP_B && v.bikeId === BIKE).length).toBe(0);
  await expect(page.locator('.lrow[data-visit-id]').filter({ hasText: SHOP_B })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Problem melden: in Neu and at the bike, no longer in Ich (a quiet hint shows the way)', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await (await newButton(page, T('New'))).click();
  await expect(page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: new RegExp(T('Problem with a bike')) })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('./#/me');
  const main = page.locator('main');
  await expect(main.getByRole('button', { name: new RegExp(T('Report a problem')) })).toHaveCount(0);
  const hint = main.getByRole('note').filter({ hasText: T('Looking for «Report a problem»? It is now under + New and at the bike:') });
  await expect(hint).toBeVisible();
  await expect(hint.getByRole('link', { name: T('Bike care') })).toHaveAttribute('href', '#/bikes?tab=care');
  expect(await noSideways(page)).toBe(0);
  await hint.scrollIntoViewIfNeeded();
  await shot(page, info, 'aj1-ich');

  await hint.getByRole('link', { name: T('Bike care') }).click();
  await expect(page).toHaveURL(/tab=care/);
  await expect(page.getByRole('button', { name: new RegExp(T('Report a problem')) })).toBeVisible();
  expect(errors).toEqual([]);
});
