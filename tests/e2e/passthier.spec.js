// «Wegweiser statt Katalog» PR 2 (Noah 01.11.2026 «1a 2a 3a 4a 5a», Inhalte «1-5a»): on Unterwegs the row «Fits here» with
// the small tools of the Toolbox; a tap opens the tool, which shows «Good to know». Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, day } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// passthier.js needs Svelte (through features.js), so its list for «ride» is read as text
const RIDE = readFileSync(fileURLToPath(new URL('../../src/lib/passthier.js', import.meta.url)), 'utf8').match(/ride: \[([^\]]*)\]/)[1].match(/'f\.[a-z]+'/g).length;

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const JURA = 'test_data_gtp_Jura-Wochenende';

test('Unterwegs: the row Fits here leads to the tools, the tool says what is good to know', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = homeFixture();
  const line = Array.from({ length: 30 }, (_, i) => [47.36 + i * 0.002, 7.15 + i * 0.004]);
  const route = { name: 'test_data_gtp_ Schlaufe', km: 62, gainM: 900, lossM: 900, start: { lat: 47.36, lon: 7.15 }, end: { lat: 47.418, lon: 7.266 }, line };
  d.tables.trips = [trip('Jura-Wochenende', day(-1), { days: 3, route }), ...d.tables.trips.filter((x) => !/TEST-Runde/.test(x.title))];
  await context.addInitScript((id) => localStorage.setItem('pack.currentTrip', id), JURA);
  await openHome(page, context, info, { data: d });
  await page.goto('./#/ride');
  const row = page.locator('[data-passt-hier="ride"]');
  await expect(row).toContainText(T('Fits here'));
  await expect(row.locator('[data-passt-item]')).toHaveCount(RIDE);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await tap(row.locator('[data-passt-item="f.phrases"]'), info);
  await expect(page).toHaveURL(/#\/me\/tools\/phrases/);
  await expect(page.locator('[data-tool-know="phrases"]')).toContainText(T('Good to know'));
  await info.attach('passt-hier', { body: await page.screenshot(), contentType: 'image/png' });
  expect(errors).toEqual([]);
});
