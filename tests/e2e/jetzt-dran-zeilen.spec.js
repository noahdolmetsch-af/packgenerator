// «Jetzt dran» steuern (Noah 05.11.2026 «4a»): «Später» on a calm row hides it for a week (with Undo), and a switch per
// kind of row in the window «Zeilen wählen». German UI, phone and desktop, fictional data. SHOTS=<folder> saves screenshots.
import { test, expect } from './clock.js';
import { mkdirSync } from 'node:fs';
import { openHome } from './home0460-fixture.js';

test('JZ1: Later hides a calm row, Undo brings it back; a switch hides a kind; Show again', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  const today = page.locator('[data-section="today"]');
  await expect(today).toBeVisible();
  const imp = page.getByRole('region', { name: T('Up now') });
  const shot = async (name, loc = today) => {
    if (!process.env.SHOTS) return;
    mkdirSync(process.env.SHOTS, { recursive: true });
    await loc.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
  };
  const fold = imp.locator('details[data-good]');
  await fold.locator('summary').click();
  const count = () => fold.locator('li.quiet').count();
  const n0 = await count();
  expect(n0).toBeGreaterThan(1);
  await shot('JZ1-eins-offen');
  // «Später» on the first calm row: it goes, a notice offers Undo
  const first = fold.locator('li.quiet').first();
  const kind = await first.getAttribute('data-row');
  await first.getByRole('button', { name: T('later') }).click();
  await expect(imp.getByRole('status').or(page.getByRole('status')).first()).toContainText(T('Hidden for a week: {text}').split('{')[0]);
  await expect.poll(count).toBe(n0 - 1);
  await shot('JZ1-eins-spaeter');
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect.poll(count).toBe(n0);
  // the window: one switch per kind
  await imp.locator('[data-rows-open]').click();
  const sheet = page.locator('dialog[data-rows-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('input[data-row-kind]').first()).toBeChecked();
  await expect(sheet.locator(`input[data-row-kind="${kind}"]`)).toBeChecked();
  await shot('JZ1-fenster', sheet);
  await sheet.locator(`input[data-row-kind="${kind}"]`).uncheck();
  await expect.poll(count).toBe(n0 - 1);
  await expect(fold.locator(`li[data-row="${kind}"]`)).toHaveCount(0);
  // a calm row put off with «Later» is listed in the window with «Show again»
  await sheet.locator(`input[data-row-kind="${kind}"]`).check();
  await sheet.locator('[data-rows-done]').click();
  await expect(sheet).toBeHidden();
  await fold.locator('li.quiet').first().getByRole('button', { name: T('later') }).click();
  await imp.locator('[data-rows-open]').click();
  await expect(sheet.locator('[data-rows-later] li')).toHaveCount(1);
  await shot('JZ1-fenster-spaeter', sheet);
  await sheet.locator('[data-row-again]').click();
  await expect(sheet.locator('[data-rows-later]')).toHaveCount(0);
});
