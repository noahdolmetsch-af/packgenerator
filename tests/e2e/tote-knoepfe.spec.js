// «Tote Knöpfe» (Klick-Rundgang 22.10.2026, Noah «5a»: a robot plays it through before every release): every
// button the walk found without a reaction now shows an effect or says why not. And Ich lists no page of the
// dropped «App verkaufen» (Noah «3a»). German, fictional v0.77.0 data only, no internet.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { v0770File } from './v0770-fixture.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function start(page, context, info) {
  const file = v0770File(info);
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(file);
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  return errors;
}

test('empty fields and no internet: every button answers', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  // Wetter: «Suchen» with an empty field
  await page.goto('./#/wetter');
  await page.locator('.wx-search').first().getByRole('button', { name: T('Search') }).click();
  await expect(page.locator('[data-wx-hint]')).toHaveText(T('Type a place first, e.g. Bern or Andermatt.'));
  // Rechner: «=» with nothing typed
  await page.goto('./#/me/tools/calc');
  await page.locator('[data-key="="]').click();
  await expect(page.locator('[data-calc-hint]')).toHaveText(T('Type a calculation first, e.g. 12.50 × 3.'));
  await page.locator('[data-key="7"]').click();
  await expect(page.locator('[data-calc-hint]')).toHaveCount(0);
  // Kompass: «+» with an empty entry
  await page.goto('./#/me/compass');
  await page.locator('form.addrow').first().getByRole('button', { name: T('Add') }).click();
  await expect(page.locator('[data-compass-empty]')).toHaveText(T('Write something first, then tap «+».'));
  // Hinweise: «Aktualisieren» offline
  await page.goto('./#/me/hinweise');
  await context.setOffline(true);
  await page.locator('[data-news-refresh]').click();
  await expect(page.locator('[data-news-offline]')).toBeVisible();
  await context.setOffline(false);
  expect(errors).toEqual([]);
});

test('Ich lists no page of the dropped «App verkaufen»', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/me');
  await expect(page.locator('a.ich-row').first()).toBeVisible();
  for (const href of ['#/me/offers', '#/me/pros', '#/me/pay']) await expect(page.locator(`a.ich-row[href="${href}"]`)).toHaveCount(0);
  expect(errors).toEqual([]);
});
