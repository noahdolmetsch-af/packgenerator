// «Speichern» zweimal schnell (Durchklick Etappe 4, Befund E4-003): the to-do and list windows of Merken must
// add the entry once and raise no error when «Save» is tapped twice at once. Fictional data only.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';

const T = tr('de');

test('a double tap on Save adds one to-do and one list, with no error', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/calendar');
  await page.reload();
  await page.locator('main').waitFor();

  await page.getByRole('button', { name: T('Add a to-do') }).click();
  let dlg = page.getByRole('dialog').last();
  await dlg.getByRole('textbox', { name: T('What?') }).fill('Doppeltipp-Aufgabe');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).dblclick();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('li.td', { hasText: 'Doppeltipp-Aufgabe' })).toHaveCount(1);

  await page.getByRole('button', { name: T('New list') }).click();
  dlg = page.getByRole('dialog').last();
  await dlg.getByRole('textbox', { name: T('Name'), exact: true }).fill('Doppeltipp-Liste');
  await dlg.getByRole('button', { name: T('Create list'), exact: true }).dblclick();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('main').getByText('Doppeltipp-Liste', { exact: true })).toHaveCount(1);

  expect(errors).toEqual([]);
});
