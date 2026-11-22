// Durchklick Etappe 3 (E3-004, E3-005): a very long word in a race name or on the emergency card
// no longer makes the page wider than the screen.
import { test, expect } from './clock.js';
import { start, sideways } from './gesamttest/lib.js';

test('Rennen: ein sehr langer Name bricht um', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/race');
  await page.locator('[data-race-new]').click();
  const dlg = page.locator('dialog[open], [role=dialog]').first();
  await dlg.locator('input:not([type=hidden])').first().fill('Testrennen ' + 'W'.repeat(120));
  await dlg.getByRole('button', { name: /Anlegen|Erstellen/ }).click();
  await expect(page).toHaveURL(/#\/race\/trip-/);
  await expect(page.locator('h1[data-page-title]')).toContainText('WWWW');
  const s = await sideways(page);
  expect(s.sw, `page ${s.sw} px wide on a ${s.w} px screen`).toBeLessThanOrEqual(s.w + 1);
});

test('Notfallkarte: ein sehr langer Name bricht in der Vorschau um', async ({ page, context }, info) => {
  await start(page, context, info);
  await page.goto('./#/mountain/qr');
  const name = page.locator('[data-card="name"]');
  await name.fill('Test ' + 'W'.repeat(100));
  await page.getByRole('button', { name: /Karte speichern|Speichern/ }).first().click();
  await expect(page.locator('pre[data-qr-text]')).toContainText('WWWW');
  const s = await sideways(page);
  expect(s.sw, `page ${s.sw} px wide on a ${s.w} px screen`).toBeLessThanOrEqual(s.w + 1);
});
