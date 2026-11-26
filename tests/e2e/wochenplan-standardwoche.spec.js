// «Standardwoche» (Noah 26.11.2026): your normal week inside the weekly plan, with fixed places and wishes per kind of unit, and what you moved
// last week comes back. German, phone + desktop, fictional data only, clock fixed (Tuesday 10 Nov 2026).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

async function open(page, context, hash = './#/flow/wochenplan') {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto(hash);
  await ready(page);
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  return errors;
}
const std = (page) => page.locator('[data-wochenplan] [data-sw]');
const toStd = (page) => page.locator('[data-wochenplan] button', { hasText: T('Standard week') }).first().click();

test('Standardwoche: shows your normal week with fixed places, wishes and what the app chooses, and the goals', async ({ page, context }) => {
  const errors = await open(page, context);
  await toStd(page);
  await expect(std(page)).toBeVisible();
  // the basic plan: tennis, yoga, gym and the ice hockey stand fixed, the rest is chosen by the app
  await expect(std(page).locator('[data-sw-entry="hockey@6"]')).toHaveAttribute('data-sw-kind-of', 'fix');
  await expect(std(page).locator('[data-sw-entry="tennis@1"]')).toHaveAttribute('data-sw-kind-of', 'fix');
  await expect(std(page).locator('[data-sw-entry="bikeOut#1"]')).toHaveAttribute('data-sw-kind-of', 'free');
  // the goals: every kind of unit with how many the week holds against how many you want
  await std(page).locator('[data-sw-all] summary').click();
  await expect(std(page).locator('[data-sw-goal-all="gym"]')).toContainText('2 / 2');
  await expect(std(page).locator('[data-sw-hours]')).toContainText(T('The week holds your goals.'));
  expect(errors).toEqual([]);
});

test('Standardwoche: a fixed place and a wish can be added and changed per kind of unit, with Undo', async ({ page, context }) => {
  const errors = await open(page, context);
  await toStd(page);
  // add a fixed yoga place on Friday at 17:00
  await std(page).locator('[data-sw-add="4"]').first().click();
  const sheet = page.locator('[data-sw-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-sw-save]')).toBeDisabled(); // no kind of unit chosen yet
  await sheet.locator('[data-sw-type="yoga"]').click();
  await sheet.locator('[data-sw-kind="fix"]').click();
  await sheet.locator('[data-sw-time]').selectOption('17:00');
  await sheet.locator('[data-sw-save]').click();
  await expect(sheet).toHaveCount(0);
  await expect(std(page).locator('[data-sw-entry="yoga@4"]')).toHaveAttribute('data-sw-kind-of', 'fix');
  await expect(std(page).locator('[data-sw-entry="yoga@4"]')).toContainText('17:00');
  await std(page).locator('[data-sw-all] summary').click();
  await expect(std(page).locator('[data-sw-goal-all="yoga"]')).toContainText('3 / 3'); // a fixed place beyond the count raises the count

  // the ice hockey on Sunday becomes a wish for Saturday morning: the app puts it there when the place is free
  await std(page).locator('[data-sw-entry="hockey@6"]').click();
  await expect(sheet.locator('[data-sw-kind="fix"]')).toHaveAttribute('aria-pressed', 'true');
  await sheet.locator('[data-sw-kind="wish"]').click();
  await expect(sheet.locator('[data-sw-kind-hint]')).toContainText(T('Wish: the app puts it here when the place is free, otherwise on the best day, and says so.'));
  await sheet.locator('[data-sw-day="5"]').click();
  await sheet.locator('[data-sw-save]').click();
  await expect(std(page).locator('[data-sw-entry="hockey#1"]')).toHaveAttribute('data-sw-kind-of', 'wish');
  await expect(std(page).locator('[data-sw-entry="hockey#1"]')).toContainText('08:00');

  // taking a place away
  await std(page).locator('[data-sw-entry="yoga@4"]').click();
  await sheet.locator('[data-sw-remove]').click();
  await expect(std(page).locator('[data-sw-entry="yoga@4"]')).toHaveCount(0);

  // Undo takes the last change back, and everything stays after a reload
  await page.locator('[data-wp-undo]').click();
  await expect(std(page).locator('[data-sw-entry="yoga@4"]')).toHaveCount(1);
  await page.reload();
  await ready(page);
  await toStd(page);
  await expect(std(page).locator('[data-sw-entry="hockey#1"]')).toHaveAttribute('data-sw-kind-of', 'wish');
  await expect(std(page).locator('[data-sw-entry="yoga@4"]')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Standardwoche: the week takes a wish where it is free, and the line under the kind of unit names it', async ({ page, context }) => {
  const errors = await open(page, context);
  await toStd(page);
  await std(page).locator('[data-sw-entry="gym#1"]').click(); // a free place: the app chose it
  const sheet = page.locator('[data-sw-sheet]');
  await expect(sheet.locator('[data-sw-remove]')).toHaveCount(0); // nothing set yet, nothing to take away
  await sheet.locator('[data-sw-day="4"]').click();
  await sheet.locator('[data-sw-time]').selectOption('16:00');
  await sheet.locator('[data-sw-save]').click();
  await expect(page.locator('[data-wp-slots="gym"]')).toContainText(T('Wish|place'));
  // in the week the gym stands on the wish
  await page.locator('[data-wochenplan] button', { hasText: T('Week|view') }).first().click();
  const unit = page.locator('[data-wp-week] [data-day="4"] [data-unit="gym#1"]');
  await expect(unit).toContainText('16:00');
  expect(errors).toEqual([]);
});

test('Wochenplan: what you moved this week comes back next week, and one tap goes back to the standard week', async ({ page, context }) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  // move the gym on Wednesday to Friday (the time stays)
  await root.locator('[data-wp-move-btn="gym@2"]').click();
  await root.locator('[data-wp-move-day="gym@2"]').selectOption('4');
  await expect(root.locator('[data-wp-week] [data-day="4"] [data-unit="gym@2"]')).toBeVisible();
  await expect(root.locator('[data-wp-like]')).toHaveCount(0); // this week it is a move of this week, not a taken-over one
  // next week: the same unit stands on Friday again, marked, with the line that offers the way back
  await root.locator('button', { hasText: T('Next week') }).first().click();
  await expect(root.locator('[data-wp-week] [data-day="4"] [data-unit="gym@2"]')).toBeVisible();
  await expect(root.locator('[data-wp-carried="gym@2"]')).toHaveText(T('like last week'));
  await expect(root.locator('[data-wp-like]')).toBeVisible();
  // one tap: back to the standard week (the gym is on Wednesday again), Undo brings it back
  await root.locator('[data-wp-std]').click();
  await expect(root.locator('[data-wp-week] [data-day="2"] [data-unit="gym@2"]')).toBeVisible();
  await expect(root.locator('[data-wp-like]')).toHaveCount(0);
  await root.locator('[data-wp-undo]').click();
  await expect(root.locator('[data-wp-week] [data-day="4"] [data-unit="gym@2"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Standardwoche: on a computer a place is pulled to another day', async ({ page, context }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 900, 'the grid with pulling is for the computer; the phone has the list and the window');
  const errors = await open(page, context);
  await toStd(page);
  const from = std(page).locator('[data-sw-entry="tennis@1"]');
  await expect(from).toBeVisible();
  await from.dragTo(std(page).locator('[data-sw-cell="2-0"]')); // Wednesday morning (tennis stands on Tuesday at 10:00)
  await expect(std(page).locator('[data-sw-entry="tennis@2"]')).toBeVisible();
  await expect(std(page).locator('[data-sw-entry="tennis@1"]')).toHaveCount(0);
  // a day where the kind of unit has a place already is refused with a line, nothing changes
  await std(page).locator('[data-sw-entry="tennis@2"]').dragTo(std(page).locator('[data-sw-cell="3-0"]'));
  await expect(page.locator('[data-wp-msg]')).toContainText('schon einen Platz');
  await expect(std(page).locator('[data-sw-entry="tennis@2"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Wochenziel: with a weekly plan its hours count, and a goal whose day has passed says so', async ({ page, context }) => {
  const errors = await open(page, context); // the plan of 15 hours is saved
  await page.goto('./#/flow/training');
  await ready(page);
  const card = page.locator('[data-section="goal"]');
  await card.getByRole('button', { name: T('Set a goal') }).click();
  await page.locator('[data-goal-hours]').fill('10');
  await expect(page.locator('[data-goal-plan-hint]')).toBeVisible(); // the form says which hours count
  await page.locator('input[type="date"]').first().fill('2026-10-24'); // a day before the fixed clock
  await page.getByRole('button', { name: T('Save'), exact: true }).first().click();
  await expect(card).toContainText(T('{n} h per week · from your weekly plan').replace('{n}', '15'));
  await expect(card).toContainText('endete am');
  await expect(card).not.toContainText('0 Wochen');
  expect(errors).toEqual([]);
});
