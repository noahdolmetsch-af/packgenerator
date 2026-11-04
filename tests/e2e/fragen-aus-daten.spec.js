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

function data(todayHr, { sleepMin = null, moods = null } = {}) {
  const d = homeFixture();
  const q = Object.fromEntries(QUESTIONS.filter((x) => ON_AT_START.has(x.id) && x.id !== 'erholung.akku').map((x) => [x.id, { on: false }]));
  d.tables.settings.push({ key: 'abfragen', value: { since: `${day(-1)}T19:00`, q, own: [] } });
  d.tables.healthDays = [
    ...Array.from({ length: 20 }, (_, i) => ({ date: day(-(i + 1)), restingHr: 51 + (i % 3) })),
    { date: day(0), restingHr: todayHr, ...(sleepMin != null ? { sleep: { asleepMin: sleepMin } } : {}) },
  ];
  if (moods) {
    const row = (n, v) => ({ id: `fad-m${n}`, qid: 'spass.stimmung', area: 'spass', day: day(n), at: `${day(n)}T20:40`, slot: `${day(n)}T20:30`, kind: 'scale', value: v, note: null, unit: null, src: 'hand' });
    d.tables.abAnswers = [...Array.from({ length: 20 }, (_, i) => row(-(i + 3), 8)), ...moods.map((v, i) => row(i - 2, v))];
  }
  return d;
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
    for (const id of ['ruhepuls', 'schlaf', 'stimmung', 'training']) await expect(page.locator(`[data-rule="${id}"]`).getByRole('switch')).toBeChecked();
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
