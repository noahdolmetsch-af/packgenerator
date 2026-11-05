// «Wetter-Sprüche auf Mundart» (Noah 03.11.2026, Idee 27): a short Swiss German line under the weather on Today,
// switchable. Fictional data (home0460-fixture: Friday 9 October, 09:00, Open-Meteo mocked), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Today says the weather in dialect and the switch takes it away', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const line = page.locator('[data-mundart]');
  await expect(page.locator('[data-weather]')).toBeVisible();
  await expect(line).toBeVisible();
  expect((await line.innerText()).length).toBeGreaterThan(10);
  await page.evaluate(() => localStorage.setItem('ops.mundart', '0'));
  await page.reload();
  await expect(page.locator('[data-weather]')).toBeVisible(); // Today is drawn again
  await expect(page.locator('[data-mundart]')).toHaveCount(0);
});
