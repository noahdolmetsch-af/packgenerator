// UI-Test Flow, Fund 3 (Noah «b»): the numbers on Aktiv say what they count. «Diese Woche» says «Wochenziele offen»,
// the ring «Bewegen» says «Bewegungszielen im Soll». Fictional data only; the clock stands on Friday 9 October 2026.
// SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import { D0, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

test('the week card and the ring name what they count', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, aktivRows());
  await page.goto('./#/flow');
  await page.reload();
  await ready(page);
  const top = page.locator('main [data-week-glance] .wgl');
  await expect(top).toContainText(/Wochenziel/);
  const ring = page.locator('main [data-ring-way="move"], main [data-ring-fold="move"]').first();
  await expect(ring).toContainText(/von \d+ Bewegungszielen im Soll/);
  if (process.env.SHOTS) {
    await page.waitForTimeout(1200);
    const w = info.project.name === 'phone' ? 390 : 1440;
    await page.locator('main [data-week-glance] .top').screenshot({ path: `${process.env.SHOTS}/woche-${w}.png` });
    await page.locator('main .ringc').screenshot({ path: `${process.env.SHOTS}/ring-${w}.png` });
  }
  expect(errors).toEqual([]);
});
