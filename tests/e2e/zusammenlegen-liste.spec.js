// «Zusammenlegen» (Durchklick Etappe 2, Befund E2-004): the suggestion list in the merge sheet took the style of the
// tick square («.box»: 22 px wide, rows side by side), so names, badges and weights ran into each other.
// Fictional data (fixture.json plus two test_data_gtp_ items); phone and computer.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const item = (id, name) => ({ id, name, nameDe: name, category: 'hyg', weightG: 120, qty: 1, weightStatus: 'measured', defaultBag: 'top', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'] });

test('Zusammenlegen: die Vorschlaege stehen untereinander und sind breit genug', async ({ page, context }, info) => {
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
  await page.getByLabel(T('Search all items'), { exact: true }).fill('Zeltseife');
  const lists = sheet.locator('ul.opts');
  await expect(lists.last().locator('li').first()).toBeVisible();
  const sheetBox = await sheet.boundingBox();
  for (let k = 0; k < (await lists.count()); k++) {
    const rows = lists.nth(k).locator('li');
    const n = await rows.count();
    const lb = await lists.nth(k).boundingBox();
    expect(lb.width, 'the list is as wide as the sheet, not 22 px').toBeGreaterThan(sheetBox.width * 0.6);
    let prevBottom = -1;
    for (let i = 0; i < n; i++) {
      const b = await rows.nth(i).boundingBox();
      expect(b.y, `row ${i} lies below the one before`).toBeGreaterThanOrEqual(prevBottom - 1);
      expect(b.x + b.width, 'a row stays inside the sheet').toBeLessThanOrEqual(sheetBox.x + sheetBox.width + 1);
      prevBottom = b.y + b.height;
    }
  }
  expect(errors).toEqual([]);
});
