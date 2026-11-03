// «Welches Velo passt zur Tour?» (idea C3, Noah 02.11.2026 «3b»), German UI: a hilly route, two bikes without bags,
// the lighter one fits best; the line sits on top of the comparison. Fictional data only.
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
const MARK = { key: 'test_data_gtp_marker', value: 1 };
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));

function fixture() {
  const data = structuredClone(base);
  const t = data.tables;
  t.bikes = [
    { id: 'bike-test', name: 'Schweres Velo', weightG: 13000, slots: ['seat'], setup: { seat: null }, fixtures: [] },
    { id: 'bike-light', name: 'Leichtes Velo', weightG: 8000, slots: ['seat'], setup: { seat: null }, fixtures: [] },
  ];
  t.settings.push(MARK);
  t.trips = [{
    id: 'gtp-fit', title: 'Berg-Tour', domain: 'bikepacking', bikeId: 'bike-test', setup: {}, status: 'planned', wx: { min: 12, max: 20, rain: 'none' },
    hours: 6, ready: [], startDate: day(3), days: 1, entries: [], route: { km: 100, gainM: 2500 },
  }];
  return data;
}

test('the comparison names the lighter bike on a hilly route', async ({ page, context }, info) => {
  const file = info.outputPath('fit.json');
  writeFileSync(file, JSON.stringify(fixture()));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./');
  const panel = await openData(page);
  await panel.getByLabel(T('Import backup')).setInputFiles(file);
  await panel.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-fit'));
  await page.goto('./#/pack');
  await page.getByRole('button', { name: /Schweres Velo/ }).first().click();
  await page.getByRole('button', { name: T('Compare bikes') }).click();
  const dlg = page.getByRole('dialog', { name: T('Which bike?') });
  await expect(dlg.locator('[data-bike-fit]')).toHaveAttribute('data-bike-fit', 'bike-light');
  await expect(dlg.locator('[data-bike-fit]')).toContainText(T('Fits this trip best: {bike}.', { bike: 'Leichtes Velo' }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
});
