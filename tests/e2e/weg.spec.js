// «Weg zum Ziel» (Noah 05.11.2026 «1b 2b 3a 4a 5a»): Touren › Weg zum Ziel — empty page, a new way, an own step, tick,
// move to another day, delete with Undo, change the start day, delete the way. Fictional data, German UI.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test('Way to the goal: create a way, own steps, tick, move, delete and undo', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));

  // the way in: the tile in Touren › «Alles hier»
  await page.goto('./#/trips');
  await ready(page);
  await page.getByRole('link', { name: new RegExp(T('Way to the goal')) }).first().click();
  await expect(page.locator('[data-page="weg"] h1')).toHaveText(T('Way to the goal'));
  await expect(page.locator('[data-empty]')).toContainText(T('No way yet. Name a big goal with a start day, for example a race in May.'));

  // a new way with a start day
  await page.getByRole('button', { name: T('New way') }).click();
  await page.locator('[data-weg-title]').fill('Test Rennen im Mai');
  await page.locator('[data-weg-start]').fill('2027-05-15');
  // the kinds of steps (training, packing, race plan …) suggest steps: untick every one, this test writes its own
  const ticked = page.locator('[data-weg-new] .wg-pick input:checked');
  while ((await ticked.count()) > 0) await ticked.first().uncheck();
  await expect(page.locator('[data-weg-new] .wg-pick input:checked')).toHaveCount(0);
  await page.getByRole('button', { name: T('Create way') }).click();
  await expect(page.locator('[data-weg-goal] h2')).toHaveText('Test Rennen im Mai');
  await expect(page.locator('[data-page="weg"]')).toContainText(T('No steps yet. Add your first step below: it stays a suggestion, you can change it any time.'));

  // own steps: one with a day, one without
  await page.locator('[data-weg-step-title]').fill('Zug buchen');
  await page.locator('[data-weg-own] input[type="date"]').fill('2027-03-01');
  await page.locator('[data-weg-own] button[type="submit"]').click();
  await page.locator('[data-weg-step-title]').fill('Ohne Tag');
  await page.locator('[data-weg-own] button[type="submit"]').click();
  const steps = page.locator('[data-weg-step]');
  await expect(steps).toHaveCount(2);
  await expect(steps.first()).toContainText('Zug buchen');
  await expect(steps.last()).toContainText('Ohne Tag');
  await expect(page.locator('[data-page="weg"]')).toContainText(T('No day yet'));

  // tick, give the second one a day (it moves before nothing: still last, but now in a group of its own)
  await steps.first().getByRole('button', { name: T('Done: {name}').replace('{name}', 'Zug buchen') }).click();
  await expect(steps.first()).toHaveClass(/done/);
  await expect(page.locator('[data-weg-goal]')).toContainText(T('{done} of {total} steps done').replace('{done}', '1').replace('{total}', '2'));
  await steps.last().locator('input[type="date"]').fill('2027-04-20');
  await expect(page.locator('[data-page="weg"]')).not.toContainText(T('No day yet'));

  // delete a step, then undo
  await steps.last().getByRole('button', { name: T('Delete {name}').replace('{name}', 'Ohne Tag') }).click();
  await page.getByRole('button', { name: T('Delete') }).last().click();
  await expect(steps).toHaveCount(1);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(steps).toHaveCount(2);

  // a way travels in the backup: it is still there after a reload
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-weg-goal] h2')).toHaveText('Test Rennen im Mai');
  await expect(steps).toHaveCount(2);

  // change the start day: the page still shows the way, no sideways scroll
  await page.locator('[data-weg-start-edit]').fill('2027-06-01');
  await expect(page.locator('[data-weg-goal]')).toContainText(/\d/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  // delete the whole way and bring it back
  await page.locator('[data-weg-delete]').click();
  await page.getByRole('button', { name: T('Delete') }).last().click();
  await expect(page.locator('[data-empty]')).toBeVisible();
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-weg-goal] h2')).toHaveText('Test Rennen im Mai');
  expect(errors).toEqual([]);
});

test('Way to the goal › Organisation: the strip counts the settled steps and names the next deadline', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));

  await page.goto('./#/trips/weg');
  await ready(page);
  await page.getByRole('button', { name: T('New way') }).click();
  await page.locator('[data-weg-title]').fill('Test Rennen im Mai');
  await page.locator('[data-weg-start]').fill('2027-05-15');
  // keep the steps of «Organisation», drop all others
  const picks = page.locator('[data-weg-new] .wg-pick');
  const orgaTitles = ['Sign up for the race', 'Put the days off in your calendar', 'Book the stay at start and finish', 'Book the train to the start', 'Tell an emergency contact your plan'].map(T);
  for (const label of await picks.allTextContents()) {
    if (!orgaTitles.includes(label.trim())) await picks.filter({ hasText: label.trim() }).first().locator('input').uncheck();
  }
  await page.getByRole('button', { name: T('Create way') }).click();

  const strip = page.locator('[data-weg-orga]');
  await expect(strip).toContainText(T('Organisation: {done} of {total} settled').replace('{done}', '0').replace('{total}', '5'));
  await expect(strip).toContainText(/Nächste Frist/);

  await page.locator('[data-weg-step] .wg-check').first().click();
  await expect(strip).toContainText(T('Organisation: {done} of {total} settled').replace('{done}', '1').replace('{total}', '5'));
  await page.locator('[data-weg-orga-go]').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(errors).toEqual([]);
});
