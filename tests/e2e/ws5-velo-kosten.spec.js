// WS5 «Wieder sichtbar» (Noah 14.10.2026 «1a 2b 3a ws1-ws7 freigeben»): the bike's head line on Velos says
// what it costs (the workshop this year, per 1000 km) when it is known; beside «Fahrten importieren» a
// Strava row («verbinden: neue Fahrten kommen von selbst») leads to the Strava page.
// Fictional data only (test_data_gtp_ names), built from tests/e2e/pf-fixture.json.
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
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: false });
}

/** The PF fixture plus two visits on the Spark: today CHF 185.50 at 5000 km, last year CHF 90 at 1000 km. */
function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  fix.tables.visits = [
    { id: `visit-${P}1`, bikeId: SPARK, date: day(0), km: 5000, shop: `${P} Velo shop`, totalChf: 185.5, parts: [{ part: 'padsR', action: 'replace', chf: 60 }, { part: 'shifting', action: 'service', chf: 40 }, { part: 'wheels', action: 'service', chf: 85.5 }] },
    { id: `visit-${P}0`, bikeId: SPARK, date: day(-400), km: 1000, shop: `${P} Velo shop`, totalChf: 90, parts: [{ part: 'fork', action: 'service', chf: 90 }] },
  ];
  const path = info.outputPath('ws5-fixture.json');
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

test('WS5: the head line of a bike shows its costs this year and per 1000 km; without visits nothing', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${SPARK}`);
  const cost = page.locator('.setup-band [data-cost]');
  // this year: CHF 185.50 → CHF 186; per 1000 km: (185.50 + 90) over 4000 km → CHF 69
  await expect(cost).toHaveText(`${T('{chf} this year', { chf: 'CHF 186' })} · ${T('{chf} per 1000 km', { chf: 'CHF 69' })}`);
  await shot(page, info, 'WS5-velo-kosten');
  await page.goto(`./#/bikes?bike=${GRAVEL}`);
  await expect(page.locator('.setup-band h2.name')).toContainText('Gravel Grinder');
  await expect(page.locator('.setup-band [data-cost]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('WS5: a Strava row under Import rides leads to the Strava page', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto(`./#/bikes?bike=${SPARK}`);
  const row = page.locator('.vk-imp a.vk-strava');
  await expect(row).toContainText('Strava');
  await expect(row).toContainText(T('connect: new rides come by themselves'));
  await row.scrollIntoViewIfNeeded();
  await shot(page, info, 'WS5-strava-zeile');
  await row.click();
  await expect(page).toHaveURL(/#\/bikes\?tab=care&view=strava/);
  expect(errors).toEqual([]);
});
