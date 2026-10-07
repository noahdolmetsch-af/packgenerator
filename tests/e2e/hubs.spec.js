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

/** The tile (opened on a phone, where it starts folded). */
async function tile(page, key) {
  const fold = page.locator('details.hub').filter({ has: page.locator(`#${key}-h`) });
  if (await fold.count()) {
    if (!(await fold.evaluate((d) => d.open))) await fold.locator('summary').click();
  }
  return page.locator('.hub').filter({ has: page.locator(`#${key}-h`) });
}

const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Trips and Bikes tiles: four buttons and More, the menu by keyboard and touch', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await load(page, context, info);

  const trips = (await tile(page, 'pack')).getByRole('group', { name: T('Trips|place') });
  const shown = trips.locator(':scope > .btn');
  await expect(shown).toHaveCount(5);
  await expect(shown).toHaveText([T('Day ride'), T('New trip'), T('Write debrief'), T('Past trips'), T('More')]);
  await expect(trips.getByRole('link', { name: T('Write debrief') })).toHaveAttribute('href', `#/debrief/${PAST}`);

  const bikes = (await tile(page, 'bikes')).getByRole('group', { name: T('Bikes|place') });
  await expect(bikes.locator(':scope > .btn')).toHaveText([T('Log a problem'), T('Log km'), T('Bike care'), T('Idea'), T('More')]);
  await noSideways(page);

  // "Day ride" makes the trip in Pack (dayride.spec.js tests the trip itself); then back to Today.
  await trips.getByRole('button', { name: T('Day ride') }).click();
  await expect(page).toHaveURL(/#\/pack$/);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await page.goto('./#/');
  await tile(page, 'pack'); // on a phone the tile starts folded again

  // More by keyboard: Enter opens and focuses the first entry, arrows move, Escape closes back on More.
  const more = trips.getByRole('button', { name: T('More') });
  await more.focus();
  await page.keyboard.press('Enter');
  const menu = trips.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(more).toHaveAttribute('aria-expanded', 'true');
  await expect(menu.getByRole('menuitem')).toHaveText([T('Setups'), T('Compare trips'), T('Learnings'), T('All templates'), T('Building blocks')]);
  await expect(menu.getByRole('menuitem', { name: T('Setups') })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: T('Compare trips') })).toBeFocused();
  await noSideways(page);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(more).toBeFocused();
  // a tap outside closes it too
  await more.click();
  await expect(menu).toBeVisible();
  await page.locator('main h1').first().click();
  await expect(menu).toBeHidden();

  // The Bikes "More": Choose a bike opens the comparison for the next trip.
  await tile(page, 'bikes');
  await bikes.getByRole('button', { name: T('More') }).click();
  const bmenu = bikes.getByRole('menu');
  await expect(bmenu.getByRole('menuitem')).toHaveText([T('Note on a bike'), T('Log a workshop visit'), T('Workshop order'), T('Choose a bike for the trip')]);
  await bmenu.getByRole('menuitem', { name: T('Choose a bike for the trip') }).click();
  await expect(page.getByRole('dialog', { name: T('Which bike?') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Past trips lists the finished trip and opens it', async ({ page, context }, info) => {
  await load(page, context, info);
  await (await tile(page, 'pack')).getByRole('link', { name: T('Past trips') }).click();
  await expect(page).toHaveURL(/#\/pack\/past/);
  await expect(page.getByRole('heading', { name: T('Past trips'), level: 1 })).toBeVisible();
  const rows = page.locator('.past li.card');
  await expect(rows).toHaveCount(1); // the next trip is not past
  await expect(rows.first()).toContainText('test_data_gtp_ Jura');
  await expect(rows.first()).toContainText(T('{n} days', { n: 3 }));
  await expect(rows.first()).toContainText(T('km unknown'));
  await expect(rows.first().getByRole('link', { name: T('Write debrief') })).toHaveAttribute('href', `#/debrief/${PAST}`);
  await noSideways(page);
  await rows.first().getByRole('link', { name: /test_data_gtp_ Jura/ }).click();
  await expect(page).toHaveURL(/#\/pack$/);
  await expect(page.locator('.tour-context h2')).toHaveText('test_data_gtp_ Jura');
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
  // in the bike's repairs (and in the "before the trip" list of the next trip on it)
  await expect(page.getByLabel(T('Each bike')).getByText('test_data_gtp_ Kette knackt')).toBeVisible();
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
  // the tile counts it
  await expect((await tile(page, 'bikes')).getByRole('link', { name: `Test gravel bike: ${T('{n} idea', { n: 1 })}` })).toBeVisible();
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
