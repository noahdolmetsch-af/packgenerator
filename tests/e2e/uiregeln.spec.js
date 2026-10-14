// 0.159.0 «UI-Regeln» Teil 1 (UI1 + UI8), German UI, phone and desktop: under the head of Kleider and
// Bausteine one thin bar says where the weight sits (per layer, per group), with names, kilos and %.
// Fictional data only (fixture.json + test_data_gtp_ clothes made here); every outside request is
// blocked. UI_SHOTS=<folder> saves the pictures for Noah.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z0-9]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const P = 'test_data_gtp_';
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const SHOTS = process.env.UI_SHOTS;
// The layer names in the app's order, read from the source (wardrobe.js imports Svelte runes).
const WSRC = readFileSync(fileURLToPath(new URL('../../src/lib/wardrobe.js', import.meta.url)), 'utf8');
const LAYERS = [...WSRC.match(/export const LAYERS = \[([\s\S]*?)\];/)[1].matchAll(/name: '([^']+)'/g)].map((m) => ({ name: m[1] }));

const cloth = (id, name, f = {}) => ({ id, name: `${P}${name}`, category: 'onbike', weightG: 100, qty: 1, weightStatus: 'measured', carry: 'body', defaultBag: 'body', ownership: 'owned', role: null, sets: [], kits: [], domains: ['bikepacking'], ...f });
const CLOTHES = [
  cloth('UI01', 'Merino Langarm', { layer: 'base', zone: 'torso', weightG: 180 }),
  cloth('UI02', 'Thermotrikot', { layer: 'mid', zone: 'torso', weightG: 320 }),
  cloth('UI03', 'Regenjacke', { layer: 'outer', zone: 'torso', weightG: 240 }),
  cloth('UI04', 'Handschuhe', { layer: 'accessory', zone: 'hands', weightG: 60 }),
];

async function start(page, context, info) {
  const data = structuredClone(base);
  data.tables.items.push(...CLOTHES);
  data.tables.settings.push(MARK);
  const file = info.outputPath('test_data_gtp_ui.json');
  writeFileSync(file, JSON.stringify(data));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  return errors;
}

async function noSideScroll(page) {
  const size = page.viewportSize();
  for (const w of [320, 390]) {
    await page.setViewportSize({ width: w, height: size.height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  }
  await page.setViewportSize(size);
}

async function shot(page, info, name) {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  const size = page.viewportSize();
  const desk = info.project.name === 'desktop';
  if (desk) await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SHOTS}/${name}-${desk ? '1440' : '390'}.png` });
  await page.setViewportSize(size);
}

test('Kleider: the weight per layer as one bar under the head', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/wardrobe');
  const bar = page.locator('[data-share-bar]');
  await expect(bar).toBeVisible();
  await expect(bar.locator('figcaption')).toHaveText(T('Weight by layer'));
  // every layer that holds clothes has its name in the legend, in the app's order
  const names = await bar.locator('.legend .nm').allTextContents();
  const layerNames = LAYERS.map((l) => T(l.name));
  expect(names.length).toBeGreaterThanOrEqual(4);
  expect(names.every((n) => layerNames.includes(n))).toBe(true);
  expect(names).toEqual(layerNames.filter((n) => names.includes(n)));
  await expect(bar.locator('.seg')).toHaveCount(names.length);
  await expect(bar.locator('.bar')).toHaveAttribute('role', 'img');
  await noSideScroll(page);
  await shot(page, info, 'UI-Teil1-Kleider');
  expect(errors).toEqual([]);
});

test('Bausteine: the weight per group as one bar under the head', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/blocks');
  const bar = page.locator('[data-share-bar]');
  await expect(bar).toBeVisible();
  await expect(bar.locator('figcaption')).toHaveText(T('Weight by group'));
  const groups = ['Always with you', 'Depending on the situation', 'On the ride', 'With the night', 'To add'].map(T);
  const names = await bar.locator('.legend .nm').allTextContents();
  expect(names.length).toBeGreaterThan(0);
  expect(names.every((n) => groups.includes(n))).toBe(true);
  // the percentages add up to about 100
  const pcs = (await bar.locator('.legend .pc').allTextContents()).map((s) => Number(s.replace(/[^\d]/g, '')));
  expect(Math.abs(pcs.reduce((a, b) => a + b, 0) - 100)).toBeLessThanOrEqual(names.length);
  await noSideScroll(page);
  await shot(page, info, 'UI-Teil1-Bausteine');
  expect(errors).toEqual([]);
});
