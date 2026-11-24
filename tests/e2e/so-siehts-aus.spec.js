// «So sieht's aus» (Noah 23.11.2026 «1-5a», Frage 5a): the empty cards of Trips, Pack, Gear and Bikes have a quiet line
// «See a sample»; a tap puts the example trip, bike and gear in (marked example) and the page fills. German UI, empty app.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { SOSIEHT_AREAS } from '../../src/lib/firststart/sosieht.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const PAGE = { trips: '#/trips', pack: '#/pack', gear: '#/gear', bikes: '#/bikes', week: '#/day' }; // week: the empty day of Mein Tag

test.beforeEach(async ({ context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
});

test('every empty main page has the line, inside the empty card and not above it', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const a of SOSIEHT_AREAS.filter((x) => PAGE[x])) {
    await page.goto(`./${PAGE[a]}`);
    const line = page.locator(`[data-sosieht="${a}"]`);
    await expect(line).toBeVisible();
    await expect(line.locator('xpath=ancestor::*[@data-empty]')).toHaveCount(1);
    await expect(line).toContainText(T('How it looks'));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  }
  expect(errors).toEqual([]);
});

test('a tap on «See a sample» puts the sample in and the page fills; the line is gone then', async ({ page }) => {
  await page.goto('./#/trips');
  await page.locator('[data-sosieht="trips"] [data-sosieht-go]').click();
  await expect(page.getByText(T('Jura loop (example)')).first()).toBeVisible();
  await expect(page.locator('[data-sosieht]')).toHaveCount(0);
  await page.goto('./#/bikes');
  await expect(page.locator('[data-sosieht]')).toHaveCount(0);
  await expect(page.getByText(T('Gravel bike (example)')).first()).toBeVisible();
});

test('on Pack the sample trip opens with its list', async ({ page }) => {
  await page.goto('./#/pack');
  await page.locator('[data-sosieht="pack"] [data-sosieht-go]').click();
  await expect(page.getByText(T('Jura loop (example)')).first()).toBeVisible();
  await expect(page.locator('[data-sosieht]')).toHaveCount(0);
});

test('on Mein Tag the sample week fills Abhaken; the line is gone then and never shows on an empty day of a used app', async ({ page }) => {
  await page.goto('./#/day');
  await page.locator('[data-sosieht="week"] [data-sosieht-go]').click();
  await expect(page.locator('[data-sosieht]')).toHaveCount(0);
  // the sample ticks are in: another empty day shows no sample line any more
  await page.goto('./#/day/2027-02-03');
  await expect(page.locator('[data-empty]').first()).toBeVisible();
  await expect(page.locator('[data-sosieht]')).toHaveCount(0);
});
