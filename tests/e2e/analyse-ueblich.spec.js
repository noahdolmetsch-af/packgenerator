// «Cardio-Belastung» Idee C (Noah 07.11.2026 «alle A–F»): a value that adds up shows its usual range as a grey band in
// the course; a value that is a mean keeps the band it had. German, phone + desktop; fictional Fitbit days; the clock
// stands on Friday 9 October 2026.
import { test, expect } from './clock.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 100; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, restingHr: 50 + (i % 5), hrZones: { light: 60 + (i % 5) * 10, mod: 10 + (i % 4) * 5, vig: 5 + (i % 3), peak: i % 7 === 0 ? 4 : 0 }, src: 'google', at: `${date}T08:00:00Z` });
  }
  return { healthDays };
}

test('Cardio load shows its usual range as a band; the resting pulse keeps its own', async ({ page, context }, info) => {
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
  await expect(wv.locator('svg rect.typ')).toHaveCount(1);
  // 3 months (the default) are weekly bars, so the band is per week
  await expect(wv.locator('.legend')).toContainText('dein üblicher Bereich pro Woche');
  await expect(wv.locator('[data-typ-note]')).toContainText('mittlere Hälfte deiner Wochen');
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/analyse-ueblich-${info.project.name}.png`, fullPage: true });
  // a month is one bar per day: the band is per day
  await wv.locator('.seg [data-key="m"]').click();
  await expect(wv.locator('svg rect.typ')).toHaveCount(1);
  await expect(wv.locator('.legend')).toContainText('dein üblicher Bereich pro Tag');
  await expect(wv.locator('[data-typ-note]')).toContainText('mittlere Hälfte deiner Tage');
  // the resting pulse has the box and the band, as before, and no extra note
  await page.goto('./#/auswerten/analyse/rhr');
  const rhr = page.locator('[data-detail="rhr"]');
  await expect(rhr.locator('svg rect.typ')).toHaveCount(1);
  await expect(rhr.locator('[data-box="typ"]')).toBeVisible();
  await expect(rhr.locator('[data-typ-note]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
