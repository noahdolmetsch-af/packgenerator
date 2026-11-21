// «Meilensteine motivierender» PR 1 (Noah 21.11.2026 «1-5 a»): the card «Dein nächster Stern» on top of Meilensteine.
// 1. It shows the closest star with how much is missing; «Bald erreichbar» below does not repeat that star.
// 2. With a weekly plan it names the unit of this week (a hint, not a promise); without a plan it names a date from the
//    pace of the last weeks, as a guess (too little history: tests/naechster.test.js).
// 3. No sideways scroll on a phone, no page error. Fictional data only; the clock stands on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put, aktivRows } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, { tennis = 0, rows = {} } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const base = aktivRows();
  // tennis: one tick every second day, with 60 minutes; «Mal gemacht» stands at `tennis` of 25
  const ticks = Array.from({ length: tennis }, (_, i) => ({ id: `test_tennis_${i}`, actId: 'tennis', day: addDays(TODAY, -2 * i - 1), at: `${addDays(TODAY, -2 * i - 1)}T17:00:00+02:00`, min: 60, n: 1 }));
  await put(page, { flowLog: [...base.flowLog, ...ticks], flowSessions: base.flowSessions, ...rows });
  await page.goto('./#/flow/milestones');
  await page.reload();
  await ready(page);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

test('the card shows the next star; «Bald erreichbar» does not repeat it', async ({ page, context }) => {
  const errors = await open(page, context, { tennis: 22 });
  const hero = page.locator('[data-hero]');
  await expect(hero).toBeVisible();
  await expect(hero).toContainText(T('Your next star'));
  await expect(hero.locator('[data-hero-left]')).toContainText(/noch/);
  await expect(hero.locator('[data-hero-tick]')).toHaveAttribute('href', '#/flow');
  const id = await hero.getAttribute('data-hero-ms');
  await expect(page.locator('section[aria-labelledby="soon-h"] [data-ms]').first()).toBeVisible();
  await expect(page.locator(`section[aria-labelledby="soon-h"] [data-ms="${id}"]`)).toHaveCount(0);
  await fits(page, 'milestones');
  expect(errors).toEqual([]);
});

test('with a weekly plan the card names what the week has, as a hint', async ({ page, context }) => {
  const errors = await open(page, context, { tennis: 22, rows: { settings: [{ key: 'training.weekplan', value: { v: 1 } }] } });
  const hero = page.locator('[data-hero]');
  const plan = hero.locator('[data-hero-plan]');
  await expect(plan).toContainText(T('Tennis'));
  await expect(plan.locator('a')).toHaveAttribute('href', '#/flow/wochenplan');
  await expect(hero.locator('[data-hero-pace]')).toHaveCount(0);
  await fits(page, 'milestones with plan');
  expect(errors).toEqual([]);
});

test('without a plan the card guesses a date from the pace; with little history it says none', async ({ page, context }) => {
  const errors = await open(page, context, { tennis: 22 });
  await expect(page.locator('[data-hero] [data-hero-pace]')).toContainText('Nur eine Schätzung');
  await fits(page, 'milestones with pace');
  expect(errors).toEqual([]);
});

// «Meilensteine motivierender» PR 3 (Idee 2): the star path under «Pro Aktivität»
test('per sport the stars stand as a path: gold for the reached ones', async ({ page, context }) => {
  const errors = await open(page, context, { tennis: 22 });
  const row = page.locator('[data-path="tennis"]');
  await expect(row).toBeVisible();
  const label = await row.locator('[role="img"]').getAttribute('aria-label');
  const [, n, m] = label.match(/^(\d+) von (\d+) Sternen erreicht/);
  await expect(row.locator('.stars svg')).toHaveCount(Number(m));
  await expect(row.locator('.stars svg.full')).toHaveCount(Number(n));
  await expect(row.locator('.stars svg.part')).toHaveCount(1);
  await expect(row.locator('a')).toHaveAttribute('href', '#/flow/milestones?act=tennis');
  await fits(page, 'milestones with path');
// «Meilensteine motivierender» PR 4 (Idee 5): the reward sits under the card, wishes hang on the next star with a tap
test('the reward is under the card; a wish hangs on the next star with one tap', async ({ page, context }) => {
  const item = { id: 'test_wish_1', name: 'Fictional gloves', nameDe: 'Erfundene Handschuhe', category: 'clothing', ownership: 'wishlist', qty: 1, weightG: null, domains: [], sets: [], kits: [] };
  const errors = await open(page, context, { tennis: 22, rows: { items: [item] } });
  const hero = page.locator('[data-hero]');
  const reward = page.locator('section[aria-labelledby="reward-h"]');
  await expect(reward).toBeVisible();
  const yHero = (await hero.boundingBox()).y;
  const yReward = (await reward.boundingBox()).y;
  expect(yReward, 'the reward comes after the card and before the rest').toBeGreaterThan(yHero);
  expect(yReward - yHero).toBeLessThan(500);
  const chip = reward.locator('[data-reward-quick] .chip', { hasText: 'Erfundene Handschuhe' });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(reward.locator('.rw.set')).toContainText('Erfundene Handschuhe');
  await expect(reward.locator('[data-reward-quick]')).toHaveCount(0);
  await expect(reward.getByRole('button', { name: DE['Change'] })).toBeVisible();
  await fits(page, 'milestones with reward');
  expect(errors).toEqual([]);
});
