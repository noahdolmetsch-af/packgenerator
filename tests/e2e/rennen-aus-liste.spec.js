// «Rennen aus der Rennliste» (Noah 24.11.2026 «a»): a file of the own race list becomes races of the app.
// Fictional races (made up here), never a real list.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const FILE = {
  races: [
    { name: 'Alpenbogen Test', date: '2027-06-12', days: '6–10 Tage', km: 1100, hm: 21000, city: 'Beispielstadt', land: 'Schweiz', surface: 'Strasse', status: 'offen', registered: true },
    { name: 'Talfahrt Beispiel', date: '2027-07-03', days: '3 Tage', km: 520, hm: 7800, land: 'Österreich', fav: true },
    { name: 'Nur gemerkt', date: '2027-08-21', days: '1', km: 200, land: 'Italien' },
    { name: 'Ohne Datum', days: '2', land: 'Frankreich' },
  ],
};

const noSideways = async (page) => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d).toBeLessThanOrEqual(1);
};

test('Races from your race list: choose the file, tick, create, undo, a second file knows what is here', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/race');
  const box = page.locator('[data-race-atlas]');
  await expect(box).toBeVisible();
  // closed by default: no list and no file field yet
  await expect(page.locator('[data-race-atlas-input]')).toHaveCount(0);
  await page.locator('[data-race-atlas-open]').click();
  const input = page.locator('[data-race-atlas-input]');

  // a file that is not a race list says so
  await input.setInputFiles({ name: 'kaputt.json', mimeType: 'application/json', buffer: Buffer.from('nope') });
  await expect(page.locator('[data-race-atlas-error]')).toContainText(T('This file could not be read. Is it the JSON file of your race list?'));

  // the right file: 4 races, the registered one and the favourite are ticked
  await input.setInputFiles({ name: 'meine-rennen.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(FILE)) });
  await expect(page.locator('[data-race-atlas-pick]')).toHaveCount(4);
  await expect(page.locator('[data-race-atlas-error]')).toHaveCount(0);
  await expect(page.locator('[data-race-atlas-pick]:checked')).toHaveCount(2);
  await noSideways(page);
  await box.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('rennen-liste-datei.png'), fullPage: false });

  // make the two races
  await page.locator('[data-race-atlas-make]').click();
  await expect(page.locator('[data-race-row]')).toHaveCount(2);
  await expect(page.getByText('Alpenbogen Test').first()).toBeVisible();
  await expect(page.getByText('Talfahrt Beispiel').first()).toBeVisible();

  // a race knows what the list said (no route yet)
  await page.locator('[data-race-row]').first().click();
  await expect(page.locator('[data-race-atlas-line]')).toContainText('km');
  await noSideways(page);
  await page.screenshot({ path: info.outputPath('rennen-zeile-aus-liste.png'), fullPage: false });

  // the same file again: the two are «already here» and cannot be ticked again
  await page.goto('./#/race');
  await page.locator('[data-race-atlas-open]').click();
  await page.locator('[data-race-atlas-input]').setInputFiles({ name: 'meine-rennen.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(FILE)) });
  await expect(page.locator('[data-race-atlas-pick]:disabled')).toHaveCount(2);
  await expect(page.locator('[data-race-atlas-pick]:checked')).toHaveCount(0);
});
