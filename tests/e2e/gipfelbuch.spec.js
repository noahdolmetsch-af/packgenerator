// v0.165.0 «Gipfelbuch für alle» (mockup GB1, Noah 15.10.2026 «1a 2a 3a 4a und manuelle eingabe möglich?
// 5b»): Aktiv › Aktivität › «Gipfelbuch»; a ride over a fictional pass is found, confirmed with a typed
// name and earns «Erster Pass über 2000 m»; a hall without a height is entered by hand; the stars show in
// the showcase. On a phone and a computer, in German. No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { TODAY, D0, addDays, put } from './aktiv-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
async function fits(page, where) {
  const w = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, `${where}: no sideways scroll`).toBeLessThanOrEqual(w);
}

/** A fictional Strava ride over a pass (900 m up to 2150 m) and an indoor ride that never counts. */
const day = addDays(TODAY, -3);
const acts = [
  { id: 'test_gb_pass', type: 'Ride', kind: 'ride', day, name: 'Testrunde Nord', hm: 1300, prof: { pts: [[0, 900], [40, 1500], [80, 2150], [120, 1000]] } },
  { id: 'test_gb_indoor', type: 'Ride', kind: 'ride', day: addDays(TODAY, -2), name: 'Rolle', trainer: true, prof: { pts: [[0, 900], [30, 2500]] } },
];

test('Gipfelbuch: found in a ride, confirmed, a hall by hand, stars in the showcase', async ({ page, context }) => {
  const errors = await open(page, context, '#/flow/activity');
  await expect(page.locator('main')).toBeVisible();
  await put(page, { activities: acts });
  await page.reload();
  const main = page.locator('main');

  // the row under «Mehr» on Aktivität leads to the book
  const row = main.locator('a[href="#/flow/gipfelbuch"]').first();
  await expect(row).toContainText(T('Summit book'));
  await row.click();
  await expect(page).toHaveURL(/#\/flow\/gipfelbuch$/);
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(T('Summit book'));

  // the empty book, and one suggestion: the pass, not the indoor ride
  await expect(main.locator('[data-gb-empty]')).toBeVisible();
  const found = main.locator('[data-gb-found]');
  await expect(found.locator('[data-gb-sugg]')).toHaveCount(1);
  await expect(found.locator('[data-gb-sugg="act:test_gb_pass"]')).toContainText(/2.150 m/);
  await fits(page, 'empty book with a suggestion');

  // confirm: the name is typed by you
  await found.locator('[data-gb-confirm]').click();
  const sheet = page.locator('[data-place-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-gb-save]').click();
  await expect(sheet.locator('.err')).toHaveText(T('Give it a name.'));
  await sheet.locator('[data-gb-name]').fill('Testpass Nord');
  await sheet.locator('[data-gb-save]').click();
  await expect(sheet).toBeHidden();
  await expect(main.locator('[data-gb-found]')).toHaveCount(0);
  await expect(main.locator('[data-gb-empty]')).toHaveCount(0);

  const place = main.locator('[data-gb-place="Testpass Nord"]');
  await expect(place).toBeVisible();
  await expect(place).toContainText(`★ ${T('first 2000 m')}`);
  await place.click();
  const det = main.locator('[data-gb-detail]');
  await expect(det.getByRole('heading', { level: 2 })).toHaveText('Testpass Nord');
  await expect(det).toContainText(T('First pass over 2000 m'));
  await expect(det).toContainText(/1.300 Hm/);

  // a hall by hand: «Andere», no height needed (5b)
  await main.locator('button', { hasText: T('Enter a place by hand') }).click();
  await expect(sheet).toBeVisible();
  await sheet.locator('[data-gb-name]').fill('Testhalle West');
  await sheet.locator('[data-gb-sport="other"]').click();
  await sheet.locator('[data-gb-label]').fill('Tennis');
  await sheet.locator('[data-gb-save]').click();
  await expect(sheet).toBeHidden();
  await expect(main.locator('[data-gb-place="Testhalle West"]')).toBeVisible();
  await expect(main.locator('[data-gb-chip="other"]')).toContainText('1');
  await fits(page, 'book with two places');

  // the stars in the showcase, as their own area
  await page.goto('./#/flow/trophies?area=gipfelbuch');
  const area = main.locator('[data-area="gipfelbuch"]');
  await expect(area).toBeVisible();
  await expect(area).toContainText(T('First pass over 2000 m'));
  await fits(page, 'showcase');

  expect(errors).toEqual([]);
});
