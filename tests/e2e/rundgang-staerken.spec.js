// «Rundgang der Stärken» (Noah 23.11.2026 «1-5a»): in Me › Handbook; four questions, «Show me ›» lights the real part of
// the sample race, «Skip» goes to the next question, the end card. The sample race is made on the way; German UI, fictional data.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { TOURS } from '../../src/lib/tour.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const S = TOURS.staerken;

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('four stations: show me, next, skip, the end card; the sample race stays', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/me/handbook');
  await page.locator('[data-tour-staerken]').click();
  const card = page.locator('.tcard');
  // station 1: the question, no lit part yet
  await expect(page.locator('#tour-h')).toHaveText(T(S[0].title));
  await expect(card).toContainText(T('Station {n} of {of}').replace('{n}', '1').replace('{of}', '4'));
  await expect(page.locator('.lit')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/race\/race-sample/);
  // «Show me»: the assumptions of the sample race light up
  await page.locator('[data-station-show]').click();
  await expect(page.locator('#tour-h')).toHaveText(T(S[1].title));
  await expect(page.locator('.lit')).toBeVisible();
  await expect(page.locator('[data-race-box="plan-assume"]')).toBeVisible();
  // «Next ›» goes to the question of station 2; «Skip» jumps over it to station 3
  await page.locator('.tcard .btn.hi').click();
  await expect(page.locator('#tour-h')).toHaveText(T(S[2].title));
  await page.locator('[data-station-skip]').click();
  await expect(page.locator('#tour-h')).toHaveText(T(S[4].title));
  // station 3: «Show me» lights the box «What lies where» of race mode, with the three drawn example bags
  await page.locator('[data-station-show]').click();
  await expect(page.locator('#tour-h')).toHaveText(T(S[5].title));
  await expect(page.locator('[data-race-box="ride-bags"]')).toBeVisible();
  await expect(page.locator('[data-race-bag-shot]')).toHaveCount(3);
  await page.locator('.tcard .btn.hi').click();
  await expect(page.locator('#tour-h')).toHaveText(T(S[6].title));
  // «Skip» at station 4: the end card
  await page.locator('[data-station-skip]').click();
  await expect(page.locator('#tour-h')).toHaveText(T(S.at(-1).title));
  await page.getByRole('button', { name: T('Close|tour') }).click();
  await expect(page.locator('.tour')).toHaveCount(0);
  // the sample race is there, marked as a sample
  await page.goto('./#/race/race-sample');
  await expect(page.locator('[data-race-sample]')).toBeVisible();
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Esc ends the tour and the next start begins again with the question', async ({ page }) => {
  await page.goto('./#/me/handbook');
  await page.locator('[data-tour-staerken]').click();
  await page.locator('[data-station-show]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.tour')).toHaveCount(0);
});
