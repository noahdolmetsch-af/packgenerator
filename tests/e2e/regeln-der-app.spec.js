// Regeln der App (Noah 14.10.2026): one rule per page, not single cases.
// A a: nothing jumps on its own (a day trip without a bike stays on Pack, with a link to Today).
// C b: a tap opens to edit (an item on the phone too; the bike pencil: see feinschliff.spec.js).
// 1b: a tab that comes back after a pause starts at the start place; back closes every window first.
import { test, expect } from '@playwright/test';
import { openHome, homeFixture, trip, entries, day } from './home0460-fixture.js';
import { AWAY_MS, SEEN_KEY } from '../../src/lib/bedienung.js';

const noErrors = (page) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
};

test('A a: finishing packing a day trip without a bike stays on Pack, with a link to Today', async ({ page, context }, info) => {
  const errors = noErrors(page);
  const d = homeFixture();
  const hike = trip('Wanderung', day(0), { domain: 'hiking', bikeId: null, bike: null, setup: {}, packs: [{ key: 'pack', name: 'test_data_gtp_ Rucksack', volumeL: 20 }], entries: entries(4, 4).map((e) => ({ ...e, slot: 'pack' })) });
  d.tables.trips = [hike, ...d.tables.trips.filter((x) => !/Herbstrunde|TEST/.test(x.id))];
  const T = await openHome(page, context, info, { data: d, hour: 7 });
  await page.evaluate((id) => localStorage.setItem('trip.current', id), hike.id);
  await page.goto('./#/pack?day'); // the Pack tab
  await page.getByRole('button', { name: T('Finish packing') }).first().click();
  const note = page.locator('.packed-toast');
  await expect(note).toContainText(T('All packed. Have a good trip!'));
  await expect(page).toHaveURL(/#\/pack/);
  await note.getByRole('link', { name: T('To Today') }).click();
  await expect(page).toHaveURL(/#\/$/);
  expect(errors).toEqual([]);
});

test('C b: on the phone a tap on an item opens it to edit', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the computer could edit already');
  const errors = noErrors(page);
  const T = await openHome(page, context, info);
  await page.goto('./#/gear?q=Bike%20computer');
  await page.getByText('Bike computer').first().click();
  const dlg = page.locator('dialog[aria-labelledby="item-h"]');
  await expect(dlg).toBeVisible();
  await dlg.getByText(T('For weather and riding time')).first().click();
  await expect(dlg.getByLabel(T('From this ride on'))).toBeVisible();
  await expect(dlg.getByRole('button', { name: T('Save') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('1b: a tab that comes back after a pause opens Today; a reload stays', async ({ page }) => {
  // no fixed clock here: it replaces the browser's performance entries, which tell a reload
  const errors = noErrors(page);
  await page.goto('./#/gear');
  await expect(page).toHaveURL(/#\/gear/);
  // right after using the app a new address stays
  await page.goto('about:blank');
  await page.goto('./#/bikes');
  await expect(page).toHaveURL(/#\/bikes/);
  // the tab wakes up later: the last use is longer ago than the pause
  await page.goto('about:blank');
  await page.addInitScript(([k, ms]) => localStorage.setItem(k, String(Date.now() - ms)), [SEEN_KEY, AWAY_MS + 60_000]);
  await page.goto('./#/bikes');
  await expect(page).toHaveURL(/#\/$/);
  // a reload (F5) stays, even after the pause
  await page.evaluate(() => (location.hash = '#/bikes'));
  await page.reload();
  await expect(page).toHaveURL(/#\/bikes/);
  expect(errors).toEqual([]);
});

test('back closes a window first: the filter sheet in Material', async ({ page, context }, info) => {
  const errors = noErrors(page);
  const T = await openHome(page, context, info);
  await page.goto('./#/gear');
  await page.locator('button.fbtn').first().click();
  const sheet = page.locator('dialog[aria-labelledby="fs-h"]');
  await expect(sheet).toBeVisible();
  await page.goBack();
  await expect(sheet).toBeHidden();
  await expect(page).toHaveURL(/#\/gear/);
  await expect(page.getByRole('heading', { name: T('Sort and filter') })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the old link to the 12 months lands at the period part of the look back', async ({ page, context }, info) => {
  const errors = noErrors(page);
  await openHome(page, context, info);
  await page.goto('./#/review');
  await expect(page).toHaveURL(/#\/debrief/);
  await expect(page.locator('#per-h')).toBeInViewport();
  expect(errors).toEqual([]);
});
