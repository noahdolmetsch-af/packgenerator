// «Quick Links» Schritt 2 (Noah 28.10.2026 «1a 2a», Idee 19): the pin on the cards, pinning into Quick Links
// and back (the first note says what the pin does), the switch in Quick Links.
import { test, expect } from '@playwright/test';
import { openHome } from './home0460-fixture.js';

test('pins on the cards: pin, unpin, switch off', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const marks = page.locator('[data-pinmark]');
  await expect(marks.first()).toBeVisible({ timeout: 10_000 });

  // pin the first card: the pin turns on, Quick Links has it in the first group
  const first = marks.first();
  const id = await first.getAttribute('data-pinmark');
  if ((await first.getAttribute('aria-pressed')) === 'true') await first.click(); // a suggested pin already: take it out first
  await expect(page.locator(`[data-pinmark="${id}"]`)).toHaveAttribute('aria-pressed', 'false');
  await page.locator(`[data-pinmark="${id}"]`).click();
  await expect(page.locator(`[data-pinmark="${id}"]`)).toHaveAttribute('aria-pressed', 'true');
  const name = await page.locator(`[data-pinmark="${id}"]`).getAttribute('title');
  await expect(page.getByText(T('«{name}» is in your Quick Links. A tap there brings you right back here.', { name }))).toBeVisible();
  await page.goto('./#/quick');
  await expect(page.locator(`[data-quick-group="s1"] [data-quick-pin="${id}"]`)).toBeVisible();
  await expect(page.locator('[data-pinmark]')).toHaveCount(0); // no pins on the pins page

  // switch them off: Heute shows none
  await page.locator('[data-quick-marks] input').uncheck();
  await page.goto('./#/');
  await expect(page.locator('main h1')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-pinmark]')).toHaveCount(0);
});
