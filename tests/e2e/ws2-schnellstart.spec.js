// WS2 «Wieder sichtbar» (Noah 14.10.2026 «1a 2b 3a ws1-ws7 freigeben»): «Tagestour jetzt» in «Neu» and in
// the search becomes «Schnellstart» and makes the trip by the rules of Today: today, 2.5 h, the bike
// ridden last, the weather of the home forecast, the time stamp as its name. Pack opens it with
// «Ändern» and «Rückgängig». Fictional data only (test_data_gtp_), the clock on D0 09:00 (Europe/Zurich),
// Open-Meteo mocked. SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { D0, openHome, homeFixture } from './home0460-fixture.js';

const STAMP = `${D0.replaceAll('-', '')}0900`; // 09:00 on D0, local time

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}

const dbTrips = (page) =>
  page.evaluate(
    () =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => no(r.error);
        r.onsuccess = () => {
          const q = r.result.transaction('trips').objectStore('trips').getAll();
          q.onsuccess = () => (r.result.close(), ok(q.result));
        };
      }),
  );

/** The fixture of Today without its trip of today; the last ride (Napf, 3 days ago) on the Spark: the quick start takes the Spark. */
function data() {
  const d = homeFixture();
  d.tables.trips = d.tables.trips.filter((x) => x.id !== 'test_data_gtp_TEST-Runde');
  const napf = d.tables.trips.find((x) => x.id === 'test_data_gtp_Napf');
  Object.assign(napf, { bikeId: 'test_data_gtp_spark', bike: 'test_data_gtp_ Spark' });
  return d;
}

test('WS2: New > Quick start makes the trip of today on the bike ridden last; Undo deletes it', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9, data: data() });
  const before = (await dbTrips(page)).length;

  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:new', { detail: 'all' })));
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByText(T('Day ride now'), { exact: true })).toHaveCount(0);
  const opt = sheet.getByRole('button', { name: new RegExp(`^${T('Quick start')}`) });
  await expect(opt).toContainText(T('today, 2.5 h, the bike ridden last'));
  await shot(page, info, 'WS2-neu-schnellstart');
  await opt.click();

  const card = page.locator('.made-card');
  await expect(card).toContainText(T('Quick start created'));
  await expect(page).toHaveURL(/#\/pack/);
  const made = (await dbTrips(page)).find((x) => x.title === STAMP);
  expect(made).toMatchObject({ startDate: D0, hours: 2.5, days: 1, overnight: 'none', bikeId: 'test_data_gtp_spark', wxFrom: 'forecast', wx: { min: 7, max: 16 } });
  expect(made.copiedFrom ?? null).toBeNull();
  await shot(page, info, 'WS2-schnellstart-erstellt');

  await card.getByRole('button', { name: T('Undo: delete this new trip') }).click();
  await expect(card).toHaveCount(0);
  await expect.poll(async () => (await dbTrips(page)).length).toBe(before);
  expect(errors).toEqual([]);
});

test('WS2: the search offers Quick start for the old word too; Enter makes the trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9, data: data() });
  if (info.project.name === 'phone') await page.locator('header.top .search button.icon').click();
  const field = page.getByRole('searchbox', { name: T('What do you want to do? Search or say an action') }).first();
  await field.fill('tagestour');
  const act = page.locator('[data-cmd="dayride"]').first();
  await expect(act).toContainText(T('Quick start'));
  await expect(act).toContainText(T('today, 2.5 h, the bike ridden last'));
  await act.click();
  await expect(page.locator('.made-card')).toContainText(T('Quick start created'));
  await expect.poll(async () => (await dbTrips(page)).find((x) => x.title === STAMP)?.bikeId).toBe('test_data_gtp_spark');
  expect(errors).toEqual([]);
});
