// v0.46.0: the tiles are gone; the bike jobs are a quiet line under the bike cards of Today.
// v0.25.1 (Noah 1a, 1b, 2b, 3a): more buttons on the Trips and Bikes tiles of Today: four visible,
// the rest under "More" (keyboard and touch). Past trips, Log a problem → Bike care, an idea on the
// bike ("Was geil wäre"). Fictional fixture plus test_data_gtp_ trips; nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const T = tr('de');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => new Date(Date.now() + n * 864e5).toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const PAST = 'test_data_gtp_hubs_past';
const NEXT = 'test_data_gtp_hubs_next';

/** One finished trip (ended 4 days ago, no debrief) and one in ten days, both on the test bike. */
function fixture(path) {
  const data = structuredClone(base);
  const bike = data.tables.bikes[0];
  const entries = data.tables.items.slice(3, 7).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: true }));
  data.tables.trips = [
    { id: PAST, domain: 'bikepacking', title: 'test_data_gtp_ Jura', startDate: day(-6), days: 3, bikeId: bike.id, bike: bike.name, setup: bike.setup, entries, ready: [], status: 'planned' },
    { id: NEXT, domain: 'bikepacking', title: 'test_data_gtp_ Alpen', startDate: day(10), days: 2, bikeId: bike.id, bike: bike.name, setup: bike.setup, entries: entries.map((e) => ({ ...e, packed: false })), ready: [], status: 'planned' },
  ];
  writeFileSync(path, JSON.stringify(data));
}

async function load(page, context, info) {
  const file = info.outputPath('hubs-fixture.json');
  fixture(file);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const data = page.locator('details.data');
  // the app opens this panel by itself on an empty start: make sure it ends up open
  await expect(async () => {
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
    expect(await data.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await expect(data.getByText(/importiert/)).toBeVisible();
  await page.goto('./#/');
}

/** v0.46.0: the bike cards of Today with their quiet line of bike jobs. */
const bikeRow = (page) => page.locator('section.bikes');

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

// v0.46.0 «Startseite neu»: the Trips and Bikes tiles are gone. The waiting debrief is a row of
// "Important today"; the bike jobs (problem, idea, workshop visit, workshop order) are one quiet line
// under the bike cards. "Choose a bike for the trip" lives in Plan (the bike choice), Setups on Bikes.
test('Today: the waiting debrief in Important today, the bike jobs under the bike cards', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, context, info);
  await expect(page.getByRole('region', { name: T('Important today') })).toContainText('test_data_gtp_ Jura');
  const jobs = bikeRow(page).locator('.jobs');
  await expect(jobs.locator('.lk').first()).toHaveText(T('Log a problem'));
  await expect(jobs.getByRole('button', { name: T('Idea') })).toBeVisible();
  await expect(jobs.getByRole('button', { name: T('Log a workshop visit') })).toBeVisible();
  await expect(jobs.getByRole('link', { name: T('Workshop order') })).toHaveAttribute('href', '#/bikes?tab=care');
  await noSideways(page);
  await jobs.getByRole('button', { name: T('Log a workshop visit') }).click();
  await expect(page.getByRole('dialog', { name: T('Log a workshop visit') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Past trips lists the finished trip and opens it', async ({ page, context }, info) => {
  await load(page, context, info);
  // v0.38.0 (Noah 13a): Past trips is in "More" › Look back.
  await page.locator('.more-btn').click();
  await page.locator('dialog.more').getByRole('link', { name: T('Past trips') }).click();
  await expect(page).toHaveURL(/#\/pack\/past/);
  await expect(page.getByRole('heading', { name: T('Past trips'), level: 1 })).toBeVisible();
  // v0.40.0 (Noah 3a): one row per trip; an open debrief is a small neutral badge, the row opens it.
  const open = page.getByRole('list', { name: new RegExp(`^${T('Debrief open')}`) });
  const rows = page.locator('.past ul[aria-labelledby] > li');
  await expect(rows).toHaveCount(1); // the next trip is not past
  await expect(open.locator('li')).toHaveCount(1);
  await expect(rows.first()).toContainText('test_data_gtp_ Jura');
  await expect(rows.first().locator('.nbadge')).toHaveText(T('open|debrief'));
  await expect(rows.first().getByRole('link')).toHaveAttribute('href', `#/debrief/${PAST}`);
  await expect(page.locator('.page-sub')).toContainText(T('{n} debrief open', { n: 1 }));
  await noSideways(page);
  await rows.first().getByRole('link', { name: /test_data_gtp_ Jura/ }).click();
  await expect(page).toHaveURL(new RegExp(`#/debrief/${PAST}$`));
  await expect(page.locator('.trip-band h1')).toHaveText('test_data_gtp_ Jura');
});

test('Log a problem lands in Bike care as an open repair', async ({ page, context }, info) => {
  await load(page, context, info);
  await bikeRow(page).getByRole('button', { name: T('Log a problem') }).click();
  const dlg = page.getByRole('dialog', { name: T('Log a problem') });
  await expect(dlg.getByLabel(T('Bike'))).toHaveValue('bike-test');
  await dlg.getByLabel(T('What is wrong?')).fill('test_data_gtp_ Kette knackt');
  await noSideways(page);
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  const saved = page.getByRole('status').filter({ hasText: T('Saved in Bike care.') });
  await saved.getByRole('link', { name: T('Open') }).click();
  await expect(page).toHaveURL(/tab=care/);
  // in the bike's repairs (and in the "before the trip" list of the next trip on it);
  // v0.31.0: also named in the bike's card "For the bike shop"
  // v0.47.1 (Noah): problems stand in one flat list above the bikes, newest on top.
  await expect(page.locator('section.problems').getByText('test_data_gtp_ Kette knackt', { exact: true }).first()).toBeVisible();
  // the note stays in the Inbox as sorted ("All notes"), not as one to sort
  await page.goto('./#/inbox');
  await expect(page.getByText('test_data_gtp_ Kette knackt').first()).toBeAttached(); // v0.47.1: in the one Inbox list, newest first
});

test('An idea for the bike shows on Bikes and can be ticked', async ({ page, context }, info) => {
  await load(page, context, info);
  await bikeRow(page).getByRole('button', { name: T('Idea') }).click();
  const dlg = page.getByRole('dialog', { name: T('Idea for a bike') });
  await dlg.getByLabel(T('What would be great?')).fill('test_data_gtp_ Dropper');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(dlg).toBeHidden();
  // v0.38.0: the Bikes tile with its idea count became "Bikes ready?"; the ideas list on Bikes counts it.
  await page.getByRole('status').filter({ hasText: T('Idea saved.') }).getByRole('link', { name: T('Open') }).click();
  await expect(page).toHaveURL(/#\/bikes/);
  const list = page.getByRole('list', { name: T('Ideas for the {bike}', { bike: 'Test gravel bike' }) });
  await expect(list).toBeVisible();
  const box = list.getByRole('checkbox', { name: /test_data_gtp_ Dropper/ });
  await expect(box).not.toBeChecked();
  await box.check();
  await expect(box).toBeChecked();
  await expect(list).toContainText(T('done|idea'));
  await noSideways(page);
});
