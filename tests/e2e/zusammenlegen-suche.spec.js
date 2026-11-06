// «Zusammenlegen» (Durchklick Etappe 2, Frage 3a, Noah 05.11.2026): the search in the merge sheet left out the suggestions, so
// it said «Kein Teil gefunden» while a suggestion above held the word. Now a suggestion that fits is a hit too, with its badge.
// Fictional data (fixture.json plus three invented items); phone and computer.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const item = (id, name) => ({ id, name, nameDe: name, category: 'hyg', weightG: 120, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });

test('Zusammenlegen: die Suche findet auch die Vorschlaege', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = structuredClone(base);
  data.tables.items.push(item('HY81', 'Zeltseife gruen'), item('HY82', 'Zeltseife gruen alt'), item('HY83', 'Zeltseife blau'));
  const file = info.outputPath('merge-sheet-fixture.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(panel.getByText(/importiert|Imported/)).toBeVisible();
  await page.goto('./#/gear');
  await page.getByLabel(T('Search gear')).fill('Zeltseife gruen');
  await page.locator('li[data-item] button.main').first().click();
  const dlg = page.getByRole('dialog').first();
  const more = dlg.locator('details[data-fold="more"] > summary');
  if (await more.count()) await more.click();
  await dlg.getByRole('button', { name: T('Merge with …') }).first().click();
  const sheet = page.getByRole('dialog', { name: T('Merge|items') });
  await expect(sheet).toBeVisible();
  // the app proposes at least one item; its name is the search word
  const sugg = sheet.locator('ul.opts[aria-label="' + T('Suggestions') + '"] li');
  await expect(sugg.first()).toBeVisible();
  const name = (await sugg.first().locator('.nm b').innerText()).trim();
  await page.getByLabel(T('Search all items'), { exact: true }).fill(name);
  const hits = sheet.locator('ul.opts[aria-label="' + T('Search results') + '"] li');
  await expect(hits.filter({ hasText: name }).first()).toBeVisible();
  await expect(sheet.getByText(T('No item found.'))).toHaveCount(0);
  // the suggestion shows its badge in the hits, and a tap on either row keeps both in step
  await expect(hits.filter({ hasText: name }).first().locator('.badge')).toHaveText(T('Suggestion'));
  const before = await sugg.first().locator('button').getAttribute('aria-pressed');
  await hits.filter({ hasText: name }).first().locator('button').click();
  await expect(sugg.first().locator('button')).not.toHaveAttribute('aria-pressed', before);
  expect(errors).toEqual([]);
});
