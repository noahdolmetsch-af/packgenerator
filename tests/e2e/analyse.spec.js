// «Analyse» (Noah 27.10.2026 «1a 2a 3a 4a 5b», thread «Analyse-Tool für alle Daten»): «Mehr» on «Aktiv heute»
// opens Auswerten › Analyse; every value is a tile; the «•••» of the activity tiles never cover a name.
// German, phone + desktop, fictional Fitbit days, Strava rides and ticks written straight into the app's
// IndexedDB. The clock stands on Friday 9 October 2026 (aktiv-fixture.js). Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { openHome } from './home0460-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const P = 'test_data_an_';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 60; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, azm: 15 + (i % 6) * 8, restingHr: 49 + (i % 4), hrvMs: 50 + (i % 7), steps: 6000 + (i % 5) * 1500, sleep: { asleepMin: 380 + (i % 7) * 15, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 90 + (i % 5) }, spo2: 95 + (i % 3), breath: 14, kcal: 2200 + (i % 9) * 40, kcalActive: 550, hrMax: 140 + (i % 9), src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day, km) => ({
    id: `${P}${id}`, day, time: '17:10', start: `${day}T15:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km, hm: 300, movingS: 4800, elapsedS: 5100, gearId: null,
    hrAvg: 132, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 85, tempAvg: 12, wNorm: null, kj: null, effort: 60, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 800,
  });
  const activities = [];
  for (let i = 1; i < 60; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i), 25 + (i % 5) * 6));
  const flowLog = [];
  const tick = (actId, i, extra = {}) => flowLog.push({ id: `${P}${actId}_${i}`, actId, day: addDays(TODAY, -i), at: `${addDays(TODAY, -i)}T18:00:00+02:00`, ...extra });
  for (let i = 0; i < 60; i++) {
    if (i % 4 === 1) tick('sauna', i, { min: 30 });
    if (i % 5 === 2) tick('gym', i, { min: 60 });
    if (i % 7 === 3) tick('hockey', i, { min: 75 });
    if (i % 9 === 4) tick('tennis', i, { min: 90 });
    if (i % 2 === 0) tick('meditation', i, { min: 15 });
  }
  const flowChecks = [];
  for (let i = 0; i < 20; i++) flowChecks.push({ day: addDays(TODAY, -i), sleep: 6 + (i % 4), energy: 5 + (i % 5), mood: 6 + (i % 3) });
  return { healthDays, activities, flowLog, flowChecks };
}

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow'); // seeds the activities of the small start (Eishockey, Sauna, Gym …)
  await ready(page);
  await expect(page.locator('[data-act]').first()).toBeVisible();
  await put(page, rows());
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
}

test('Aktiv heute: the dots never cover a name, More opens Analyse', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info); // a device with a trip and gear, so Heute shows its tiles
  const card = page.locator('[data-section="acts"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('[data-act]').first()).toBeVisible();
  // every name ends left of its «•••», on every tile
  const tiles = card.locator('li');
  const n = await tiles.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const name = await tiles.nth(i).locator('.tx b').boundingBox();
    const dots = await tiles.nth(i).locator('.more').boundingBox();
    expect(name.x + name.width, `tile ${i}`).toBeLessThanOrEqual(dots.x + 0.5);
    expect(dots.width).toBeLessThanOrEqual(30);
  }
  if (process.env.ANALYSE_SHOTS) await card.screenshot({ path: `qa/analyse/kachel-${info.project.name}.png` });

  const more = card.locator('[data-acts-all]');
  await expect(more).toHaveText(new RegExp(`^${T('More|acts tile')}`));
  await more.click();
  await expect(page).toHaveURL(/#\/auswerten\/analyse$/);
  await expect(page.getByRole('heading', { level: 1, name: T('Analyse|page') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Analyse: every value as a tile, sources and period, a tap opens its course', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  await expect(page.getByRole('heading', { level: 1, name: T('Analyse|page') })).toBeVisible();
  for (const g of ['heart', 'sleep', 'move', 'sports', 'felt', 'aktiv']) await expect(page.locator(`[data-group="${g}"]`), g).toBeVisible();
  await expect(page.locator('[data-value="rhr"]')).toContainText(T('Resting pulse'));
  await expect(page.locator('[data-value="act:sauna"]')).toContainText('Sauna');
  await expect(page.locator('[data-value="act:hockey"]')).toContainText('Eishockey');
  await expect(page.locator('[data-value="km:bike"]')).toBeVisible();
  // the tab «Analyse» of Auswerten lights up
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, 'no sideways scroll').toBeLessThanOrEqual(w);
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/analyse-${info.project.name}.png`, fullPage: true });

  // Strava off: the sport tiles go, Fitbit stays
  await page.locator('[data-src="strava"]').click();
  await expect(page.locator('[data-src="strava"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-value="km:bike"]')).toHaveCount(0);
  await expect(page.locator('[data-value="rhr"]')).toBeVisible();
  // the choice stays after a reload
  await page.getByRole('button', { name: T('{n} days|analyse').replace('{n}', '90') }).click();
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-src="strava"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: T('{n} days|analyse').replace('{n}', '90') })).toHaveAttribute('aria-pressed', 'true');

  // a tap opens the value's own page
  await page.locator('[data-value="act:sauna"]').click();
  await expect(page).toHaveURL(/#\/flow\/auswertung\?act=sauna&p=90$/);
  await page.goBack();
  await page.locator('[data-value="rhr"]').click();
  await expect(page).toHaveURL(/#\/flow\/stats\/hr$/);
  expect(errors).toEqual([]);
});
