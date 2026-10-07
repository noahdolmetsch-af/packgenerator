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
      // the same four places, in the same order, on every page
      await expect(nav.locator('a'), hash).toHaveText([T('Today|place'), T('Trips|place'), T('Gear|place'), T('Bikes|place')]);
      if (place) await expect(nav.locator('a[aria-current="page"]'), hash).toHaveText(T(place));
      else await expect(nav.locator('a[aria-current="page"]'), hash).toHaveCount(0);
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
function fixture(path, soonDate) {
  const data = structuredClone(base);
  const entries = data.tables.items.slice(3, 7).map((i) => ({ itemId: i.id, slot: 'body', qty: 1, packed: false }));
  const trip = (id, startDate) => ({ id: `test_data_gtp_${id}`, domain: 'bikepacking', title: `test_data_gtp_ ${id}`, startDate, days: 1, bikeId: 'bike-test', setup: {}, entries, ready: [], status: 'planned' });
  data.tables.trips = [trip('later', '2026-10-20'), trip('sooner', soonDate)];
  writeFileSync(path, JSON.stringify(data));
}

for (const [soon, step] of [['2026-10-08', 'Start packing'], ['2026-10-14', 'Continue planning']]) {
  test(`Today opens the trip it shows: ${step}`, async ({ page, context }, info) => {
    const T = tr('en');
    const file = info.outputPath('nav-fixture.json');
    fixture(file, soon);
    await page.clock.setFixedTime(new Date('2026-10-07T10:00:00Z'));
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    page.on('dialog', (d) => d.accept());
    await page.goto('./');
    const data = page.locator('details.data');
    if (!(await data.evaluate((d) => d.open))) await data.locator('summary').click();
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
    await band.getByRole('link', { name: T(step), exact: true }).click();
    if (step === 'Start packing') await expect(page.getByRole('dialog', { name: T('Packing day: {title}', { title: 'test_data_gtp_ sooner' }) })).toBeVisible();
    else await expect(page.locator('.tour-context h2')).toHaveText('test_data_gtp_ sooner');
    await expect(page.locator('nav[aria-label] a[aria-current="page"]').filter({ visible: true })).toHaveText(T('Trips|place'));
    expect(await page.evaluate(() => localStorage.getItem('pack.currentTrip'))).toBe('test_data_gtp_sooner');
  });
}
