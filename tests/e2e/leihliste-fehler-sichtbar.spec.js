// «Ausgeliehen» (Durchklick Etappe 2, Befund E2-005): «Speichern» ohne gewählte Sache zeigte die Meldung
// «Bitte mindestens eine Sache wählen.» über dem Formular, ausserhalb des Bildes, wenn die Liste lang ist.
// Jetzt steht sie beim Knopf. Erfundene Daten (home0460-fixture).
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

test('Ausgeliehen: die Fehlermeldung steht beim Speichern-Knopf, im Bild', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info);
  await page.goto('./#/gear/lend');
  const main = page.locator('main');
  await main.getByRole('button', { name: T('New lending list') }).first().click();
  const form = main.locator('form');
  await form.getByLabel(T('Who borrows it')).fill('test_data_gtp_ Gast');
  const save = form.getByRole('button', { name: T('Save') });
  await save.scrollIntoViewIfNeeded();
  await save.click();
  const alert = form.getByRole('alert');
  await expect(alert).toHaveText(T('Please choose at least one thing.'));
  await expect(alert).toBeInViewport();
  await expect(save).toBeInViewport();
  // choose a thing: the message goes with the next save
  await form.getByRole('checkbox').first().check();
  await save.click();
  await expect(main.locator('article', { has: page.getByRole('heading', { name: 'test_data_gtp_ Gast' }) })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: T('Please choose at least one thing.') })).toHaveCount(0);
  expect(errors).toEqual([]);
});
