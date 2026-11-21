// «Lange Namen brechen um» (UI-Test Training 17.11.2026, Fund 7): ein langer Name einer Einheit in der Woche endet nicht
// mit «…», er bricht auf eine zweite Zeile um und bleibt im Bildschirm.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { seedActivities, planSessions, activities, day } from './leistung-data.js';

const LONG = 'Lockere Grundlagenfahrt mit Kaffeepause am Hügel';

test('Training › Woche: ein langer Einheiten-Name bricht um statt mit «…» zu enden', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  await ready(page);
  const plan = planSessions().map((s) => (s.id === 'p9' ? { ...s, name: LONG, day: day(0) } : s));
  await seedActivities(page, { acts: activities(), plan });
  await page.goto('./#/flow/training');
  await page.reload();
  await ready(page);
  const chip = page.locator('[data-planned="p9"]');
  await expect(chip).toBeVisible();
  await expect(chip).toContainText(LONG);
  const name = chip.locator('.cn');
  // nothing is cut off: the text fits inside its box, and the chip stays inside the screen
  expect(await name.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await name.evaluate((el) => getComputedStyle(el).textOverflow)).not.toBe('ellipsis');
  const box = await chip.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
