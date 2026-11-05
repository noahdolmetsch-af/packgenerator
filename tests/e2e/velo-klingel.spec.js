// «Klingel wackelt» (Paket C idea 17, Noah 03.11.2026 «b»): the care chip of «Heute fällig» carries a small bike bell that
// wobbles once when the line appears; nothing moves with «Reduce motion». Fictional data (home0460-fixture.js).
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

async function withDueCare(page, context, info) {
  const d = homeFixture();
  // the service of the whole bike is long overdue (3000 km, 100 h or 365 days)
  d.tables.bikes.forEach((b) => Object.assign(b, { km: 6000, service: { last: { day: day(-500), km: 0, hours: 0 } } }));
  const T = await openHome(page, context, info, { data: d });
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  return T;
}

test('Heute faellig: the care chip has a bell that wobbles once', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await withDueCare(page, context, info);
  const chip = page.locator('[data-due-today] [data-due="care"]');
  await expect(chip).toBeVisible();
  const anim = await chip.locator('svg').evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toMatch(/bell-ring$/);
  // nothing about it is read out as extra text: the chip says the same as before
  await expect(chip).toContainText(/\d/);
  expect(errors).toEqual([]);
});

test('Heute faellig: with reduced motion the bell stands still', async ({ page, context }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await withDueCare(page, context, info);
  const chip = page.locator('[data-due-today] [data-due="care"]');
  await expect(chip).toBeVisible();
  expect(await chip.locator('svg').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
});
