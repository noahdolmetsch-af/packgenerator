// «Timer-Pillen oben» (Durchklick Etappe 5, Bericht Frage 2a, Noah 06.11.2026): auf dem Computer schweben die Pillen
// des laufenden Timers und der Stoppuhr oben rechts, nicht unten über den Knöpfen. Auf dem Handy bleiben sie unten über
// der Leiste. Erfundene Daten, kein echtes Netz.
import { test, expect } from './clock.js';
import { ready } from './settle.js';

test('Timer-Pille: Computer oben rechts, Handy unten', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
  });
  await page.goto('./#/timer');
  await ready(page);
  const main = page.locator('main');
  await main.locator('[data-typed]').fill('5 min');
  await main.locator('form.typed button[type="submit"]').click();
  await expect(main.locator('[data-act="go"]')).toBeVisible();
  await page.goto('./#/');
  await ready(page);
  const pill = page.locator('[data-timer-float]');
  await expect(pill).toBeVisible({ timeout: 15_000 });
  const box = await pill.boundingBox();
  const vp = page.viewportSize();
  if (vp.width >= 720) {
    expect(box.y, 'on a computer the pill is at the top').toBeLessThan(80);
    expect(box.x + box.width, 'at the right edge').toBeGreaterThan(vp.width - 40);
  } else {
    expect(box.y + box.height, 'on a phone the pill stays low').toBeGreaterThan(vp.height - 140);
  }
  expect(errors).toEqual([]);
});
