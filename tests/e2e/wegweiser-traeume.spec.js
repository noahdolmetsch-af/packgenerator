// «Wegweiser statt Katalog» PR 6 (Noah 01.11.2026 «1a 2a 3a 4a 5a», plan «1-26»): «Fits here» on Dreams and on New ground
// leads to the free-time pages and the own discovery bingo. Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// passthier.js needs Svelte (through features.js), so its lists are read as text
const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/passthier.js', import.meta.url)), 'utf8');
const ids = (place) => SRC.match(new RegExp(`${place}: \\[([^\\]]*)\\]`))[1].match(/'f\.[a-z]+'/g).map((s) => s.slice(1, -1));

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const noSideways = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test('Dreams and New ground: the row Fits here leads to travel wishes and the first night', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: homeFixture() });

  await page.goto('./#/trips/dreams');
  const dreams = page.locator('[data-passt-hier="dreams"]');
  await expect(dreams).toContainText(T('Fits here'));
  await expect(dreams.locator('[data-passt-item]')).toHaveCount(ids('dreams').length);
  await expect(dreams.locator('[data-passt-item="f.freireise"]')).toHaveText(T('Travel wishes'));
  expect(await noSideways(page)).toBe(0);
  await tap(dreams.locator('[data-passt-item="f.freireise"]'), info);
  await expect(page).toHaveURL(/#\/me\/frei\/reise/);

  await page.goto('./#/neuland');
  const nl = page.locator('[data-passt-hier="neuland"]');
  await expect(nl).toContainText(T('Fits here'));
  await expect(nl.locator('[data-passt-item]')).toHaveCount(ids('neuland').length);
  expect(await noSideways(page)).toBe(0);
  await tap(nl.locator('[data-passt-item="f.freinacht"]'), info);
  await expect(page).toHaveURL(/#\/me\/frei\/nacht/);
  await info.attach('passt-hier-traeume', { body: await page.screenshot(), contentType: 'image/png' });
  expect(errors).toEqual([]);
});
