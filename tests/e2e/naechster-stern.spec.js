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

// «Meilensteine motivierender» PR 2 (Idee 3): the shelf «Ganz geschafft»
test('a milestone with all its stars stands on the shelf, not in the list', async ({ page, context }) => {
  // own thresholds (flow.msTune) make «Mal gemacht» of tennis finish with 22 ticks: stars 1 and 2 are reached
  const errors = await open(page, context, { tennis: 22, rows: { settings: [{ key: 'flow.msTune', value: { 'tennis.sessions': { steps: [5, 10] } } }] } });
  const shelf = page.locator('[data-done-shelf]');
  await expect(shelf).toBeVisible();
  await expect(shelf).toContainText(T('Fully done'));
  await expect(shelf.locator('[data-done-ms="tennis.sessions"]')).toContainText('Letzter Stern am');
  await expect(page.locator('[data-ms-fold="all"] [data-ms="tennis.sessions"], .grid [data-ms="tennis.sessions"]')).toHaveCount(0);
  // the sport's own page of the list: finished ones on the shelf, open ones in the list
  await page.goto('./#/flow/milestones?act=tennis');
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-done-shelf] [data-done-ms="tennis.sessions"]')).toBeVisible();
  await expect(page.locator('.grid [data-ms="tennis.sessions"]')).toHaveCount(0);
  await expect(page.locator('.grid [data-ms]').first()).toBeVisible();
  await fits(page, 'milestones with shelf');
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
  expect(errors).toEqual([]);
});

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

// «Meilensteine motivierender» PR 5 (Idee 4): «Dein Jahr in Sternen»
test('the year in stars: twelve bars, totals, filter by sport', async ({ page, context }) => {
  const errors = await open(page, context, { tennis: 22 });
  const card = page.locator('[data-year-stars]');
  await expect(card).toBeVisible();
  await expect(card).toContainText(T('Your year in stars'));
  await expect(card.locator('.bars > div')).toHaveCount(12);
  const total = Number(await card.locator('[data-year-total]').textContent());
  expect(total).toBeGreaterThan(0);
  await page.goto('./#/flow/milestones?act=tennis');
  await page.reload();
  await ready(page);
  const tennisTotal = Number(await page.locator('[data-year-stars] [data-year-total]').textContent());
  expect(tennisTotal).toBeLessThanOrEqual(total);
  await fits(page, 'milestones with year');
  expect(errors).toEqual([]);
});

// «Meilensteine ordnen» (Noah 23.11.2026 «ja»): one block «Geschafft», a list per sport with the real name first
test('one block «Geschafft» holds the shelf, the finished ones and the year; the next star is not repeated there', async ({ page, context }) => {
  const errors = await open(page, context, { tennis: 22, rows: { settings: [{ key: 'flow.msTune', value: { 'tennis.sessions': { steps: [5, 10] } } }] } });
  const block = page.locator('[data-geschafft]');
  await expect(block).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 2, name: T('Achieved|ms') })).toBeVisible();
  await expect(block.locator('[data-done-shelf]')).toBeVisible();
  await expect(block.getByRole('heading', { level: 3, name: T('Trophy shelf') })).toBeVisible();
  await expect(block.locator('.ts .nx')).toHaveCount(0);
  await expect(block.locator('[data-year-stars]')).toBeVisible();
  // nothing of it stands outside the block any more
  await expect(page.locator('[data-done-shelf]')).toHaveCount(1);
  await expect(page.locator('[data-year-stars]')).toHaveCount(1);
  await fits(page, 'milestones with the block');
  expect(errors).toEqual([]);
});

test('a sport shows its real name first and its playful name small; rows lead with the sport', async ({ page, context }) => {
  const errors = await open(page, context, { tennis: 22 });
  const row = page.locator('[data-path="tennis"]');
  await expect(row.locator('b')).toHaveText('Tennis spielen');
  await expect(row.locator('.nk')).toHaveText('Filzball');
  // every row of a sport's milestone starts with the sport: two «Stunden» are never one number
  const rows = page.locator('section[aria-labelledby="soon-h"] li[data-ms] b');
  const n = await rows.count();
  for (let i = 0; i < n; i++) {
    const id = await page.locator('section[aria-labelledby="soon-h"] li[data-ms]').nth(i).getAttribute('data-ms');
    if (/^(tennis|bike|yoga|gym|pushups|meditation|run|walk|sauna|hockey)\./.test(id)) expect(await rows.nth(i).textContent(), id).toContain(' · ');
  }
  // the chips stay few: «Alle», «Über alle» and the favourites; other sports sit in one select
  expect(await page.locator('.chips a.chip').count()).toBeLessThanOrEqual(8);
  await fits(page, 'milestones with sports');
  expect(errors).toEqual([]);
});
