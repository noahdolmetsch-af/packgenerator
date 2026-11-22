// «Tourenvorschläge» (Noah 05.11.2026 «1a 2a 3a»): the pilot page with five tours, its filters, one tour with map, profile and
// «Why this suggestion?», «Not for me» with Undo. Independent of the month: snow only moves tours between two groups.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');

test('Tour suggestions: five tours, filters, one tour, hide and undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));

  // the way in: Touren › Träume has the button
  await page.goto('./#/trips/dreams');
  await ready(page);
  await page.locator('[data-dreams-suggest]').click();
  await expect(page.locator('[data-page="vorschlaege"] h1')).toHaveText(T('Tour suggestions'));
  const tours = page.locator('[data-vs-tour]');
  await expect(tours).toHaveCount(5); // medium and difficult: every pilot tour has one of them
  await expect(page.locator('[data-vs-filters] [data-vs-level="easy"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-vs-filters] [data-vs-level="medium"]')).toHaveAttribute('aria-pressed', 'true');

  // region and level filters
  await page.locator('[data-vs-region="zh"]').click();
  await expect(tours).toHaveCount(2);
  await page.locator('[data-vs-region="zh"]').click();
  await page.locator('[data-vs-level="medium"]').click();
  await page.locator('[data-vs-level="difficult"]').click();
  await expect(page.getByText(T('No tour fits these filters.'))).toBeVisible();
  await page.getByRole('button', { name: T('Reset filters') }).click();
  await expect(tours).toHaveCount(5);
  await page.locator('[data-vs-hours="2"]').click();
  await expect(tours).toHaveCount(1); // only the downhill is under two hours
  await page.locator('[data-vs-hours="any"]').click();

  // kind: only the downhill; the start filter needs a home place, so it only gives a hint here
  await page.locator('[data-vs-art="downhill"]').click();
  await expect(tours).toHaveCount(1);
  await page.locator('[data-vs-art="downhill"]').click();
  await expect(tours).toHaveCount(5);
  await expect(page.locator('[data-vs-start]')).toContainText(T('Set your home place and you can choose how far the start may be.'));

  // one tour: the hardest of the pilot, with warning, profile and the reasons
  await page.locator('[data-vs-tour="sm-332"] a.tl').click();
  await expect(page.locator('[data-page="vorschlaege"] h1')).toContainText('Davos');
  await expect(page.locator('[data-vs-map]')).toBeVisible();
  await expect(page.locator('[data-vs-warn]')).toBeVisible();
  await expect(page.locator('[data-profile] svg').first()).toBeVisible();
  await expect(page.locator('[data-vs-why]')).toContainText(T('Why this suggestion?'));
  await page.locator('[data-profile] input[type="range"]').fill('500');
  await expect(page.locator('[data-vs-facts]')).toContainText('33 km');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  // choose the lines: «Snow» off, the line is gone
  await page.locator('[data-vs-lines] summary').click();
  await page.locator('[data-vs-line="snow"]').uncheck();
  await expect(page.locator('[data-vs-why] li')).toHaveCount(2); // time and difficulty are left
  await page.locator('[data-vs-line="snow"]').check();

  // keep as a dream
  await page.locator('[data-vs-dream]').click();
  await expect(page.getByRole('status').filter({ hasText: T('Open Dreams') })).toBeVisible();

  // not for me, then undo
  await page.locator('[data-vs-hide]').click();
  await expect(page).toHaveURL(/#\/trips\/vorschlaege$/);
  await expect(tours).toHaveCount(4);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(tours).toHaveCount(5);
  expect(errors).toEqual([]);
  void info;
});
