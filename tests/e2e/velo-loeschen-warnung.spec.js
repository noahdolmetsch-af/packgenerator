// «Velo löschen» (Noah 1.11.2026 «1-5 a»), German UI: the delete window offers «Retire instead», which opens the
// retire window and deletes nothing. Fictional fixture.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const BIKE = base.tables.bikes[0];

test.beforeEach(async ({ page, context }, info) => {
  const file = info.outputPath('velo-loeschen.json');
  writeFileSync(file, JSON.stringify(base));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(file);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
});

test('delete window offers retiring instead and deletes nothing', async ({ page }) => {
  await page.goto(`./#/bikes?bike=${BIKE.id}`);
  await page.locator('.bmenu button').first().click();
  await page.getByRole('menuitem', { name: new RegExp(T('Edit|bike')) }).click();
  await page.getByRole('button', { name: T('Delete bike') }).click();
  const alt = page.locator('[data-gds-alt-run]');
  await expect(alt).toHaveText(T('Retire instead'));
  await alt.click();
  await expect(page.locator('[data-retire-sheet]')).toBeVisible();
  const bikes = await page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => { const q = r.result.transaction('bikes').objectStore('bikes').getAll(); q.onsuccess = () => { r.result.close(); ok(q.result.map((b) => b.id)); }; };
  }));
  expect(bikes).toContain(BIKE.id);
});
