// «Weitere Orte» deckt keinen Ort mehr zu (UI-Test Training 17.11.2026, Fund 10): auf einem Laptop (niedriger Bildschirm) steht der
// Knopf «Weitere Orte» in einer eigenen Zeile unter der Liste, nicht über dem letzten Ort.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('Seitenleiste: «Weitere Orte» steht unter der Liste und deckt keinen Ort zu', async ({ page, context }, info) => {
  test.skip(info.project.name === 'phone', 'die Seitenleiste gibt es nur am Computer');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 520 }); // seven places plus «Ich» now fit at 780 px; a low window (the side bar stays above 500 px) makes the list scroll again
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/flow/training');
  await ready(page);
  const more = page.locator('[data-menu-more]');
  await expect(more).toBeVisible();
  const nav = await page.locator('nav.places').boundingBox();
  const btn = await more.boundingBox();
  expect(btn.y).toBeGreaterThanOrEqual(nav.y + nav.height - 1); // unter der Liste, nicht darüber
  // ein Tipp scrollt die Liste weiter
  const before = await page.locator('nav.places').evaluate((el) => el.scrollTop);
  await more.click();
  await expect.poll(() => page.locator('nav.places').evaluate((el) => el.scrollTop)).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});
