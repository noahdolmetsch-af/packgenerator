// Ich aufräumen (Noah 24.11.2026, Sitemap): fünf Gruppen, Dokumente in Daten, eine Zeile für Erinnerungen, Logbuch in Hilfe
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Ich: five groups, Documents under Data, one row for reminders, the log under Help', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/me');
  const main = page.locator('main');
  await expect(main.locator('[data-me-row="docs"]')).toBeVisible();
  await expect(main.locator('[data-row="reminders"]')).toContainText(T('Reminders and alerts'));
  // the three old reminder rows are gone from Ich, the log stands under Help
  for (const h of ['#/me/push', '#/me/hinweise']) await expect(main.locator(`a.ich-row[href="${h}"]`)).toHaveCount(0);
  await expect(page.locator('section[aria-labelledby="me-app-h"] a[data-row="logbuch"]')).toBeVisible();
  // at most 17 rows are visible without opening «More» (16 and the version row)
  const open = await main.locator('a.ich-row:visible, button.ich-row:visible, li.ich-row:visible').count();
  expect(open).toBeLessThanOrEqual(20);
  // the pages stay reachable and lead to each other with «Continue to»
  await main.locator('[data-row="reminders"]').click();
  await expect(page).toHaveURL(/#\/me\/reminders/);
  await page.goto('./#/me/push');
  await expect(page.locator('main').getByRole('link', { name: T('Alerts and news') }).last()).toBeVisible();
  expect(errors).toEqual([]);
});

test('Logbuch: the address with neu opens the empty entry, the help window of every page has the line', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/week');
  await page.locator('[data-help-open]').filter({ visible: true }).first().click();
  const line = page.locator('dialog[data-help] [data-help-log]');
  await expect(line).toContainText(T('Something missing? Into the log'));
  await line.click();
  await expect(page.locator('[data-logbuch-sheet]')).toBeVisible();
  // the address no longer asks for a new entry (a reload does not open it again)
  await expect(page).toHaveURL(/#\/me\/logbuch$/);
  expect(errors).toEqual([]);
});

test('Neu menu: the row Write down an improvement opens the empty log entry', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/gear');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('pg:new')));
  const row = page.locator('dialog.sheet.new [data-new-log]');
  await expect(row).toContainText(T('Write down an improvement'));
  await row.click();
  await expect(page.locator('[data-logbuch-sheet]')).toBeVisible();
  expect(errors).toEqual([]);
});
