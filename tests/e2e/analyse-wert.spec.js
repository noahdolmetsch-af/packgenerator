// «Analyse» M6 (Noah 27.10.2026 «alle Mockups 1:1»): a tap on a tile opens the page of that value with
// ranges, boxes, the course (trip band, typical range, layers), per weekday and the days. German, phone +
// desktop; fictional Fitbit days and one fictional trip written straight into IndexedDB; the clock stands on
// Friday 9 October 2026 (aktiv-fixture.js).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const H = (fill) => Array.from({ length: 24 }, (_, i) => fill(i));

function rows() {
  const healthDays = [];
  for (let i = 0; i < 120; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({
      date, restingHr: 48 + (i % 5) + (i >= 20 && i < 24 ? 6 : 0), steps: 6000 + (i % 7) * 900,
      sleep: { asleepMin: 380 + (i % 4) * 20, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 92 },
      vo2max: 55 + (i % 3) / 10, hrH: H((h) => 52 + Math.round(18 * Math.max(0, Math.sin((h - 6) / 5)))), stepH: H((h) => (h >= 7 && h <= 20 ? 300 + h * 20 : 0)),
      src: 'google', at: `${date}T08:00:00Z`,
    });
  }
  const trips = [{ id: 'e2e-wert-trip', name: 'Probefahrt Jura', domain: 'bike', status: 'done', startDate: addDays(TODAY, -23), days: 4 }];
  return { healthDays, trips };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await put(page, rows());
  await page.goto('./#/auswerten/analyse');
  await page.reload();
  await ready(page);
  return errors;
}

test('A tile opens the page of its value: ranges, boxes, course, layers, weekdays, days', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.locator('[data-value="rhr"]').click();
  await expect(page).toHaveURL(/#\/auswerten\/analyse\/rhr$/);
  const wv = page.locator('[data-detail="rhr"]');
  await expect(wv.getByRole('heading', { level: 1 })).toHaveText(T('Resting pulse'));
  // 3 months by default: four boxes, the highest day names the trip
  for (const b of ['avg', 'lo', 'hi', 'typ']) await expect(wv.locator(`[data-box="${b}"]`), b).toBeVisible();
  await expect(wv.locator('[data-box="hi"] span')).toContainText('Probefahrt Jura');
  await expect(wv.locator('svg rect.band')).toHaveCount(1);
  await expect(wv.locator('[data-wd-note]')).toBeVisible();
  // a layer: sleep, with its own axis on the right
  await wv.locator('[data-suggest="sleep"]').click();
  await expect(wv.locator('[data-layer="sleep"]')).toBeVisible();
  await expect(wv.locator('.ax.r')).toBeVisible();
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/wert-${info.project.name}.png`, fullPage: true });
  // a day in the table shows every value of that day
  await wv.locator('.days tbody button').first().click();
  await expect(wv.locator('[data-day]')).toHaveAttribute('data-day', TODAY);
  await expect(wv.locator('.dayall')).toContainText(T('VO₂max (cardio fitness)'));
  // the week, one back
  await wv.locator('.seg [data-key="w"]').click();
  await wv.locator('[data-back]').click();
  await expect(wv.locator('[data-range-text]')).toContainText('26');
  await expect(wv.locator('[data-fwd]')).toBeEnabled();
  // the choices stay for this value
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-layer="sleep"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Pulse over the day: the day range shows the hours', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/auswerten/analyse/hrDay');
  const wv = page.locator('[data-detail="hrDay"]');
  await wv.locator('.seg [data-key="d"]').click();
  await expect(wv.locator('#wv-course')).toHaveText(T('Over the day|analyse'));
  await expect(wv.locator('svg path.ln')).toBeVisible();
  await expect(wv.locator('[data-box="lo"] span')).toContainText(':00');
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/wert-tag-${info.project.name}.png`, fullPage: true });
  // hourly activity: 24 bars
  await page.goto('./#/auswerten/analyse/actHours');
  const ah = page.locator('[data-detail="actHours"]');
  await ah.locator('.seg [data-key="d"]').click();
  await expect(ah.locator('svg rect.b')).toHaveCount(24);
  // an unknown value says so and leads back
  await page.goto('./#/auswerten/analyse/gibtsnicht');
  await expect(page.getByText(T('This value is not there (any more).'))).toBeVisible();
  expect(errors).toEqual([]);
});
