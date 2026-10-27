// «Eigenes Diagramm» (Noah 27.10.2026 «1a 2a 3a und b möglich 4a 5a», mockups D1, D2, D3, D6): at the top of
// Analyse, up to 6 values from every area on one time axis, under each other or on top of each other; a tap
// on a day shows that day with every value; values are added with search, removed, reordered. German, phone
// + desktop, fictional Fitbit days, Strava rides, ticks, «Wi gaht's?» and one trip written straight into
// IndexedDB. The clock stands on Friday 9 October 2026 (aktiv-fixture.js). Fictional data only.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { DEFAULT_KEYS } from '../../src/lib/analyse/diagram.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const P = 'test_data_dg_';

function rows() {
  // fictional, but not too regular: a fixed noise per day, sleep a bit longer the night after sauna
  const rnd = (i, k) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  const healthDays = [];
  for (let i = 0; i < 95; i++) {
    const date = addDays(TODAY, -i);
    const azm = (k) => Math.round(20 + 50 * rnd(k, 1));
    const sleep = Math.round(380 + 40 * rnd(i, 2) + (i % 4 === 0 ? 25 : 0) + 0.4 * azm(i + 1));
    healthDays.push({ date, azm: azm(i), restingHr: 48 + Math.round(4 * rnd(i, 3)) + (i >= 26 && i <= 31 ? 3 : 0), hrvMs: 45 + Math.round(15 * rnd(i, 4)), steps: 5000 + Math.round(6000 * rnd(i, 5)), sleep: { asleepMin: sleep, deepMin: 70, remMin: 85, lightMin: 220, awakeMin: 20, start: '23:20', end: '06:50', efficiency: 88 + Math.round(6 * rnd(i, 6)) }, spo2: 95 + Math.round(2 * rnd(i, 7)), breath: 14, kcal: 2100 + Math.round(500 * rnd(i, 8)), kcalActive: 550, hrMax: 135 + Math.round(30 * rnd(i, 9)), src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day, km) => ({
    id: `${P}${id}`, day, time: '17:10', start: `${day}T15:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km, hm: 300, movingS: 4800, elapsedS: 5100, gearId: null,
    hrAvg: 132, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 85, tempAvg: 12, wNorm: null, kj: null, effort: 60, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 800,
  });
  const activities = [];
  for (let i = 1; i < 90; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i), 25 + (i % 5) * 6));
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
  for (let i = 0; i < 90; i++) flowChecks.push({ day: addDays(TODAY, -i), sleep: 5 + Math.round(4 * rnd(i, 10)), energy: 4 + Math.round(5 * rnd(i, 11)), mood: 5 + Math.round(4 * rnd(i, 12)) });
  const trips = [{ id: `${P}trip`, name: 'Probefahrt Jura', domain: 'bike', status: 'done', startDate: addDays(TODAY, -30), days: 4 }];
  return { healthDays, activities, flowLog, flowChecks, trips };
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
const shot = (page, name, info) => process.env.ANALYSE_SHOTS && page.screenshot({ path: `qa/analyse/${name}-${info.project.name}.png`, fullPage: true });

test('Eigenes Diagramm: the D1 values under each other, a tapped day with all values', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const dg = page.locator('[data-diagram]');
  await expect(dg).toBeVisible();
  // at the top: before the tiles' choice
  const [yd, yp] = await Promise.all([dg.boundingBox(), page.locator('.pick').boundingBox()]);
  expect(yd.y).toBeLessThan(yp.y);
  await expect(dg.locator('[data-dg-row]')).toHaveCount(DEFAULT_KEYS.length);
  for (const k of DEFAULT_KEYS) await expect(dg.locator(`[data-dg-row="${k}"]`), k).toBeVisible();
  await expect(dg.locator('[data-dg-row="rhr"] rect.band')).toHaveCount(1);
  await expect(dg.locator('[data-dg-row="km:bike"] rect.bar').first()).toBeVisible();
  await shot(page, 'diagramm', info);
  // tap a day in the resting pulse row: a line through all rows and the day with every value
  const svg = dg.locator('[data-dg-row="rhr"] svg[role="img"]');
  const box = await svg.boundingBox();
  await svg.click({ position: { x: box.width - 2, y: box.height / 2 } });
  const sheet = page.locator('[data-day-sheet]');
  await expect(sheet).toHaveAttribute('data-day-sheet', TODAY);
  await expect(sheet).toContainText(T('Resting pulse'));
  await expect(sheet.locator('[data-ticked]')).toContainText('Meditation');
  await sheet.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/diagramm-tag-${info.project.name}.png` });
  await sheet.locator('[data-prev]').click();
  await expect(sheet).toHaveAttribute('data-day-sheet', addDays(TODAY, -1));
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await expect(dg.locator('[data-dg-pv]')).toHaveCount(DEFAULT_KEYS.length);
  expect(errors).toEqual([]);
});

test('Eigenes Diagramm: add with search up to 6, remove, reorder, on top of each other, weeks; it stays', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const dg = page.locator('[data-diagram]');
  await dg.locator('[data-dg-add]').click();
  const vp = page.locator('[data-value-picker]');
  await vp.locator('[data-find]').fill('sauna');
  await vp.locator('[data-pick="act:sauna"]').click();
  await expect(vp.locator('[data-count]')).toHaveText(T('{n} of {max} chosen|diagram').replace('{n}', '6').replace('{max}', '6'));
  await vp.locator('[data-find]').fill('');
  await expect(vp.locator('[data-pick="hrv"]')).toBeDisabled();
  await vp.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/diagramm-wert-${info.project.name}.png` });
  await vp.getByRole('button', { name: T('Done'), exact: true }).click();
  await expect(dg.locator('[data-dg-row]')).toHaveCount(6);
  await expect(dg.locator('[data-dg-add]')).toHaveCount(0);
  // remove one, reorder with the arrows
  await dg.locator('[data-dg-value="azm"] .x').click();
  await expect(dg.locator('[data-dg-row]')).toHaveCount(5);
  const dot = () => dg.locator('[data-dg-value="rhr"] .dot').evaluate((el) => getComputedStyle(el).backgroundColor);
  const before = await dot();
  await dg.locator('[data-dg-sort]').click();
  await dg.locator('[data-dg-order] li').first().locator('.sort-ar').nth(1).click();
  await expect(dg.locator('[data-dg-row]').first()).toHaveAttribute('data-dg-row', 'rhr');
  expect(await dot(), 'a value keeps its colour').toBe(before);
  // on top of each other: one picture, one line per value
  await dg.getByRole('button', { name: T('On top of each other|diagram'), exact: true }).click();
  await expect(dg.locator('.over svg path.smooth')).toHaveCount(5);
  await shot(page, 'diagramm-uebereinander', info);
  // one point per week
  await dg.getByRole('button', { name: T('Week|diagram'), exact: true }).click();
  await dg.getByRole('button', { name: T('Under each other|diagram'), exact: true }).click();
  const bars = await dg.locator('[data-dg-row="km:bike"] rect.bar').count();
  expect(bars).toBeGreaterThan(8);
  expect(bars).toBeLessThan(15);
  // it stays after a reload
  await page.reload();
  await ready(page);
  await expect(dg.locator('[data-dg-row]').first()).toHaveAttribute('data-dg-row', 'rhr');
  await expect(dg.locator('[data-dg-row="azm"]')).toHaveCount(0);
  await expect(dg.getByRole('button', { name: T('Week|diagram'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('Eigenes Diagramm: a filter for everything, one for a single value, marked days; days left out stay gaps', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const dg = page.locator('[data-diagram]');
  const points = (k) => dg.locator(`[data-dg-row="${k}"] rect.bar`).count();
  await expect(dg.locator('[data-dg-row="azm"] rect.bar').first()).toBeVisible();
  const before = await points('azm');
  await dg.locator('[data-dg-filter]').click();
  const fs = page.locator('[data-filter-sheet="all"]');
  // only Monday to Friday, without sauna, marked: gym
  await fs.locator('[data-wd="5"]').click();
  await fs.locator('[data-wd="6"]').click();
  await fs.locator('[data-act-pick]').selectOption({ label: 'Sauna' });
  await fs.locator('[data-act-without]').click();
  await fs.locator('[data-mark]').selectOption({ label: 'Gym' });
  await fs.evaluate((el) => Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished)));
  if (process.env.ANALYSE_SHOTS) await page.screenshot({ path: `qa/analyse/diagramm-filter-${info.project.name}.png` });
  await fs.locator('[data-apply]').click();
  await expect(dg.locator('[data-dg-filter]')).toContainText('2');
  await expect(dg.locator('[data-dg-part="wd"]')).toContainText(/Mo.Fr/);
  await expect(dg.locator('[data-dg-part="act"]')).toContainText('Sauna');
  await expect(dg.locator('[data-dg-kept]')).toContainText('90');
  const after = await points('azm');
  expect(after).toBeLessThan(before);
  await expect(dg.locator('[data-dg-row="rhr"] circle.mk').first()).toBeVisible();
  await shot(page, 'diagramm-gefiltert', info);
  // a filter only for the bike km: only trip days
  await dg.locator('[data-dg-row-filter="km:bike"]').click();
  const one = page.locator('[data-filter-sheet="value"]');
  await one.locator('[data-trip="only"]').click();
  await one.locator('[data-apply]').click();
  await expect(dg.locator('[data-dg-row="km:bike"] .ownf')).toBeVisible();
  expect(await points('km:bike')).toBeLessThan(4);
  expect(await points('azm')).toBe(after);
  // × takes one part away; the filters stay after a reload
  await dg.locator('[data-dg-part="act"] .x').click();
  await page.reload();
  await ready(page);
  await expect(dg.locator('[data-dg-part="act"]')).toHaveCount(0);
  await expect(dg.locator('[data-dg-part="wd"]')).toBeVisible();
  await expect(dg.locator('[data-dg-row="km:bike"] .ownf')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Was hängt zusammen?: one value against another with an offset, in words, the strongest links as a list', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/auswerten/analyse');
  const zh = page.locator('[data-links]');
  await expect(zh).toBeVisible();
  // under the diagram
  const [yd, yz] = await Promise.all([page.locator('[data-diagram]').boundingBox(), zh.boundingBox()]);
  expect(yz.y).toBeGreaterThan(yd.y);
  await expect(zh.locator('[data-link-x]')).toHaveValue('azm');
  await expect(zh.locator('[data-link-y]')).toHaveValue('sleep');
  await expect(zh.locator('circle.pt').first()).toBeVisible();
  await expect(zh.locator('circle.pt.on').first()).toBeVisible();
  await expect(zh.locator('[data-link-word]')).toBeVisible();
  await expect(zh.locator('[data-link-text]')).toContainText(T('Only an observation|link'));
  await expect(zh.locator('[data-link-list] tbody tr').first()).toBeVisible();
  await zh.scrollIntoViewIfNeeded();
  await shot(page, 'zusammenhang', info);
  // the same day instead of the day after
  const n1 = await zh.locator('circle.pt').count();
  await zh.getByRole('button', { name: T('the same day|link'), exact: true }).click();
  await expect(zh.getByRole('button', { name: T('the same day|link'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(Math.abs((await zh.locator('circle.pt').count()) - n1)).toBeLessThanOrEqual(2);
  // a line of the list shows that pair
  const row = zh.locator('[data-link-row]').first();
  const [x, y] = (await row.getAttribute('data-link-row')).split('|');
  await row.click();
  await expect(zh.locator('[data-link-x]')).toHaveValue(x);
  await expect(zh.locator('[data-link-y]')).toHaveValue(y);
  // a point opens its day
  await zh.locator('circle.pt').first().dispatchEvent('click');
  await expect(page.locator('[data-day-sheet]')).toBeVisible();
  expect(errors).toEqual([]);
});
