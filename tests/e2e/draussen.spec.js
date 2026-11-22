// «Draussen» challenge on Heute (Noah 21.11.2026 «1a 2b 3a 4a»): start, Strava minutes and minutes by hand count together,
// Undo, the days as dots, the light line from 16:00, change and end. Fictional data only (home0460 fixture: the clock stands
// on Friday 9 October 2026, 17:00 Zürich); the challenge started on 6 October, day 4 of 26. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const walk = (id, d, min, extra = {}) => ({ id: `test_out_${id}`, day: d, kind: 'hike', type: 'Walk', name: 'Test walk', movingS: min * 60, km: 3, hm: 0, hist: null, ...extra });
const rec = (hand = {}) => ({ key: 'outdoor', value: { name: 'Outdoors', goalMin: 90, from: day(-3), until: day(22), hand, stopped: false, closed: false, no: null } });
function fixture(rows = {}) {
  const data = homeFixture();
  data.tables.activities = rows.activities ?? [];
  data.tables.settings = [...data.tables.settings, ...(rows.settings ?? [])];
  return data;
}

test('without a challenge one quiet line offers it; Start makes the card, minutes add up with Undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info, { hour: 17, data: fixture() });
  const offer = page.locator('[data-outdoor-offer]');
  await expect(offer).toBeVisible();
  if (process.env.SHOTS) {
    await offer.evaluate((el) => (el.style.outline = '3px solid #f08a24')); // the new part, framed for the pictures
    await offer.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${process.env.SHOTS}/draussen-start-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await offer.locator('[data-outdoor-start]').click();
  await page.locator('dialog.oc-sheet').getByRole('button', { name: T('Start'), exact: true }).click();
  const card = page.locator('[data-outdoor-card]');
  await expect(card).toBeVisible();
  await expect(card).toContainText(T('Day {n} of {total}', { n: 1, total: 84 }));
  await expect(card.locator('[data-outdoor-now]')).toContainText('0 ');
  await card.locator('[data-outdoor-add="30"]').click();
  await expect(card.locator('[data-outdoor-now]')).toContainText('30 ');
  await page.getByRole('button', { name: /Rückgängig/ }).first().click();
  await expect(card.locator('[data-outdoor-now]')).toContainText('0 ');
  expect(errors).toEqual([]);
});

test('Strava minutes and minutes by hand add up, the trainer does not count, own minutes without a sport', async ({ page, context }, info) => {
  const acts = [walk('a', day(-3), 100), walk('b', day(-2), 60), walk('c', day(-1), 20), walk('d', day(0), 40), walk('e', day(0), 50, { type: 'Ride', kind: 'bike', trainer: true })];
  const T = await openHome(page, context, info, { hour: 17, data: fixture({ activities: acts, settings: [rec({ [day(-2)]: [30], [day(0)]: [15] })] }) });
  const card = page.locator('[data-outdoor-card]');
  await expect(card).toContainText(T('Day {n} of {total}', { n: 4, total: 26 }));
  await expect(card.locator('[data-outdoor-now]')).toContainText('55 ');
  await expect(card.locator('[data-outdoor-strava]')).toContainText('40');
  await expect(card).toContainText(T('{n} min to go', { n: 35 }));
  await expect(card.locator('.dots i.ok')).toHaveCount(2); // 22nd (100) and 23rd (60 + 30)
  await expect(card.locator('.dots i.miss')).toHaveCount(1); // the 24th (20)
  await expect(card.locator('.dots i.today')).toHaveCount(1);
  await expect(card.locator('[data-outdoor-light]')).toContainText(T('The sun sets at {set}.', { set: '' }).slice(0, 12));
  if (process.env.SHOTS) {
    await card.evaluate((el) => (el.style.outline = '3px solid #f08a24')); // the new part, framed for the pictures
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${process.env.SHOTS}/draussen-offen-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await card.locator('[data-own-min-input]').fill('120');
  await card.locator('[data-own-min-input]').press('Enter');
  await expect(card.locator('[data-outdoor-now]')).toContainText(T('Done today: {min} of {goal} min', { min: 175, goal: 90 }));
  await expect(card.locator('.dots i.ok')).toHaveCount(3);
  if (process.env.SHOTS) {
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5500); // the message with Undo is gone
    await page.screenshot({ path: `${process.env.SHOTS}/draussen-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
});

test('the challenge can be changed and ended', async ({ page, context }, info) => {
  const T = await openHome(page, context, info, { hour: 17, data: fixture({ settings: [rec()] }) });
  const card = page.locator('[data-outdoor-card]');
  await card.locator('[data-outdoor-change]').click();
  const sheet = page.locator('dialog.oc-sheet');
  await sheet.locator('input.num').fill('60');
  await sheet.getByRole('button', { name: T('Save'), exact: true }).click();
  await expect(card).toContainText(' 60 ');
  await card.locator('[data-outdoor-change]').click();
  await sheet.getByRole('button', { name: T('End the challenge') }).click();
  await expect(card).toHaveCount(0);
});
