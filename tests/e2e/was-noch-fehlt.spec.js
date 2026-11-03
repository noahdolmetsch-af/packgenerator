// «Was die App noch wissen sollte» (idea D3, Noah 02.11.2026 «3b»), German UI: the card on Me › Hinweise and News names
// the missing home place and bike weight; a tap leads to the place where it is filled in. Fictional data only.
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));

function fixture() {
  const data = structuredClone(base);
  data.tables.bikes = [{ id: 'bike-nw', name: 'Velo ohne Gewicht', weightG: null, slots: ['seat'], setup: { seat: null }, fixtures: [], parts: [] }];
  data.tables.settings = data.tables.settings.filter((s) => s.key !== 'homePlace');
  data.tables.settings.push({ key: 'test_data_gtp_marker', value: 1 });
  return data;
}

test('the card names what is missing and leads to where it is filled in', async ({ page, context }, info) => {
  const file = info.outputPath('needs.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.goto('./#/me/hinweise');
  const card = page.locator('[data-needs]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-need="home"]')).toContainText(T('Your home place'));
  await expect(card.locator('[data-need="bikeweight"]')).toContainText(T('{n} bike without a weight', { n: '1' }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  await card.locator('[data-need="home"] a').click();
  await expect(page).toHaveURL(/#\/wetter/);
});
