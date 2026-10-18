// Impeccable runde 2 (18.10.2026, Noah «alle Vorschläge angenommen»), Gruppe 4: Meditation, Training, Ziele,
// Aktivität and Timer. German, a fixed clock, fictional data only (aktiv-fixture.js).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, aktivRows, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, rows = aktivRows()) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  if (rows) await put(page, rows);
  return errors;
}
async function go(page, hash) {
  await page.goto(`./${hash}`);
  await page.reload();
  await ready(page);
  await expect(page.locator('main h1')).toHaveCount(1);
}

test('Meditation: one sentence before the first session; «Ø Tiefe (1–5)» explains itself', async ({ page, context }) => {
  const errors = await open(page, context, null);
  const main = page.locator('main');
  await go(page, '#/flow/act/meditation');
  await expect(main.locator('[data-review-empty]')).toHaveText(T('No session yet. After your first meditation you see your streak here, the minutes of the week and how deep it was.'));
  await expect(main.locator('.stats')).toHaveCount(0);
  await put(page, aktivRows());
  await go(page, '#/flow/act/meditation');
  await expect(main.locator('[data-review-empty]')).toHaveCount(0);
  const dq = main.locator('[data-depth]');
  await expect(dq).toContainText(T('avg. depth (1–5)'));
  await dq.click();
  await expect(dq).toHaveAttribute('aria-expanded', 'true');
  await expect(main.locator('#m-depth-help')).toHaveText(T('Your own rating after each session, from 1 (restless) to 5 (very deep).'));
  expect(errors).toEqual([]);
});

test('Training: the subtitle fits the week, the empty look back says why and leads to Strava', async ({ page, context }) => {
  const errors = await open(page, context, null);
  const main = page.locator('main');
  await go(page, '#/flow/training');
  await expect(main.locator('header.ph')).toContainText(T('Plan your training week and see how much time you spent in which heart rate zone. Strava brings the activities by itself.'));
  const back = main.locator('[data-section="look-back"]');
  await expect(back.locator('[data-back-empty]')).toHaveText(T('No training time in the last 6 weeks yet. As soon as Strava brings an activity with heart rate, a bar per week stands here.'));
  await expect(back.locator('li[data-week]')).toHaveCount(0);
  await expect(back.locator('[data-back-strava]')).toHaveText(T('Connect Strava'));
  // the explanation stands above the days, not under them
  await expect(main.locator('#plan-h').locator('..')).toContainText(T('Tap + on a day to plan a session. Dashed = planned, green = done (from Strava).'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Ziele: calm states instead of «! heute offen» everywhere, the year goals say «zeigen»', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/flow/goals');
  await expect(main.locator('#acts-h')).toHaveText(T('Your goals, last 7 days'));
  const rows = main.locator('ul.acts > li[data-id]');
  await expect(rows.first()).toBeVisible();
  // «heute offen» only for a daily goal; a rolling goal not on track is grey, without «!»
  const left = main.locator('[data-pill="left"]');
  expect(await left.count()).toBeGreaterThan(0);
  await expect(left.first()).toHaveText(new RegExp(T('{n}× more in {d} days', { n: '\\d+', d: '\\d+' })));
  await expect(left.first()).not.toHaveClass(/warn/);
  for (const p of await main.locator('[data-pill="today"]').all()) {
    const row = p.locator('xpath=ancestor::li[1]');
    await expect(row.locator('small').first()).toContainText(/täglich|pro Tag|jeden Tag|\/ ?Tag/i);
  }
  // the year goals' switch says what it does
  const yg = main.locator('[data-section="year-goals"] [data-goal="km"]');
  await expect(yg.locator('label.ygsw')).toContainText(T('show|goal'));
  await expect(yg.getByRole('switch')).toBeChecked();
  expect(errors).toEqual([]);
});
