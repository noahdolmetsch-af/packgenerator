// «Bausteine» (Noah 15.10.2026, B «1 a+b, 2 a+b, 3 a+b, 4a, 5a», BS «1b 2a 3b 4a 5b»): the Bike pass and
// the Workshop order are made of blocks. Arranged right in the sheet or on the page «Bausteine»; the
// first change asks for all bikes or only this one; a switched off block is missing in the text too;
// an own block deleted on one bike asks about the others.
import { test, expect } from '@playwright/test';
import { start, fixture, tr, table } from './gesamttest/lib.js';

const T = tr('de');
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

function data() {
  const d = structuredClone(fixture().data);
  const bike = d.tables.bikes.find((b) => /hardtail/.test(b.id));
  return { d, id: bike.id, name: bike.name };
}

test('B3 B4: arranging in the sheet asks once, a switched off block leaves the sheet and the text', async ({ page, context }, info) => {
  const { d, id, name } = data();
  const errors = await start(page, context, info, { data: d });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`./#/bikes?bike=${id}&sheet=order`);
  await expect(page.locator('.paper [data-block="wishes"]')).toBeVisible();
  await page.getByTestId('arrange').click();
  const row = page.getByTestId('block-list').locator('[data-block="wishes"]');
  await row.getByRole('switch').click();
  // BS4 a: the first change on this bike asks for all bikes or only this one
  const ask = page.getByTestId('block-ask');
  await expect(ask).toContainText(fill(T('Change the order for all bikes or only for {bike}?'), { bike: name }));
  await ask.getByRole('button', { name: fill(T('Only for {bike}'), { bike: name }) }).click();
  await expect(row.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === id).sheetBlocks?.layout?.order?.find((x) => x.id === 'wishes')?.on).toBe(false);
  // asked once: the next change goes to the same place without a question
  await page.getByTestId('block-list').locator('[data-block="budget"]').getByRole('button', { name: fill(T('Move {name} up'), { name: T('Cost limit') }) }).click();
  await expect(ask).toHaveCount(0);
  await page.getByRole('button', { name: T('Done|arrange') }).click();
  await expect(page.locator('.paper [data-block="wishes"]')).toHaveCount(0);
  // the text to the bike shop has no wishes line now
  await page.getByRole('button', { name: T('Copy text') }).click();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Grüezi');
  expect(text).not.toContain('Wünsche:');
  // another bike keeps the standard
  const other = d.tables.bikes.find((b) => b.id !== id);
  await page.goto(`./#/bikes?bike=${other.id}&sheet=order`);
  await expect(page.locator('.paper [data-block="wishes"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('B3 a: the page Bausteine adds a block from the library for all bikes, and back to the standard', async ({ page, context }, info) => {
  const { d, id } = data();
  const errors = await start(page, context, info, { data: d });
  await page.goto(`./#/bikes?bike=${id}&sheet=blocks`);
  await expect(page.getByTestId('blocks-page')).toBeVisible();
  const lib = page.getByTestId('block-library');
  await lib.locator('[data-block="replaced"]').getByRole('button', { name: T('Add|block') }).click();
  await page.getByTestId('block-ask').getByRole('button', { name: T('For all bikes') }).click();
  await expect(page.getByTestId('block-list').locator('[data-block="replaced"]')).toBeVisible();
  await expect.poll(async () => (await table(page, 'settings')).find((s) => s.key === 'sheetBlocks')?.value?.layout?.pass?.some((x) => x.id === 'replaced' && !x.lib)).toBe(true);
  // undo puts the standard back
  await page.getByTestId('block-notice').getByRole('button', { name: T('Undo') }).click();
  await expect(page.getByTestId('block-list').locator('[data-block="replaced"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('B5 BS5: an own block with a text per bike; deleting it asks about the other bikes', async ({ page, context }, info) => {
  const { d, id, name } = data();
  const errors = await start(page, context, info, { data: d });
  await page.goto(`./#/bikes?bike=${id}&sheet=pass`);
  const note = page.locator('.paper [data-block="own:note"] textarea');
  await note.fill('Sattel 2 mm nach vorne');
  await note.blur();
  await expect.poll(async () => (await table(page, 'bikes')).find((b) => b.id === id).sheetBlocks?.own?.note?.text).toBe('Sattel 2 mm nach vorne');
  await page.getByTestId('arrange').click();
  const row = page.getByTestId('block-list').locator('[data-block="own:note"]');
  await row.getByRole('button', { name: fill(T('More for {what}'), { what: T('Note') }) }).click();
  await page.getByRole('menuitem', { name: new RegExp(T('Delete block')) }).click();
  const ask = page.getByTestId('block-ask');
  await expect(ask).toContainText(fill(T('Delete «{block}» on all bikes too?'), { block: T('Note') }));
  await ask.getByRole('button', { name: fill(T('Only on {bike}'), { bike: name }) }).click();
  await expect(row).toHaveCount(0);
  const other = d.tables.bikes.find((b) => b.id !== id);
  await page.goto(`./#/bikes?bike=${other.id}&sheet=pass`);
  await expect(page.locator('.paper [data-block="own:note"]')).toBeVisible();
  expect(errors).toEqual([]);
});
