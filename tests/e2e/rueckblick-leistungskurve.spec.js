// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»), PR 13: the power curve in the Rückblick card «Puls und Leistung»
// is a line chart you can point at (exact watts), a tap opens the duration, «Als Tabelle» lists the durations.
// Fictional data only (sn2x-fixture.js trip, leistung-data.js ride put on its first day).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { sn2xData, D0, SEE } from './sn2x-fixture.js';
import { activities, seedActivities } from './leistung-data.js';
import { openData, settle } from './settle.js';

const DATA = sn2xData();
const shot = async (loc, info, name) => {
  if (process.env.SHOTS) await loc.screenshot({ path: `${process.env.SHOTS}/${process.env.PREFIX ?? ''}${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('power curve: exact watts on pointing, a tap opens the duration, the table lists them', async ({ page, context }, info) => {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/curve-${info.testId}.json`;
  writeFileSync(file, JSON.stringify(DATA));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.setFixedTime(new Date(`${D0}T10:00:00+02:00`));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  // the main ride of the fictional Strava data (power meter, curve 584 / 402 / 296 / 248 / 214 W) on the first day of the trip
  const start = DATA.tables.trips.find((x) => x.id === SEE).startDate;
  const ride = { ...activities()[0], startLocal: `${start}T17:05:00Z`, start: `${start}T15:05:00Z` };
  await seedActivities(page, { acts: [ride] });
  await page.goto(`./#/debrief/${encodeURIComponent(SEE)}`);
  await page.reload();
  await settle(page);
  const body = page.locator('section[data-group="body"] button.gb');
  if ((await body.getAttribute('aria-expanded')) !== 'true') await body.click();
  const chart = page.locator('[data-heart-power] [data-chart="power-curve"]');
  await chart.scrollIntoViewIfNeeded();
  await expect(chart.locator('[data-plot]')).toHaveAttribute('data-n', '5');
  await expect(chart.locator('[data-plot]')).toHaveAttribute('aria-label', /5 s 584 W/);
  await shot(chart, info, 'karte');
  // pointing: the exact watts of the duration above the chart
  await chart.locator('[data-plot]').focus();
  await page.keyboard.press('Home');
  await expect(chart.locator('[data-readout]')).toContainText('584 W');
  // a tap opens the duration with the watts per kg
  await page.keyboard.press('Enter');
  const sheet = page.locator('[data-power-sheet]');
  await expect(sheet).toContainText('584 W');
  await page.getByRole('button', { name: 'Längere Dauer' }).click();
  await expect(sheet).toContainText('402 W');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  // the table: the five durations
  await chart.getByRole('button', { name: 'Als Tabelle' }).click();
  await expect(chart.locator('table tbody tr')).toHaveCount(5);
  await expect(chart.locator('table')).toContainText('214 W');
  await shot(chart, info, 'tabelle');
  expect(errors).toEqual([]);
});
