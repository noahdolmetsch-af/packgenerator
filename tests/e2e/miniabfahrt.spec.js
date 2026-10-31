// Mini-Tools «Wann muss ich losfahren?» (Noah 28.10.2026, idea 10): a meeting point at 09:00, two people from
// different start places; the one further away leaves earlier; without a start place a person waits at the end;
// remove has Undo; a new meeting takes the people of the last. The place search (Open-Meteo) is mocked with
// fictional places. Fictional data only.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const phone = (info) => info.project.name === 'phone';
const tap = (loc, info) => (phone(info) ? loc.tap() : loc.click());
const noSideways = async (page, where = '') => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d, where).toBeLessThanOrEqual(1);
};
const PLACES = {
  treff: { name: 'test_data_gtp_ Treffstadt', latitude: 47.35, longitude: 7.9, admin1: 'Solothurn', country: 'Switzerland' },
  weit: { name: 'test_data_gtp_ Weitdorf', latitude: 47.55, longitude: 8.15, admin1: 'Zürich', country: 'Switzerland' },
  nah: { name: 'test_data_gtp_ Nahweiler', latitude: 47.37, longitude: 7.92, admin1: 'Solothurn', country: 'Switzerland' },
};
async function mockPlaces(context) {
  await context.route(/geocoding-api\.open-meteo\.com/, (route) => {
    const q = new URL(route.request().url()).searchParams.get('name').toLowerCase();
    const hit = Object.entries(PLACES).find(([k]) => q.includes(k));
    return route.fulfill({ json: { results: hit ? [hit[1]] : [] } });
  });
}
async function pickPlace(page, info, box, word) {
  await box.locator('[data-pp-q]').fill(word);
  await tap(box.locator('[data-pp-search]'), info);
  await tap(box.locator('[data-pp-found] button').first(), info);
  await expect(box.locator('[data-pp-name]')).toContainText(word === 'treff' ? 'Treffstadt' : word === 'weit' ? 'Weitdorf' : 'Nahweiler');
}
async function addPerson(page, info, name) {
  await page.locator('[data-ab-name]').fill(name);
  await tap(page.locator('[data-ab-add]'), info);
  await expect(page.locator(`[data-ab-person="${name}"]`)).toBeVisible();
}

test('When do I leave: the one further away leaves first, a missing start waits, remove has Undo', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await mockPlaces(context);
  await page.goto('./#/me/mini');
  await tap(page.locator('[data-mt-tool="abfahrt"]'), info);
  await expect(page.locator('[data-ab-empty]')).toBeVisible();
  await tap(page.locator('[data-ab-new]'), info);
  await expect(page.locator('[data-ab-meet]')).toBeVisible();
  await expect(page.locator('[data-ab-noplace]')).toBeVisible();

  await pickPlace(page, info, page.locator('[data-pp="meet"]'), 'treff');
  await page.locator('[data-ab-time]').fill('09:00');
  await page.locator('[data-ab-time]').dispatchEvent('change');

  await addPerson(page, info, 'test_data_gtp_ Nora');
  await addPerson(page, info, 'test_data_gtp_ Wim');
  await addPerson(page, info, 'test_data_gtp_ Olga');
  await pickPlace(page, info, page.locator('[data-pp="from-0"]'), 'nah');
  await pickPlace(page, info, page.locator('[data-pp="from-1"]'), 'weit');
  await tap(page.locator('[data-ab-person="test_data_gtp_ Wim"] [data-ab-speed="25"]'), info);
  await noSideways(page, 'meeting with people');

  const rows = page.locator('[data-ab-rows] li');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toHaveAttribute('data-ab-row', 'test_data_gtp_ Wim');
  await expect(rows.nth(1)).toHaveAttribute('data-ab-row', 'test_data_gtp_ Nora');
  await expect(rows.nth(2)).toHaveAttribute('data-ab-row', 'test_data_gtp_ Olga');
  await expect(rows.nth(2)).toContainText(T('Start place missing'));
  const wim = await rows.nth(0).locator('[data-ab-at]').textContent();
  const nora = await rows.nth(1).locator('[data-ab-at]').textContent();
  expect(wim < nora && nora < '09:00', `${wim} ${nora}`).toBe(true);
  await expect(page.locator('[data-ab-wa]')).toHaveAttribute('href', /test_data_gtp_%20Wim/);

  // Olga takes her home place
  await tap(page.locator('[data-pp="from-2"] [data-pp-home]'), info);
  await expect(page.locator('[data-ab-rows] li[data-ab-row="test_data_gtp_ Olga"] [data-ab-at]')).toHaveText(/^\d\d:\d\d$/);

  // remove Nora, then Undo
  await tap(page.locator('[data-ab-person="test_data_gtp_ Nora"] [data-ab-remove]'), info);
  await tap(page.getByRole('button', { name: T('Remove'), exact: true }), info);
  await expect(page.locator('[data-ab-person="test_data_gtp_ Nora"]')).toHaveCount(0);
  await tap(page.getByRole('button', { name: T('Undo') }).last(), info);
  await expect(page.locator('[data-ab-person="test_data_gtp_ Nora"]')).toBeVisible();

  // a new meeting takes the meeting point and the people
  await page.goto('./#/me/mini/abfahrt');
  await expect(page.locator('[data-ab-item]')).toHaveCount(1);
  await tap(page.locator('[data-ab-new]'), info);
  await expect(page.locator('[data-ab-rows] li')).toHaveCount(3);
  await page.goto('./#/me/mini/abfahrt');
  await page.reload();
  await expect(page.locator('[data-ab-item]')).toHaveCount(2);
});
