// «Rueckmeldung beim Tippen» (Noah 25.11.2026 «1-5a»): on Today a tick buzzes briefly and the tile lights up; taking it back stays quiet;
// with the switch «Short vibration when ticking» off nothing buzzes. The app seeds its own fictional activities; no personal data.
import { test, expect } from '@playwright/test';
import { flowSeeded, putWall } from './wall-fixture.js';

const D0 = '2026-10-09T07:52:00+02:00';

async function open(page, context, { buzzOff = false } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript((off) => {
    localStorage.setItem('lang', 'de');
    if (off) localStorage.setItem('ops.buzz', '0');
    window.__buzz = [];
    navigator.vibrate = (p) => (window.__buzz.push(p), true);
  }, buzzOff);
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  await putWall(page);
  await expect(page.locator('[data-section="flow"] [data-act="pushups"]')).toBeVisible();
}
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

test('Today: a tick buzzes once and lights up, taking it back stays quiet', async ({ page, context }, info) => {
  await open(page, context);
  const push = page.locator('[data-section="flow"] [data-act="pushups"]');
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__buzz.length)).toBe(1);
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.__buzz.length)).toBe(1);
});

test('Today: with the switch off a tick does not buzz', async ({ page, context }, info) => {
  await open(page, context, { buzzOff: true });
  const push = page.locator('[data-section="flow"] [data-act="pushups"]');
  await press(push, info);
  await expect(push).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__buzz.length)).toBe(0);
});
