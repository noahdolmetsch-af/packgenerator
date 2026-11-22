// «Lange Wörter: Sportarten der Touren» (Nacht-Roboter «Langes Wort», Noah 06.11.2026 «4a»): ein Name ohne
// Umbruchstelle bei «Sportarten deiner Touren» (Aktiv › Meine Sportarten) machte die Seite auf dem Handy breiter
// als den Bildschirm (429 px statt 390 px). Erfundene Texte.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const FIXTURE = fileURLToPath(new URL('./fixture.json', import.meta.url));
const LONG = 'Wunderlangeswort'.repeat(3).slice(0, 40); // the name of a sport is cut at 40 characters

test('Meine Sportarten: eine Sportart der Touren mit langem Namen bleibt auf dem Bildschirm', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIXTURE);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert|Imported/)).toBeVisible();

  await page.goto('./#/flow/sports');
  const rows = page.locator('[data-trip-sports] > li');
  await expect(rows.first()).toBeVisible();
  await page.locator('[data-add-trip-sport]').click();
  const input = page.getByRole('dialog').locator('input').first();
  await input.fill(LONG);
  await input.press('Enter');
  await expect(page.locator('[data-trip-sports]')).toContainText('Wunderlangeswort');

  const vw = page.viewportSize().width;
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(sw, 'the page is not wider than the screen').toBeLessThanOrEqual(vw);
  const row = rows.filter({ hasText: 'Wunderlangeswort' });
  const right = await row.evaluate((e) => e.getBoundingClientRect().right);
  expect(right, 'the row ends on the screen').toBeLessThanOrEqual(vw);
  expect(errors).toEqual([]);
});
