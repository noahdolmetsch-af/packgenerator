// «Rennatlas» (Noah 24.11.2026 «1:1 wie das Mockup»): a file of the own race list stays in the app: list with
// filters, year line with overlaps, map, one race in a window that makes a race of the app.
// Fictional races (made up here), never a real list. The test clock stands on 9 October 2026.
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const FILE = {
  format: 'rennatlas',
  asOf: '2026-10-09',
  races: [
    { name: 'Alpenbogen Test', date: '2027-06-12', days: '6–10', km: 1100, hm: 21000, city: 'Beispielstadt', land: 'Schweiz', surface: 'Strasse', status: 'Anmeldung offen', registered: true, lat: 47.0, lon: 8.3 },
    { name: 'Nebenan Test', date: '2027-06-18', days: '2–3', km: 300, land: 'Schweiz', surface: 'Strasse', status: 'Anmeldung offen', registered: true, lat: 47.4, lon: 9.4 },
    { name: 'Talfahrt Beispiel', date: '2027-07-03', days: '3', km: 520, hm: 7800, land: 'Österreich', surface: 'MTB / Offroad', status: 'Anmeldung öffnet', opens: '2026-10-16', fav: true, lat: 47.3, lon: 13.3, note: 'Erfundenes Rennen für den Test.' },
    { name: 'Seenrunde Test', date: '2027-08-21', days: '1', km: 200, land: 'Italien', surface: 'Strasse', status: 'Anmeldung offen' },
    { name: 'Ohne Datum', days: '2', land: 'Frankreich', surface: 'Gravel / Mischbelag' },
  ],
};
const BUF = { name: 'meine-rennen.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(FILE)) };

const noSideways = async (page) => {
  const d = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(d).toBeLessThanOrEqual(1);
};

test('Race atlas: file, list with filters, saved filter, year line, map, one race becomes a race, file stays', async ({ page, context }, info) => {
  const T = await openHome(page, context, info);
  await page.goto('./#/race');
  // nothing yet: the coming tab leads to the atlas
  await expect(page.locator('[data-race-empty]')).toBeVisible();
  await page.locator('[data-race-to-list]').click();
  const box = page.locator('[data-race-atlas]');
  await expect(box).toBeVisible();
  await expect(page.locator('[data-race-atlas-empty]')).toBeVisible();
  await box.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('rennatlas-leer.png'), fullPage: false });
  const input = page.locator('[data-race-atlas-input]').first();

  // a file that is not a race list says so
  await input.setInputFiles({ name: 'kaputt.json', mimeType: 'application/json', buffer: Buffer.from('nope') });
  await expect(page.locator('[data-race-atlas-error]')).toContainText(T('This file could not be read. Is it the JSON file of your race list?'));

  // the right file: five races stand in the list
  await input.setInputFiles(BUF);
  await expect(page.locator('[data-atlas-row]')).toHaveCount(5);
  await expect(page.locator('[data-race-atlas-error]')).toHaveCount(0);
  await expect(page.locator('[data-atlas-count]')).toContainText('5');
  await expect(page.locator('[data-atlas-sum]')).toContainText('5');
  await noSideways(page);
  await box.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('rennatlas-liste.png'), fullPage: false });

  // the phone has a window for the filters, a wide screen a column; both reach the same chips
  const phone = await page.locator('[data-atlas-open-filter]').count();
  if (phone) await page.locator('[data-atlas-open-filter]').click();
  await page.locator('[data-atlas-land="Schweiz"]').click();
  await expect(page.locator('[data-atlas-switch="fits"]')).toBeVisible();
  if (phone) await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-atlas-row]')).toHaveCount(2);
  await expect(page.locator('[data-atlas-pills]')).toContainText('Schweiz');
  await expect(page.locator('[data-atlas-count]')).toContainText('2');

  // text search finds a race without accents or case
  await page.locator('[data-atlas-search]').fill('NEBENAN');
  await expect(page.locator('[data-atlas-row]')).toHaveCount(1);
  await page.locator('[data-atlas-search]').fill('');
  await expect(page.locator('[data-atlas-row]')).toHaveCount(2);

  // save this filter under a name, clear it, pick it again, delete it
  await page.locator('[data-atlas-save]').click();
  await page.locator('[data-atlas-save-name]').fill('Nur Schweiz');
  await page.locator('[data-atlas-save-name]').press('Enter');
  await expect(page.locator('[data-atlas-saved]')).toContainText('Nur Schweiz');
  await page.locator('[data-atlas-pills] button').first().click();
  await expect(page.locator('[data-atlas-row]')).toHaveCount(5);
  await page.locator('[data-atlas-saved-pick]').click();
  await expect(page.locator('[data-atlas-row]')).toHaveCount(2);
  await page.locator('[data-atlas-saved-manage]').click();
  await page.locator('.vdlg .btn.del').first().click();
  await page.locator('[data-sheet-save]').click();
  await expect(page.locator('[data-atlas-saved-pick]')).toHaveCount(0);
  await page.locator('[data-atlas-pills] button').first().click();
  await expect(page.locator('[data-atlas-row]')).toHaveCount(5);

  // the star puts a race on the year line
  await page.locator('[data-atlas-fav]').nth(3).click();
  await expect(page.locator('[data-atlas-fav][aria-pressed="true"]')).toHaveCount(2);

  // year line: the cards, the warning for the two registered races that do not fit, one bar per race of yours
  await page.locator('[data-race-atlas] [data-key="line"]').click();
  await expect(page.locator('[data-atlas-line]')).toBeVisible();
  await expect(page.locator('[data-atlas-clash]')).toContainText('Alpenbogen Test');
  await expect(page.locator('[data-atlas-clash]')).toContainText('Nebenan Test');
  await expect(page.locator('[data-atlas-bar]')).toHaveCount(4);
  await expect(page.locator('[data-atlas-cards]')).toContainText('Talfahrt Beispiel');
  await noSideways(page);
  await page.locator('[data-atlas-svg]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('rennatlas-zeitstrahl.png'), fullPage: false });

  // map: the races with a position stand on it, the one without says so
  await page.locator('[data-race-atlas] [data-key="map"]').click();
  await expect(page.locator('[data-atlas-mapsvg="europe"]')).toBeVisible();
  await expect(page.locator('[data-atlas-point]').first()).toBeVisible();
  await expect(page.locator('[data-atlas-map-missing]')).toHaveCount(1);
  // three zoom levels: the large map is Zoom 3, «−» brings the wider region, a tap on a small map makes it large
  await expect(page.locator('[data-atlas-mapsvg]')).toHaveCount(3);
  await expect(page.locator('[data-atlas-zoomname]')).toContainText('Zoom 3');
  await expect(page.locator('[data-atlas-zoom-in]')).toBeDisabled();
  await page.locator('[data-atlas-zoom-out]').click();
  await expect(page.locator('[data-atlas-zoomname]')).toContainText('Zoom 2');
  await expect(page.locator('[data-atlas-zoom-pick="3"]')).toBeVisible();
  await page.locator('[data-atlas-zoom-pick="3"]').click();
  await expect(page.locator('[data-atlas-zoomname]')).toContainText('Zoom 3');
  await noSideways(page);
  await page.locator('[data-atlas-mapsvg="europe"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('rennatlas-karte.png'), fullPage: false });

  // one race: the facts in a window, then it becomes a race of the app
  await page.locator('[data-race-atlas] [data-key="list"]').click();
  await page.locator('[data-atlas-row] .al-hit').filter({ hasText: 'Talfahrt Beispiel' }).click();
  await expect(page.locator('[data-atlas-detail]')).toContainText('Erfundenes Rennen für den Test.');
  await page.screenshot({ path: info.outputPath('rennatlas-rennen.png'), fullPage: false });
  await page.locator('[data-sheet-save]').click();
  await expect(page).toHaveURL(/#\/race\/.+/);
  await expect(page.locator('[data-race-atlas-line]')).toContainText('km');
  await noSideways(page);

  // the file stays: back on the page the atlas is there without choosing the file again, and the race is marked as here
  await page.goto('./#/race');
  await page.locator('.rc-tabs [data-key="list"]').click();
  await expect(page.locator('[data-atlas-row]')).toHaveCount(5);
  await expect(page.locator('[data-atlas-row]').filter({ hasText: 'Talfahrt Beispiel' })).toContainText(T('in the app|race'));
});
