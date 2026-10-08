// v0.28.0 (AP25, Noah 8.10.2026): templates learn from experience, traceably. A hint says
// "3 of 3 trips not used" with the trips and their context, "Not now" puts it in the History,
// Home shows a card while there are suggestions. First aid only comes with a night.
// Fictional fixture plus test_data_gtp_ records; nothing outside the preview server.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const item = (id, name, f) => ({ id, name: `test_data_gtp_ ${name}`, category: 'lux', weightG: 120, qty: 1, weightStatus: 'measured', defaultBag: 'seat', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });

/** Three finished 2-day lodging trips with the down jacket on and not used; a template with it and the multi tool. */
function learnFixture() {
  const data = structuredClone(base);
  const T0 = data.tables;
  const d0 = today();
  T0.items.push(item('AP01', 'Daunenjacke', { category: 'offbike' }));
  const trip = (id, ago, wx) => ({
    id, title: `test_data_gtp_ ${id}`, domain: 'bikepacking', startDate: addDays(d0, -ago), days: 2, overnight: 'lodging', wx, bikeId: 'bike-test', bike: 'Test gravel bike',
    setup: { seat: 'bag-TA01', frame: 'bag-TA02', top: 'bag-TA03' }, entries: ['AP01', 'TO01'].map((itemId) => ({ itemId, slot: 'seat', qty: 1, packed: true })), ready: [], status: 'done',
  });
  T0.trips.push(trip('Jura', 90, { min: 4, max: 10, rain: 'none' }), trip('Emmental', 60, { min: 8, max: 14, rain: 'showers' }), trip('Napf', 30, { min: 6, max: 12, rain: 'rain' }));
  const done = (id) => ({ tripId: id, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: { AP01: 'unused', TO01: 'unused' }, missing: [], applied: [], km: null, kmApplied: 0, doneAt: `${addDays(d0, -1)}T10:00:00.000Z` });
  T0.debriefs.push(done('Jura'), done('Emmental'), done('Napf'));
  T0.settings.push({ key: 'templates', value: [{ id: 'tpl-test_data_gtp_', name: 'test_data_gtp_ Wochenende', setup: {}, entries: [{ itemId: 'AP01', slot: 'seat', qty: 1 }, { itemId: 'TO01', slot: 'frame', qty: 1 }], ready: [], ride: null, hours: null, sets: {}, purpose: {}, updatedAt: '2026-10-01T08:00:00.000Z' }] });
  return data;
}

/** First aid: a standard kit and a rescue blanket in the first aid set, no trips yet. */
function aidFixture() {
  const data = structuredClone(base);
  data.tables.items.push(
    item('AP02', 'Erste-Hilfe-Set', { category: 'hyg', role: 'standard', sets: ['firstaid'], defaultBag: 'top' }),
    item('AP03', 'Rettungsdecke', { category: 'hyg', sets: ['firstaid'], defaultBag: 'top' }),
  );
  return data;
}

async function start(page, context, info, data) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const file = info.outputPath('ap25-fixture.json');
  writeFileSync(file, JSON.stringify(data));
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(panel.getByText(/importiert|Imported/)).toBeVisible();
}

/** Good to know, opened on the phone (folded there). */
async function know(page) {
  const fold = page.locator('main details.know');
  if (await fold.count()) {
    await expect(async () => {
      if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
      expect(await fold.evaluate((d) => d.open)).toBe(true);
    }).toPass();
    return fold;
  }
  return page.locator('main section.know');
}

const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

const allTrips = (page) =>
  page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').getAll();
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }));

test('a template hint with its source, "Not now" into the History, the Home card', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, learnFixture());
  await page.goto('./#/');
  // Home: one suggestion (the multi tool is a tool: never "take out")
  let k = await know(page);
  const card = k.locator('[data-card="templates"]');
  await expect(card).toContainText(T('{n} suggestion for your templates', { n: 1 }));
  await card.getByRole('link', { name: T('Look at them') }).click();
  await expect(page).toHaveURL(/#\/pack\/templates$/);

  const row = page.locator('[data-hint="out:AP01"]');
  await expect(row).toContainText(T('Take {name} out of the template?', { name: 'test_data_gtp_ Daunenjacke' }));
  await expect(page.locator('[data-hint="out:TO01"]')).toHaveCount(0);
  const src = row.locator('details.src');
  await expect(src.locator('summary')).toHaveText(T('{count} of {of} trips not used', { count: 3, of: 3 }));
  await src.locator('summary').click();
  await expect(src).toContainText(T('Not needed on:'));
  const trips = src.locator('.trips li');
  await expect(trips).toHaveCount(3);
  await expect(trips.first()).toContainText('test_data_gtp_ Napf');
  await expect(trips.first()).toContainText(`2 Tage · ${T('Lodging')} · 6–12 °C, Regen`);
  await expect(trips.nth(1)).toContainText('8–14 °C, Schauer');
  await noSideScroll(page);

  await row.getByRole('button', { name: T('Not now') }).click();
  await expect(page.locator('[data-hint="out:AP01"]')).toHaveCount(0);
  const hist = page.locator('details.hist');
  await expect(hist.locator('summary')).toContainText(`${T('History')} (1)`);
  await hist.locator('summary').click();
  await expect(hist).toContainText(`${T('Not now')}: ${T('Take out: {name}', { name: 'test_data_gtp_ Daunenjacke' })}`);
  await expect(hist).toContainText('test_data_gtp_ Napf, test_data_gtp_ Emmental, test_data_gtp_ Jura');
  await noSideScroll(page);
  // the template keeps its items
  await expect(page.locator('.card').first()).toContainText(T('{n} items', { n: 2 }));

  // Home: no more card
  await page.goto('./#/');
  k = await know(page);
  await expect(k.locator('[data-card]').first()).toBeVisible();
  await expect(k.locator('[data-card="templates"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('first aid: none on a day ride, with a 1-night lodging trip', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, info, aidFixture());
  await page.goto('./#/');
  // the day ride in one tap (the Home button sends this event)
  await page.evaluate(() => window.dispatchEvent(new Event('pg:dayride')));
  await expect(page.locator('.made-card')).toBeVisible();
  let list = await allTrips(page);
  expect(list).toHaveLength(1);
  const day = list[0].entries.map((e) => e.itemId);
  expect(day.length).toBeGreaterThan(3);
  expect(day).not.toContain('AP02');
  expect(day).not.toContain('AP03');

  // v0.28.0 (Noah 8.10.2026): a fresh "New trip" dialog starts with the standard set
  await page.getByLabel(T('More: other trip, edit trip, templates, print')).click();
  await page.getByRole('button', { name: T('New trip'), exact: true }).click();
  const fresh = page.getByRole('dialog', { name: T('New trip') });
  await expect(fresh.getByLabel(T('Start from'))).toHaveValue('standard');
  await fresh.getByRole('button', { name: T('Cancel') }).click();
  await expect(fresh).toBeHidden();

  // a 2-day trip with a night in lodging brings both, and says why
  const title = 'test_data_gtp_ Hotelnacht';
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  await page.getByRole('dialog', { name: T('Plan a new trip') }).getByRole('button', { name: T('Standard set') }).click();
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await dlg.getByLabel(T('Name')).fill(title);
  await dlg.getByLabel(T('Start date')).fill(today());
  await dlg.getByRole('spinbutton', { name: T('Days') }).fill('2');
  await dlg.getByRole('button', { name: T('Lodging') }).click();
  await dlg.getByRole('button', { name: T('Create trip') }).click();
  await expect(dlg).toBeHidden();
  await expect.poll(async () => (await allTrips(page)).find((x) => x.title === title)?.entries.map((e) => e.itemId) ?? []).toEqual(expect.arrayContaining(['AP02', 'AP03']));
  const top = page.getByRole('region', { name: T('Top tube bag') });
  const head = top.locator('.bag-heading');
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await expect(top.locator('.planning-row').filter({ hasText: 'test_data_gtp_ Rettungsdecke' })).toContainText(T('First aid from 1 night'));
  await noSideScroll(page);
  list = await allTrips(page);
  expect(list).toHaveLength(2);
  expect(errors).toEqual([]);
});
