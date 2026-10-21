// «Auswertung wie Training» part 3 (Noah 20.10.2026 «das ist ab jetzt unser standard … in alle übrigen bereiche»):
// the saved Rückblick of a trip with a Strava ride shows, under «Körper und Leistung», the same analyses as the
// ride page in Training (ActAnalysesPick → ActAnalyses), in German, at 390 px and on a computer. Fictional data
// only (sn2x-fixture.js plus one ride from leistung-data.js on the trip's day).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { sn2xData, D0, SEE } from './sn2x-fixture.js';
import { activities, seedActivities } from './leistung-data.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const DATA = sn2xData();

test('Rückblick › Körper und Leistung: the analyses of the ride page for the trip’s Strava ride', async ({ page, context }, info) => {
  mkdirSync(info.project.outputDir, { recursive: true });
  const file = `${info.project.outputDir}/rba-${info.testId}.json`;
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

  // one ride with a power meter on the day of the trip
  const trip = DATA.tables.trips.find((x) => x.id === SEE);
  const d = trip.startDate.slice(0, 10);
  const ride = { ...activities()[0], start: `${d}T07:00:00Z`, startLocal: `${d}T09:00:00Z` };
  await seedActivities(page, { acts: [ride] });
  await page.goto(`./#/debrief/${encodeURIComponent(SEE)}`);
  await page.reload();
  await settle(page);

  const body = page.locator('section[data-group="body"]');
  const head = body.locator('button.gb');
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  const box = body.locator(`[data-act-analyses="${ride.id}"]`);
  await expect(box).toBeVisible();
  await expect(box.locator('[data-section="analyses"] h2')).toHaveText(T('Analyses'));
  for (const k of ['more', 'cadence', 'halves', 'best']) await expect(box.locator(`[data-ana="${k}"]`)).toBeVisible();
  await expect(box.getByRole('link', { name: T('The whole ride in Training') })).toHaveAttribute('href', `#/flow/training/a/${ride.id}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/rueckblick-analysen-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  expect(errors).toEqual([]);
});
