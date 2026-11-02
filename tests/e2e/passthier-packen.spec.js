// «Wegweiser statt Katalog» PR 5 «Packen, Planen, Teilen» (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»): on Pack the
// rows «Fits here» under the weight, under a route without GPX and on a ski tour, and the menu link to the share preview.
// Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// passthier.js needs Svelte (through features.js), so its lists are read as text
const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/passthier.js', import.meta.url)), 'utf8');
const count = (place) => SRC.match(new RegExp(`\\n  ${place}: \\[([^\\]]*)\\]`))[1].match(/'f\.[a-z]+'/g).length;

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Pack: Fits here under the weight and the route, the map tool says what is good to know', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = homeFixture();
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), 'test_data_gtp_Herbstrunde');
  await openHome(page, context, info, { data: d });
  await page.goto('./#/pack');
  const weight = page.locator('[data-passt-hier="weight"]');
  await expect(weight).toContainText(T('Fits here'));
  await expect(weight.locator('[data-passt-item]')).toHaveCount(count('weight'));
  const route = page.locator('[data-passt-hier="route"]');
  await expect(route.locator('[data-passt-item]')).toHaveCount(count('route'));
  await expect(page.locator('a[data-share-preview]')).toHaveAttribute('href', '#/me/ruhig/teilen?open=preview');
  expect(await noScroll(page)).toBe(0);
  await route.scrollIntoViewIfNeeded();
  await info.attach('passt-hier-packen', { body: await page.screenshot(), contentType: 'image/png' });
  await tap(route.locator('[data-passt-item="f.mapmeasure"]'), info);
  await expect(page).toHaveURL(/#\/me\/tools\/map/);
  await expect(page.locator('[data-tool-know="map"]')).toContainText(T('Good to know'));
  expect(errors).toEqual([]);
});

test('Pack of a ski tour: Fits here leads to the backpack check', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = homeFixture();
  const ski = trip('Piz-Beispiel', day(2), { domain: 'ski', bikeId: null, bike: null, setup: {}, packs: [{ key: 'pack', name: 'Backpack 30 L', volumeL: 30 }], entries: [] });
  d.tables.trips = [ski, ...d.tables.trips];
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), ski.id);
  await openHome(page, context, info, { data: d });
  await page.goto('./#/pack');
  const row = page.locator('[data-passt-hier="ski"]');
  await expect(row.locator('[data-passt-item]')).toHaveCount(count('ski'));
  expect(await noScroll(page)).toBe(0);
  await tap(row.locator('[data-passt-item="f.skicheck"]'), info);
  await expect(page).toHaveURL(/#\/ski\/check/);
  expect(errors).toEqual([]);
});
