// «Lange Wörter: Gipfelbuch und Eigene Fragen» (Durchklick Etappe 5, Befunde E5-004, E5-005): ein sehr langes Wort
// ohne Umbruchstelle machte die Seite breiter als den Bildschirm: bei der Notiz eines Orts im Gipfelbuch (und bei der
// Meldung «… ist im Gipfelbuch») und bei dem Namen einer eigenen Frage unter «Deine Abfragen». Erfundene Texte.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const LONG_NAME = 'Wunderlangeswort'.repeat(5); // the name of a place is cut at 80 characters
const LONG_NOTE = 'Wunderlangeswort'.repeat(12); // the note at 200
const LONG_QUESTION = 'Wunderlangeswort'.repeat(7); // the name of a question at 120
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

test('Gipfelbuch: ein Ort mit langem Namen und langer Notiz bleibt auf dem Bildschirm', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, '#/flow/gipfelbuch');
  await page.getByRole('button', { name: T('Enter a place by hand') }).first().click();
  const sheet = page.locator('dialog[open][data-place-sheet]');
  await sheet.locator('[data-gb-name]').fill(LONG_NAME);
  await sheet.getByLabel(T('Note (optional)')).fill(LONG_NOTE);
  await sheet.locator('[data-gb-save]').click();
  await expect(page.locator('p.undo[role="status"]')).toContainText('Wunderlangeswort');
  await expect(page.locator('[data-gb-detail] p.note')).toContainText('Wunderlangeswort');
  expect(await wide(page), 'the page is not wider than the screen').toBeLessThanOrEqual(0);
  const cw = await page.evaluate(() => document.documentElement.clientWidth);
  for (const sel of ['p.undo', '[data-gb-detail] h2', '[data-gb-detail] p.note']) {
    const r = await page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().right);
    expect(r, sel).toBeLessThanOrEqual(cw);
  }
  expect(errors).toEqual([]);
});

test('Deine Abfragen: eine eigene Frage mit langem Namen bleibt auf dem Bildschirm', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, '#/me/abfragen');
  await page.locator('[data-own-add]').click();
  await page.locator('[data-own-name]').fill(LONG_QUESTION);
  await page.locator('[data-own-save]').click();
  const row = page.locator('li.q', { hasText: 'Wunderlangeswort' }).first();
  await expect(row).toBeVisible();
  expect(await wide(page), 'the page is not wider than the screen').toBeLessThanOrEqual(0);
  const cw = await page.evaluate(() => document.documentElement.clientWidth);
  expect(await row.evaluate((el) => el.getBoundingClientRect().right)).toBeLessThanOrEqual(cw);
  expect(errors).toEqual([]);
});
