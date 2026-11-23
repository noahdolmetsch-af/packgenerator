// Heute und Diese Woche aufräumen (Noah 23.11.2026 «ja»): Heute in three parts. Jetzt and Deine Woche are open; the rest
// (Dein Körper, Unterwegs und Velos, Schnell öffnen, Entdecken) stands under one closed line «Mehr» that the device remembers.
// The other specs run with 'pg.homeMoreOpen' = '1' (playwright.config.js); this one tests the closed default. Fictional data only.
import { test, expect } from './clock.js';
import { homeFixture, openHome } from './home0460-fixture.js';

test.use({ storageState: { cookies: [], origins: [] } });

test('Mehr is closed with the names of its areas, a tap opens it, the device remembers', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture(), hour: 9 });
  const more = page.locator('[data-home-more]');
  await expect(more).toBeVisible();
  await expect(page.locator('[data-more-sum]')).toContainText(/Dein Körper/);
  // Jetzt and Deine Woche stand open above it, with their tiles
  await expect(page.locator('[data-home-sec="now"]')).toBeVisible();
  await expect(page.locator('[data-home-sec="week"]')).toBeVisible();
  const order = await page.locator('[data-home-sec], [data-home-more]').evaluateAll((els) => els.map((e) => e.dataset.homeSec ?? 'more'));
  expect(order.slice(0, 2)).toEqual(['now', 'week']);
  expect(order.at(-1)).toBe('more');
  // under it: nothing yet
  await expect(page.locator('[data-home-sec="body"]')).toHaveCount(0);
  await expect(page.locator('[data-tile="spruch"]')).toHaveCount(0);
  await page.locator('[data-more-toggle]').click();
  await expect(page.locator('[data-home-sec="body"]')).toBeVisible();
  await expect(page.locator('[data-home-sec="discover"]')).toBeVisible();
  await expect(page.locator('[data-tile="spruch"]')).toBeVisible();
  await expect(page.locator('[data-more-sum]')).toHaveCount(0);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/mehr-offen-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  // remembered
  await page.reload();
  await expect(page.locator('[data-home-sec="body"]')).toBeVisible();
  await page.locator('[data-more-toggle]').click();
  await expect(page.locator('[data-home-sec="body"]')).toHaveCount(0);
});

test('the weather stands once in the greeting and the body tile has no second morning check', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture(), hour: 9 });
  await expect(page.locator('[data-weather]')).toBeVisible();
  await expect(page.locator('[data-heutebild-wx]')).toHaveCount(0);
  await expect(page.locator('[data-tile="heutecheck"]')).toBeVisible();
  await page.locator('[data-more-toggle]').click();
  await expect(page.locator('[data-tile="body"]')).toBeVisible();
  await expect(page.locator('[data-tile="body"] [data-body-check]')).toHaveCount(0);
});
