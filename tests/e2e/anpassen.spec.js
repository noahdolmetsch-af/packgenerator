// «Anpassen» (Noah 20.10.2026 «1a 2a 3a 4a 5a»), fictional data: «Diese Seite anpassen» at the end of a page hides,
// renames and sorts its parts, changes the tabs (start tab) and the menu, keeps it after a reload, and «Wie am Anfang»
// puts everything back.
import { test, expect } from './clock.js';
import { start, tr } from './gesamttest/lib.js';

const T = tr('de');

const openSheet = async (page) => {
  await page.locator('[data-anp-open]').click();
  const sheet = page.locator('dialog[data-anp-sheet]');
  await expect(sheet).toBeVisible();
  return sheet;
};
const row = (sheet, name) => sheet.locator('li[data-anp-row]').filter({ hasText: name });
const heading = (page, name) => page.locator('main h2').filter({ hasText: name }).first();

test.describe('Anpassen', () => {
  test('parts of a page: hide, rename, sort, keep, back as at the start', async ({ page, context }, info) => {
    const errors = await start(page, context, info);
    await page.goto('./#/me/look');
    await page.locator('main h1').first().waitFor();
    const font = T('Font');
    const pal = T('Colour world');

    let sheet = await openSheet(page);
    await expect(row(sheet, font)).toBeVisible();
    // hide «Schrift»
    await row(sheet, font).getByRole('switch').uncheck();
    // rename «Farbwelt»
    await row(sheet, pal).getByRole('button', { name: T('Rename {name}', { name: pal }) }).click();
    await sheet.getByRole('textbox').fill('Meine Farben');
    await sheet.getByRole('textbox').press('Enter');
    await expect(row(sheet, 'Meine Farben')).toBeVisible();
    // «Meine Farben» one place up: it is above the hidden «Schrift» now
    await row(sheet, 'Meine Farben').getByRole('button', { name: T('Move {name} up', { name: 'Meine Farben' }) }).click();
    await sheet.getByRole('button', { name: T('Close') }).click();

    await expect(heading(page, font)).toBeHidden();
    await expect(heading(page, 'Meine Farben')).toBeVisible();

    // kept after a reload
    await page.reload();
    await page.locator('main h1').first().waitFor();
    await expect(heading(page, 'Meine Farben')).toBeVisible();
    await expect(heading(page, font)).toBeHidden();
    // the list under Darstellung names the page
    await page.locator('[data-anp-look-open]').click();
    await expect(page.locator('[data-anp-look]')).toContainText(T('Pages you changed'));

    // back as at the start
    sheet = await openSheet(page);
    await sheet.locator('[data-anp-reset]').click();
    await sheet.getByRole('button', { name: T('Close') }).click();
    await expect(heading(page, font)).toBeVisible();
    await expect(heading(page, pal)).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('menu and tabs: hide a place, a start tab', async ({ page, context }, info) => {
    const errors = await start(page, context, info);
    const phone = info.project.name === 'phone';
    await page.goto('./#/trips');
    await page.locator('main h1').first().waitFor();
    const sheet = await openSheet(page);
    // Touren opens with Vorlagen
    await sheet.locator('[data-anp-start]').selectOption('templates');
    // hide «Velos» in the menu
    await sheet.getByRole('button', { name: T('Menu') }).click();
    const bikes = T('Bikes|place');
    await row(sheet, bikes).getByRole('switch').uncheck();
    await sheet.getByRole('button', { name: T('Close') }).click();

    const menu = phone ? page.locator('nav.bottom') : page.locator('aside nav.places');
    await expect(menu.locator('[data-place="bikes"]')).toHaveCount(0);
    await expect(menu.locator('[data-place="today"]')).toHaveCount(1);
    // from Heute, «Touren» opens at Vorlagen
    await page.goto('./#/');
    await menu.locator('[data-place="trips"] a, a[data-place="trips"]').first().click();
    await expect(page).toHaveURL(/#\/pack\/templates/);

    // everything back under Ich › Darstellung
    await page.goto('./#/me/look');
    await page.locator('[data-anp-look-open]').click();
    await page.locator('[data-anp-reset-all]').click();
    await expect(menu.locator('[data-place="bikes"]')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
});
