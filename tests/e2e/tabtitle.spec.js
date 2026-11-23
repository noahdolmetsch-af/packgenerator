// «Seitentitel im Browser-Tab» (Noah 23.11.2026 «2a»): the tab says where you are; Heute is «Pack Generator».
// German UI, no network, fictional data only (an empty app).
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { startRun, RUN_KEY } from '../../src/lib/timer.js';

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

test('Heute keeps the name of the app, another page names itself and its place', async ({ page, context }) => {
  await open(page, context, '#/');
  await expect.poll(() => page.title()).toBe('Pack Generator');
  await page.goto('./#/week');
  await ready(page);
  await expect.poll(() => page.title()).toMatch(/·|Woche/);
  await expect.poll(() => page.title()).not.toBe('Pack Generator');
  await expect(page.locator('[data-tab-title-live]')).toHaveCount(1);
});

test('a running timer puts its time in front of the title, on every page', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const run = startRun({ mode: 'up' }, Date.now() - 754_000, 'Meditation');
  await context.addInitScript(([key, v]) => {
    localStorage.setItem('lang', 'de');
    localStorage.setItem(key, JSON.stringify(v));
  }, [RUN_KEY, run]);
  await page.goto('./#/week');
  await ready(page);
  await expect.poll(() => page.title()).toMatch(/^▶ 12:\d\d · Meditation$/);
  await page.goto('./#/');
  await expect.poll(() => page.title()).toMatch(/^▶ 1\d:\d\d · Meditation$/);
});
