// Impeccable (Noah 18.10.2026 «alle a-d umsetzen»): Eingang, Ich, Daten und Backup.
// - Eingang: the row's button names the suggestion and opens its form; «Einfach behalten» files with one tap
//   (toast with «Rückgängig»); ••• › «Woanders ablegen …» shows the 7 targets.
// - Ich: «Wartet auf dich» on top (inbox; never a key that runs out, Noah 20.10.2026); «App-Wartung», «Mehr» and «Hilfe» folded.
// - Daten und Backup: the head in words, one main button «Backup speichern», the last backup named.
// Fictional data only (tests/e2e/v048-fixture.js, test_data_gtp_ names); nothing leaves the preview server.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { readFileSync } from 'node:fs';
// the targets of «Ablegen als …», read from the app source (inbox.js imports page code that needs the browser)
const TARGETS = [...readFileSync(new URL('../../src/lib/inbox.js', import.meta.url), 'utf8').split('export const TARGETS = [')[1].split('];')[0].matchAll(/\{ key: '(\w+)'/g)].map((m) => m[1]);
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
  // ••• › «Woanders ablegen …»: every target (13 since «Mail in die App»)
  await bell.getByLabel(T('More for this note')).click();
  await page.getByRole('menuitem', { name: new RegExp(`^${T('File elsewhere …')}`) }).click();
  await expect(sheet.locator('.targets li')).toHaveCount(TARGETS.length);
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

test('Ich: Waiting for you on top, App maintenance, More and Help folded', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/me');
  const wait = page.locator('[data-section="waiting"]');
  await expect(wait.getByRole('heading', { name: T('Waiting for you') })).toBeVisible();
  const inbox = wait.locator('[data-wait="inbox"]');
  await expect(inbox).toContainText(/Eingang: \d+ Notizen zum Ablegen/);
  await expect(inbox.getByRole('link', { name: T('File') })).toHaveAttribute('href', '#/inbox');
  // Noah 20.10.2026: no line about a key that runs out; keys live only in «App-Wartung» (folded)
  await expect(wait.locator('[data-wait^="key-"]')).toHaveCount(0);
  const maint = page.locator('[data-section="maintenance"]');
  await expect(maint).not.toHaveAttribute('open', '');
  await maint.locator('summary').first().click();
  await expect(maint).toHaveAttribute('open', '');
  await expect(maint.locator('[data-maint="keys"]')).toBeVisible();
  // «Mehr» and «Hilfe» are folded, one tap opens them
  await expect(page.getByRole('button', { name: new RegExp(T('Try it out')) })).toBeHidden();
  await page.locator('main summary').filter({ has: page.getByRole('heading', { name: T('More'), exact: true }) }).click();
  await expect(page.getByRole('button', { name: new RegExp(T('Try it out')) })).toBeVisible();
  await expect(page.locator('a.ich-row[href="#/me/handbook"]')).toBeHidden();
  await page.locator('main summary').filter({ hasText: T('Help|me') }).click();
  await expect(page.locator('a.ich-row[href="#/me/handbook"]')).toBeVisible();
  // the row «Data and backup» no longer repeats «Backup due»
  await expect(page.locator('a.ich-row[href="#/me/data"] .pill')).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
});

test('Daten und Backup: the head in words, one main button Save backup', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/me/data');
  const panel = page.locator('.datapanel');
  await expect(panel.locator('[data-head-line]')).not.toContainText(/grün/);
  await expect(panel.getByRole('button', { name: T('Save backup') })).toBeVisible();
  await expect(panel.getByRole('button', { name: T('Export backup') })).toHaveCount(0);
  await expect(panel.locator('#data-title + .ich-hs')).toContainText(/Letztes Backup: /);
  await noSideways(page);
  expect(errors).toEqual([]);
});
