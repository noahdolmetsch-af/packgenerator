// «Alles fertig» (Noah 24.10.2026 «1a 2b 3a 4a»): the leftovers of the older threads. Heute on an empty device
// stays short and leads to the weather page; the logbook takes an own entry; a bike's «…» opens the sale listing.
// German, fictional data only (v0.77.0 fixture), no internet.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File } from './v0770-fixture.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function blank(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function start(page, context, info) {
  const errors = await blank(page, context);
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(v0770File(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return errors;
}

test('Heute on an empty device: short, with the way to the weather page and Jetzt alles zeigen', async ({ page, context }) => {
  const errors = await blank(page, context);
  await page.goto('./');
  const wall = page.locator('[data-empty-wall]');
  await expect(wall).toBeVisible();
  await expect(wall).toContainText(T('The rest of Today comes as soon as you have a bike, an item or a trip.'));
  await expect(page.locator('[data-weather-page]')).toHaveAttribute('href', '#/wetter');
  await wall.getByRole('button', { name: T('Show everything now') }).click();
  await expect(wall).toHaveCount(0);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(sw).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Logbuch: an own entry for a trip without a packing list', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/debrief/logbook');
  const log = page.locator('main #logbook');
  await log.locator('[data-log-add]').click();
  const dlg = page.locator('dialog[data-log-entry-sheet]');
  await expect(dlg).toHaveJSProperty('open', true);
  // empty name: the form says what is missing instead of doing nothing
  await dlg.getByRole('button', { name: T('Add the entry') }).click();
  await expect(dlg).toHaveJSProperty('open', true);
  await dlg.locator('#le-name').fill('Testrunde Seeland');
  await dlg.getByRole('button', { name: T('Add the entry') }).click();
  await expect(dlg).toHaveCount(0);
  await expect(log.locator('ul.log > li').filter({ hasText: 'Testrunde Seeland' })).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('Velos: the bike menu opens the sale listing', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/bikes');
  await page.locator('.setup-band .bmenu .btn.dots').first().click();
  await page.getByRole('menuitem', { name: new RegExp(T('Sale listing')) }).first().click();
  await expect(page).toHaveURL(/view=sell/);
  expect(errors).toEqual([]);
});
