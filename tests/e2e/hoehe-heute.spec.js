// «Temperaturen nach Höhe» on Today (Noah 05.11.2026 «1b»): one calm line for the home place, with a switch on the weather page.
// Made-up place and air layers (hoehe-fixture.js); Open-Meteo is mocked, everything else outside is blocked (openHome).
import { test, expect } from './clock.js';
import { openHome, homeFixture } from './home0460-fixture.js';
import { mock } from './hoehe-fixture.js';

test('Today shows the temperatures by height for the home place; the switch on the weather page takes the line away', async ({ page, context }, info) => {
  await openHome(page, context, info, { data: homeFixture() });
  await mock(context);

  await page.goto('./#/');
  const line = page.locator('[data-heute-hoehe]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  // today is 4 degrees warmer than the standard layers (the fixture): 1000 m 7.5 °C, 2000 m 1.2 °C, 3000 m −5 °C
  await expect(line.locator('[data-heute-hoehe-row="1000"]')).toHaveText('1’000 m 8°');
  await expect(line.locator('[data-heute-hoehe-row="2000"]')).toHaveText('2’000 m 1°');
  await expect(line.locator('[data-heute-hoehe-row="3000"]')).toHaveText('3’000 m −5°');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath(`hoehe-heute-${info.project.name}.png`) });

  // a tap opens the weather page
  await line.click();
  await expect(page.locator('[data-hoehe]')).toBeVisible({ timeout: 20_000 });

  // switched off on the weather page, gone on Today
  await page.locator('[data-hoehe-set] summary').click();
  await page.locator('[data-hoehe-home]').uncheck();
  await page.goto('./#/');
  await expect(page.locator('[data-heute-wetter]')).toBeAttached();
  await expect(page.locator('[data-heute-hoehe]')).toHaveCount(0);
});
