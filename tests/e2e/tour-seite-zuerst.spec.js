// «Tour-Seite: Hauptsache zuerst» (Noah 24.11.2026 «1-5a», impeccable ganze App): the packing list comes right after the head.
// One row of chips (tasks, route, weather) and «Alle n ›» (a window with every jump mark), one line for the weather and the onion,
// the cards «Wie anstrengend wird es?», power and the tip stand under the list; on a phone the conditions, the weight and the bike
// with its bags follow the list (the weight before the route). Fictional data (Gesamttest fixture), German UI.
// TOUR_SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { settle } from './settle.js';
import { mkdirSync } from 'node:fs';
import { fixture, prepare, importBackup, view, tr, sideways } from './gesamttest/lib.js';

const T = tr('de');
const { summary } = fixture();
const TRIP = summary.tripIds;
const phone = (info) => info.project.name === 'phone';
const SHOTS = process.env.TOUR_SHOTS;
const tap = async (loc, info) => {
  await loc.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  return phone(info) ? loc.tap() : loc.click();
};

let state = null;
test.beforeAll(async ({ browser }, info) => {
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: info.project.use.viewport, timezoneId: 'Europe/Zurich', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await prepare(page, ctx, 'de');
  await page.goto('./');
  await importBackup(page, info, fixture().data, { lang: 'de' });
  await page.waitForTimeout(1500);
  state = info.outputPath('state.json');
  await ctx.storageState({ path: state, indexedDB: true });
  await ctx.close();
});

async function open(browser, info, trip, hash = '#/pack') {
  const ctx = await browser.newContext({ baseURL: info.project.use.baseURL, storageState: state, viewport: info.project.use.viewport, isMobile: phone(info), hasTouch: phone(info), timezoneId: 'Europe/Zurich', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errors = await prepare(page, ctx, 'de');
  await page.goto('./');
  await settle(page);
  await page.evaluate((t) => localStorage.setItem('pack.currentTrip', t), trip);
  await view(page, hash);
  return { ctx, page, errors };
}
const top = async (loc) => Math.round(await loc.evaluate((el) => el.getBoundingClientRect().top + window.scrollY));

test('Tour-Seite: the packing list stands before the conditions, the guess and the tip; the chips are one row with All n', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, TRIP.tent);
  const main = page.locator('main');
  const list = main.locator('.list-head');
  await expect(list).toBeVisible();
  const listY = await top(list);
  // the list stands high: a Wächter, not a length rule (the card «Gehört zu» above the title is still open; the aim is 700 px once it is a closed line)
  expect(listY, 'Packliste vor 1200 px').toBeLessThan(phone(info) ? 1200 : 900);
  // before the list: the head, the core line with its chips, the line for the weather, «Ready to go?»; no band «Alles bleibt änderbar»
  await expect(main.locator('.trip-band .stn')).toHaveCount(0);
  expect(await top(main.locator('[data-core-line]'))).toBeLessThan(listY);
  expect(await top(main.locator('details.ampel'))).toBeLessThan(listY);
  // after the list: the conditions (on a phone), the guess for the effort, power, the tip
  expect(await top(main.locator('[data-expect]'))).toBeGreaterThan(listY);
  if (phone(info)) expect(await top(main.locator('.cond'))).toBeGreaterThan(listY);
  // the row «On this page» of the help card is gone; one row of chips and «Alle n» stand in its place
  await expect(main.locator('[data-onpage="pack"]')).toHaveCount(0);
  const nav = main.locator('[data-core-line]').getByRole('navigation', { name: T('Jump to') });
  expect(await nav.locator('button').count()).toBeLessThanOrEqual(4);
  await expect(nav.locator('[data-jump-all]')).toContainText(/Alle \d+/);
  expect((await sideways(page)).wide).toEqual([]);
  if (SHOTS) {
    mkdirSync(SHOTS, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${SHOTS}/tour-oben-${info.project.name}.png` });
    // the core line with the chips, the line for the weather, «Ready to go?» and the start of the list
    await main.locator('[data-core-line]').evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70));
    await page.screenshot({ path: `${SHOTS}/tour-liste-${info.project.name}.png` });
  }

  // «Alle n ›» lists every jump mark in a window; a tap goes there
  await tap(nav.locator('[data-jump-all]'), info);
  const sheet = page.locator('[data-jump-sheet]');
  await expect(sheet).toBeVisible();
  expect(await sheet.locator('[data-jump-all-to]').count()).toBeGreaterThan(4);
  await expect(sheet.locator('[data-jump-all-to="list"]')).toBeVisible();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/tour-alle-${info.project.name}.png` });
  await tap(sheet.locator('[data-jump-all-to="weather"]'), info);
  await expect(sheet).toHaveCount(0);
  await expect(page.locator(':focus')).toBeInViewport();
  expect(errors).toEqual([]);
  await ctx.close();
});

test('Tour-Seite: the line for weather and onion goes to the conditions; the weight comes before the route', async ({ browser }, info) => {
  const { ctx, page, errors } = await open(browser, info, TRIP.tent);
  const main = page.locator('main');
  const line = main.locator('[data-weather-line]');
  await expect(line).toBeVisible();
  await expect(line).toContainText(/°C/);
  await tap(line, info);
  await expect(page.locator(':focus')).toBeInViewport();
  if (phone(info)) {
    // below the list the weight and the bike with its bags come before the route
    const wc = await top(main.locator('section.wc').first());
    const rc = await top(main.locator('section.rc').first());
    const tb = await top(main.locator('section.tbike').first());
    expect(wc).toBeLessThan(tb);
    expect(tb).toBeLessThan(rc);
    if (SHOTS) {
      await main.locator('section.wc').first().evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 70));
      await page.screenshot({ path: `${SHOTS}/tour-unten-${info.project.name}.png` });
    }
  }
  expect(errors).toEqual([]);
  await ctx.close();
});
