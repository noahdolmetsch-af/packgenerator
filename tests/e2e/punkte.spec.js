// «Ruhige Punkte an allen Orten» (Noah 23.11.2026 «4a»): the menu shows a small mark on Touren (a tour starts within 3 days and
// is not fully packed) and on Plan (ticks still open today); each can be switched off in Ich › Darstellung.
// Fictional fixture, the clock stands on Friday 9 October 2026; nothing leaves the preview.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { homeFixture, openHome, day } from './home0460-fixture.js';

// the place rows of the bottom bar (a) and of the side bar (li); the <html> element carries data-place too
const row = (page, key) => page.locator(`a[data-place="${key}"], li[data-place="${key}"]`);
const dot = (page, key) => row(page, key).locator('[data-place-dot]:visible');

test('Touren shows a small dot while the next tour is not packed; Heute and Material show none of their own', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await expect(dot(page, 'trips')).toHaveCount(1);
  await expect(dot(page, 'today')).toHaveCount(0);
  // the tooltip / the screen reader line says what it means
  await expect(row(page, 'trips').locator(':scope:visible').first()).toContainText(/Touren: 1 Tour mit offener Packliste|Touren: \d+ Touren? mit offener Packliste/);
});

test('a tour that starts in more than 3 days gives no dot', async ({ page, context }, info) => {
  const data = homeFixture();
  for (const t of data.tables.trips) if (t.startDate) t.startDate = day(12);
  await openHome(page, context, info, { data });
  await expect(dot(page, 'trips')).toHaveCount(0);
});

test('the switch in Darstellung takes the dot away and it stays away after a reload', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await expect(dot(page, 'trips')).toHaveCount(1);
  await page.evaluate(() => localStorage.setItem('ops.dottrips', '0'));
  await page.reload();
  await expect(row(page, 'trips').locator(':scope:visible').first()).toBeVisible();
  await expect(dot(page, 'trips')).toHaveCount(0);
});

test('the two switches stand in Ich › Darstellung', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me/look');
  await ready(page);
  await expect(page.locator('[data-ops] input[data-op="dotplan"]')).toBeAttached();
  await expect(page.locator('[data-ops] input[data-op="dottrips"]')).toBeAttached();
});
