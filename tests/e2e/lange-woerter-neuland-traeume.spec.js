// «Lange Wörter: Neuland und Träume» (Durchklick Etappe 5, Befunde E5-002, E5-003): ein sehr langes Wort ohne
// Umbruchstelle machte die Seite breiter als den Bildschirm: in der Neuland-Suche («Nichts gefunden für …») und in
// der Meldung nach «Hinzufügen» bei den Träumen. Erfundene Texte, kein echtes Netz.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const LONG = 'Wunderlangeswort'.repeat(5); // the name of a dream is cut at 80 characters
const LONG_SEARCH = 'Wunderlangeswort'.repeat(20);
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto(`./${hash}`);
  await ready(page);
}

test('Neuland: «Nichts gefunden» mit einem langen Wort bleibt auf dem Bildschirm', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, '#/neuland');
  const field = page.locator('input[type="search"]').first();
  await field.fill(LONG_SEARCH);
  await expect(page.locator('p.none')).toContainText('Wunderlangeswort');
  expect(await wide(page), 'the page is not wider than the screen').toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Träume: die Meldung nach «Hinzufügen» mit einem langen Titel bleibt auf dem Bildschirm', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context, '#/trips/dreams');
  await page.getByPlaceholder(T('e.g. Over the Furka and Grimsel')).fill(LONG).catch(async () => {
    await page.locator('main input[type="text"]').first().fill(LONG);
  });
  await page.locator('[data-dream-add]').click();
  const note = page.locator('p.ok[role="status"]');
  await expect(note).toContainText('Wunderlangeswort');
  expect(await wide(page), 'the page is not wider than the screen').toBeLessThanOrEqual(0);
  const r = await note.evaluate((el) => el.getBoundingClientRect().right);
  expect(r).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth));
  expect(errors).toEqual([]);
});
