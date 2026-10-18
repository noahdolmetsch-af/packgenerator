// Impeccable (Noah 18.10.2026 «alle a-d umsetzen»): Eingang, Ich, Daten und Backup.
// - Eingang: the row's button names the suggestion and opens its form; «Einfach behalten» files with one tap
//   (toast with «Rückgängig»); ••• › «Woanders ablegen …» shows the 7 targets.
// - Ich: «Wartet auf dich» on top (inbox, the key that runs out); «App-Wartung», «Mehr» and «Hilfe» folded.
// - Daten und Backup: the head in words, one main button «Backup speichern», the last backup named.
// Fictional data only (tests/e2e/v048-fixture.js, test_data_gtp_ names); nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v048File, P } from './v048-fixture.js';
import { openData, settle } from './settle.js';
import { put } from './aktiv-fixture.js';

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
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);

test('Eingang: the button names the suggestion, Just keep with one tap and Undo, File elsewhere in the more menu', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/inbox');
  const bell = page.locator('li[data-note-id]').filter({ hasText: `${P} Bell rattles` });
  await expect(bell.getByRole('button', { name: T('File as bike problem') })).toBeVisible();
  // the button opens the problem form at once; the 7 targets wait behind «Anderes Ziel wählen»
  await bell.getByRole('button', { name: T('File as bike problem') }).click();
  const sheet = page.getByRole('dialog', { name: T('File as …') });
  await expect(sheet.locator('.targets')).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: T('Into bike care') })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  // ••• › «Woanders ablegen …»: the 7 targets
  await bell.getByLabel(T('More for this note')).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('File elsewhere …')}`) }).click();
  await expect(sheet.locator('.targets li')).toHaveCount(7);
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();

  // a plain thought (no trip, no keyword): «Einfach behalten» files it with one tap, the toast offers Undo
  await put(page, { notes: [{ id: `${P}keep1`, text: `${P} Gedanke zum Wochenende`, status: 'open', at: new Date().toISOString() }] });
  await page.reload();
  await settle(page);
  const row = page.locator('li[data-note-id]:not(.filed)').filter({ hasText: `${P} Gedanke zum Wochenende` });
  await row.getByRole('button', { name: T('Just keep') }).click();
  const toast = page.getByRole('status').filter({ hasText: T('Filed: {where}', { where: T('Notes') }) });
  await expect(toast).toBeVisible();
  await expect(row).toHaveCount(0);
  await expect(page.locator('li.filed').filter({ hasText: `${P} Gedanke zum Wochenende` })).toBeVisible();
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(row.getByRole('button', { name: T('Just keep') })).toBeVisible();
  await noSideways(page);
  expect(errors).toEqual([]);
});
