// «Wegweiser statt Katalog» PR 7 (Noah 01.11.2026 «1a 2a 3a 4a 5a», plan «1-26»): «Fits here» on Insights, Your questions and
// My sports leads to the quiet helpers for body values and sports. Fictional data (test_data_gtp_), observation only.
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

test('Insights, questions and sports: the row Fits here leads to counter-examples, scales and the tennis page', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: homeFixture() });

  await page.goto('./#/me/insights');
  const ins = page.locator('[data-passt-hier="insights"]');
  await expect(ins).toContainText(T('Fits here'));
  await expect(ins.locator('[data-passt-item]')).toHaveCount(ids('insights').length);
  expect(await noSideways(page)).toBe(0);
  await tap(ins.locator('[data-passt-item="f.counterdays"]'), info);
  await expect(page).toHaveURL(/#\/me\/ruhig\/herkunft/);

  await page.goto('./#/me/abfragen');
  const ab = page.locator('[data-passt-hier="abfragen"]');
  await expect(ab.locator('[data-passt-item]')).toHaveCount(ids('abfragen').length);
  await expect(ab.locator('[data-passt-item="f.scalemeaning"]')).toHaveText(T('What a scale meant'));
  expect(await noSideways(page)).toBe(0);
  await tap(ab.locator('[data-passt-item="f.scalemeaning"]'), info);
  await expect(page).toHaveURL(/#\/me\/ruhig\/zahlen/);

  await page.goto('./#/flow/sports');
  const sp = page.locator('[data-passt-hier="sports"]');
  await expect(sp.locator('[data-passt-item]')).toHaveCount(ids('sports').length);
  expect(await noSideways(page)).toBe(0);
  await tap(sp.locator('[data-passt-item="f.tennistop"]'), info);
  await expect(page).toHaveURL(/#\/flow\/sport\/act%3Atennis/);
  await info.attach('passt-hier-koerper', { body: await page.screenshot(), contentType: 'image/png' });
  expect(errors).toEqual([]);
});
