// «Brunnen und Velo-Werkstätten an der Strecke» (Noah 19.10.2026): on Plan, the route card searches
// OpenStreetMap only after a tap, lists the places by km with a link to openstreetmap.org, filters by
// kind, and keeps the list offline. Overpass is mocked (fictional answer); nothing leaves the test.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const ANSWER = {
  elements: [
    { type: 'node', id: 9001, lat: 47.2005, lon: 7.5005, tags: { amenity: 'drinking_water', name: 'test_data_gtp_ Dorfbrunnen' } },
    { type: 'way', id: 9002, center: { lat: 47.202, lon: 7.503 }, tags: { shop: 'bicycle', name: 'test_data_gtp_ Velo Werkstatt', opening_hours: 'Mo-Fr 08:00-18:00' } },
    { type: 'node', id: 9003, lat: 47.203, lon: 7.5045, tags: { amenity: 'bicycle_repair_station' } },
  ],
};

test('route card: search on tap, rows by km with OSM links, chips filter, the list stays offline', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  let asked = 0;
  let bodies = [];
  await page.route(/overpass/, (route) => {
    asked++;
    bodies.push(route.request().postData() ?? '');
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANSWER) });
  });
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_trip26'));
  await page.goto('./#/pack');
  await page.reload();
  await expect(page.locator('.calm-pack')).toBeVisible();

  const box = page.locator('section.rc [data-route-pois]');
  await expect(box.getByRole('heading', { name: T('Water and bike workshops on the way') })).toBeVisible();
  // nothing loads by itself
  expect(asked).toBe(0);
  await box.getByRole('button', { name: T('Search fountains and workshops') }).click();
  await expect(box.locator('.rp-list li')).toHaveCount(3);
  expect(asked).toBe(1);
  expect(decodeURIComponent(bodies[0].replace(/^data=/, ''))).toContain('around:250,');
  await expect(box.getByText(T('{n} places within {m} m of the route', { n: 3, m: 250 }))).toBeVisible();
  const first = box.locator('.rp-list a').first();
  await expect(first).toHaveText(new RegExp(`^\\s*km \\d+(\\.\\d)? · ${T('Fountain|poi')} · test_data_gtp_ Dorfbrunnen\\s*$`));
  await expect(first).toHaveAttribute('href', 'https://www.openstreetmap.org/node/9001');
  await expect(first).toHaveAttribute('target', '_blank');
  await expect(first).toHaveAttribute('rel', /noopener/);
  await expect(box.getByText('Mo-Fr 08:00-18:00')).toBeVisible();
  await expect(box.getByText(T('Data: OpenStreetMap, as of {when}. Opening hours and water can change; check on the spot.', { when: 'X' }).split('X')[0])).toBeVisible();

  // chips: only workshops
  const chips = box.getByRole('group', { name: T('Kinds of places|poi') });
  await chips.getByRole('button', { name: new RegExp(`^${T('Water|poi')}`) }).click();
  await chips.getByRole('button', { name: new RegExp(`^${T('Pump|poi')}`) }).click();
  await expect(box.locator('.rp-list li')).toHaveCount(1);
  await expect(box.locator('.rp-list a')).toHaveAttribute('href', 'https://www.openstreetmap.org/way/9002');
  for (const a of await box.locator('.rp-list a, button').all()) expect((await a.boundingBox()).height).toBeGreaterThanOrEqual(40);
  expect(await wide(page)).toBeLessThanOrEqual(0);

  // after a reload the list is there without asking again
  await page.reload();
  await expect(page.locator('.calm-pack')).toBeVisible();
  await expect(page.locator('section.rc [data-route-pois] .rp-list li')).toHaveCount(3);
  expect(asked).toBe(1);
  expect(errors).toEqual([]);
});

test('route card: the map service fails, a plain message and a retry', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  let ok = false;
  await page.route(/overpass/, (route) => (ok ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANSWER) }) : route.fulfill({ status: 504, body: 'busy' })));
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'test_data_gtp_trip26'));
  await page.goto('./#/pack');
  await page.reload();
  const box = page.locator('section.rc [data-route-pois]');
  await box.getByRole('button', { name: T('Search fountains and workshops') }).click();
  await expect(box.getByRole('alert')).toHaveText(T('The map service did not answer right now. It is often busy; try again in a minute.'));
  ok = true;
  await box.getByRole('button', { name: T('Search fountains and workshops') }).click();
  await expect(box.locator('.rp-list li')).toHaveCount(3);
  await expect(box.getByRole('alert')).toHaveCount(0);
});
