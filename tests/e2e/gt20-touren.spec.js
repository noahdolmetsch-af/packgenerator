// Gesamttest 20.10.2026 (Noah «3a 4a», all B/C findings) for Touren, Rennen and Reise-Spur, fictional data
// (home0460-fixture.js, test_data_gtp_), phone 390 and desktop:
// a) B3: Touren › Fahrten is its own tab (bar and sidebar), the old address #/trips still opens Übersicht;
// b) C9: the races are rows like the app's other lists (not underlined, the whole row a 44 px link, ›);
// c) C4: a very long trip name without spaces wraps on the Reise-Spur, the page never moves sideways.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture } from './home0460-fixture.js';
import { toAnalysis, tapTab } from './placetab.js';

const NAPF = 'test_data_gtp_Napf';
const LONG = `test_data_gtp_${'Sehrlangertournameohneleerzeichen'.repeat(3)}`;
// Test names stay ASCII (their output folder holds the imported file).
const sideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const wideOnes = (page) =>
  page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    return [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > w + 1).slice(0, 8).map((e) => `${e.tagName}.${e.className}`);
  });

test('a) Rides is its own tab, under Auswerten since N1; Touren keeps the trips', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/trips');
  await expect(page.getByRole('heading', { level: 1, name: T('Trips|place') })).toBeVisible();
  await expect(page.locator('section[data-planned]')).toBeVisible();
  await expect(page.locator('section[data-activities]')).toHaveCount(0);
  // N1 «Neue Leiste» (Noah 20.10.2026 «2a»): the tabs of Touren no longer have «Fahrten»
  await expect(page.locator(`nav.ptabs a[href="#/trips/rides"], .side .tabs a[href="#/trips/rides"]`).filter({ visible: true })).toHaveCount(0);
  // Auswerten (it shares Aktiv's place) has the tab «Fahrten», same address as before
  await page.locator('nav.bottom a[data-place="active"], .side li[data-place="active"] > a.pa').filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/#\/flow/);
  // «Aktiv neu» (Noah 22.10.2026): Auswerten shares Aktiv's place; the switch (phone) or its row (computer) leads there
  await toAnalysis(page);
  await tapTab(page, T('Rides|tab'));
  await expect(page).toHaveURL(/#\/trips\/rides$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Rides from Strava') })).toBeVisible();
  await expect(page.locator(`a[href="#/trips/rides"][aria-current="page"]`).filter({ visible: true }).first()).toBeVisible();
  await expect(page.locator('nav.bottom a[data-place="active"][aria-current="page"], .side li[data-place="active"].on').filter({ visible: true }).first()).toBeVisible();
  await expect(page.locator('section[data-activities]')).toBeVisible();
  await expect(page.locator('section[data-planned], section[data-packmode]')).toHaveCount(0);
  expect(await sideways(page)).toBeLessThanOrEqual(0);
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
