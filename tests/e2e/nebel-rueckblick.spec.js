// «Warst du über dem Nebel?» im Rückblick (Noah 27.11.2026 «wieder aufnehmen»): the saved Rückblick of a winter trip asks once; «Yes» keeps
// the day on the Sammel-Wand shelf (with the fog height when given), «No thanks» is remembered, both with Undo; a summer trip is not asked,
// a trip of two days lets you choose the day. German UI, fictional data (sn4plus-fixture).
import { test, expect } from './clock.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sn4plusData, D0, day } from './sn4plus-fixture.js';
import { importAndSettle } from './settle.js';

const WINTER = 'test_data_gtp_fog1';
const TWO = 'test_data_gtp_fog2';
const SUMMER = 'test_data_gtp_fog3';

async function open(page, context, info) {
  const d = sn4plusData();
  const base = d.tables.trips[0];
  const at = `${day(-3)}T18:00:00.000Z`;
  const mk = (id, title, start, days) => ({ ...base, id, title, startDate: start, days, status: 'done', finished: start, route: { name: 'x', km: 60, gainM: 800, line: [[47, 8], [47.1, 8.1]], profile: [[0, 500], [60, 700]] } });
  d.tables.trips = [mk(WINTER, 'Test Hochplateau-Runde', day(-3), 1), mk(TWO, 'Test Zwei Tage', day(-6), 2), mk(SUMMER, 'Test Sommertour', '2026-07-12', 1)];
  d.tables.debriefs = [WINTER, TWO, SUMMER].map((tripId) => ({ tripId, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', applied: [], km: 60, kmApplied: 0, doneAt: at, createdAt: at, updatedAt: at }));
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/nebel-rueckblick-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(d));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  await page.goto('./');
  await importAndSettle(page, file);
}

test('The Rückblick of a winter trip asks about the fog once; Yes keeps the day on the Sammel-Wand, No thanks is remembered, both with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, info);

  // a summer trip is not asked
  await page.goto(`./#/debrief/${SUMMER}`);
  await expect(page.locator('[data-stamp-offer]')).toBeVisible();
  await expect(page.locator('[data-fog-ask]')).toHaveCount(0);

  // «No thanks» goes away and is remembered; Undo brings the question back
  await page.goto(`./#/debrief/${WINTER}`);
  const ask = page.locator('[data-fog-ask]');
  await ask.scrollIntoViewIfNeeded();
  await expect(ask).toBeVisible();
  await expect(ask).toContainText('Warst du über dem Nebel?');
  await expect(ask.locator('[data-fog-day-one]')).toBeVisible();
  await ask.locator('[data-fog-leave]').click();
  await expect(page.locator('[data-fog-ask]')).toHaveCount(0);
  await page.getByRole('button', { name: /Rückgängig/ }).first().click();
  await expect(page.locator('[data-fog-ask]')).toBeVisible();
  await ask.locator('[data-fog-leave]').click();
  await expect(page.locator('[data-fog-ask]')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('[data-stamp-offer]')).toBeVisible();
  await expect(page.locator('[data-fog-ask]')).toHaveCount(0);

  // a trip of two days: choose the day, give the height, keep it
  await page.goto(`./#/debrief/${TWO}`);
  const ask2 = page.locator('[data-fog-ask]');
  await ask2.scrollIntoViewIfNeeded();
  await expect(ask2.locator('[data-fog-day-pick] option')).toHaveCount(2);
  if (process.env.SHOTS) {
    mkdirSync(process.env.SHOTS, { recursive: true });
    await page.screenshot({ path: `${process.env.SHOTS}/rueckblick-frage-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await ask2.locator('[data-fog-day-pick]').selectOption({ index: 1 });
  await ask2.locator('[data-fog-top]').fill('900');
  await ask2.locator('[data-fog-keep]').click();
  const done = page.locator('[data-fog-done]');
  await expect(done).toBeVisible();
  await expect(page.locator('[data-fog-ask]')).toHaveCount(0);
  // Undo takes the day back
  await page.getByRole('button', { name: /Rückgängig/ }).first().click();
  await expect(page.locator('[data-fog-ask]')).toBeVisible();
  await page.locator('[data-fog-keep]').click();
  await expect(page.locator('[data-fog-done]')).toBeVisible();

  // the shelf shows the day with the trip name and the height
  await page.locator('[data-fog-done]').getByRole('link', { name: /Sammel-Wand/ }).click();
  await expect(page).toHaveURL(/#\/debrief\/sammlung$/);
  const row = page.locator('[data-shelf="fog"] [data-fog-day]');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Test Zwei Tage');
  await expect(row).toContainText('Nebel bis 900 m');
  expect(errors).toEqual([]);
});
