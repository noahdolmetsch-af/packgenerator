// «Dein Vorschlag» (Warteliste 4; Noah 22.11.2026 «1b», «5a»): the page #/pack/vorschlag shows the list of the open trip as an offer;
// «Change» opens the packing list in Steps at that step; a left-out piece can be taken along again (one Undo). Fictional data, German.
import { test, expect } from './clock.js';
import { openHome, homeFixture, entries, trip, day } from './home0460-fixture.js';
import { mkdirSync } from 'node:fs';

test('Suggestion page: offer, steps, Change leads to the step, left-out piece comes back with Undo, like last time compares', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  const T = data.tables;
  const all = T.items.slice(3, 9);
  const mine = T.trips.find((x) => x.id === 'test_data_gtp_Herbstrunde');
  mine.entries = entries(5, 0);
  mine.leftOut = [{ itemId: all[5].id, at: '2026-10-09T08:00:00.000Z' }];
  T.trips.push(trip('Vorjahr', day(-40), { entries: [...entries(4, 4), { itemId: all[5].id, slot: 'seat', qty: 1, packed: true }] }));
  await openHome(page, context, info, { hour: 9, data });
  await page.goto('./#/pack/vorschlag');
  await expect(page.locator('[data-vs-offer]')).toBeVisible();
  await expect(page.locator('[data-vs-step]').first()).toBeVisible();
  await expect(page.locator('[data-vs-left]')).toBeVisible();
  await expect(page.locator('[data-vs-like]')).toContainText('Wie letztes Mal');
  await page.locator('[data-vs-compare]').click();
  await expect(page.locator('[data-vs-diff]')).toContainText('Nur jetzt');
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/vorschlag-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  }
  // the left-out piece comes back, one Undo takes it away again
  await page.locator('[data-vs-along]').first().click();
  await expect(page.locator('[data-vs-left]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(page.locator('[data-vs-left]')).toBeVisible();
  // «Change» opens the packing list in Steps, the step open
  await page.locator('[data-vs-step] button').first().click();
  await expect(page).toHaveURL(/#\/pack$/);
  await expect(page.locator('[data-pack-view]')).toHaveValue('steps');
  await expect(page.locator('.bag-group .bag-heading[aria-expanded="true"]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('New trip: the button Suggestion in a minute makes the trip and opens the suggestion', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { hour: 9 });
  await page.goto('./#/trips');
  await page.locator('[data-pack-new]').click();
  const btn = page.locator('[data-suggest-start]');
  await expect(btn).toBeVisible();
  await btn.click();
  // the window may ask for one more answer (it always does when something is missing); then the plain button works the same way
  const url = page.waitForURL(/#\/pack\/vorschlag/, { timeout: 8000 }).then(() => true, () => false);
  const went = await url;
  if (!went) {
    await expect(page.locator('[role="alert"], .err, [data-bad], [aria-invalid="true"]').first()).toBeVisible();
  } else {
    await expect(page.locator('[data-vs-offer], .empty')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
