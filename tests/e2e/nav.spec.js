// v0.23.0 (AP07): one navigation on every page. Every old address still opens its page and marks
// the right main place (Today / Trips / Gear / Bikes), and Today's one main step opens exactly the
// trip it shows, never another one. Empty database or fictional test_data_gtp_ trips only.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';

const tr = (lang) => (en, vars) => {
  const text = (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

/** address → the main place that must be marked (null: none of the four, e.g. the Inbox). */
const ROUTES = [
  ['#/', 'Today|place'],
  ['#/trips', 'Trips|place'],
  ['#/pack', 'Trips|place'],
  ['#/pack?day', 'Trips|place'],
  ['#/pack/templates', 'Trips|place'],
  ['#/gear?fav=1', 'Gear|place'],
  ['#/gear?q=Tent', 'Gear|place'],
  ['#/favorites', 'Gear|place'],
  ['#/bikes?tab=care', 'Bikes|place'],
  ['#/bikes', 'Bikes|place'],
  ['#/care', 'Bikes|place'],
  ['#/ride', 'Trips|place'],
  ['#/debrief', 'Trips|place'],
  ['#/debrief/test_data_gtp_none', 'Trips|place'],
  // v0.71.0 «Fünf Orte»: Im Flow is the place Aktiv; the Inbox lives in «Ich» (no place lit)
  ['#/flow', 'Active|place'],
  ['#/inbox', null],
  ['#/inbox/new', null],
  ['#/share/test_data_gtp_code', 'Trips|place'],
];

for (const lang of ['en', 'de']) {
  test(`every address marks its place, ${lang}`, async ({ page, context }) => {
    const T = tr(lang);
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('dialog', (d) => d.dismiss());
    const width = page.viewportSize().width;
    for (const [hash, place] of ROUTES) {
      await page.goto(`./${hash}`);
      const nav = page.locator('nav[aria-label]').filter({ visible: true }).filter({ has: page.locator(`a[href="#/gear"]`) });
      await expect(nav, hash).toHaveCount(1);
      // the same five places (v0.71.0), in the same order, on every page (the sidebar also lists their pages)
      const places = page.locator('nav.bottom a, .side li.pl > a.pa');
      await expect(places, hash).toHaveText([T('Today|place'), T('Trips|place'), T('Gear|place'), T('Bikes|place'), T('Active|place')]);
      const lit = page.locator('nav.bottom a[aria-current], .side li.pl > a.pa[aria-current]');
      if (place) await expect(lit, hash).toHaveText(T(place));
      else await expect(lit, hash).toHaveCount(0);
      await expect(page.locator('main'), hash).not.toBeEmpty();
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(sw, `${hash} scrolls sideways`).toBeLessThanOrEqual(width);
    }
    // the old Care address lands on Bikes → Care; the "new note" address opens the quick note
    await page.goto('./#/care');
    await expect(page).toHaveURL(/#\/bikes\?tab=care$/);
    await page.goto('./#/inbox/new');
    await expect(page.getByRole('dialog').filter({ visible: true })).toHaveCount(1);
    await expect(page).toHaveURL(/#\/inbox$/);
    expect(errors).toEqual([]);
  });
}

/** Two upcoming fictional trips; the later one is the trip Pack had open last. */
function fixture(path, soonDate, wx) {
  const data = structuredClone(base);
  const entries = data.tables.items.slice(3, 7).map((i) => ({ itemId: i.id, slot: 'body', qty: 1, packed: false }));
  const trip = (id, startDate) => ({ id: `test_data_gtp_${id}`, domain: 'bikepacking', title: `test_data_gtp_ ${id}`, startDate, days: 1, bikeId: 'bike-test', setup: {}, entries, ready: [], status: 'planned', wx });
  data.tables.trips = [trip('later', '2026-10-20'), trip('sooner', soonDate)];
  writeFileSync(path, JSON.stringify(data));
}

// v0.29.0: Today's buttons carry the names of the trip tabs (Pack, Plan).
// v0.34.0 A (L1): Today shows the trip schedule's next step: tomorrow (weather set) "Pack"; in a week
// without weather the weather step, whose button opens Plan (with the trip conditions).
const WARM = { min: 16, max: 24, rain: 'none' };
for (const [soon, button, step, wx] of [['2026-10-08', 'Pack|stage', 'Pack|stage', WARM], ['2026-10-14', 'Get the forecast', 'Plan|stage', null]]) {
  test(`Today opens the trip it shows: ${step}`, async ({ page, context }, info) => {
    const T = tr('en');
    const file = info.outputPath('nav-fixture.json');
    fixture(file, soon, wx);
    await page.clock.setFixedTime(new Date('2026-10-07T10:00:00Z'));
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
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
    await expect(data.getByText(T('Imported {name} (replaced all data).', { name: 'nav-fixture.json' }))).toBeVisible();
    // Pack last showed the other trip
    await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_later'));
    await page.goto('./#/');
    const band = page.getByRole('region', { name: 'test_data_gtp_ sooner' });
    await expect(band).toBeVisible();
    // exactly one strong button in the band
    await expect(band.locator('.btn')).toHaveCount(1);
    await band.getByRole('link', { name: T(button), exact: true }).click();
    await expect(page.locator('.trip-band h1')).toHaveText('test_data_gtp_ sooner');
    // the band's tab of that step is the current one
    await expect(page.locator('.trip-band nav a[aria-current="page"]')).toContainText(T(step));
    if (step === 'Pack|stage') await expect(page.locator('.pd')).toHaveAttribute('aria-label', T('Packing day: {title}', { title: 'test_data_gtp_ sooner' }));
    // v0.67.0: the trip's steps are the StepBar (nav.stepbar), not a place
    await expect(page.locator('nav[aria-label]:not(.steps):not(.stepbar) a[aria-current="page"]').filter({ visible: true })).toHaveText(T('Trips|place'));
    expect(await page.evaluate(() => localStorage.getItem('pack.currentTrip'))).toBe('test_data_gtp_sooner');
  });
}

// v0.23.1 (Noah 1b): DE|EN sits only in the menu (phone and desktop), one tap once the menu
// is open, keyboard reachable, and it shows which language is on. v0.38.0 (Noah 12a): the menu was
// "More" at the top right; v0.71.0 «Fünf Orte»: it is the page «Ich» behind the round button there.
test('the language switch lives in «Ich»', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.getItem('lang') || localStorage.setItem('lang', 'en'));
  await page.goto('./');
  await expect(page.locator('header.top, .side').locator('button[lang="de"]').filter({ visible: true })).toHaveCount(0);
  // keyboard: «Ich» opens with Enter
  await page.locator('a.me').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/me$/);
  const group = page.locator('main').getByRole('group', { name: 'Language' });
  await expect(group).toBeVisible();
  await expect(group.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
  await expect(group.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('aria-pressed', 'false');
  await group.getByRole('button', { name: 'Deutsch' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  const gruppe = page.locator('main').getByRole('group', { name: 'Sprache' });
  await expect(gruppe.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('aria-pressed', 'true');
  await gruppe.getByRole('button', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

// v0.23.1 (Noah 3b): on the phone the places of Today started folded.
// v0.46.0 «Startseite neu»: the places are gone; nothing on Today folds. An empty app shows First
// steps and "What do you want to do?" with 8 buttons on a phone, 12 on a computer.
test('Today folds nothing; First steps and the buttons of What do you want to do?', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const T = tr('de');
  await expect(page.getByRole('region', { name: T('First steps') })).toBeVisible();
  await expect(page.locator('main details.folded')).toHaveCount(0);
  const grid = page.getByRole('region', { name: T('What do you want to do?') });
  await expect(grid.locator('.grid > *')).toHaveCount(info.project.name === 'phone' ? 8 : 12);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize().width);
});

// v0.23.1 (Noah): "Search" on the Gear card puts the cursor in Gear's search field, and "+" says
// it plans a trip. Empty database. v0.46.0: the Gear card left Today; #/gear?find=1 stays.
test('Gear card search and + plans a trip', async ({ page, context }) => {
  const T = tr('de');
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/gear?find=1');
  await expect(page.getByRole('searchbox', { name: T('Search gear') })).toBeFocused();
  await page.goto('./#/');
  await page.getByRole('button', { name: T('New'), exact: true }).first().click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  // v0.30.0 (Noah, finding 2): straight into the New trip window (empty data: no bike yet, so no list preview).
  const dlg = page.getByRole('dialog', { name: T('New trip') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('group', { name: T('When?') })).toBeVisible();
});
