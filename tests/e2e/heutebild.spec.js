// «Paket G» (Noah 03.11.2026 «a»): the drawn landscape with the next trip on top of Today, switchable.
// Fictional data (home0460-fixture: Friday 9 October, 09:00, Open-Meteo mocked), nothing leaves the preview.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Today shows the picture with the days to go and the switch takes it away', async ({ page, context }, info) => {
  await openHome(page, context, info);
  const bild = page.locator('[data-heutebild]');
  await expect(bild).toBeVisible();
  // Noah 17.11.2026 «1-5a»: the picture is the top of the card «My tour», which says the tour; the picture itself names it for screen readers
  await expect(page.locator('[data-section="meinetour"] [data-heutebild]')).toHaveCount(1);
  await expect(bild).toHaveAttribute('aria-label', /Herbstrunde/);
  await expect(bild.locator('[data-heutebild-line]')).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem('ops.heutebild', '0'));
  await page.reload();
  await expect(page.locator('[data-weather]')).toBeVisible(); // Today is drawn again
  await expect(page.locator('[data-heutebild]')).toHaveCount(0);
});
