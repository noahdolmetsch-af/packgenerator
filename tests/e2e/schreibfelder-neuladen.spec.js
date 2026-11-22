// Durchklick Etappe 6 (Noah 06.11.2026 «4a»): a note typed in Notizen or in the Planungs-Notiz of Packen is still
// there after a reload, until it is saved. Fictional data (home0460-fixture).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Notizen: the typed text survives a reload and goes after saving', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const T = await openHome(page, context, info);
  await page.goto('./#/notes');
  const field = page.getByLabel(T('New note'), { exact: true }).first();
  await field.fill('Gedanke fuer spaeter');
  await page.reload();
  const again = page.getByLabel(T('New note'), { exact: true }).first();
  await expect(again).toHaveValue('Gedanke fuer spaeter', { timeout: 20_000 });
  await page.getByRole('button', { name: T('Save'), exact: true }).first().click();
  await page.reload();
  await expect(page.getByLabel(T('New note'), { exact: true }).first()).toHaveValue('');
});

test('Packen: the typed planning note survives a reload and goes after adding', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const T = await openHome(page, context, info);
  await page.goto('./#/pack');
  const field = page.getByLabel(T('New planning note'), { exact: false }).first();
  await field.fill('Zelt pruefen');
  await page.reload();
  await expect(page.getByLabel(T('New planning note'), { exact: false }).first()).toHaveValue('Zelt pruefen', { timeout: 20_000 });
  await page.getByLabel(T('New planning note'), { exact: false }).first().press('Enter');
  await expect(page.locator('[data-plan-note]').first()).toContainText('Zelt pruefen');
  await page.reload();
  await expect(page.getByLabel(T('New planning note'), { exact: false }).first()).toHaveValue('');
});
