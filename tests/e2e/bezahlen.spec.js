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
  const row = page.locator('a.ich-row[href="#/me/pay"]');
  await expect(row).toContainText(T('Payments'));
  await expect(row).toContainText(T('prepared|pay'));
  await expect(page.locator('section[aria-labelledby="me-app-h"]')).toContainText(T('Payments'));
  await row.click();
  await expect(page).toHaveURL(/#\/me\/pay$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(T('Payments'));
  await expect(page.getByRole('note')).toContainText(T('Prepared, not active yet.'));

  const cards = page.locator('.pay-card');
  await expect(cards).toHaveCount(USE_CASES.length);
  for (const [i, u] of USE_CASES.entries()) await expect(cards.nth(i)).toContainText(T(u.title));
  const have = page.locator('section[aria-labelledby="pay-have-h"] .ich-row');
  await expect(have).toHaveCount(PREPARED.length);
  for (const [i, p] of PREPARED.entries()) await expect(have.nth(i)).toContainText(T(p.title));
  await expect(page.locator('.pay-cost')).toContainText(T('CHF 0'));
  await expect(page.locator('.pay-miss li')).toHaveCount(MISSING.length);

  // read only: nothing on the page pays or switches anything on
  await expect(page.locator('.pay button, .pay .btn')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
