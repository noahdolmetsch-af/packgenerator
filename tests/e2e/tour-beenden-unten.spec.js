// Auffälligkeiten 28.10.2026 (Noah «1a»): «Tour beenden …» is always a visible button at the bottom of
// Unterwegs, before «Losfahren» too (it was only in the band's «…» then). It asks first; «Weiterfahren»
// closes the question. Fictional fixture (test_data_gtp_), German, phone + desktop, no sideways scroll.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
// the fixture: a 3-day trip from 8 October
const TRIP = 'test_data_gtp_trip24';
const SHOTS = process.env.SHOTS;

async function start(page, context, clock) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(clock));
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), TRIP);
  await page.goto('./#/ride');
  await page.reload();
}

for (const [name, clock] of [
  ['before setting off on day 1', '2026-10-08T07:00:00+02:00'],
  ['while riding on day 2', '2026-10-09T13:00:00+02:00'],
]) {
  test(`«Tour beenden …» at the bottom of Unterwegs, ${name}`, async ({ page, context }, info) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await start(page, context, clock);
    await expect(page.locator('.trip-band h1')).toBeVisible();
    const foot = page.locator('[data-ride-end-foot]');
    await foot.scrollIntoViewIfNeeded();
    await expect(foot).toBeVisible();
    await expect(foot).toHaveText(T('End the trip …'));
    await expect(page.locator('.rendfoot')).toContainText(T('Earlier too. The app asks first, and you can undo it.'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    if (SHOTS) {
      mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: `${SHOTS}/${clock.slice(0, 10)}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
    }
    await foot.click();
    const sheet = page.locator('dialog.endsheet');
    await expect(sheet.getByRole('heading', { name: T('End the trip now?') })).toBeVisible();
    await sheet.getByRole('button', { name: T('Ride on') }).click();
    await expect(sheet).toBeHidden();
    expect(errors).toEqual([]);
  });
}
