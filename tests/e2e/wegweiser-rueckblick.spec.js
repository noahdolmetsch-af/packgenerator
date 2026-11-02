// «Wegweiser statt Katalog» PR 4 (Noah 01.11.2026 «3a», Inhalte «1-5a»): after «Done» on a debrief, «Debrief finished» shows «Next»
// with «For next time» and trip costs; the saved debrief ends with «Fits here». Fictional data (test_data_gtp_).
import { test, expect } from './clock.js';
import { openHome, homeFixture, tr, trip, entries, day } from './home0460-fixture.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// passthier.js needs Svelte (through features.js), so its list for «debrief» is read as text
const DEBRIEF = readFileSync(fileURLToPath(new URL('../../src/lib/passthier.js', import.meta.url)), 'utf8').match(/debrief: \[([^\]]*)\]/)[1].match(/'f\.[a-z]+'/g).map((s) => s.slice(1, -1));

const T = tr('de');
const tap = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const ID = 'test_data_gtp_Bodensee';

test('Rueckblick: after Done comes Next, the saved debrief ends with Fits here', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = homeFixture();
  const past = trip('Bodensee', day(-5), { days: 3, entries: entries(6, 6), packedAt: day(-6) });
  d.tables.trips = [past, ...d.tables.trips];
  d.tables.debriefs = [...d.tables.debriefs, { tripId: ID, status: 'draft', weather: 'planned', amount: 'right', bags: 'fine', note: '', items: { [past.entries[0].itemId]: 'unused' }, missing: [{ id: 'm1', name: 'test_data_gtp_ Ersatzschlauch', itemId: null }], applied: [] }];
  await openHome(page, context, info, { data: d });
  await page.goto(`./#/debrief/${ID}`);
  await tap(page.locator('.trip-band').getByRole('button', { name: T('Done|debrief') }), info);
  await expect(page).toHaveURL(new RegExp(`#/trip/${ID}/debriefed$`));
  const next = page.locator('[data-als-naechstes]');
  await expect(next.getByRole('heading', { name: T('Next') })).toBeVisible();
  await expect(next.locator('[data-row="naechstes"]')).toContainText(T('For next time'));
  await expect(next.locator('[data-row="costs"]')).toContainText(T('Trip costs'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await tap(next.locator('[data-row="costs"]'), info);
  await expect(page).toHaveURL(/#\/me\/tools\/costs/);
  await expect(page.locator('[data-tool-know="costs"]')).toContainText(T('Good to know'));

  await page.goto(`./#/debrief/${ID}`);
  const row = page.locator('[data-passt-hier="debrief"]');
  await expect(row).toContainText(T('Fits here'));
  await expect(row.locator('[data-passt-item]')).toHaveCount(DEBRIEF.length);
  await tap(row.locator('[data-passt-item="f.knowhow"]'), info);
  await expect(page).toHaveURL(/#\/me\/ruhig\/koennen/);
  expect(errors).toEqual([]);
});
