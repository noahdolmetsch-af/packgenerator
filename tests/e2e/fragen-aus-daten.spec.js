// «Fragen aus deinen Daten» (Noah 03.11.2026 «1b 2a 3a 4a 5a», «bau stufe 1»), German UI, phone 390 and desktop 1440,
// fictional data (home0460-fixture.js; the clock on Friday 9 October 2026, 09:00):
// - a resting pulse of 61 against a usual of 52: the morning window asks first, with «Warum frage ich das?»
// - the answer lands in the history; a normal day asks nothing; the switch under Deine Abfragen turns the rule off
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome, homeFixture, day } from './home0460-fixture.js';
import { QUESTIONS, ON_AT_START } from '../../src/lib/abfragen.js';

const SHOTS = '/tmp/claude-0/sn-shots/fad';
const shot = async (page, info, name) => {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
};

function data(todayHr, { sleepMin = null, moods = null, sport = null, cfg = null, guess = false } = {}) {
  const d = homeFixture();
  const q = Object.fromEntries(QUESTIONS.filter((x) => ON_AT_START.has(x.id) && x.id !== 'erholung.akku').map((x) => [x.id, { on: false }]));
  d.tables.settings.push({ key: 'abfragen', value: { since: `${day(-1)}T19:00`, q, own: [] } });
  d.tables.healthDays = [
    // guess: long nights (8 h) go with a good mood (8), short ones (5 h) with a low one (5), every other day
    ...Array.from({ length: 20 }, (_, i) => ({ date: day(-(i + 1)), restingHr: 51 + (i % 3), ...(guess ? { sleep: { asleepMin: i % 2 ? 300 : 480 } } : {}) })),
    { date: day(0), restingHr: todayHr, ...(sleepMin != null ? { sleep: { asleepMin: sleepMin } } : {}) },
  ];
  if (sport) d.tables.sportItems = sport.map(([kind, n, extra], i) => ({ id: `fad-s${i}`, sport: 'act:tennis', kind, day: day(n), at: `${day(n)}T18:00`, ...extra }));
  if (cfg) d.tables.settings.push({ key: 'datenfragen', value: cfg });
  if (guess) {
    d.tables.abAnswers = Array.from({ length: 20 }, (_, i) => ({ id: `fad-g${i}`, qid: 'spass.stimmung', area: 'spass', day: day(-(i + 1)), at: `${day(-(i + 1))}T20:40`, slot: `${day(-(i + 1))}T20:30`, kind: 'scale', value: i % 2 ? 5 : 8, note: null, unit: null, src: 'hand' }));
  }
  if (moods) {
    const row = (n, v) => ({ id: `fad-m${n}`, qid: 'spass.stimmung', area: 'spass', day: day(n), at: `${day(n)}T20:40`, slot: `${day(n)}T20:30`, kind: 'scale', value: v, note: null, unit: null, src: 'hand' });
    d.tables.abAnswers = [...Array.from({ length: 20 }, (_, i) => row(-(i + 3), 8)), ...moods.map((v, i) => row(i - 2, v))];
  }
  return d;
}

/**
 * The saved home forecast of today (Heute fetched it) and the calendar copy: both tables are not in the backup, so they
 * are written into the open database, then the page loads again. wx: fields of today's forecast; cal: [[startHourUtc, hours]].
 */
async function seed(page, { wx = null, cal = null, calYesterday = null }) {
  await page.evaluate(async ({ wx, cal, calYesterday }) => {
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = iso(new Date());
    const db = await new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => ok(r.result); });
    const put = (store, rows) => new Promise((ok) => {
      const tx = db.transaction(store, 'readwrite');
      for (const row of rows) tx.objectStore(store).put(row);
      tx.oncomplete = ok;
    });
    if (wx) {
      const place = await new Promise((ok) => { const q = db.transaction('settings').objectStore('settings').get('homePlace'); q.onsuccess = () => ok(q.result.value); });
      await put('meta', [{ key: 'homeForecast', fetchedAt: new Date().toISOString(), place, days: [{ date: today, min: 9, max: 19, rainMm: 0, rainPct: 10, ...wx }] }]);
    }
    if (cal) await put('gEvents', cal.map(([h, len], i) => ({ id: `fad-e${i}`, gid: `fad-e${i}`, day: today, lastDay: today, cal: 'primary', title: 'Test', start: `${today}T${h}:00:00Z`, end: `${today}T${String(Number(h) + len).padStart(2, '0')}:00:00Z`, allDay: false, busy: true })));
    if (calYesterday) {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const y = iso(d);
      await put('gEvents', calYesterday.map(([h, len], i) => ({ id: `fad-y${i}`, gid: `fad-y${i}`, day: y, lastDay: y, cal: 'primary', title: 'test_data_gtp_ Klettern', start: `${y}T${h}:00:00Z`, end: `${y}T${String(Number(h) + len).padStart(2, '0')}:00:00Z`, allDay: false, busy: true })));
    }
    db.close();
  }, { wx, cal, calYesterday });
  await page.reload();
}

test.describe('Fragen aus deinen Daten', () => {
  test('a standout resting pulse: the question comes first, with the reason, the answer is saved', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(61) });
    const card = page.locator('[data-section="abfragen"]');
    await expect(card).toHaveJSProperty('open', true);
    const first = card.locator('[data-q]').first();
    await expect(first).toHaveAttribute('data-q', 'daten.ruhepuls');
    await expect(first.getByText(T('What did you do yesterday that throws you off so much today?'))).toBeVisible();
    await expect(first.locator('[data-why]')).toContainText('Warum frage ich das?');
    await expect(first.locator('[data-why]')).toContainText('Ruhepuls ist heute 61');
    await expect(first.locator('[data-why]')).toContainText('52');
    await expect(first.locator('[data-from-data]')).toHaveText('aus deinen Daten');
    mkdirSync(SHOTS, { recursive: true });
    await card.screenshot({ path: `${SHOTS}/fad-fenster-${info.project.name === 'phone' ? 390 : 1440}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
    await first.getByRole('button', { name: T('Alcohol|data'), exact: true }).click();
    await first.getByRole('button', { name: T('Stress|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.ruhepuls"]')).toHaveCount(0);
    // the answer is in the history and the question does not come back the next days
    await page.goto('./#/me/history');
    await expect(page.locator('[data-row="daten.ruhepuls"]').first()).toContainText('Alkohol');
  });

  test('a normal resting pulse asks nothing', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52) });
    const card = page.locator('[data-section="abfragen"]');
    await expect(card.locator('[data-q="erholung.akku"]')).toBeVisible();
    await expect(card.locator('[data-q="daten.ruhepuls"]')).toHaveCount(0);
  });

  test('the switch under Deine Abfragen turns the rule off and on', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(61) });
    await page.goto('./#/me/abfragen');
    const rule = page.locator('[data-rule="ruhepuls"]');
    await expect(rule).toBeVisible();
    await expect(rule.locator('b').filter({ hasText: T('Resting pulse above your usual') })).toBeVisible();
    await shot(page, info, 'fad-regel');
    const sw = rule.getByRole('switch');
    await expect(sw).toBeChecked();
    await sw.uncheck();
    await page.goto('./#/');
    await expect(page.locator('[data-section="abfragen"] [data-q="erholung.akku"]')).toBeVisible();
    await expect(page.locator('[data-q="daten.ruhepuls"]')).toHaveCount(0);
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-rule="ruhepuls"]').getByRole('switch')).not.toBeChecked();
  });

  test('a short night asks what kept you awake, with the hours as the reason', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52, { sleepMin: 295 }) });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.schlaf"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('What kept you awake last night?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('4 Std. 55 Min.');
    await expect(card.locator('[data-q="daten.ruhepuls"]')).toHaveCount(0);
    await q.getByRole('button', { name: T('Thoughts|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.schlaf"]')).toHaveCount(0);
  });

  test('three low mood days ask what would do you good', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52, { moods: [4, 5, 4] }) });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.stimmung"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('What would do you good today?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('8');
    await mkdirSync(SHOTS, { recursive: true });
    await card.screenshot({ path: `${SHOTS}/fad2-stimmung-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('A walk|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.stimmung"]')).toHaveCount(0);
  });

  test('normal sleep and mood ask nothing; all three rules have their switch', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52, { sleepMin: 450, moods: [7, 8, 7] }) });
    const card = page.locator('[data-section="abfragen"]');
    await expect(card.locator('[data-q="erholung.akku"]')).toBeVisible();
    await expect(card.locator('[data-q^="daten."]')).toHaveCount(0);
    await page.goto('./#/me/abfragen');
    for (const id of ['ruhepuls', 'schlaf', 'stimmung', 'training', 'pause', 'spiel', 'platz']) await expect(page.locator(`[data-rule="${id}"]`).getByRole('switch')).toBeChecked();
  });

  test('a long day yesterday asks how the legs feel, with the time as the reason', async ({ page, context }, info) => {
    const d = data(52);
    d.tables.activities = [{ id: 'fad-a1', day: day(-1), kind: 'bike', name: 'Long loop', km: 90, movingS: 3.4 * 3600 }];
    const T = await openHome(page, context, info, { data: d });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.training"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('How do your legs feel after yesterday?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('3 Std. 24 Min.');
    mkdirSync(SHOTS, { recursive: true });
    await card.screenshot({ path: `${SHOTS}/fad4-training-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('Heavy legs|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.training"]')).toHaveCount(0);
  });

  test('six days without training ask what kept you from it', async ({ page, context }, info) => {
    const d = data(52);
    d.tables.activities = [{ id: 'fad-p1', day: day(-8), kind: 'bike', name: 'Loop', km: 40, movingS: 7200 }, { id: 'fad-p2', day: day(-6), kind: 'run', name: 'Run', km: 8, movingS: 3000 }];
    const T = await openHome(page, context, info, { data: d });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.pause"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('What kept you from training lately?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('vor 6 Tagen');
    await card.screenshot({ path: `${SHOTS}/fad4-pause-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('Tired|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.pause"]')).toHaveCount(0);
  });

  test('a game yesterday asks what worked, with the minutes as the reason', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52, { sport: [['played', -1, { type: 'training', min: 90, court: 'clay', result: 'none', worked: '' }]] }) });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.spiel"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('How was the game yesterday? What worked, what did not?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('90 Minuten');
    await card.screenshot({ path: `${SHOTS}/fad5-spiel-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('Serve worked|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.spiel"]')).toHaveCount(0);
  });

  test('a court time marked as not played asks what got in the way', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52, { sport: [['slot', -1, { time: '18:00', min: 60, court: 'clay', answer: 'skipped' }]] }) });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.platz"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('What got in the way of the court time?'))).toBeVisible();
    await card.screenshot({ path: `${SHOTS}/fad5-platz-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('Work came up|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.platz"]')).toHaveCount(0);
  });

  test('rain and a mood below your usual ask what does you good on grey days', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52, { moods: [8, 8, 5] }) });
    await seed(page, { wx: { rainPct: 90, rainMm: 6 } });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.grau"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('What does you good on grey days?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('Regen');
    await card.screenshot({ path: `${SHOTS}/fad7-grau-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('A short walk|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.grau"]')).toHaveCount(0);
  });

  test('rain with a normal mood, or a low mood on a dry day, asks nothing', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52, { moods: [8, 8, 8] }) });
    await seed(page, { wx: { rainPct: 90 } });
    await expect(page.locator('[data-section="abfragen"] [data-q="erholung.akku"]')).toBeVisible();
    await expect(page.locator('[data-q="daten.grau"]')).toHaveCount(0);
  });

  test('fine weather and a free evening ask whether something is planned outside', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52) });
    await seed(page, { wx: { max: 21 }, cal: [['08', 1]] });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.draussen"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('Anything planned outside?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('21 Grad');
    await card.screenshot({ path: `${SHOTS}/fad7-draussen-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('A ride|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.draussen"]')).toHaveCount(0);
  });

  test('an appointment in the evening keeps the outside question away', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52) });
    await seed(page, { wx: { max: 21 }, cal: [['17', 2]] });
    await expect(page.locator('[data-section="abfragen"] [data-q="erholung.akku"]')).toBeVisible();
    await expect(page.locator('[data-q="daten.draussen"]')).toHaveCount(0);
  });

  test('an appointment yesterday asks how it was, with the appointment as the reason', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52) });
    await seed(page, { calYesterday: [['10', 2]] });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.termin"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('An activity yesterday. How was it?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('Klettern');
    await expect(q.locator('[data-why]')).toContainText('120 Minuten');
    await card.screenshot({ path: `${SHOTS}/fad10-termin-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('Good|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.termin"]')).toHaveCount(0);
  });

  test('a short appointment or one on another day asks nothing', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52) });
    await seed(page, { cal: [['10', 3]] }); // only today: the calendar is in use, but nothing yesterday
    await expect(page.locator('[data-section="abfragen"] [data-q="erholung.akku"]')).toBeVisible();
    await expect(page.locator('[data-q="daten.termin"]')).toHaveCount(0);
  });

  test('no calendar or no weather yet: the box says why the weather rules are quiet', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52) });
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-data-empty-calendar]')).toBeVisible();
    await expect(page.locator('[data-rule="grau"]')).toBeVisible();
    await expect(page.locator('[data-rule="draussen"]')).toBeVisible();
    await expect(page.locator('[data-rule="termin"]')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/fad10-regeln-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  });

  test('a random question from the switched-off samples comes marked and never again takes it out for good', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52) });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q]').filter({ has: page.locator('[data-random]') });
    await expect(q).toHaveCount(1);
    await expect(q.locator('[data-random]')).toHaveText('eine Zufallsfrage');
    await expect(q.locator('[data-why]')).toContainText('Zufallsfrage');
    const id = await q.getAttribute('data-q');
    await card.screenshot({ path: `${SHOTS}/fad8-zufall-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.locator('[data-never]').click();
    await expect(card.locator(`[data-q="${id}"]`)).toHaveCount(0);
    await page.goto('./#/me/abfragen');
    const row = page.locator('[data-rule="zufall"]');
    await expect(row.locator('[data-random-never]')).toContainText('1');
    await page.screenshot({ path: `${SHOTS}/fad8-regeln-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
    await row.locator('[data-random-back]').click();
    await expect(row.locator('[data-random-never]')).toHaveCount(0);
  });

  test('the switch under Deine Abfragen turns the random question off', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52, { cfg: { zufall: { off: true } } }) });
    await expect(page.locator('[data-section="abfragen"] [data-q="erholung.akku"]')).toBeVisible();
    await expect(page.locator('[data-random]')).toHaveCount(0);
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-random-switch]')).not.toBeChecked();
  });

  test('a hint from what goes together asks yes or no on a day that fits, with the sentence as the reason', async ({ page, context }, info) => {
    const T = await openHome(page, context, info, { data: data(52, { guess: true, sleepMin: 500 }) });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.vermutung"]');
    await expect(q).toBeVisible();
    await expect(q.getByText(T('Does that fit today?'))).toBeVisible();
    await expect(q.locator('[data-why]')).toContainText('Deine Daten deuten darauf hin');
    await expect(q.locator('[data-why]')).toContainText('Schlaf');
    await card.screenshot({ path: `${SHOTS}/fad9-vermutung-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.getByRole('button', { name: T('Yes, that fits|data'), exact: true }).click();
    await card.locator('[data-ab-save]').click();
    await expect(card.locator('[data-q="daten.vermutung"]')).toHaveCount(0);
    await page.goto('./#/me/history');
    await expect(page.locator('[data-row="daten.vermutung"]').first()).toContainText('Ja, das passt');
  });

  test('a short night does not fit the hint: no guess, and the rule has its switch', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52, { guess: true, sleepMin: 250 }) });
    await expect(page.locator('[data-section="abfragen"] [data-q="erholung.akku"]')).toBeVisible();
    await expect(page.locator('[data-q="daten.vermutung"]')).toHaveCount(0);
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-rule="vermutung"]').getByRole('switch')).toBeChecked();
    await page.screenshot({ path: `${SHOTS}/fad9-regeln-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
  });

  test('no tennis noted: the box says why the tennis rules are quiet', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52) });
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-data-empty-tennis]')).toBeVisible();
    await page.locator('[data-datenfragen]').screenshot({ path: `${SHOTS}/fad5-regeln-${info.project.name === 'phone' ? 390 : 1440}.png` });
  });

  test('no activities yet: the box says why the training rules are quiet', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(52) });
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-data-empty-training]')).toBeVisible();
    await page.locator('[data-datenfragen]').screenshot({ path: `${SHOTS}/fad4-regeln-${info.project.name === 'phone' ? 390 : 1440}.png` });
  });

  test('skipped three times: the window offers to ask less often, and the rule then says so', async ({ page, context }, info) => {
    const cfg = { skips: { ruhepuls: { n: 3, day: day(-1) } } };
    const T = await openHome(page, context, info, { data: data(61, { cfg }) });
    const card = page.locator('[data-section="abfragen"]');
    const q = card.locator('[data-q="daten.ruhepuls"]');
    await expect(q.locator('[data-fewer]')).toContainText('dreimal übersprungen');
    await card.screenshot({ path: `${SHOTS}/fad6-seltener-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await q.locator('[data-fewer-yes]').click();
    await expect(q.locator('[data-fewer]')).toHaveCount(0);
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-rule-gap="ruhepuls"]')).toContainText('alle 7 Tage');
    await page.locator('[data-rule="ruhepuls"] [data-rule-reset]').click();
    await expect(page.locator('[data-rule-gap="ruhepuls"]')).toHaveCount(0);
    expect(T).toBeTruthy();
  });

  // leaving Heute with the window open counts as «Heute nicht» (quiet until the evening), so each way is its own test
  test('a higher threshold keeps the rule quiet', async ({ page, context }) => {
    await openHome(page, context, test.info(), { data: data(61) });
    await page.goto('./#/me/abfragen');
    const rule = page.locator('[data-rule="ruhepuls"]');
    await expect(rule.locator('[data-rule-reset]')).toHaveCount(0);
    // 61 against 52 is 9 above: a threshold of 12 keeps the rule quiet
    await rule.locator('[data-rule-val]').fill('12');
    await rule.locator('[data-rule-val]').blur();
    await expect(rule.locator('[data-rule-reset]')).toBeVisible();
    await page.goto('./#/');
    await expect(page.locator('[data-section="abfragen"] [data-q="erholung.akku"]')).toBeVisible();
    await expect(page.locator('[data-q="daten.ruhepuls"]')).toHaveCount(0);
  });

  test('own wording and threshold: it asks in your words, links to the rule, goes back to standard', async ({ page, context }, info) => {
    await openHome(page, context, info, { data: data(61) });
    await page.goto('./#/me/abfragen');
    const rule = page.locator('[data-rule="ruhepuls"]');
    await rule.locator('[data-rule-val]').fill('6');
    await rule.locator('[data-rule-val]').blur();
    await rule.locator('[data-rule-text]').fill('Was war gestern anders?');
    await rule.locator('[data-rule-text]').blur();
    await expect(rule.locator('[data-rule-reset]')).toBeVisible();
    await page.goto('./#/');
    const q = page.locator('[data-q="daten.ruhepuls"]');
    await expect(q.getByText('Was war gestern anders?')).toBeVisible();
    await q.locator('[data-why-adjust]').click();
    await expect(page).toHaveURL(/#\/me\/abfragen/);
    mkdirSync(SHOTS, { recursive: true });
    await page.locator('[data-datenfragen]').screenshot({ path: `${SHOTS}/fad3-regeln-${info.project.name === 'phone' ? 390 : 1440}.png` });
    await rule.locator('[data-rule-reset]').click();
    await expect(rule.locator('[data-rule-reset]')).toHaveCount(0);
    await expect(rule.locator('[data-rule-text]')).toHaveValue('');
    await expect(rule.locator('[data-rule-val]')).toHaveValue('5');
  });

  test('without Fitbit values the page says why the pulse and sleep rules are quiet', async ({ page, context }, info) => {
    const d = data(61);
    d.tables.healthDays = [];
    await openHome(page, context, info, { data: d });
    await page.goto('./#/me/abfragen');
    await expect(page.locator('[data-data-empty]')).toBeVisible();
    await expect(page.locator('[data-data-next]')).toHaveAttribute('href', '#/me/insights');
  });
});
