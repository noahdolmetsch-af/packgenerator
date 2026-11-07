// «Speichern» zweimal schnell in Notizen (Durchklick Etappe 4, Befund E4-004): the note form must keep one note
// when «Save» is tapped twice at once. Fictional data only.
import { test, expect } from './clock.js';
import { start, table, tr } from './gesamttest/lib.js';

const T = tr('de');

test('a double tap on Save keeps one note', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/notes');
  await page.reload();
  await page.locator('main').waitFor();

  const before = (await table(page, 'notes')).length;
  await page.getByRole('textbox', { name: T('New note') }).fill('Doppeltipp-Notiz');
  await page.getByRole('button', { name: T('Save'), exact: true }).first().dblclick();
  await expect(page.getByRole('textbox', { name: T('New note') })).toHaveValue('');
  await page.waitForTimeout(500);
  expect((await table(page, 'notes')).length).toBe(before + 1);

  expect(errors).toEqual([]);
});
