// UI-Test Flow, Fund 8 (Noah «c»): under «Tick off today» one help line says what a tap, a long press and Meditation do
// (before there were two lines that said nearly the same). Fictional data only; the clock stands on Friday 9 October 2026.
// SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0 } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

test('one help line under «Tick off today» also names Meditation', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  const sec = page.locator('section[aria-labelledby="tick-h"]');
  await expect(sec.locator('[data-act="meditation"]')).toBeVisible();
  const help = sec.locator('[data-tick-help]');
  await expect(help).toHaveCount(1);
  await expect(help).toContainText(T('Tap|tick help'));
  await expect(help).toContainText(T('Tap Meditation: start or tick off.'));
  // no second line of its own
  await expect(sec.locator('p', { hasText: T('Tap Meditation: start or tick off.') })).toHaveCount(1);
  if (process.env.SHOTS) {
    await page.waitForTimeout(1200);
    await help.scrollIntoViewIfNeeded();
    await sec.screenshot({ path: `${process.env.SHOTS}/hinweis-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  expect(errors).toEqual([]);
});
