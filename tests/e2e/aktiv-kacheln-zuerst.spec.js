// Noah 24.11.2026 «1-5a» (impeccable, whole app): «Heute abhaken» puts the tiles first.
// 1. The tiles stand right under the help line, before the week and the rings (phone: in the first screen and a half).
// 2. The second heading «Heute abhaken» and the line under it (the week number, which the head already says) stay for screen readers only.
// 3. The head of the part is just the two quiet links: «Stoppuhr ›» on the left, «Bearbeiten ›» on the right.
// Fictional data only (the start activities).
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('Heute abhaken: tiles first, the heading only for screen readers, Stoppuhr left and Bearbeiten right', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const tick = page.locator('section[aria-labelledby="tick-h"]');
  const week = page.locator('section[aria-labelledby="week-h"]');
  const first = tick.locator('[data-act="run"]');
  await expect(first).toBeVisible();

  // 1. the tiles come before the week
  const t = await first.boundingBox();
  const w = await week.boundingBox();
  // (a phone has one column; on a computer the week stands in the second column, beside the tiles)
  if (info.project.name === 'phone') {
    expect(t.y).toBeLessThan(w.y);
    expect(t.y).toBeLessThan(700);
  }

  // 2. the heading is still there for screen readers, but takes no room
  const h = page.locator('#tick-h');
  await expect(h).toHaveText(T('Tick off today'));
  const hb = await page.locator('section[aria-labelledby="tick-h"] .st').boundingBox();
  expect(hb.width).toBeLessThanOrEqual(2);
  expect(hb.height).toBeLessThanOrEqual(2);

  // 3. Stoppuhr left, Bearbeiten right
  const stop = await tick.getByRole('button', { name: T('Stopwatch'), exact: true }).boundingBox();
  const edit = await tick.locator('[data-sec-edit]').boundingBox();
  expect(stop.x).toBeLessThan(edit.x);
  expect(Math.abs(stop.y - edit.y)).toBeLessThan(12);
  expect(errors).toEqual([]);
});
