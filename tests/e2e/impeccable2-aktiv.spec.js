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

test('Aktivität: what the page is for, the own name on a renamed tile, «Kleine Dinge zum Abhaken»', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/flow/activity');
  await expect(main.locator('header.ph')).toContainText(T('Your favourite activities at a glance: streaks, bests and the next star.'));
  await expect(main.locator('#tiles-h').locator('..')).toContainText(T('Tap opens the activity. Under «Change tiles» you choose what each tile shows.'));
  // a tile whose playful name differs shows the activity's own name small above it; the same name stands once
  const tiles = main.locator('a[data-tile]');
  await expect(tiles.first()).toBeVisible();
  for (const tile of await tiles.all()) {
    const playful = (await tile.locator('.tn').textContent()).trim();
    const own = tile.locator('[data-own-name]');
    if (await own.count()) expect((await own.textContent()).trim()).not.toBe(playful);
  }
  expect(await main.locator('[data-own-name]').count()).toBeGreaterThan(0);
  await expect(main.locator('section[aria-labelledby="more-h"]')).toContainText(T('Small things to tick off'));
  await expect(main.locator('[data-week-empty]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Aktivität: an empty week says what will show', async ({ page, context }) => {
  const errors = await open(page, context, null);
  await go(page, '#/flow/activity');
  await expect(page.locator('main [data-week-empty]')).toHaveText(T('No active day this week yet. What you tick off shows here as a dot.'));
  expect(errors).toEqual([]);
});

test('Timer: «Stoppuhr» everywhere, chips on a phone, «Schnellstarts», a finished timer ticks in Aktiv only on a tap', async ({ page, context }) => {
  const errors = await open(page, context);
  const main = page.locator('main');
  await go(page, '#/timer');
  await expect(main.locator('[data-mode="up"]')).toContainText(T('Stopwatch'));
  await expect(main.locator('#t-blocks')).toHaveText(T('Quick starts'));
  const phoneSize = page.viewportSize().width < 720;
  // a phone: the kinds are small chips without their second line; the clock and Start are on the first screen
  await expect(main.locator('[data-mode="down"] small')).toBeVisible({ visible: !phoneSize });
  if (phoneSize) {
    const goBox = await main.locator('[data-act="go"]').boundingBox();
    expect(goBox.y + goBox.height).toBeLessThanOrEqual(page.viewportSize().height);
  }
  await main.locator('[data-typed]').fill('1 min');
  await main.locator('form.typed button[type="submit"]').click();
  await page.clock.runFor(62_000);
  const done = main.locator('[data-done]');
  await expect(done).toBeVisible();
  // nothing ticked by itself
  const timerTicks = () => page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('flowLog').objectStore('flowLog').getAll();
      q.onsuccess = () => res(q.result.filter((e) => e.via === 'timer').length);
    };
  }));
  expect(await timerTicks()).toBe(0);
  await done.locator('[data-aktiv-open]').click();
  const chips = done.locator('[data-aktiv]');
  expect(await chips.count()).toBeGreaterThan(0);
  await chips.nth(1).click();
  await expect(chips.nth(1)).toHaveAttribute('aria-checked', 'true');
  await done.locator('[data-aktiv-tick]').click();
  await expect(done.locator('[data-aktiv-done]')).toBeVisible();
  await expect.poll(timerTicks).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});
