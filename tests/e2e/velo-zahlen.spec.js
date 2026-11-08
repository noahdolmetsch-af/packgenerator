// «Velo-Zahlen als Wege» (UI-Prüfung 07.11.2026, V1): on Velos the km, the costs, the care status and the next trip lead somewhere.
// Fictional data only (test_data_gtp_ names), built from tests/e2e/pf-fixture.json (as ws5-velo-kosten.spec.js).
// SHOTS=<folder> saves the screenshots (1440 and 390, light).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const SPARK = `${P}spark`;
const GRAVEL = `${P}gravel`;

async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.waitForTimeout(1500); // the odometer has rolled
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: false });
}

/** The PF fixture plus two visits on the Spark: today CHF 185.50 at 5000 km, last year CHF 90 at 1000 km. */
function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  fix.tables.visits = [
    { id: `visit-${P}1`, bikeId: SPARK, date: day(0), km: 5000, shop: `${P} Velo shop`, totalChf: 185.5, parts: [{ part: 'padsR', action: 'replace', chf: 60 }, { part: 'shifting', action: 'service', chf: 40 }, { part: 'wheels', action: 'service', chf: 85.5 }] },
    { id: `visit-${P}0`, bikeId: SPARK, date: day(-400), km: 1000, shop: `${P} Velo shop`, totalChf: 90, parts: [{ part: 'fork', action: 'service', chf: 90 }] },
  ];
  // the chain of the Spark: mounted at 4200 km, own limit 1000 km, bike at 5000 km → 800 of 1000, soon (for «On the shopping list»)
  const spark = fix.tables.bikes.find((b) => b.id === SPARK);
  spark.life = { chain: 1000 };
  spark.parts = [{ key: 'chain', model: 'Test chain', history: [{ date: day(-60), km: 4200, value: null, action: 'replace', result: 'done', by: 'self', note: '' }] }];
  const path = info.outputPath('velo-zahlen-fixture.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

async function start(page, context, info) {
  const file = fixtureFile(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

test('Velos: the km, the costs, the care status and the next trip are ways', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${SPARK}`);
  const band = page.locator('.setup-band');
  await expect(band.locator('[data-bike-km-link]')).toBeVisible();
  await expect(band.locator('[data-bike-cost-link]')).toContainText('CHF 186');
  await expect(band.locator('[data-bike-ride]')).toContainText(`${P} Jura event`);
  // V1b: the next trip says whether the bike fits it; weight and bags lead to their pages
  await expect(band.locator('[data-bike-ride-fit]')).toBeVisible();
  await expect(band.locator('[data-bike-weight-link]')).toBeVisible();
  await expect(band.locator('[data-bike-bags-link]')).toBeVisible();
  if (info.project.name === 'phone') expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await shot(page, info, 'V1-velos-karten');
  await band.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('.setup-band')?.scrollIntoView({ block: 'start' }));
  await shot(page, info, 'V1-velos-kopf');

  // the km lead to the part «Velos» of Analyse
  await band.locator('[data-bike-km-link]').click();
  await expect(page).toHaveURL(/#\/auswerten\/analyse\?tab=velos&bike=/);
  await expect(page.getByRole('tab', { name: T('Bikes|tab') })).toHaveAttribute('aria-selected', 'true');
  // V1b: only the tapped bike, and a way back to all bikes
  await expect(page.locator('[data-bike-only]')).toContainText('Scott Spark 960');
  await expect(page.locator('[data-bike-total]').filter({ hasNotText: 'Scott Spark 960' })).toHaveCount(0); // no other bike
  await page.evaluate(() => document.querySelector('[data-bike-only]')?.scrollIntoView({ block: 'start' }));
  await shot(page, info, 'V1b-analyse-nur-ein-velo');
  await page.locator('[data-bike-all]').click();
  await expect(page.locator('[data-bike-only]')).toHaveCount(0);
  await expect(page.locator('[data-bike-km]')).toBeVisible();
  await shot(page, info, 'V1-analyse-velos');

  // the costs lead to the year of the bike
  await page.goto(`./#/bikes?bike=${SPARK}`);
  await page.locator('.setup-band [data-bike-cost-link]').click();
  await expect(page).toHaveURL(/#\/bikes\?.*view=year/);

  // the next trip leads to its packing list
  await page.goto(`./#/bikes?bike=${SPARK}`);
  await page.locator('.setup-band [data-bike-ride]').click();
  await expect(page).toHaveURL(/#\/pack/);
  await expect(page.getByText(`${P} Jura event`).first()).toBeVisible(); // that trip, not the one shown last

  // the status pill of a card leads to the care of that bike
  await page.goto(`./#/bikes?bike=${SPARK}`);
  await page.locator(`[data-velo-card="${SPARK}"] [data-card-status]`).click();
  await expect(page).toHaveURL(/#\/bikes\?.*tab=care/);
  expect(errors).toEqual([]);
});

test('Velos: weight and bags lead to their pages, the card text to the care', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${SPARK}`);
  await page.locator('.setup-band [data-bike-bags-link]').click();
  await expect(page).toHaveURL(/#\/bikes\?.*tab=rig.*view=bags|#\/bikes\?.*view=bags.*tab=rig/);
  await page.goto(`./#/bikes?bike=${SPARK}`);
  await page.locator('.setup-band [data-bike-weight-link]').click();
  await expect(page).toHaveURL(/#\/bikes\?.*tab=compare/);
  await page.goto(`./#/bikes?bike=${SPARK}`);
  await page.locator(`[data-velo-card="${SPARK}"] [data-card-text]`).first().click();
  await expect(page).toHaveURL(/#\/bikes\?.*tab=care/);
  expect(errors).toEqual([]);
});

test('Verschleiss: a part that is due goes on the shopping list in one tap, with Undo', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?tab=care&view=wear&bike=${SPARK}`);
  const shop = page.locator('[data-wear-shop]').first();
  await expect(shop).toBeVisible();
  await expect(page.locator('[data-wear-shop-open]').first()).toHaveAttribute('href', '#/me/alltag/einkauf');
  await shop.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('[data-wear-shop]')?.scrollIntoView({ block: 'center' }));
  await shot(page, info, 'V1b-verschleiss');
  await shop.click();
  await expect(page.getByText(T('"{name}" is on the shopping list.', { name: '' }).split('«')[0].trim() || 'Einkaufsliste').first()).toBeVisible();
  expect(errors).toEqual([]);
});

