// Paket N «Pläne und Träume» (19.10.2026): notes linked with each other (#10) and Ich › Was kommt (#68).
// In German, on a phone and a computer: two notes are written, one is linked from the other, the link
// shows on both, «Auf einen Blick» counts it, a #tag searches; Ich › Was kommt shows the packages.
// No sideways scroll, no page errors. Fictional data only.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { PACKAGES } from '../../src/lib/wascommt.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');

async function prep(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}
const noSideScroll = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);

test('notes: link one note with another, the link shows on both', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/notes');
  await ready(page);
  const cap = page.locator('form.cap textarea');
  for (const text of ['test_data_gtp_ Jura #herbst', 'test_data_gtp_ Packliste #herbst']) {
    await cap.fill(text);
    await page.locator('form.cap button[type="submit"]').click();
    await expect(page.locator('li.ncard', { hasText: text.split(' #')[0] })).toHaveCount(1);
  }
  const stats = page.locator('[data-note-stats]');
  await expect(stats).toContainText('#herbst');

  await page.locator('li.ncard', { hasText: 'Jura' }).locator('button').click();
  const sheet = page.locator('dialog.nsheet');
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('[data-note-links]')).toContainText(T('Maybe related'));
  await sheet.getByRole('button', { name: T('Link a note') }).click();
  await sheet.getByRole('searchbox', { name: T('Search a note to link') }).fill('Packliste');
  await sheet.locator('[data-note-links] button', { hasText: 'Packliste' }).click();
  await expect(sheet.locator('[data-note-links] .nl button', { hasText: 'Packliste' })).toHaveCount(1);
  await noSideScroll(page);

  // one tap opens the linked note; it shows the link back
  await sheet.locator('[data-note-links] .nl button', { hasText: 'Packliste' }).click();
  const other = page.locator('dialog.nsheet');
  await expect(other.locator('#note-h')).toContainText('Packliste');
  await expect(other.locator('[data-note-links]')).toContainText(T('links here'));
  await other.getByRole('button', { name: T('Done') }).click();
  await expect(stats).toContainText(T('{n} notes linked with others').replace('{n}', '2'));

  // a #tag searches
  await stats.getByRole('button', { name: /#herbst/ }).click();
  await expect(page.locator('.notes label.search input')).toHaveValue('#herbst');
  expect(errors).toEqual([]);
});

test('Ich › Was kommt shows the packages', async ({ page, context }) => {
  const errors = await prep(page, context);
  await page.goto('./#/me');
  await ready(page);
  await page.locator('a[data-row="next"]').click();
  await expect(page).toHaveURL(/#\/me\/next$/);
  const root = page.locator('[data-page="was-kommt"]');
  await expect(root.locator('h1, h2').first()).toBeVisible();
  await expect(root.locator('[data-package]')).toHaveCount(PACKAGES.length);
  await expect(root.locator('[data-package="N"]')).toContainText(T('Plans and dreams'));
  await noSideScroll(page);
  expect(errors).toEqual([]);
});
