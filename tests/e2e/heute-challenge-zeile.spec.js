// «Challenges und Meditation vorn» (Noah 23.11.2026 «1-3a»): one line at the bottom of the block «Heute abhaken» on Heute.
// Left the challenge «Draussen» (only while it runs, +30 Min with Undo), right the meditation (always, start button).
// The big cards further down stay. The home0460 fixture: the clock stands on Friday 9 October 2026, 17:00 Zürich.
// Fictional data only. SHOTS=<folder> saves pictures.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded } from './wall-fixture.js';
import { openHome, homeFixture, day } from './home0460-fixture.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const rec = { key: 'outdoor', value: { name: 'Outdoors', goalMin: 90, from: day(-3), until: day(22), hand: { [day(0)]: [20] }, stopped: false, closed: false, no: null } };
async function open(page, context, info, withChallenge) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  data.tables.activities = [];
  if (withChallenge) data.tables.settings = [...data.tables.settings, rec];
  await openHome(page, context, info, { hour: 17, data });
  await flowSeeded(page);
  await page.reload();
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  return errors;
}
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const shot = async (page, info, name) => {
  if (!process.env.SHOTS) return;
  const box = page.locator('[data-section="haken"]');
  await box.scrollIntoViewIfNeeded();
  await page.locator('[data-challenge-line]').evaluate((el) => (el.style.outline = '3px solid #f08a24'));
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('the line sits inside the block, shows Draussen and the meditation, +30 Min adds with Undo', async ({ page, context }, info) => {
  const errors = await open(page, context, info, true);
  const line = page.locator('[data-section="haken"] [data-challenge-line]');
  await expect(line).toBeVisible();
  await expect(line.locator('[data-cl-outdoor]')).toContainText(T('{min} of {goal} min today', { min: 20, goal: 90 }));
  await expect(line.locator('[data-cl-med]')).toContainText(T('still open today'));
  await expect(line.locator('[data-cl-med-start]')).toBeVisible();
  await shot(page, info, 'zeile-challenge');
  await press(line.locator('[data-cl-add="30"]'), info);
  await expect(line.locator('[data-cl-outdoor]')).toContainText(T('{min} of {goal} min today', { min: 50, goal: 90 }));
  await press(page.locator('.ftoast').getByRole('button', { name: T('Undo') }), info);
  await expect(line.locator('[data-cl-outdoor]')).toContainText(T('{min} of {goal} min today', { min: 20, goal: 90 }));
  // the big cards stay further down (nothing falls away)
  await expect(page.locator('[data-outdoor-card]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('without a challenge the line shows only the meditation', async ({ page, context }, info) => {
  const errors = await open(page, context, info, false);
  const line = page.locator('[data-section="haken"] [data-challenge-line]');
  await expect(line).toBeVisible();
  await expect(line.locator('[data-cl-outdoor]')).toHaveCount(0);
  await expect(line.locator('[data-cl-med]')).toBeVisible();
  await shot(page, info, 'zeile-nur-meditation');
  expect(errors).toEqual([]);
});

test('the best window today: one quiet sentence under Outdoors from the hourly rain, dry until 19 in the fixture', async ({ page, context }, info) => {
  const errors = await open(page, context, info, true);
  const line = page.locator('[data-section="haken"] [data-challenge-line]');
  await expect(line.locator('[data-cl-window]')).toHaveText(T('Dry until {h}:00 today.', { h: 19 }));
  await shot(page, info, 'zeile-fenster');
  expect(errors).toEqual([]);
});
