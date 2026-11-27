// «Heute entdecken» (Noah 23.11.2026 «1a 2b 3a 4a 5a»): one idea with its «Warum» in a row under the chips on Today (it was the card «Discover»
// under «More»), «Later» (the ×) with Undo, «More ideas» with three, the switch that takes the row away. German, phone and computer, fictional data.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Heute entdecken: one idea with its reason on the first screen, Later with Undo, More ideas, the switch', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 9 });
  const row = page.locator('[data-ideas-row]');
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toContainText(T('Discover today'));
  await expect(row.locator('[data-idea-why]')).not.toBeEmpty();
  // the card «Discover» is not under «More» any more
  await expect(page.locator('[data-section="discover"]')).toHaveCount(0);
  // «Favoriten» (Noah 27.11.2026 «1-5a», changed on purpose): the favourites stand first on Today and push everything down on a phone (Noah «a»: big cards,
  // Abhaken slides down), so the row starts within the first two screens; it still stands right under the chips and the favourites
  const box = await row.boundingBox();
  expect(box.y).toBeLessThan(2 * page.viewportSize().height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/heute-entdecken-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  const first = await row.getAttribute('data-idea');
  await row.locator('[data-idea-later]').click();
  await expect(row).not.toHaveAttribute('data-idea', first);
  // Undo brings the idea back
  await page.locator('.rtoast').getByRole('button', { name: T('Undo') }).click();
  await expect(row).toHaveAttribute('data-idea', first);

  await page.locator('[data-ideas-more]').click();
  const sheet = page.locator('[data-ideas-sheet]');
  await expect(sheet).toBeVisible();
  expect(await sheet.locator('[data-idea-item]').count()).toBeLessThanOrEqual(3);
  await expect(sheet.locator('[data-ideas-map]')).toContainText(T('See the map of the app'));
  await sheet.locator('[data-ideas-switch]').uncheck();
  await sheet.getByRole('button', { name: T('Done|customise') }).click();
  await expect(page.locator('[data-ideas-row]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

// «Heute entdecken» 3a/4a (Noah 23.11.2026 «3a 4a 5a»): back from a tour whose debrief is open, the row asks for the debrief;
// what the app learned from your debriefs is one of the ideas in «More ideas». German, phone and computer, fictional data.
test('Heute entdecken: the debrief of the tour you came back from, and what the app learned', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const d = homeFixture();
  // the tour of 3 days ago has no debrief yet; one learning of the last days
  d.tables.debriefs = d.tables.debriefs.filter((x) => x.tripId !== 'test_data_gtp_Napf');
  d.tables.trips = d.tables.trips.map((x) => (x.id === 'test_data_gtp_Napf' ? { ...x, status: 'planned' } : x));
  d.tables.learnings = [{ id: 'test_data_gtp_l1', rule: 'test_data_gtp_ Regenjacke nach oben packen', action: '', topic: 'clothing', priority: 'medium', itemIds: [], source: 'test_data_gtp_', appliesTo: ['all'], confirmed: 0, tripId: 'test_data_gtp_Napf', createdAt: `${day(-2)}T08:00:00.000Z` }];
  const T = await openHome(page, context, info, { data: d, hour: 13 });
  const row = page.locator('[data-ideas-row]');
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row).toContainText(T('Debrief of your last tour'));
  await expect(row).toContainText('test_data_gtp_ Napf');
  await expect(row.locator('[data-idea-why]')).toContainText(T('You are back from this tour. A short debrief teaches the app what to pack next time.'));
  await page.locator('[data-ideas-more]').click();
  const sheet = page.locator('[data-ideas-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText(T('New learned from your debriefs'));
  await expect(sheet).toContainText('test_data_gtp_ Regenjacke nach oben packen');
  expect(errors).toEqual([]);
});
