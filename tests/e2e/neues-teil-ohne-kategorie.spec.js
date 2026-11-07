// E2-002 (Durchklick Etappe 2): a new thing closed with a name only (no category yet) said
// «Du findest es unter .» (the category was empty). It now names the place: «Ohne Kategorie».
// Fictional data (home0460-fixture).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Neues Teil nur mit Namen: die Meldung nennt Ohne Kategorie', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/gear');
  await page.getByRole('button', { name: T('Add item'), exact: true }).filter({ visible: true }).first().click();
  const dlg = page.getByRole('dialog').first();
  await dlg.getByLabel(T('Name'), { exact: true }).fill('Zelt-Pflock Probe');
  await expect(dlg.getByRole('status').filter({ hasText: T('Saved') })).toBeVisible(); // saved while typing
  await dlg.getByRole('button', { name: T('Close') }).click();
  const msg = page.getByText(/Zelt-Pflock Probe/).filter({ hasText: T('Other / unknown category') });
  await expect(msg.first()).toBeVisible();
  await expect(msg.first()).toContainText(T('"{name}" is saved. You find it under {cat}.', { name: 'Zelt-Pflock Probe', cat: T('Other / unknown category') }));
  expect(errors).toEqual([]);
});
