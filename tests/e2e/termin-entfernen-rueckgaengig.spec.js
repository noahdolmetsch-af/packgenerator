// «Entfernen» bei einem Termin (Durchklick Etappe 4, Befund E4-005): removing a date in the week plan offers Undo,
// and Undo brings it back. Fictional data only.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';

const T = tr('de');

test('removing a date in the week offers Undo and Undo brings it back', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/week');
  await page.reload();
  await page.locator('main').waitFor();

  await page.getByRole('button', { name: T('Date|week'), exact: true }).click();
  await page.getByPlaceholder(T('e.g. Dentist')).fill('Test-Termin');
  await page.getByRole('button', { name: T('Save'), exact: true }).last().click();
  await expect(page.getByText('Test-Termin')).toHaveCount(1);

  await page.getByRole('button', { name: T('Remove: {title}', { title: 'Test-Termin' }) }).click();
  await expect(page.getByText('Test-Termin', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(page.getByText('Test-Termin', { exact: true })).toHaveCount(1);

  expect(errors).toEqual([]);
});
