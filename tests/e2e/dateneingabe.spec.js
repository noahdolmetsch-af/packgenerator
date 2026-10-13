// Bugfix Dateneingabe (Noah 13.10.2026: at the bike shop he could not enter the values, the app kept
// landing on other pages). «enter» on a sheet of the bike's folder opens exactly that value of exactly
// that bike for typing, and saving or cancelling comes back to the sheet, with the value on it.
import { test, expect } from '@playwright/test';
import { start, fixture, tr, esc, table } from './gesamttest/lib.js';

const T = tr('de');

/** The bike the phone's «Compare bikes» leaves out at first (it starts with two). */
const hardtail = () => fixture().summary.bikeIds.find((id) => /hardtail/.test(id));

test('Pick-up check: «enter» the saddle height, save, back on the check with the value', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const bike = hardtail();
  await page.goto(`./#/bikes?bike=${bike}&sheet=pickup`);
  const row = page.locator('.paper li').filter({ hasText: T('Saddle height') });
  await row.getByRole('link', { name: T('enter|value') }).click();
  const dlg = page.locator('dialog[open]');
  await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('heading')).toHaveText(new RegExp(esc(T('Saddle height'))));
  await expect(dlg.locator('input')).toBeFocused();
  await dlg.locator('input').fill('745');
  await dlg.getByRole('button', { name: T('Save') }).click();
  await expect(page).toHaveURL(new RegExp(esc(`sheet=pickup`)));
  await expect(page.locator('.paper li').filter({ hasText: T('Saddle height') })).toContainText('745');
  const stored = (await table(page, 'bikes')).find((b) => b.id === bike);
  expect(JSON.stringify(stored)).toContain('745');
  expect(errors).toEqual([]);
});

test('Bike pass: a part value of a bike that «Compare bikes» does not show first; Cancel goes back too', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const bike = hardtail();
  await page.goto(`./#/bikes?bike=${bike}&sheet=pass`);
  const vr = page.locator('.paper .vr').filter({ hasText: T('Rotor front') });
  await vr.getByRole('link', { name: T('enter|value') }).click();
  const dlg = page.locator('dialog[open]');
  await expect(dlg).toBeVisible();
  await expect(dlg).toContainText(fixture().data.tables.bikes.find((b) => b.id === bike).name);
  // Cancel: back on the pass, nothing changed
  await dlg.getByRole('button', { name: T('Cancel') }).click();
  await expect(page).toHaveURL(new RegExp(esc('sheet=pass')));
  await expect(vr.getByRole('link', { name: T('enter|value') })).toBeVisible();
  // again, now with a value
  await vr.getByRole('link', { name: T('enter|value') }).click();
  await dlg.locator('input').fill('180');
  await dlg.locator('input').press('Enter');
  await expect(page).toHaveURL(new RegExp(esc('sheet=pass')));
  await expect(page.locator('.paper .vr').filter({ hasText: T('Rotor front') })).toContainText('180');
  expect(errors).toEqual([]);
});
