// «Doppeltipp-Schutz» (Durchklick Etappe 4, Noah 06.11.2026 «5a»): two quick taps on «Save» keep one note and one to-do,
// whatever the window does itself. Fictional data only.
import { test, expect } from './clock.js';
import { start, table, tr } from './gesamttest/lib.js';

const T = tr('de');

test('a double tap on Save keeps one note and one to-do', async ({ page, context }, info) => {
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

  await page.goto('./#/calendar');
  await page.reload();
  await page.locator('main').waitFor();
  await page.getByRole('button', { name: T('Add a to-do') }).click();
  const dlg = page.getByRole('dialog').last();
  await dlg.getByRole('textbox', { name: T('What?') }).fill('Doppeltipp-Aufgabe');
  await dlg.getByRole('button', { name: T('Save'), exact: true }).dblclick();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('li.td', { hasText: 'Doppeltipp-Aufgabe' })).toHaveCount(1);

  expect(errors).toEqual([]);
});
