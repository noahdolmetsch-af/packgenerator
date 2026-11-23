// «Weiter zu …» (thread «Navigation ohne Sackgassen»): a page whose only link led back to its place ends with one line with the way on.
import { test, expect } from './clock.js';
import { ready } from './settle.js';
import { weiterOf, WEITER_ADDRESSES } from '../../src/lib/nav/weiter.js';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const PAGES = WEITER_ADDRESSES.filter((a) => weiterOf(a).length);

test('every page of the list ends with «Weiter zu» and its links lead to the pages named', async ({ page, context }) => {
  test.setTimeout(240_000);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await ready(page);
  expect(PAGES.length).toBeGreaterThan(20);
  for (const hash of PAGES) {
    await page.evaluate((h) => { location.hash = h; }, hash);
    const line = page.locator('main nav[data-weiter]');
    await expect(line, hash).toHaveCount(1, { timeout: 15_000 });
    await expect(line, hash).toContainText('Weiter zu');
    const want = weiterOf(hash);
    const hrefs = await line.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs, hash).toEqual(want.map((w) => w.href));
    const names = await line.locator('a').allTextContents();
    expect(names.map((n) => n.trim()), hash).toEqual(want.map((w) => T(w.label)));
  }
});

test('a tap on «Weiter zu» opens that page, and Back returns', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/');
  await ready(page);
  await page.evaluate(() => { location.hash = '#/stopps'; });
  const line = page.locator('main nav[data-weiter]');
  await expect(line).toHaveCount(1, { timeout: 15_000 });
  await line.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('weiter-zu.png') });
  await line.getByRole('link', { name: 'Weg zum Ziel' }).click();
  await expect(page).toHaveURL(/#\/trips\/weg$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/stopps$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
});
