// «Neuer Schwung» Stil S2 «Kacheln mit Tiefe» on Heute (Noah 26.10.2026 «1a»): the cards on Today have no frame, a soft
// shadow and round corners of 18 px; the trip card ends in a drawn landscape with the dashed route, which draws in
// (not with «Bewegung reduzieren»). Other pages keep the palette's cards. Fictional data.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('S2 Heute: cards with depth and the trip card with its landscape', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const trip = page.locator('section.trip[data-trip]').first();
  await expect(trip).toBeVisible();
  const st = await trip.evaluate((el) => { const c = getComputedStyle(el); return { r: c.borderTopLeftRadius, b: c.borderTopColor, s: c.boxShadow }; });
  expect(st.r).toBe('18px');
  expect(st.b).toBe('rgba(0, 0, 0, 0)');
  expect(st.s).not.toBe('none');
  const land = trip.locator('[data-trip-land]');
  await expect(land).toBeVisible();
  expect(await land.locator('.rt').evaluate((el) => getComputedStyle(el).animationName)).toMatch(/land-go$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('S2 Heute with reduce motion: the route stands still', async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page, context, info);
  const rt = page.locator('section.trip [data-trip-land] .rt').first();
  await expect(rt).toBeAttached();
  expect(await rt.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
