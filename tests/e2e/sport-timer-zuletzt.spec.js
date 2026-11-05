// «Aktiv und Auswerten» 5a (Noah 03.11.2026): «Zuletzt genutzt» on top of «Meine Sportarten» (the three sports ticked
// last) and the block «Timer» on a sport page (it opens the stopwatch of this sport, can be switched off).
// German, phone + desktop, fictional ticks, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const tick = (actId, day) => ({ id: `test_data_zl_${actId}_${day}`, actId, day, at: `${day}T07:00:00+02:00`, n: 1 });

test('SZ-1 «Zuletzt genutzt» shows the last three sports, the newest first, one tap to their page', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow/sports');
  await ready(page);
  await expect(page.locator('[data-recent-sports]')).toHaveCount(0); // nothing ticked yet: no row
  await put(page, { flowLog: [tick('yoga', '2026-10-05'), tick('run', '2026-10-08'), tick('gym', '2026-10-07'), tick('hiking', '2026-09-01')] });
  await page.reload();
  await ready(page);
  const box = page.locator('[data-recent-sports]');
  await expect(box.getByRole('heading', { name: T('Last used|sports') })).toBeVisible();
  await expect(box.locator('[data-recent]')).toHaveCount(3);
  expect(await box.locator('[data-recent]').evaluateAll((els) => els.map((e) => e.dataset.recent))).toEqual(['run', 'gym', 'yoga']);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  await box.locator('[data-recent="run"]').click();
  await expect(page).toHaveURL(/#\/flow\/sport\/act%3Arun/);
  expect(errors).toEqual([]);
});

test('SZ-2 a sport page has the block «Timer»: it opens the stopwatch, and «Adjust blocks» switches it off', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow/sport/act%3Arun');
  await ready(page);
  const blk = page.locator('[data-block="timer"]');
  await expect(blk.getByRole('heading', { name: T('Timer') })).toBeVisible();
  await page.screenshot({ path: info.outputPath('sz-sportseite.png') });
  await blk.locator('[data-sport-timer]').click();
  await expect(page.locator('dialog.tsheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('[data-adjust]').click();
  await page.locator('[data-toggle="timer"]').click();
  await expect(page.locator('[data-block="timer"]')).toHaveCount(0);
  await page.locator('[data-toggle="timer"]').click(); // and on again
  await expect(page.locator('[data-block="timer"]')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});
