// «Zeitraum» on Auswerten (Noah 05.11.2026 «1a 2b 3a 4a»): one switch on top (Woche, Monat, Jahr, Alles, Eigener
// Zeitraum), paging with ‹ ›, remembered, and a line that says what it does not touch. German UI, fictional wall.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded, putWall } from './wall-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const D0 = '2026-10-09T07:52:00+02:00';

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  await putWall(page);
  await page.goto('./#/auswerten');
  await expect(page.locator('[data-period-bar]')).toBeVisible();
}
const pick = (page, name) => page.locator('[data-period-bar]').getByRole('button', { name, exact: true }).click();
// on a phone the lists sit behind one row
async function listTitle(page) {
  const fold = page.locator('[data-ov-fold] details').first();
  if ((await fold.count()) && !(await fold.evaluate((el) => el.open))) await fold.locator('summary').click();
  return page.locator('#km-h');
}

test('ZR-1 the week is the start; Month pages back with ‹ ›; the list follows', async ({ page, context }) => {
  await open(page, context);
  const bar = page.locator('[data-period-bar]');
  await expect(bar.getByRole('button', { name: T('Week|period'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-period-next]')).toBeDisabled();
  await expect(await listTitle(page)).toHaveText(T('Last 7 days'));
  await pick(page, T('Month|period'));
  await expect(page.locator('[data-period-label]')).toHaveText('Oktober 2026');
  await expect(await listTitle(page)).toHaveText('Oktober 2026');
  await expect(page.locator('[data-section="week-numbers"]')).toHaveCount(0);
  await page.locator('[data-period-prev]').click();
  await expect(page.locator('[data-period-label]')).toHaveText('September 2026');
  await expect(page.locator('[data-period-next]')).toBeEnabled();
  await page.locator('[data-period-next]').click();
  await expect(page.locator('[data-period-label]')).toHaveText('Oktober 2026');
  await expect(page.locator('[data-period-next]')).toBeDisabled();
  await pick(page, T('Year|period'));
  await expect(page.locator('[data-period-label]')).toHaveText('2026');
  await pick(page, T('Week|period'));
  await expect(await listTitle(page)).toHaveText(T('Last 7 days'));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test('ZR-2 Everything and Own range; the hint names what stays; the choice is remembered', async ({ page, context }) => {
  await open(page, context);
  await expect(page.locator('[data-period-hint]')).toContainText(T('Today'));
  await pick(page, T('Everything|period'));
  await expect(page.locator('[data-period-label]')).toHaveText(T('Everything you have recorded'));
  await expect(await listTitle(page)).toHaveText(T('All time'));
  await pick(page, T('Own range|period'));
  const own = page.locator('[data-period-own]');
  await expect(own).toBeVisible();
  await own.locator('input[data-period-from]').fill('2026-09-01');
  await own.locator('input[data-period-to]').fill('2026-09-30');
  await expect(page.locator('[data-period-incomplete]')).toHaveCount(0);
  // remembered: after a reload the own range is still there, with both days
  await page.reload();
  await expect(page.locator('[data-period-bar]').getByRole('button', { name: T('Own range|period'), exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-period-own] input[data-period-from]')).toHaveValue('2026-09-01');
  await pick(page, T('Month|period'));
  await page.locator('[data-period-prev]').click();
  await page.reload();
  // paging back starts at the present again; the mode stays
  await expect(page.locator('[data-period-label]')).toHaveText('Oktober 2026');
});
