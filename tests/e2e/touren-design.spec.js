// v0.102.0 Design-Refresh P4 «Touren» (T1–T5, T24, approved 12.10.2026): the Touren overview, the
// «Neue Tour» window with its gallery, Vorlagen, and Plan with Strecke, Velo und Taschen, Gewicht,
// Etappen («Einteilen» with Undo) and, for an event, «Bis zum Start». Fictional fixture (test_data_gtp_),
// German, phone + desktop, no horizontal scroll.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

async function start(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  // a fixed day before the fixture's trips (14. and 19. October), so «in n Tagen» does not drift
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, FIX);
}

/** Opens Plan of one trip of the fixture. */
async function plan(page, id) {
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), id);
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('.calm-pack')).toBeVisible();
}

test('Touren: title with the count line, Weitermachen band, tiles, Wetter-Fenster and Bestwerte', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/trips');
  await expect(page.getByRole('heading', { level: 1, name: T('Trips|place') })).toBeVisible();
  await expect(page.locator('h1').first()).toHaveCount(1);
  // v0.126.0 TZ-1: the count line by the three trip states (tests/e2e/tz1.spec.js checks the numbers)
  await expect(page.getByText(new RegExp(esc(T('{n} planned', { n: 'X' })).replace('X', '\\d+'))).first()).toBeVisible();
  // SN4g «Touren-Seite, Runde 2»: the band «Packmodus» names the trip being packed and goes on with one main button
  const band = page.locator('[data-pack-band]');
  await expect(band.getByRole('link', { name: new RegExp(esc(T('Open pack mode'))) })).toBeVisible();
  // «Geplant» as cards with «Neue Tour»; Bestwerte now in «In Zahlen», the weather in the tile «Gute Tage für eine Tour»
  const planning = page.locator('section[data-planned]').filter({ has: page.locator('#trips-plan') });
  await expect(planning.locator('li.pc').first()).toBeVisible();
  await expect(planning.getByRole('button', { name: new RegExp(esc(T('New trip'))) }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Good days for a trip') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Best values'), exact: true })).toBeVisible();
  // only the band has the main colour
  await expect(page.locator('main .btn.hi')).toHaveCount(await band.locator('.btn.hi').count());
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (info.project.name === 'phone') {
    // a small phone: nothing may make the page wider than the screen (a phone would zoom out, found
    // in v0461 test 7: the band's content once asked for 340 px)
    await page.setViewportSize({ width: 320, height: 760 });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(320);
    expect(await wide(page)).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});

// v0.114.0 «Rahmenbedingungen» (B1, B2): the title without the hint line, «Sportart» as chips, «Vorlage wählen»
// folded with the starts as buttons (the gallery «Packliste startet mit» is gone, with its «Letzte Tour»).
test('Rahmenbedingungen: sport as chips, «Vorlage wählen» with the starts as buttons', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/trips');
  await page.locator('section[data-planned] [data-plan-new]').click(); // SN4g: «Neue Tour» in the head of «Geplant»
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText(T('Name, date, bike and packing list. Everything can be changed later.'))).toHaveCount(0);
  await expect(dlg.getByRole('group', { name: T('Sport') })).toBeVisible();
  await expect(dlg.getByRole('group', { name: T('Packing list starts with') })).toHaveCount(0);
  await dlg.getByRole('button', { name: new RegExp(esc(T('Choose a template'))) }).click();
  const cards = dlg.getByRole('group', { name: T('Your templates') }).getByRole('button');
  await expect(cards.first()).toHaveAttribute('aria-pressed', 'true');
  const ex = dlg.getByRole('group', { name: T('Examples') }).getByRole('button');
  expect(await ex.count()).toBe(2);
  await ex.first().click();
  await expect(ex.first()).toHaveAttribute('aria-pressed', 'true');
  await expect(cards.first()).toHaveAttribute('aria-pressed', 'false');
  expect(await wide(page)).toBeLessThanOrEqual(0);
});

test('Vorlagen: «Neue Vorlage», area chips, every template with «Neue Tour», the current trip on the side', async ({ page, context }) => {
  await start(page, context);
  await page.goto('./#/pack/templates');
  await expect(page.getByRole('heading', { level: 1, name: T('Templates') })).toBeVisible();
  await expect(page.getByRole('link', { name: T('New template') })).toBeVisible();
  await expect(page.getByRole('group', { name: T('Area') })).toBeVisible();
  const rows = page.locator('li.row[data-tpl]:not(.arch)');
  expect(await rows.count()).toBeGreaterThan(0);
  await expect(rows.first().getByRole('button', { name: new RegExp(esc(T('New trip'))) }).or(rows.first().getByRole('link', { name: new RegExp(esc(T('New trip'))) }))).toBeVisible();
  await expect(page.getByRole('heading', { name: T('From your trips') })).toBeVisible(); // SN3 «Seiten neu»: was «From the current trip»
  expect(await wide(page)).toBeLessThanOrEqual(0);
});

test('Tour planen: Strecke, Velo und Taschen, Gewicht, Etappen; «Einteilen» names the places, with Undo', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await plan(page, 'test_data_gtp_trip27');
  for (const h of ['Route|map', 'Bike and bags', 'Weight', 'Stages|trip']) await expect(page.getByRole('heading', { level: 2, name: T(h), exact: true })).toBeVisible();
  // no route yet: the card says how to get one, the file stays on the device
  await expect(page.getByText(T('No route yet'))).toBeVisible();
  await expect(page.getByText(T('all together, with food and water'))).toBeVisible(); // v0.137.0 DK3: one weight, food included
  const stages = page.locator('section.sc');
  await expect(stages.locator('li')).toHaveCount(3);

  await stages.getByRole('button', { name: new RegExp(esc(T('Divide|stages'))) }).click();
  const sheet = page.getByRole('dialog', { name: T('Divide into stages') });
  await expect(sheet).toBeVisible();
  await sheet.getByLabel(T('Start')).fill('test_data_gtp_ Ort A');
  await sheet.getByLabel(T('Day {n} ends in', { n: 1 })).fill('test_data_gtp_ Ort B');
  await sheet.getByLabel(T('Day {n} ends in', { n: 3 })).fill('test_data_gtp_ Ort D');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(sheet).toBeHidden();
  await expect(stages.locator('li').first()).toContainText('test_data_gtp_ Ort A → test_data_gtp_ Ort B');
  await expect(stages.locator('li').nth(2)).toContainText('test_data_gtp_ Ort D');
  await expect(stages).toContainText(T('your own stages'));
  // as every change of the trip: Undo brings the even days back
  await page.getByRole('button', { name: T('Undo'), exact: true }).first().click();
  await expect(stages.locator('li').first()).not.toContainText('test_data_gtp_ Ort B');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Event: «Bis zum Start», the route with map and height profile, own km per stage and back to even', async ({ page, context }) => {
  await start(page, context);
  await plan(page, 'test_data_gtp_trip26');
  const until = page.locator('section.es');
  await expect(until.getByRole('heading', { name: T('Until the start') })).toBeVisible();
  await expect(until.locator('.boxes li').first()).toContainText('7');
  const route = page.locator('section.rc');
  await expect(route).toContainText('135 km');
  await expect(route.getByRole('img', { name: new RegExp(esc(T('Map of {name}', { name: 'X' })).replace('X', '.*')) })).toBeVisible();
  // offline (the test blocks the outside world): no map tiles, so no attribution either
  await expect(route.getByText('© OpenStreetMap')).toHaveCount(0);
  const stages = page.locator('section.sc');
  await expect(stages.locator('li')).toHaveCount(2);
  await expect(stages.locator('li').first()).toContainText('68');
  await stages.getByRole('button', { name: new RegExp(esc(T('Divide|stages'))) }).click();
  const sheet = page.getByRole('dialog', { name: T('Divide into stages') });
  await sheet.getByLabel(T('Day {n} ends at km', { n: 1 })).fill('50');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(stages.locator('li').first()).toContainText('50 km');
  await expect(stages.locator('li').nth(1)).toContainText('85 km');
  await stages.getByRole('button', { name: new RegExp(esc(T('Divide|stages'))) }).click();
  await page.getByRole('dialog', { name: T('Divide into stages') }).getByRole('button', { name: T('Even out') }).click();
  await expect(stages.locator('li').first()).toContainText('68 km');
  expect(await wide(page)).toBeLessThanOrEqual(0);
});
