// «Analyse: alle Werte» (Noah 27.10.2026 «alle holen, zumindest optional anzeigen»): the further Fitbit values
// (VO₂max, distance, floors, pulse over the day, hourly activity, workouts, weight, body fat) show as tiles,
// and «Also values without data» shows every value, dashed. German, phone + desktop; fictional Fitbit days
// written straight into IndexedDB; the clock stands on Friday 9 October 2026 (aktiv-fixture.js).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const H = (fill) => Array.from({ length: 24 }, (_, i) => fill(i));

function rows() {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({
      date, restingHr: 49 + (i % 4), steps: 6000 + (i % 5) * 1500, azm: 20 + (i % 6) * 5,
      sleep: { asleepMin: 400, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 92 },
      vo2max: 55 + (i % 3) / 10, distKm: 4.5 + (i % 4), floors: 6 + (i % 5), climbM: 20 + (i % 7) * 3, fitKg: 66 + (i % 3) / 10, bodyFat: 14 + (i % 2) / 10,
      hrMin: 44 + (i % 3), hrAvg: 66 + (i % 4), hrZones: { light: 60, mod: 12, vig: 4, peak: 1 }, levels: { sed: 610 + i, light: 180, mod: 20, very: 15 },
      exercises: i % 3 ? [] : [{ type: 'WALKING', name: 'Gehen', start: '12:10', end: '12:40', min: 30, kcal: 120 }],
      stepH: H((h) => (h >= 7 && h <= 20 ? 300 + h * 20 : 0)), hrH: H((h) => 55 + Math.round(10 * Math.sin(h / 4))),
      src: 'google', at: `${date}T08:00:00Z`,
    });
  }
  return { healthDays };
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

test('Analyse shows the new Fitbit values and, on wish, every value without data', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const tile = (k) => page.locator(`[data-value="${k}"]`);
  for (const [k, name] of [['vo2max', 'VO₂max (cardio fitness)'], ['hrDay', 'Pulse over the day'], ['distKm', 'Distance (watch)'], ['floors', 'Floors'], ['actHours', 'Hourly activity'], ['workouts', 'Fitbit workouts'], ['fitKg', 'Weight (Fitbit)'], ['bodyFat', 'Body fat'], ['sedMin', 'Sitting time'], ['hrMin', 'Lowest pulse of the day']]) {
    await expect(tile(k), k).toBeVisible();
    await expect(tile(k).locator('.tx')).toHaveText(T(name));
  }
  // 30 days by default: VO₂max is a mean with one decimal
  await expect(tile('vo2max').locator('.v b')).toHaveText(/^55[.,]\d$/);
  await expect(tile('actHours').locator('.v small')).toHaveText(T('of 12|hours'));
  // the place holders only with «Also values without data»
  await expect(tile('sleepScore')).toHaveCount(0);
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/alle-${info.project.name}.png`, fullPage: true });
  await page.locator('[data-all]').click();
  await expect(page.locator('[data-all]')).toHaveAttribute('aria-pressed', 'true');
  await expect(tile('sleepScore')).toHaveClass(/empty/);
  await expect(tile('gTrain').locator('.how')).toHaveText(T('Garmin does not give this out'));
  // an empty tile is no link
  expect(await tile('sleepScore').evaluate((el) => el.tagName)).toBe('DIV');
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/alle-leer-${info.project.name}.png`, fullPage: true });
  // the choice stays after a reload
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-all]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
