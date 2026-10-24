// Ich › Bezahlen (mockups BZ1 + BZ2b, Noah 14.10.2026 «1a 2b», «bz freigeben»): the row under Ich ›
// The app opens #/me/pay; the page shows the note on top, one card per idea, the prepared parts, the
// costs and what is missing, in German, without sideways scrolling. Lists are read from the app source.
import { test, expect } from '@playwright/test';
import { tr } from './home0460-fixture.js';
import { ready } from './settle.js';
import { USE_CASES, PREPARED, MISSING } from '../../src/lib/pay/info.js';

const T = tr('de');

test.beforeEach(async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/me');
  await ready(page);
});

test('Ich › Die App › Bezahlen opens the explaining page', async ({ page }) => {
  // Klick-Rundgang Q05 (Noah 22.10.2026 «3a», changed on purpose): «App verkaufen» is dropped, Ich no longer lists this page; it opens by its address
  await expect(page.locator('a.ich-row[href="#/me/pay"]')).toHaveCount(0);
  await page.goto('./#/me/pay');
  await expect(page).toHaveURL(/#\/me\/pay$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Payments'));
  // Impeccable Runde 2 (on purpose): «Invoices» on top, everything prepared folded under «Sell and book»
  await expect(page.locator('.pay-inv')).toContainText(T('Invoices'));
  await expect(page.getByRole('note')).toBeHidden();
  await page.locator('details.pay-more > summary').click();
  await expect(page.getByRole('note')).toContainText(T('Prepared, not active yet.'));

  const cards = page.locator('.pay-card');
  await expect(cards).toHaveCount(USE_CASES.length);
  for (const [i, u] of USE_CASES.entries()) await expect(cards.nth(i)).toContainText(T(u.title));
  const have = page.locator('section[aria-labelledby="pay-have-h"] .ich-row');
  await expect(have).toHaveCount(PREPARED.length);
  for (const [i, p] of PREPARED.entries()) await expect(have.nth(i)).toContainText(T(p.title));
  await expect(page.locator('.pay-cost')).toContainText(T('CHF 0'));
  await expect(page.locator('.pay-miss li')).toHaveCount(MISSING.length);

  // «prepared» is grey now, never a green «ready» (nothing is active yet)
  await expect(have.locator('.pay-ok').first()).toHaveText(T('prepared|pay'));
  // read only: nothing in the prepared part pays or switches anything on (the one button opens the invoices)
  await expect(page.locator('.pay-more button, .pay-more .btn')).toHaveCount(0);
  await expect(page.locator('.pay .btn')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
