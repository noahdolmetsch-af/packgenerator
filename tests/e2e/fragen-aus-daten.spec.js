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

function data(todayHr) {
  const d = homeFixture();
  const q = Object.fromEntries(QUESTIONS.filter((x) => ON_AT_START.has(x.id) && x.id !== 'erholung.akku').map((x) => [x.id, { on: false }]));
  d.tables.settings.push({ key: 'abfragen', value: { since: `${day(-1)}T19:00`, q, own: [] } });
  d.tables.healthDays = [
    ...Array.from({ length: 20 }, (_, i) => ({ date: day(-(i + 1)), restingHr: 51 + (i % 3) })),
    { date: day(0), restingHr: todayHr },
  ];
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
});
