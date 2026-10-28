// «Form und Erholung» (Noah 20.10.2026 «1a 2b 3a 4a 5a») and the Garmin overview («baue sie 1:1 nach»),
// German, phone + desktop, fictional Fitbit days, Strava activities, a trip and a morning check written
// into the app's IndexedDB, the clock on Friday 9 October 2026.
// 1. Aktiv: the readiness card on top (number, sentence, the tour in 3 days); «Aktivitäten von heute»,
//    «Im Fokus» per sport, «Überblick» 2×2 (heart rate, minutes, calories, sleep), «Letzte 7 Tage».
// 2. The sport page: 7 days / 4 weeks / 1 year, the tabs, back in time; the heart rate page.
// 3. «Körperwerte»: five groups, the tabs of each, blood pressure and water entered and deleted (Undo),
//    the kilometres of the year and temperature against pulse.
// 4. The page «Form»: what counts today (the morning check too), the 12 weeks, the tour readiness.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';
import { openOverview } from './ov-fold.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const P = 'test_data_fu_';

function rows() {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    healthDays.push({ date, azm: 20 + (i % 5) * 5, restingHr: 50 + (i % 3), hrvMs: 45 + (i % 4), steps: 9000, sleep: { asleepMin: 420 + (i % 6) * 5, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: '23:05', end: '06:55', efficiency: 90 + (i % 5) }, spo2: 95 + (i % 3), breath: 14, kcal: 2300 + i, kcalActive: 600, hrMax: 150 + (i % 7), src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day, kind, type, km, hm, movingS, hrAvg, effort) => ({
    id: `${P}${id}`, day, time: '07:10', start: `${day}T05:10:00Z`, name: `${P}${id}`, type, kind, km, hm, movingS, elapsedS: movingS + 300, gearId: null,
    hrAvg, hrMax: hrAvg + 25, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: kind === 'bike' ? 84 : null, hist: { 120: movingS / 2, 150: movingS / 2 },
    tempAvg: kind === 'bike' ? 4 + (km % 20) : null, wNorm: null, kj: null, effort, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: Math.round(movingS / 6),
  });
  const activities = [act('heute', TODAY, 'bike', 'GravelRide', 20.7, 250, 4094, 138, 70)];
  for (let i = 2; i < 70; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i), 'bike', 'Ride', 30 + (i % 4) * 5, 400, 5400, 135, 80));
  activities.push(act('lauf', addDays(TODAY, -1), 'run', 'Run', 8, 90, 2700, 150, 45));
  const trips = [{ id: `${P}trip`, title: `${P}Testtour`, startDate: addDays(TODAY, 3), days: 4, status: 'planned', entries: [], createdAt: `${TODAY}T07:00:00Z` }];
  const flowChecks = [{ day: TODAY, sleep: 8, energy: 9, mood: 7 }];
  const flowLog = [{ id: `${P}med`, actId: 'meditation', day: TODAY, at: `${TODAY}T07:00:00+02:00`, min: 20 }];
  return { healthDays, activities, trips, flowChecks, flowLog };
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
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('Auswerten: readiness on top, then the Garmin overview', async ({ page, context }) => {
  const errors = await open(page, context);
  // «Aktiv neu» (Noah 22.10.2026): the form card and the overview are on the start of Auswerten
  await go(page, '#/auswerten');
  const card = page.locator('[data-section="form"]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-form-score]')).toHaveText(/^\d{1,3}$/);
  await expect(card.locator('[data-form-line]')).not.toBeEmpty();
  await expect(card.locator('[data-form-tour]')).toContainText(`${P}Testtour`);
  // on top: the card comes before the overview
  const cardY = (await card.boundingBox()).y;
  expect(cardY).toBeLessThan((await page.locator('[data-today-act]').boundingBox()).y);

  await expect(page.locator('[data-today-act]')).toHaveCount(1);
  await expect(page.locator('[data-today-act]')).toContainText('20.7 km');
  const focus = page.locator('[data-focus-card="bike"]');
  await expect(focus).toBeVisible();
  await expect(focus.locator('.b')).toHaveCount(7);
  await expect(focus.locator('.dots i')).toHaveCount(28);
  await expect(page.locator('[data-focus-card="run"]')).toHaveCount(1);
  await openOverview(page);
  const ov = page.locator('[data-overview]');
  await expect(ov.locator('[data-ov="hr"]')).toContainText('bpm');
  await expect(ov.locator('[data-section="azm"] [data-azm-sum]')).not.toBeEmpty();
  await expect(ov.locator('[data-section="azm"] [data-day]')).toHaveCount(7);
  await expect(ov.locator('[data-ov="kcal"]')).toContainText(T('At rest|kcal'));
  await expect(ov.locator('[data-ov="sleep"]')).toContainText(' h ');
  await expect(page.locator('[data-l7="bike"]')).toContainText('km');
  await expect(page.locator('[data-l7="run"]')).toBeVisible();
  await expect(page.locator('[data-section="week-numbers"] [data-wn]')).toHaveCount(6);
  await fits(page, 'Aktiv');
  await page.locator('[data-section="form"]').screenshot({ path: 'qa/form-uebersicht/aktiv-form.png' });
  await page.locator('[data-overview]').screenshot({ path: 'qa/form-uebersicht/aktiv-ueberblick.png' });

  await focus.click();
  await expect(page).toHaveURL(/#\/flow\/stats\/bike$/);
  expect(errors).toEqual([]);
});

test('the sport page and the heart rate page', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow/stats/bike');
  const st = page.locator('[data-stats="bike"]');
  await expect(st.locator('[data-page-title]')).toHaveText(T('Bike|kind'));
  await expect(st.locator('.bc')).toHaveCount(7);
  await expect(st.locator('[data-total]')).toContainText('km');
  await expect(st.locator(`[data-stat-act="${P}heute"]`)).toBeVisible();
  await st.locator('[data-ranges] [data-key="w4"]').click();
  await expect(st.locator('.bc')).toHaveCount(28);
  await st.locator('[data-ranges] [data-key="y1"]').click();
  await expect(st.locator('.bc')).toHaveCount(12);
  await st.locator('[data-tab="time"]').click();
  await expect(st.locator('[data-total]')).toHaveText(/\d+:\d{2}:\d{2}/);
  await st.locator('[data-ranges] [data-key="d7"]').click();
  const span = await st.locator('[data-span]').textContent();
  await st.locator('[data-back]').click();
  await expect(st.locator('[data-span]')).not.toHaveText(span);
  await fits(page, 'Sportart');
  await page.screenshot({ path: 'qa/form-uebersicht/sportart.png' });

  await go(page, '#/flow/stats/hr');
  const hr = page.locator('[data-stats="hr"]');
  await expect(hr.locator('[data-hr-rest]')).toHaveText(/^5\d bpm$/);
  await expect(hr.locator('[data-hr-high]')).toHaveText(/^1\d\d bpm$/);
  await expect(hr.locator('[data-hr-day]')).toHaveCount(7);
  await expect(hr.locator(`[data-hr-day="${TODAY}"]`)).toContainText('bpm');
  await fits(page, 'Herzfrequenz');
  expect(errors).toEqual([]);
});

test('the page «Form»: what counts, 12 weeks, tour readiness', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow/form');
  await expect(page.locator('[data-page-title]')).toHaveText(T('Form and recovery'));
  await expect(page.locator('[data-form-now] [data-form-score]')).toContainText('/100');
  const parts = page.locator('[data-form-parts]');
  for (const k of ['rhr', 'hrv', 'sleep', 'feltSleep', 'energy', 'form']) await expect(parts.locator(`[data-part="${k}"]`)).toBeVisible();
  await expect(parts.locator('[data-part="energy"]')).toContainText('9');
  await expect(page.locator('[data-form-curve] svg.lines path')).toHaveCount(2);
  await expect(page.locator('[data-form-curve] svg.rhr')).toBeVisible();
  await expect(page.locator('[data-tour-now]')).toContainText(`${P}Testtour`);
  await expect(page.locator('[data-form-tours] .td li')).toHaveCount(4);
  await fits(page, 'Form');
  await page.screenshot({ path: 'qa/form-uebersicht/form.png', fullPage: true });
  expect(errors).toEqual([]);
});

// «Diagramme zum Antippen» K1 (Noah 27.10.2026 «1-5 a»): «Verlauf» has axes, the exact day on pointing, a
// window behind a tap, the span switch, the parts on and off and «Als Tabelle». Fictional data.
test('the page «Form»: Verlauf with axes, exact numbers, the day behind a tap', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await go(page, '#/flow/form');
  const ch = page.locator('[data-chart="formweeks"]');
  await expect(ch).toBeVisible();
  // three axes (lines, form, resting pulse), each with at least three round labels; lines from 0
  const axes = ch.locator('[data-yticks]');
  await expect(axes).toHaveCount(3);
  for (let i = 0; i < 3; i++) expect(await axes.nth(i).locator('span').count()).toBeGreaterThanOrEqual(3);
  await expect(axes.first().locator('span').first()).toHaveText('0');
  await expect(ch.locator('[data-normal]')).toHaveCount(1);
  if (process.env.SHOTS) await page.locator('[data-form-curve]').screenshot({ path: `${process.env.SHOTS}/verlauf-12wo-${info.project.name === 'phone' ? 390 : 1440}.png` });
  // at least three dates under the chart, the last is today
  expect(await ch.locator('[data-xdates] span').count()).toBeGreaterThanOrEqual(3);
  await expect(ch.locator('[data-xdates] span').last()).toHaveText(T('today'));
  // the line above shows today; keyboard: Home is the first day, Enter opens it
  await expect(ch.locator('[data-readout]')).toContainText(T('today'));
  const plot = ch.locator('[data-plot]');
  expect(Number(await plot.getAttribute('data-n'))).toBe(84);
  await plot.focus();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowLeft');
  await expect(ch.locator('[data-readout]')).not.toContainText(T('today'));
  await page.keyboard.press('Enter');
  const sheet = page.locator('[data-chart-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-sheet-vals] div')).toHaveCount(5);
  await expect(sheet.locator('[data-sheet-acts] li')).toContainText(`${P}lauf`);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/verlauf-tag-${info.project.name === 'phone' ? 390 : 1440}.png` });
  await sheet.getByRole('button', { name: T('Next day') }).click();
  await expect(sheet.locator('[data-sheet-acts] li')).toContainText(`${P}heute`);
  await expect(sheet.getByRole('button', { name: T('Next day') })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  // a tap on the chart opens a day too
  const pa = ch.locator('.pa');
  await pa.scrollIntoViewIfNeeded();
  const b = await pa.boundingBox();
  await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.5);
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: T('Close') }).click();
  // hide the resting pulse: its axis goes; 4 weeks: 28 days
  await ch.locator('[data-layer="rhr"]').click();
  await expect(ch.locator('[data-layer="rhr"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(axes).toHaveCount(2);
  await ch.getByRole('button', { name: T('4 wk|span') }).click();
  await expect(plot).toHaveAttribute('data-n', '28');
  if (process.env.SHOTS) await ch.screenshot({ path: `${process.env.SHOTS}/verlauf-${info.project.name === 'phone' ? 390 : 1440}.png` });
  // «Als Tabelle»: the days as rows
  await ch.getByRole('button', { name: T('As table') }).click();
  await expect(ch.locator('[data-chart-table]')).toBeVisible();
  expect(await ch.locator('[data-chart-table] tbody tr').count()).toBeGreaterThan(5);
  await fits(page, 'Verlauf');
  expect(errors).toEqual([]);
});

test('Körperwerte: groups, tabs, own entries', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow/stats/hr');
  const st = page.locator('[data-stats="hr"]');
  const groups = st.locator('[data-bgroups] [data-key]');
  await expect(groups).toHaveCount(5);
  await expect(groups.nth(0)).toHaveText(T('Heart|group'));
  await expect(st.locator('[data-btab]')).toHaveCount(5);
  await st.locator('[data-btab="spo2"]').click();
  await expect(st.locator('[data-body="spo2"] [data-body-mean]')).toContainText('%');
  await fits(page, 'Herz');

  // blood pressure: enter, see it, delete, undo
  await st.locator('[data-btab="bp"]').click();
  await st.locator('[data-bp-sys]').fill('300');
  await st.locator('[data-bp-dia]').fill('80');
  await st.locator('[data-bp-save]').click();
  await expect(st.locator('[data-bp-form] .err')).toBeVisible();
  await st.locator('[data-bp-sys]').fill('121');
  await st.locator('[data-bp-save]').click();
  await expect(st.locator(`[data-body-day="${TODAY}"]`)).toContainText('121/80');
  await expect(st.locator('[data-body="bp"] [data-legend] li')).toHaveCount(2);
  await st.locator(`[data-entry-del="${TODAY}"]`).click();
  await page.getByRole('dialog').getByRole('button', { name: T('Delete') }).click();
  await expect(st.locator(`[data-body-day="${TODAY}"]`)).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(st.locator(`[data-body-day="${TODAY}"]`)).toContainText('121/80');
  await fits(page, 'Blutdruck');

  // sleep: phases stacked, efficiency, bedtime with its spread
  await st.locator('[data-bgroups] [data-key="sleep"]').click();
  await expect(st.locator('[data-btab="sleep"]')).toHaveAttribute('aria-selected', 'true');
  await st.locator('[data-btab="stages"]').click();
  await expect(st.locator('[data-body="stages"] .stk')).toHaveCount(7);
  await st.locator('[data-btab="bed"]').click();
  await expect(st.locator('[data-body="bed"] [data-body-mean]')).toHaveText('23:05');
  await expect(st.locator('[data-bed-spread]')).toContainText('± 0');

  // activity: zones and meditation
  await st.locator('[data-bgroups] [data-key="act"]').click();
  await st.locator('[data-btab="zones"]').click();
  await expect(st.locator('[data-body="zones"] [data-legend] li')).toHaveCount(5);
  await st.locator('[data-btab="med"]').click();
  await expect(st.locator(`[data-body-day="${TODAY}"]`)).toContainText('20');

  // body: water
  await st.locator('[data-bgroups] [data-key="body"]').click();
  await st.locator('[data-btab="water"]').click();
  await st.locator('[data-water-l]').fill('2,5');
  await st.locator('[data-water-save]').click();
  await expect(st.locator(`[data-body-day="${TODAY}"]`)).toContainText(/2[.,]5 l/);
  await fits(page, 'Trinkmenge');

  // bike: cadence, the year, temperature and pulse
  await st.locator('[data-bgroups] [data-key="bike"]').click();
  await st.locator('[data-btab="cad"]').click();
  await expect(st.locator('[data-body="cad"] [data-body-mean]')).toContainText('84');
  await st.locator('[data-btab="year"]').click();
  await expect(st.locator('[data-ranges]')).toHaveCount(0);
  await expect(st.locator('[data-year-now]')).toContainText('km');
  await st.locator('[data-btab="temp"]').click();
  await st.locator('[data-ranges] [data-key="y1"]').click();
  await expect(st.locator('[data-temp-dot]').first()).toBeVisible();
  await expect(st.locator('[data-band]')).toHaveCount(3);
  await fits(page, 'Velo');
  await page.screenshot({ path: 'qa/form-uebersicht/koerperwerte.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('Fitbit everywhere: Erholung shows the latest night next to your normal', async ({ page, context }) => {
  const errors = await open(page, context);
  await go(page, '#/flow/rest');
  const fit = page.locator('[data-rest-fitbit]');
  await expect(fit.locator('[data-fit="pulse"] b')).toHaveText(/^5\d$/);
  await expect(fit.locator('[data-fit="sleep"]')).toContainText(' h');
  await expect(fit.locator('[data-fit="hrv"]')).toContainText('ms');
  await fits(page, 'Erholung');
  expect(errors).toEqual([]);
});
