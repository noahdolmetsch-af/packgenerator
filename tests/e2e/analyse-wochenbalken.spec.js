// «Cardio-Belastung» Idee B (Noah 07.11.2026 «alle A–F»): from 3 months on a value that adds up shows one bar per
// week; a tap on a bar shows the week and its seven days. German, phone + desktop; fictional Fitbit days; the clock
// stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 100; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, restingHr: 50, hrZones: { light: 60 + (i % 5) * 10, mod: 10 + (i % 4) * 5, vig: 5 + (i % 3), peak: i % 7 === 0 ? 4 : 0 }, src: 'google', at: `${date}T08:00:00Z` });
  }
  return { healthDays };
}

test('Cardio load: 3 months are weekly bars; a tap shows the week and its days', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto('./#/auswerten/analyse/cardioLoad');
  await page.reload();
  await ready(page);
  const wv = page.locator('[data-detail="cardioLoad"]');
  // 3 months: 13 weekly bars, labelled «pro Woche»
  await expect(wv.locator('svg rect.b')).toHaveCount(13);
  await expect(wv.locator('.chart .ch small')).toHaveText('pro Woche');
  // a month stays one bar per day
  await wv.locator('.seg [data-key="m"]').click();
  await expect(wv.locator('svg rect.b')).toHaveCount(30);
  await expect(wv.locator('.chart .ch small')).toHaveText('pro Tag');
  // back to 3 months: a tap on the plot picks the last week, the card shows its seven days
  await wv.locator('.seg [data-key="m3"]').click();
  await wv.locator('.plot svg').click({ position: { x: 1, y: 100 }, force: true });
  await expect(wv.locator('[data-week-days]')).toBeVisible();
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/analyse-wochenbalken-${info.project.name}.png`, fullPage: true });
  await expect(wv.locator('[data-week-days] button')).toHaveCount(7);
  await expect(wv.locator('[data-picked-value]')).toContainText('–');
  await wv.locator('[data-week-days] button').nth(2).click();
  await expect(wv.locator('.dayall')).toHaveAttribute('data-day', /^2026-/);
  expect(errors).toEqual([]);
});
