// «Tempo-Messer» (Noah 02.11.2026 «a»): the switch under Ich › Daten, the line, copy; off forgets.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Tempo-Messer: on shows a line, off hides it and keeps nothing', async ({ page, context }, info) => {
  await openHome(page, context, info);
  await page.goto('./#/me/data');
  const sw = page.locator('[data-tempo-switch]');
  await expect(sw).toBeAttached({ timeout: 10_000 });
  await sw.scrollIntoViewIfNeeded();
  await expect(page.locator('[data-tempo-out]')).toHaveCount(0);
  await sw.check({ force: true });
  const out = page.locator('[data-tempo-out]');
  await expect(out).toBeVisible();
  await page.mouse.wheel(0, 600);
  await expect(out).toContainText(/Start|Daten|Data|Gerät|Device|Noch nichts|Nothing measured/);
  expect(await page.evaluate(() => localStorage.getItem('tempoMesser'))).toBe('1');
  await sw.uncheck({ force: true });
  await expect(page.locator('[data-tempo-out]')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('tempoMesser'))).toBeNull();
});
