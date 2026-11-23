// «Erkenntnisse» (Noah 19.10.2026 «4b» + «zusätzlich eine eigene Seite»): what goes together in your data,
// in the Auswertung (the three strongest) and on its own page Ich › Erkenntnisse. Phone 390 and desktop 1440,
// German, a fixed clock in Europe/Zurich, fictional data only: 30 days of Fitbit sleep and resting pulse and
// the battery of «Wi gaht's?» (more sleep, fuller battery), the last three days a high resting pulse.
// SHOTS=<folder> saves full-page screenshots (light).
import { test, expect } from '@playwright/test';
import { viaTab } from './placetab.js'; // UI-Ziele #6: the pages that were rows under Ich are tabs now
import DE from '../../src/lib/i18n/de/index.js';
import { lastDays } from '../../src/lib/erkenntnisse.js';
import { ready } from './settle.js';
import { put } from './aktiv-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const DAY = '2026-10-19';

function data() {
  const days = lastDays(DAY, 30);
  const healthDays = days.map((date, i) => ({ date, sleep: { asleepMin: 360 + (i % 3) * 60 }, restingHr: i >= 27 ? 62 : 50 + (i % 2), src: 'test' }));
  const abAnswers = days.map((day, i) => ({ id: `test_data_gtp_ab_${i}`, qid: 'erholung.akku', area: 'erholung', day, at: `${day}T07:10`, slot: `${day}T07:00`, kind: 'scale', value: 4 + (i % 3) * 2, note: null, unit: null, src: 'hand' }));
  // sauna on every third day (the night after is the longest): an activity of Aktiv that goes with the night
  const flowLog = days.filter((_, i) => i % 3 === 1).map((day) => ({ id: `test_sauna_${day}`, actId: 'sauna', day, at: `${day}T19:00:00+02:00`, min: 30 }));
  return { healthDays, abAnswers, flowLog };
}

async function open(page, context, withData = true) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me');
  await ready(page);
  if (withData) await put(page, data());
  return errors;
}
async function shot(page, info, name) {
  if (!process.env.SHOTS) return;
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}
const noScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test('own page: the sentence about sleep and battery, the resting pulse note, what still waits', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/me/insights');
  await expect(page.getByRole('heading', { level: 1, name: T('Insights') })).toBeVisible();
  const sec = page.locator('[data-section="insights"]');
  const ins = sec.locator('[data-insight="sleep-battery"]');
  await expect(ins).toContainText(T('On days with {x}, {y} was {hi} on average, otherwise {lo}.', { x: T('more than {v} h of sleep', { v: '7' }), y: T('your battery|insight'), hi: '8', lo: '5' }));
  await expect(ins.locator('[data-sure="sure"]')).toContainText(T('Sure'));
  await expect(sec.locator('[data-insights-how]')).toBeVisible();
  await expect(sec.locator('[data-rhr-high]')).toContainText('62, 62, 62');
  await expect(sec.locator('[data-waiting="km-mood"]')).toContainText(T('{n} of {m} days', { n: 0, m: 14 }));
  await expect(sec).toContainText(T('Going together is not a cause. Only to look at, never a diagnosis. Everything stays on the device.'));
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'erkenntnisse-seite');
  expect(errors).toEqual([]);
});

test('Auswertung shows the strongest three and leads to the page; Ich has a row', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/me/analysis');
  const sec = page.locator('[data-section="insights"]');
  await expect(sec.locator('[data-insight="sleep-battery"]')).toBeVisible();
  expect(await sec.locator('[data-insight]').count()).toBeLessThanOrEqual(3);
  await expect(sec.locator('[data-waiting]')).toHaveCount(0);
  await shot(page, info, 'erkenntnisse-auswertung');
  await sec.locator('[data-insights-all]').click();
  await expect(page).toHaveURL(/#\/me\/insights$/);
  await viaTab(page, 'analysis', '#/me/insights'); // UI-Ziele #6: Auswerten › Zusammenhänge
  await expect(page.getByRole('heading', { level: 1, name: T('Insights') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('without data: one calm line, no sentence', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(`${DAY}T12:00:00+02:00`) });
  await page.goto('./#/me/insights');
  await ready(page);
  const sec = page.locator('[data-section="insights"]');
  await expect(sec.locator('[data-insights-none]')).toBeVisible();
  await expect(sec.locator('[data-insight]')).toHaveCount(0);
});

// Noah 19.10.2026 «2a 3a 4a und b möglich»: weather and daylight (Open-Meteo, here a fixed answer), appointments
// per day and own number questions, each own question switchable off. Fictional data only.
test('weather, appointments and an own question are compared; the own question can be switched off', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const days = lastDays(DAY, 30);
  const before = days.slice(0, -1);
  await context.route(/^https:\/\/api\.open-meteo\.com\//, (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ daily: { time: days, temperature_2m_max: days.map(() => 12), precipitation_sum: days.map(() => 0), sunshine_duration: days.map((_, i) => (i % 2 ? 8 : 1) * 3600), daylight_duration: days.map(() => 11 * 3600) } }),
    }),
  );
  const mood = before.map((day, i) => ({ id: `test_data_gtp_mood_${i}`, qid: 'spass.stimmung', area: 'spass', day, at: `${day}T20:10`, slot: `${day}T20:00`, kind: 'scale', value: i % 2 ? 8 : 5, note: null, unit: null, src: 'hand' }));
  const own = before.map((day, i) => ({ id: `test_data_gtp_own_${i}`, qid: 'own-test', area: 'eigene', day, at: `${day}T20:10`, slot: `${day}T20:00`, kind: 'number', value: i % 2 ? 3 : 0, note: null, unit: 'cups', src: 'hand' }));
  const cfg = { since: `${days[0]}T00:00`, q: { 'own-test': { on: true, since: `${days[0]}T00:00` } }, own: [{ id: 'own-test', area: 'eigene', text: 'Testtassen', form: { kind: 'number', unit: 'cups' }, every: { kind: 'daily', time: '20:00' } }] };
  await put(page, {
    abAnswers: [...mood, ...own],
    settings: [{ key: 'homePlace', value: { name: 'Testdorf', lat: 46.9, lon: 7.4 } }, { key: 'abfragen', value: cfg }],
    meta: [{ key: 'dayEvents', days: Object.fromEntries(before.map((d, i) => [d, i % 2 ? 1 : 6])) }],
  });
  await page.goto('./#/me/insights');
  const sec = page.locator('[data-section="insights"]');
  await expect(sec.locator('[data-insight="sun-mood"]')).toContainText(T('your mood|insight'));
  await expect(sec.locator('[data-insight="evts-mood"]')).toBeVisible();
  const ownIns = sec.locator('[data-insight="own-own-test-mood"]');
  await expect(ownIns).toContainText('Testtassen');
  await expect(sec.locator('[data-insights-sources]')).toContainText(T('Also compared'));
  await expect(sec.locator('[data-insights-noplace]')).toHaveCount(0);
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'erkenntnisse-quellen');
  await sec.locator('[data-insights-own="own-test"] input').click();
  await expect(ownIns).toHaveCount(0);
  await sec.locator('[data-insights-own="own-test"] input').click();
  await expect(ownIns).toBeVisible();
  expect(errors).toEqual([]);
});

// Noah 23.11.2026 «ja» (Thread «Zusammenhänge nützlicher machen»): the strongest levers with a tip, every activity of Aktiv compared,
// a tap shows the days with and without, «Bald sichtbar» instead of the long list (which stays behind a fold), a try with an end, the path.
test('levers, a picture with and without, soon visible, a try with an end, the right path', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await page.goto('./#/me/insights');
  await expect(page.getByRole('heading', { level: 1, name: T('Insights') })).toBeVisible();
  // the path says Auswerten › Körper (not Ich › Daten)
  await expect(page.getByRole('link', { name: T('Analysis|place') }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: T('Data'), exact: true })).toHaveCount(0);
  const lev = page.locator('[data-levers]');
  await expect(lev).toContainText(T('Your strongest levers'));
  expect(await lev.locator('[data-lever]').count()).toBeLessThanOrEqual(3);
  // the strongest lever is sleep → battery, with a tip
  const first = lev.locator('[data-lever="sleep-battery"]');
  await expect(first).toContainText(T('Try it today: go to bed earlier.'));
  // an activity of Aktiv is a lever too (sauna, the night after)
  const sauna = lev.locator('[data-lever^="act-sauna"]');
  await expect(sauna).toHaveCount(1);
  await expect(sauna).toContainText(T('Try it today: {name}.', { name: 'Sauna' }));
  // a tap shows the little picture
  await first.locator('button.row').click();
  await expect(first.locator('[data-mit-ohne] circle').first()).toBeVisible();
  await expect(first.locator('[data-mit-ohne]')).toContainText(T('Otherwise'));
  // a test with an end starts a try in «Experiment mit Ende»
  await first.locator('[data-try-start]').click();
  await expect(first.locator('[data-try-running]')).toBeVisible();
  // the try is there in «Experiment mit Ende», with its question
  await first.locator('[data-try-running] a').click();
  await expect(page).toHaveURL(/#\/me\/ruhig\/versuche/);
  await expect(page.locator('body')).toContainText(T('What changes with «{x}»: {y}?', { x: T('more than {v} h of sleep', { v: '7' }), y: T('Battery|lever') }));
  await page.goBack();
  await expect(page.locator('[data-levers]')).toBeVisible();
  // the list is tappable too, the long list of pairs without days is behind a fold, with a headline
  const sec = page.locator('[data-section="insights"]');
  await sec.locator('[data-insight="sleep-battery"] button.row').click();
  await expect(sec.locator('[data-insight="sleep-battery"] [data-mit-ohne]')).toBeVisible();
  await expect(page.locator('[data-soon]')).toBeVisible();
  await expect(page.locator('[data-waiting-all]')).not.toHaveAttribute('open', '');
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'zusammenhaenge-hebel');
  expect(errors).toEqual([]);
});

// Noah 23.11.2026 «Muster» (Thread «Zusammenhänge nützlicher machen»): the days of the week, the recovery after a hard day, the best range,
// the days against a sentence. 60 fictional days: Mondays have the lowest battery, every 7th day is hard (260 active zone minutes) and the
// resting pulse is raised the day after.
test('weekdays, recovery after a hard day, best range and the days against a sentence', async ({ page, context }, info) => {
  const errors = await open(page, context, false);
  const days = lastDays(DAY, 60);
  const dow = (d) => (new Date(`${d}T12:00:00Z`).getUTCDay() + 6) % 7;
  const hard = (i) => i % 7 === 3;
  const healthDays = days.map((date, i) => ({ date, sleep: { asleepMin: 330 + (i % 5) * 30 }, restingHr: 50 + (i > 0 && hard(i - 1) ? 4 : 0) + (i % 2 ? 1 : 0), azm: hard(i) ? 260 : 30 + (i % 4) * 10, hrvMs: 40, src: 'test' }));
  const abAnswers = days.map((day, i) => ({ id: `test_data_gtp_m_${i}`, qid: 'erholung.akku', area: 'erholung', day, at: `${day}T07:10`, slot: `${day}T07:00`, kind: 'scale', value: (dow(day) === 0 ? 3 : 7) + (i % 3) * 0.2 + (330 + (i % 5) * 30 > 420 ? 1 : 0), note: null, unit: null, src: 'hand' }));
  await put(page, { healthDays, abAnswers });
  await page.goto('./#/me/insights');
  const wd = page.locator('[data-weekday="battery"]');
  await expect(wd).toBeVisible();
  await expect(page.locator('[data-weekdays]')).toContainText(new Date(Date.UTC(2026, 0, 5)).toLocaleDateString('de-CH', { weekday: 'long', timeZone: 'UTC' }));
  const rec = page.locator('[data-recovery]');
  await expect(rec).toContainText(T('Recovery'));
  await expect(rec.locator('[data-recovery-step="1"]')).toContainText('+');
  // the best range and the days against it, in the opened sentence
  const row = page.locator('[data-insight="sleep-battery"]');
  await row.locator('button.row').click();
  await expect(row.locator('[data-best-band]')).toContainText(T('Best range: {r}', { r: '' }).trim().split(' ')[0]);
  expect(await noScroll(page)).toBe(true);
  await shot(page, info, 'zusammenhaenge-muster');
  expect(errors).toEqual([]);
});
