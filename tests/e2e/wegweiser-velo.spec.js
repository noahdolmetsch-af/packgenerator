// «Wegweiser statt Katalog» PR 3 (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»): on Velos › Setup the row «Fits here»
// with gear ratios and spirit level; on Gear the quick row has bar code and units. Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, tr } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// passthier.js needs Svelte (through features.js), so its list for «rig» is read as text
const RIG = readFileSync(fileURLToPath(new URL('../../src/lib/passthier.js', import.meta.url)), 'utf8').match(/rig: \[([^\]]*)\]/)[1].match(/'f\.[a-z]+'/g).length;

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Velos Setup: Fits here leads to gear ratios, which says what is good to know', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/bikes?tab=rig');
  const row = page.locator('[data-passt-hier="rig"]');
  await expect(row).toContainText(T('Fits here'));
  await expect(row.locator('[data-passt-item]')).toHaveCount(RIG);
  expect(await noScroll(page)).toBe(0);
  await tap(row.locator('[data-passt-item="f.gears"]'), info);
  await expect(page).toHaveURL(/#\/me\/tools\/gears/);
  await expect(page.locator('[data-tool-know="gears"]')).toContainText(T('Good to know'));
  expect(errors).toEqual([]);
});

test('Gear: the quick row opens bar code and units', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info);
  await page.goto('./#/gear');
  const quick = page.locator('[data-gear-quick]');
  await expect(quick.locator('[data-gear-quick-item="barcode"]')).toHaveText(T('Bar code → gear'));
  await expect(quick.locator('[data-gear-quick-item="units"]')).toHaveText(T('Convert units'));
  expect(await noScroll(page)).toBe(0);
  await tap(quick.locator('[data-gear-quick-item="units"]'), info);
  await expect(page).toHaveURL(/#\/me\/tools\/units/);
  expect(errors).toEqual([]);
});
