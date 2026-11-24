// Impeccable «Kleider» (Noah 24.11.2026 «1-5a», Fund 1 in velos-material.md): on a phone your own clothes come first
// (the figure, «Noch einordnen», «Aufräumen», the layers) and the wishlist, which is not yours yet, ends the content.
// A computer keeps the wishes under the columns. German UI, fictional data only (fixture.json + clothes made here).
import { test, expect } from './clock.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const P = 'test_data_gtp_';
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const CLOTHING = ['onbike', 'rain', 'offbike', 'shoes'];
const cloth = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const CLOTHES = [
  cloth('KZ01', 'Baselayer duenn', { layer: 'base', zone: 'torso', tempMin: 4, tempMax: 35 }),
  cloth('KZ02', 'Fleecepulli', { layer: 'mid', zone: 'torso', tempMin: -5, tempMax: 10 }),
  cloth('KZ03', 'Regenjacke', { layer: 'outer', zone: 'torso', tempMin: -2, tempMax: 18, category: 'rain' }),
  cloth('KZ04', 'Bib kurz', { layer: 'base', zone: 'legs', tempMin: 4, tempMax: 35 }),
  cloth('KZ05', 'Badehose', { layer: 'base', zone: 'legs' }),
  cloth('KZ06', 'Badehose', { layer: 'base', zone: 'legs' }),
  cloth('KZ07', 'Unsortiertes Hemd', { category: 'offbike' }),
  cloth('KZ08', 'Daunenjacke Ultralight', { layer: 'outer', zone: 'torso', ownership: 'wishlist' }),
  cloth('KZ09', 'Wunsch Handschuhe', { layer: 'accessory', zone: 'hands', ownership: 'wishlist' }),
];

async function start(page, context, info) {
  const data = structuredClone(base);
  data.tables.items = data.tables.items.filter((i) => !CLOTHING.includes(i.category) && !i.layer && !i.zone);
  data.tables.items.push(...CLOTHES);
  data.tables.settings.push(MARK);
  const file = info.outputPath('test_data_gtp_kleider.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.goto('./#/wardrobe');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: T('Wardrobe') })).toBeVisible();
}

const topOf = (page, sel) => page.locator(sel).first().evaluate((el) => el.getBoundingClientRect().top + window.scrollY);

test('Wardrobe order - own clothes before tidy up, the wishlist ends the content', async ({ page, context }, info) => {
  await start(page, context, info);
  await expect(page.locator('[data-wishes]')).toBeVisible();
  await expect(page.locator('[data-tidy]')).toBeVisible();
  const onion = await topOf(page, '.onion');
  const tidy = await topOf(page, '[data-tidy]');
  const cols = await topOf(page, '.cols');
  const wishes = await topOf(page, '[data-wishes]');
  const phone = info.project.name === 'phone';
  if (phone) {
    expect(onion).toBeLessThan(tidy); // the figure before «Aufräumen»
    expect(tidy).toBeLessThan(cols); // «Aufräumen» before the layers
    expect(await topOf(page, '.sort')).toBeLessThan(tidy); // «Noch einordnen» right before «Aufräumen»
    expect(onion).toBeLessThan(700); // Hauptsache vor 700 px: the figure is in the first screens, not behind the wishlist
  }
  expect(cols).toBeLessThan(wishes); // phone and computer: the wishes stand after the layers
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
