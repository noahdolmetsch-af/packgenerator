// Durchklick 4a (Noah 22.11.2026): the sentence «n things are up today» on Heute is tappable and jumps to the list «Up now».
// Fictional data (home0460 fixture).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Heute: the sentence about things up today jumps to the list Up now', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const jump = page.locator('[data-say-jump]');
  await expect(jump).toBeVisible();
  await expect(jump).toContainText(/\d|One thing|Ein/);
  await jump.click();
  const head = page.locator('#imp-h');
  await expect(head).toBeInViewport({ ratio: 0.5 });
  await expect(page.locator('section.imp')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(T('To the list')).toBeTruthy();
});
