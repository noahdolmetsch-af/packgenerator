// «Paket G» (Noah 03.11.2026 «a»): the drawn landscape with the next trip on top of Today, switchable.
// Fictional data (home0460-fixture: Friday 9 October, 09:00, Open-Meteo mocked), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Today shows the picture with the days to go and the switch takes it away', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const bild = page.locator('[data-heutebild]');
  await expect(bild).toBeVisible();
  await expect(bild.locator('[data-heutebild-line]')).toContainText(/Herbstrunde/);
  await page.evaluate(() => localStorage.setItem('ops.heutebild', '0'));
  await page.reload();
  await expect(page.locator('[data-weather]')).toBeVisible(); // Today is drawn again
  await expect(page.locator('[data-heutebild]')).toHaveCount(0);
});
