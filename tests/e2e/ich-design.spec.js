// Design-Refresh P9a «Ich» (I1–I10, I12, I13, I13b, B20, B35; Noah 12.10.2026 «Runde 20 freigegeben»):
// the Ich pages in the new look. Ich in four groups; Data and backup as its own page with the status
// lights; To the phone with a QR code of the app's address; Inbox with the view chips and «Recently
// filed»; Notes as rows; the Helper in two columns; the windows (shortcuts, home place) in the window look.
// Fictional data only (tests/e2e/v048-fixture.js, test_data_gtp_ names); nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v048File, P } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(v048File(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

const path = (page) => page.getByRole('navigation', { name: T('Path') });
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
/** Exactly one visible h1 with this text, and nothing wider than the screen. */
async function onePage(page, title) {
  await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible();
  await expect(page.locator('main h1:visible')).toHaveCount(1);
  await noSideways(page);
}

test('I1: Ich in four groups; Data and backup opens its own page', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/me');
  await onePage(page, T('Me|place'));
  const main = page.locator('main');
  for (const h of ['Data', 'Settings', 'The app', 'More']) await expect(main.getByRole('heading', { level: 2, name: T(h), exact: true })).toBeVisible();
  for (const name of ['Inbox', 'Notes', 'What the app can do']) await expect(main.getByRole('link', { name: new RegExp(T(name)) }).first()).toBeVisible();
  await main.getByRole('link', { name: new RegExp(T('Data and backup')) }).click();
  await expect(page).toHaveURL(/#\/me\/data$/);
  await onePage(page, T('Data and backup'));
  await expect(path(page).getByRole('link', { name: T('Me|place') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('I2 and B20: the status lights, the backup buttons and Other data', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/me/data');
  await onePage(page, T('Data and backup'));
  const panel = page.locator('.datapanel');
  await expect(panel.getByRole('heading', { name: T('Everything in order?') })).toBeVisible();
  // one light each for the backup, the folder, the storage, «Kept by the browser» (P3b «Daten sicher») and
  // Fitbit (mockup G2, Paket B, changed on purpose); each says its state in words too
  await expect(panel.locator('li.light')).toHaveCount(5);
  await expect(panel.locator('li.light .dot')).toHaveCount(5);
  await expect(panel.locator('li.light').filter({ hasText: T('Kept by the browser') })).toHaveCount(1);
  await expect(panel.locator('li.light').filter({ hasText: 'Fitbit' })).toContainText(T('not connected|fitbit'));
  await expect(panel.getByRole('button', { name: T('Save backup') })).toBeVisible();
  await expect(panel.getByText(T('Import backup'), { exact: true })).toBeVisible();
  await expect(panel.getByRole('heading', { name: T('Other data') })).toBeVisible();
  await panel.getByRole('link', { name: new RegExp(T('To the phone')) }).click();
  await expect(page).toHaveURL(/#\/me\/phone$/);
  expect(errors).toEqual([]);
});

test('B35: To the phone shows a QR code of the app address, never the data', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/me/phone');
  await onePage(page, T('To the phone'));
  await expect(path(page).getByRole('link', { name: T('Data') })).toHaveAttribute('href', '#/me/data');
  const qr = page.getByRole('img', { name: T('QR code with the address of the app') });
  await expect(qr).toBeVisible();
  expect(await qr.locator('path').getAttribute('d')).toMatch(/^M/);
  await expect(page.getByText(T('The code holds only the address of the app, never your data.'))).toBeVisible();
  expect(errors).toEqual([]);
});

test('I3: Inbox with the view chips, To file and Recently filed', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/inbox');
  await onePage(page, T('Inbox'));
  const chips = page.getByRole('group', { name: T('Show') });
  await expect(chips.getByRole('button', { name: new RegExp(T('To file')) })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('heading', { level: 2, name: T('To file') })).toBeVisible();
  // Impeccable (18.10.2026, changed on purpose): the button names the suggestion
  await expect(page.locator('li[data-note-id]').filter({ hasText: `${P} Bell rattles` }).getByRole('button', { name: T('File as bike problem') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Recently filed') })).toBeVisible();
  await expect(page.locator('li.filed').filter({ hasText: `${P} Bremse hinten schleift` })).toBeVisible();
  // I4: «File as …» opens on the suggestion's form; the 7 targets with the suggestion chosen behind «Choose another target»
  await page.locator('li[data-note-id]').filter({ hasText: `${P} Bell rattles` }).getByRole('button', { name: T('File as bike problem') }).click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.getByRole('button', { name: T('Into bike care') })).toBeVisible();
  await dlg.getByRole('button', { name: T('Choose another target') }).click();
  await expect(dlg.locator('li.sug button.tile')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('I5 and I6: Notes as rows, pinned first; the note window folds Turn the note into', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/notes');
  await onePage(page, T('Notes'));
  await expect(page.getByRole('heading', { name: new RegExp(T('Pinned')) })).toBeVisible();
  const row = page.locator('li.ncard').filter({ hasText: `${P} Reifendruck Gravel` });
  await expect(row).toBeVisible();
  await row.getByRole('button').first().click();
  const dlg = page.getByRole('dialog');
  await expect(dlg.locator('details.turn')).not.toHaveAttribute('open', '');
  await expect(dlg.getByRole('button', { name: T('Done') })).toBeVisible();
  await page.keyboard.press('Escape');
  expect(errors).toEqual([]);
});

test('I8: the Helper with its path, the code first while it is not set up', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/helper');
  // v0.118.0 «KI-Helfer ausblenden» (K4, changed on purpose): «AI helper», the one switch, the setup beside it;
  // the key opens by itself while it is not set up
  await onePage(page, T('AI helper'));
  await expect(path(page).getByRole('link', { name: T('Me|place') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Setup|helper') })).toBeVisible();
  await expect(page.getByLabel(T('Helper code'))).toBeVisible();
  await expect(page.getByText(T('What goes to Claude?')).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('I10 and I12: the home place window and the shortcuts window', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/me');
  await page.locator('main').getByRole('button', { name: new RegExp(T('Home place')) }).click();
  const home = page.getByRole('dialog', { name: T('Your home place') });
  await expect(home).toBeVisible();
  await expect(home.getByRole('button', { name: T('Save') })).toBeDisabled();
  await home.getByRole('button', { name: T('Close') }).click();
  await expect(home).toBeHidden();
  // Impeccable (18.10.2026, changed on purpose): handbook, shortcuts and intro are under the row «Help»
  await page.locator('main summary').filter({ hasText: T('Help|me') }).click();
  await page.locator('main').getByRole('button', { name: T('Help and keyboard shortcuts') }).click();
  const keys = page.getByRole('dialog', { name: T('Keyboard shortcuts') });
  await expect(keys.getByRole('heading', { name: T('Places') })).toBeVisible();
  await expect(keys.locator('kbd', { hasText: 'Esc' })).toBeVisible();
  await keys.locator('.vd-foot').getByRole('button', { name: T('Close') }).click();
  await expect(keys).toBeHidden();
  expect(errors).toEqual([]);
});

test('no sideways scroll at 320 and 390 px on the Ich pages', async ({ page, context }, info) => {
  await start(page, context, info);
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 });
    for (const hash of ['#/me', '#/me/data', '#/me/phone', '#/inbox', '#/notes', '#/helper', '#/features']) {
      await page.goto(`./${hash}`);
      await expect(page.locator('main h1:visible')).toHaveCount(1);
      await noSideways(page);
    }
  }
});
