// v0.44.0 "Rueckblick 12 Monate", German UI, phone and desktop:
// 1. Today shows the calm card "Letzte 12 Monate" (numbers, one fact, "Ansehen ->") and it opens #/review.
// 2. #/review: Fahren, Packen, Gelernt, Velos with numbers, a neutral delta to the 12 months before,
//    two small charts; no sideways scroll at 390 and 320 px; More -> Rueckblick and Debrief lead there too.
// 3. An empty app: no card on Today, one sentence on #/review.
// Fictional data only (tests/e2e/v038-fixture.js + test_data_gtp_ records made here); every outside
// request is blocked (Open-Meteo too). V044_SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { P, SPARK, GRAVEL, v038Data, day } from './v038-fixture.js';

const SHOTS = process.env.V044_SHOTS;
const shot = async (page, info, name, fullPage = false) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name}.png`, fullPage });
};
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

/** v038's data plus trips in this window and the one before, a ride, a learning and a bought wish. */
function data() {
  const fix = v038Data();
  const T = fix.tables;
  const entries = (ids) => ids.map((id) => ({ itemId: `${P}${id}`, slot: 'seat', qty: 1, packed: true }));
  const trip = (id, n, days, bikeId, ids, extra = {}) => ({ id: `${P}${id}`, domain: 'bikepacking', title: `${P} ${id}`, startDate: day(n), days, bikeId, bike: T.bikes.find((b) => b.id === bikeId).name, setup: {}, entries: entries(ids), ready: [], status: 'done', createdAt: `${day(n - 3)}T08:00:00.000Z`, ...extra });
  T.trips.push(
    trip('Jura', -200, 3, SPARK, ['KL13', 'SL04', 'KL05', 'WZ01'], { overnight: 'outdoor' }),
    trip('Seerunde', -150, 1, GRAVEL, ['KL13', 'KL05']),
    trip('Alt1', -500, 1, GRAVEL, ['KL13']),
    trip('Alt2', -450, 1, GRAVEL, ['KL13']),
  );
  T.debriefs.push(
    { tripId: `${P}Jura`, status: 'done', km: 260, clothing: 'cold', items: {}, missing: [], note: '' },
    { tripId: `${P}Seerunde`, status: 'done', km: 80, clothing: 'fit', items: {}, missing: [], note: '' },
    { tripId: `${P}Alt1`, status: 'done', km: 60, items: {}, missing: [], note: '' },
    { tripId: `${P}Alt2`, status: 'done', km: 70, items: {}, missing: [], note: '' },
  );
  T.rides = [{ id: `${P}ride1`, name: `${P} Feierabend`, date: day(-40), km: 52.3, gainM: 840, movingH: 2.6, pauseH: 0.2, totalH: 2.8, pauses: [], tripId: null, createdAt: `${day(-40)}T18:00:00.000Z` }];
  T.learnings.push({ id: `${P}L44`, topic: 'gear', rule: `${P} Gloves within reach`, itemIds: [], source: `${P} Jura`, createdAt: `${day(-30)}T10:00:00.000Z` });
  const wish = T.items.find((i) => i.id === `${P}KL05`);
  wish.boughtAt = `${day(-10)}T09:00:00.000Z`;
  return fix;
}

async function start(page, context, info, fix = data()) {
  const file = info.outputPath('review044.json');
  writeFileSync(file, JSON.stringify(fix));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const panel = page.locator('details.data');
  await expect(async () => {
    if (!(await panel.evaluate((d) => d.open))) await panel.locator('summary').click();
    expect(await panel.evaluate((d) => d.open)).toBe(true);
  }).toPass();
  await panel.getByLabel('Backup importieren').setInputFiles(file);
  await panel.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await expect(panel.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

test('Today: the card of the last 12 months opens the review', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/');
  const card = page.locator('[data-review-card]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: 'Letzte 12 Monate' })).toBeVisible();
  await expect(card.locator('[data-k=trips] dt')).toHaveText('Touren');
  await expect(card.locator('[data-k=km] dd')).toHaveText(/^\d/);
  await expect(card.locator('[data-k=nights] dd')).toHaveText(/^\d+$/);
  await expect(card.locator('.fact')).not.toBeEmpty();
  // Calm: no orange action button in the card.
  await expect(card.locator('.btn')).toHaveCount(0);
  await card.scrollIntoViewIfNeeded();
  await noSideways(page);
  await shot(page, info, 'heute-karte');
  const view = card.getByRole('link', { name: 'Ansehen →' });
  expect((await view.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await view.click();
  await expect(page).toHaveURL(/#\/review$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Letzte 12 Monate' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Review page: four sections, deltas, charts, no sideways scroll', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/review');
  for (const h of ['Fahren', 'Packen', 'Gelernt', 'Velos']) await expect(page.getByRole('heading', { level: 2, name: h, exact: true })).toBeVisible();
  const ride = page.locator('section', { has: page.getByRole('heading', { name: 'Fahren', exact: true }) });
  await expect(ride.locator('li', { hasText: 'Nächte draussen' })).toContainText('2');
  await expect(ride.locator('li', { hasText: 'Höhenmeter' })).toContainText('840 m');
  // More trips than in the 12 months before: a neutral "+n" badge in the trips row.
  await expect(ride.locator('li', { hasText: 'Touren' }).locator('.nbadge')).toHaveText(/^\+\d+/);
  await expect(page.getByRole('img', { name: 'km pro Monat' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Basisgewicht pro Tour' })).toBeVisible();
  const learned = page.locator('section', { has: page.getByRole('heading', { name: 'Gelernt', exact: true }) });
  await expect(learned).toContainText(`${P} Gloves within reach`);
  await expect(learned).toContainText('Zu kalt 1');
  const pack = page.locator('section', { has: page.getByRole('heading', { name: 'Packen', exact: true }) });
  await expect(pack.getByText('Von der Wunschliste gekauft')).toBeVisible();
  const bikes = page.locator('section', { has: page.getByRole('heading', { name: 'Velos', exact: true }) });
  await expect(bikes).toContainText('CHF 129');
  await bikes.getByText('Teile ersetzt').click();
  await expect(bikes).toContainText('Kassette');
  await noSideways(page);
  await shot(page, info, 'seite', true);
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 700 });
    await noSideways(page);
    await shot(page, info, 'seite-320', true);
  }
  expect(errors).toEqual([]);
});

test('More and Debrief lead to the review', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief');
  await page.getByRole('link', { name: /Letzte 12 Monate/ }).click();
  await expect(page).toHaveURL(/#\/review$/);
  await page.goto('./#/');
  await page.locator('.more-btn').click();
  const sheet = page.locator('dialog.more');
  await expect(sheet).toBeVisible();
  await sheet.getByRole('link', { name: 'Letzte 12 Monate' }).click();
  await expect(page).toHaveURL(/#\/review$/);
  await expect(sheet).toBeHidden();
  expect(errors).toEqual([]);
});

test('Empty: no card on Today, one sentence on the review page', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Erste Schritte' })).toBeVisible();
  await expect(page.locator('[data-review-card]')).toHaveCount(0);
  await page.goto('./#/review');
  await expect(page.getByText(/Das füllt sich nach den ersten Touren/)).toBeVisible();
  await expect(page.locator('h2.sec-head')).toHaveCount(0);
  await noSideways(page);
  await shot(page, info, 'leer');
  expect(errors).toEqual([]);
});
