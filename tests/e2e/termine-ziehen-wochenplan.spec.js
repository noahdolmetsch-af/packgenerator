// «Termine ziehen» (Noah 24.11.2026 «1a 2b 3a 4a») in the Wochenplan: a unit pulled onto the next day does the same as «Move»
// (the day changes, the week plans anew, «Undo» takes it back). Computer: pull with the mouse. Phone: press and hold, then pull
// (touch events through the browser's own protocol). German, fictional data only, clock fixed (Tuesday 10 Nov 2026).
import { test, expect } from '@playwright/test';
import { ready } from './settle.js';

async function open(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00+01:00'));
  await page.goto('./#/flow/wochenplan');
  await ready(page);
  await page.locator('[data-wochenplan] [data-empty] button').first().click();
  await expect(page.locator('[data-wp-hvalue]')).toHaveText('15 Std');
  return errors;
}

/** Pull from one point to another: the mouse on a computer, press-hold-move on a phone. */
async function pull(page, info, from, to) {
  if (info.project.name !== 'phone') {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 8 });
    await page.mouse.up();
    return;
  }
  const cdp = await page.context().newCDPSession(page);
  const pt = (p) => [{ x: p.x, y: p.y }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(from) });
  await page.waitForTimeout(700); // the hold: the unit lifts
  for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt({ x: from.x + ((to.x - from.x) * i) / 8, y: from.y + ((to.y - from.y) * i) / 8 }) });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('Termine ziehen Wochenplan: a unit pulled onto the next day moves there, Undo takes it back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const root = page.locator('[data-wochenplan]');
  const unit = root.locator('[data-unit="tennis@3"]');
  await unit.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  const a = await unit.boundingBox();
  const target = root.locator('[data-wp-week] [data-day="4"] .dn');
  const t = await target.boundingBox();
  // both on the screen: the unit (Thursday) and the name of Friday below it
  expect(t.y).toBeGreaterThan(0);
  expect(t.y + t.height / 2).toBeLessThan(page.viewportSize().height);
  await pull(page, info, { x: a.x + 30, y: a.y + a.height / 2 }, { x: t.x + t.width / 2, y: t.y + t.height / 2 });
  await expect(root.locator('[data-day="4"] [data-unit="tennis@3"]')).toBeVisible();
  await expect(root.locator('[data-unit="tennis@3"] .tag')).toHaveCount(1);
  await expect(root.locator('[data-wp-msg]')).toContainText('Verschoben');
  // Undo puts it back on Thursday
  await root.locator('[data-wp-undo]').click();
  await expect(root.locator('[data-day="3"] [data-unit="tennis@3"]')).toBeVisible();
  expect(errors).toEqual([]);
});
