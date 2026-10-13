// Bugfix Dateneingabe (Noah 13.10.2026: at the bike shop he could not enter the values, the app kept
// landing on other pages). «enter» on a sheet of the bike's folder opens exactly that value of exactly
// that bike for typing, and saving or cancelling comes back to the sheet, with the value on it.
import { test, expect } from '@playwright/test';
import { start, fixture, tr, esc, table } from './gesamttest/lib.js';

const T = tr('de');

/** The bike the phone's «Compare bikes» leaves out at first (it starts with two). */
const hardtail = () => fixture().summary.bikeIds.find((id) => /hardtail/.test(id));

// D1a (Noah «D1–D4 freigegeben», Wert-Karten ★): the values of the Pick-up check are typed right on the sheet.
test('Pick-up check: type the saddle height on the card, Next opens the next value, steps with plus', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const bike = hardtail();
  await page.goto(`./#/bikes?bike=${bike}&sheet=pickup`);
  const card = (label) => page.locator('.paper li.vcard').filter({ hasText: T(label) });
  await expect(page.locator('.paper .vprog')).toBeVisible();
  await card('Saddle height').getByRole('button').click();
  const input = card('Saddle height').locator('input');
  await expect(input).toBeFocused();
  await input.fill('745');
  await input.press('Enter');
  // saved and done, still on the sheet; the next open value is ready
  await expect(page).toHaveURL(new RegExp(esc('sheet=pickup')));
  await expect(card('Saddle height')).toHaveClass(/done/);
  await expect(card('Saddle height')).toContainText('745');
  const stored = (await table(page, 'bikes')).find((b) => b.id === bike);
  expect(stored.fit.seatHeight).toBe(745);
  expect(stored.sheets.pickup.ticks['val:seatHeight']).toBe(true);
  // the first card of the check: «Leave empty» marks it done without a value
  const first = page.locator('.paper li.vcard').first();
  await first.getByRole('button').click();
  await first.getByRole('button', { name: T('Leave empty') }).click();
  await expect(page.locator('.paper li.vcard').first()).toHaveClass(/done/);
  // the saddle height again: the field has the value, − and + step it
  await card('Saddle height').getByRole('button').click();
  await expect(card('Saddle height').locator('input')).toHaveValue('745');
  await card('Saddle height').getByRole('button', { name: T('One step more') }).click();
  await expect(card('Saddle height').locator('input')).toHaveValue('746');
  await card('Saddle height').getByRole('button', { name: T('Save') }).click();
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === bike).fit.seatHeight).toBe(746);
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

// D2–D4: «Enter values», every value of one bike on one page; «Choose fields» for all bikes; an own field.
test('Enter values: type, «Next» to the next field, hide a field for all bikes, add an own field', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const bike = hardtail();
  await page.goto(`./#/bikes?tab=compare&bike=${bike}`);
  await page.getByRole('link', { name: T('Enter values') }).click();
  await expect(page.getByRole('heading', { level: 1, name: T('Enter values') })).toBeVisible();
  const field = (label) => page.getByLabel(T(label), { exact: true });
  await field('Target pressure front').fill('1,8');
  await field('Target pressure front').press('Enter');
  await expect(field('Target pressure rear')).toBeFocused();
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === bike).fit.pressureF).toBe(1.8);
  // D3: hide «Saddle setback» for all bikes, only here
  await page.getByRole('button', { name: T('Choose fields') }).click();
  const dlg = page.locator('dialog[open]');
  await dlg.getByRole('switch', { name: T('Show {field}').replace('{field}', T('Saddle setback')) }).click();
  await dlg.getByRole('button', { name: T('Done') }).click();
  await expect(field('Saddle setback')).toHaveCount(0);
  await page.goto(`./#/bikes?bike=${bike}&sheet=pass`);
  await expect(page.locator('.paper .vr').filter({ hasText: T('Saddle setback') })).toHaveCount(1);
  // D4: an own field in «Suspension», every bike gets it
  await page.goto(`./#/bikes?tab=compare&view=enter&bike=${bike}`);
  await page.locator('section.grp').filter({ hasText: T('Suspension|values') }).getByRole('button', { name: T('Own field') }).click();
  const own = page.locator('dialog[open]');
  await own.getByLabel(T('Name'), { exact: true }).fill('Token Gabel');
  await own.getByLabel(T('Unit (free, may stay empty)')).fill('Stück');
  await own.getByRole('button', { name: T('Add field') }).click();
  await expect(page.getByLabel(/Token Gabel/)).toBeVisible();
  await page.getByLabel(/Token Gabel/).fill('2');
  await page.getByLabel(/Token Gabel/).press('Enter');
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === bike).ownValues?.['token-gabel']).toBe(2);
  // Show all brings the hidden field back
  await page.getByRole('button', { name: T('Choose fields') }).click();
  await page.locator('dialog[open]').getByRole('button', { name: T('Show all') }).click();
  await page.locator('dialog[open]').getByRole('button', { name: T('Done') }).click();
  await expect(field('Saddle setback')).toBeVisible();
  expect(errors).toEqual([]);
});
