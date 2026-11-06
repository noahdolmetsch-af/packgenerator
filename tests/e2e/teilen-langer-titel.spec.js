// Durchklick Etappe 3 (E3-002): Ich › Ruhig und persönlich › Teilen mit Vorschau: a title of one long word
// pushed the box «Check what goes along», and with it the page, sideways.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';

test('Share preview: a long title without spaces does not push the page sideways', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/me/ruhig/teilen');
  const T = tr('de');
  const title = page.getByLabel(T('Title the other person sees'));
  await expect(title).toBeVisible();
  await title.fill('W'.repeat(320));
  await title.press('Tab');
  await page.waitForTimeout(500); // the preview takes the title when the field is left
  await expect(page.locator('[data-share-preview] h1')).toContainText('WWWW');
  const over = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: document.documentElement.clientWidth }));
  expect(over.sw, `page ${over.sw} px wide on a ${over.w} px screen`).toBeLessThanOrEqual(over.w + 1);
});
