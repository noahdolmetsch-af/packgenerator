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

/** The tile (opened on a phone, where it starts folded). v0.38.0: the Bikes tile is "Bikes ready?". */
async function tile(page, key) {
  if (key === 'bikes') return page.locator('section.ready');
  const fold = page.locator('details.hub').filter({ has: page.locator(`#${key}-h`) });
  if (await fold.count()) {
    if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
  }
  return page.locator('.hub').filter({ has: page.locator(`#${key}-h`) });
}

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Trips tile and "Bikes ready?": only what no menu has, the More menu by keyboard and touch', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, context, info);

  // v0.38.0 (Noah 13a): every target once. Day ride, New trip, Past trips, Compare trips, Learnings,
  // templates and building blocks are in "New" and "More"; the Trips tile keeps what only it knows.
  const trips = (await tile(page, 'pack')).getByRole('group', { name: T('Trips|place') });
  await expect(trips.locator(':scope > .btn')).toHaveText([T('Write debrief'), T('Setups')]);
  await expect(trips.getByRole('link', { name: T('Write debrief') })).toHaveAttribute('href', `#/debrief/${PAST}`);

  // The Bikes tile became "Bikes ready?" (Noah 8a): a problem and an idea, the rest under More.
  const bikes = (await tile(page, 'bikes')).getByRole('group', { name: T('Bikes|place') });
  await expect(bikes.locator(':scope > .btn')).toHaveText([T('Log a problem'), T('Idea'), T('More')]);
  await noSideways(page);

  // More by keyboard: Enter opens and focuses the first entry, arrows move, Escape closes back on More.
  const more = bikes.getByRole('button', { name: T('More') });
  await more.focus();
  await page.keyboard.press('Enter');
  const menu = bikes.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('menuitem')).toHaveText([T('Log a workshop visit'), T('Workshop order'), T('Choose a bike for the trip')]);
  await expect(menu.getByRole('menuitem', { name: T('Log a workshop visit') })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: T('Workshop order') })).toBeFocused();
  await noSideways(page);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();
  // a tap outside closes it too
  await more.click();
  await expect(menu).toBeVisible();
  await page.locator('main h1').first().click();
  await expect(menu).toBeHidden();

  // Choose a bike opens the comparison for the next trip.
  await more.click();
  await menu.getByRole('menuitem', { name: T('Choose a bike for the trip') }).click();
  await expect(page.getByRole('dialog', { name: T('Which bike?') })).toBeVisible();
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
  await (await tile(page, 'bikes')).getByRole('button', { name: T('Log a problem') }).click();
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
  await expect(page.getByLabel(T('Each bike')).getByText('test_data_gtp_ Kette knackt', { exact: true }).first()).toBeVisible();
  // the note stays in the Inbox as sorted ("All notes"), not as one to sort
  await page.goto('./#/inbox');
  await expect(page.getByText('test_data_gtp_ Kette knackt').first()).toBeAttached(); // folded under "All notes"
});

test('An idea for the bike shows on Bikes and can be ticked', async ({ page, context }, info) => {
  await load(page, context, info);
  await (await tile(page, 'bikes')).getByRole('button', { name: T('Idea') }).click();
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
