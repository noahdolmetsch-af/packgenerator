// Verpflegung (Noah 19.10.2026 «1a 2a 3a und b 4a 5a»): Touren › Verpflegung for the fictional trip «Event Jura
// 300» (135 km, 1100 m up, 8 h a day). Without shops the route is one section with a warning; the places along
// the route (the live map's search, Overpass mocked, fictional answer) add a shop and a water stop; your values change the grams; «Meine
// Produkte» shows bars and gels; a product can be added and deleted (own window, Undo). Nothing leaves the test.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const ID = 'test_data_gtp_trip26';
const ANSWER = {
  elements: [
    { type: 'node', id: 9101, lat: 47.26, lon: 7.59, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Brunnen Mitte' } },
    { type: 'node', id: 9102, lat: 47.288, lon: 7.632, tags: { shop: 'supermarket', name: 'test_data_gtp_ Dorfladen', opening_hours: 'Mo-Su 00:00-24:00' } },
  ],
};

test('Verpflegung: sections, water stops, own values, products', async ({ page, context }) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.route(/overpass/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANSWER) }));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.goto(`./#/trips/fuel?trip=${ID}`);
  await page.reload();
  const main = page.locator('main');
  await expect(main.getByRole('heading', { level: 1, name: T('Food and water|fuel') })).toBeVisible();

  // 1. no shop known: one section for the whole way, with the warning
  const res = main.locator('[data-fuel-result]');
  await expect(res.getByText(T('carbohydrates'), { exact: true })).toBeVisible();
  await expect(main.locator('[data-fuel-section]')).toHaveCount(1);
  await expect(main.locator('[data-warn="noshop"]')).toBeVisible();
  const grams = async () => Number((await res.locator('.sum b').nth(1).innerText()).replace(/\D/g, ''));
  expect(await grams()).toBeGreaterThan(300);
  // Paket X: what the ride uses, from the one energy rule
  await expect(res.locator('[data-fuel-kcal]')).toContainText(T('kcal used, about'));

  // 2. the places along the route (all kinds, the live map's search): a shop splits the route, a fountain refills
  await main.locator('[data-fuel-keep]').click();
  await expect(main.locator('[data-fuel-places]')).toBeVisible({ timeout: 60_000 });
  await expect(main.locator('[data-fuel-section]')).toHaveCount(2);
  await expect(main.locator('[data-fuel-section="1"]')).toContainText('test_data_gtp_ Dorfladen');
  await expect(main.locator('[data-fuel-section="1"]')).toContainText(T('Carry {c} to the first of {n} water stop on the way.', { c: 'X', n: 1 }).split('X')[0]);
  await expect(main.getByRole('link', { name: T('Show all kinds on the map') })).toHaveAttribute('href', `#/live/${ID}`);

  // 3. your values: 90 g per hour gives more grams
  const before = await grams();
  await main.getByText(T('Eat and drink'), { exact: true }).click();
  const carbs = main.locator('[data-fuel-val="carbsGh"]');
  await carbs.fill('90');
  await carbs.press('Enter');
  await expect.poll(grams).toBeGreaterThan(before);
  await main.getByRole('button', { name: T('Back to the standard values') }).click();
  await expect.poll(grams).toBe(before);

  // 4. as products
  await res.getByRole('button', { name: T('My products') }).click();
  await expect(res.locator('[data-fuel-pack]')).toContainText(T('Bar|fuel'));

  // 5. add and delete a product
  await main.locator('[data-fuel-new]').fill('test_data_ Reiskuchen');
  await main.locator('[data-fuel-new]').press('Enter');
  const list = main.locator('[data-fuel-products] li');
  await expect(list).toHaveCount(5);
  await expect(list.last().locator('input[type="text"]')).toHaveValue('test_data_ Reiskuchen');
  await list.last().getByRole('button', { name: T('Delete {name}', { name: 'test_data_ Reiskuchen' }) }).click();
  await page.getByRole('dialog').getByRole('button', { name: T('Delete') }).click();
  await expect(list).toHaveCount(4);

  // 6. the route card in Pack links here
  await page.evaluate((id) => localStorage.setItem('pack.currentTrip', id), ID);
  await page.goto('./#/pack');
  await expect(page.locator('[data-fuel-link]')).toHaveAttribute('href', `#/trips/fuel?trip=${ID}`);

  // no sideways scrolling
  await page.goto(`./#/trips/fuel?trip=${ID}`);
  await expect(main.locator('[data-fuel-section]')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
