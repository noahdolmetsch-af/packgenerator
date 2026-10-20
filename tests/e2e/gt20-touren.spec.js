// Gesamttest 20.10.2026 (Noah «3a 4a», all B/C findings) for Touren, Rennen and Reise-Spur, fictional data
// (home0460-fixture.js, test_data_gtp_), phone 390 and desktop:
// a) B3: Touren › Fahrten is its own tab (bar and sidebar), the old address #/trips still opens Übersicht;
// b) C9: the races are rows like the app's other lists (not underlined, the whole row a 44 px link, ›);
// c) C4: a very long trip name without spaces wraps on the Reise-Spur, the page never moves sideways.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';

const NAPF = 'test_data_gtp_Napf';
const LONG = `test_data_gtp_${'Sehrlangertournameohneleerzeichen'.repeat(3)}`;
// Test names stay ASCII (their output folder holds the imported file).
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const wideOnes = (page) =>
  page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > w + 1).slice(0, 8).map((e) => `${e.tagName}.${e.className}`);
  });

test('a) Trips: Rides is its own tab, the old address stays Overview', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/trips');
  await expect(page.getByRole('heading', { level: 1, name: T('Trips|place') })).toBeVisible();
  // the tabs of Touren (the bar on a phone, the sidebar on a computer) have «Fahrten»
  const tab = page.locator(`a[href="#/trips/rides"]`).filter({ hasText: T('Rides|tab') }).filter({ visible: true }).first();
  await expect(tab).toBeVisible();
  await tab.click();
  await expect(page).toHaveURL(/#\/trips\/rides$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Rides from Strava') })).toBeVisible();
  await expect(page.locator(`a[href="#/trips/rides"][aria-current="page"]`).filter({ visible: true }).first()).toBeVisible();
  await expect(page.locator('section[data-activities]')).toBeVisible();
  await expect(page.locator('section[data-planned], section[data-packmode]')).toHaveCount(0);
  expect(await sideways(page)).toBeLessThanOrEqual(0);
  // back to Übersicht: the tab bar leads there, the planned trips are back
  await page.locator(`a[href="#/trips"]`).filter({ hasText: T('Overview|tab') }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/#\/trips$/);
  await expect(page.locator('section[data-planned]')).toBeVisible();
  await expect(page.locator('section[data-activities]')).toHaveCount(0);
});

test('b) Races: rows with a chevron, not underlined links', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-sample-open]').click();
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  await page.goto('./#/race');
  const row = page.locator('a[data-race-row="race-sample"]');
  await expect(row).toBeVisible();
  await expect(row).toContainText(T('Sample race 1000'));
  const look = await row.evaluate((a) => {
    const s = getComputedStyle(a);
    const title = getComputedStyle(a.querySelector('.t'));
    return { deco: s.textDecorationLine, titleDeco: title.textDecorationLine, h: a.getBoundingClientRect().height, chev: !!a.querySelector('svg.chev') };
  });
  expect(look).toEqual({ deco: 'none', titleDeco: 'none', h: look.h, chev: true });
  expect(look.h).toBeGreaterThanOrEqual(44);
  // the whole row opens the race, also a tap on its right end
  const b = await row.boundingBox();
  await page.mouse.click(b.x + b.width - 12, b.y + b.height / 2);
  await expect(page).toHaveURL(/#\/race\/race-sample$/);
  expect(await sideways(page)).toBeLessThanOrEqual(0);
});

test('c) Travel track: a very long trip name wraps, no sideways scroll', async ({ page, context }, info) => {
  const d = homeFixture();
  const napf = d.tables.trips.find((x) => x.id === NAPF);
  napf.title = LONG;
  await openHome(page, context, info, { data: d });
  await page.goto(`./#/spur/${NAPF}`);
  await expect(page.getByRole('heading', { level: 1, name: LONG })).toBeVisible();
  expect(await sideways(page), (await wideOnes(page)).join(' | ')).toBeLessThanOrEqual(0);
  const h1 = await page.getByRole('heading', { level: 1, name: LONG }).boundingBox();
  expect(h1.x + h1.width).toBeLessThanOrEqual(page.viewportSize().width);
});
