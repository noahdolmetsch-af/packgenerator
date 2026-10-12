// 0.114.1 (UI-Prüfung A1): a saved debrief from an old backup or the Excel import can come without
// its list of not-used items (`items`) or without `missing`. Its Rückblick page stayed empty: the page
// crashed on `debrief.items[…]`. Now such a debrief opens like any other, every item counted as used.
// Fictional fixture plus one test_data_gtp_ trip; nothing leaves the preview.
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const tr = (lang) => (en) => (lang === 'de' ? DE[en] : null) ?? en.replace(/\|[a-z]+$/, '');
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const day = (n) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const TRIP = 'test_data_gtp_old';

/** One day ride 30 days ago with a finished debrief as an old backup has it: no items, no missing. */
function fixture(path, title) {
  const data = structuredClone(base);
  const entries = data.tables.items.slice(3, 7).map((i) => ({ itemId: i.id, slot: 'seat', qty: 1, packed: true }));
  data.tables.trips = [{ id: TRIP, domain: 'bikepacking', title, startDate: day(-30), days: 1, bikeId: 'bike-test', bike: data.tables.bikes[0].name, setup: data.tables.bikes[0].setup, entries, ready: [], status: 'planned' }];
  const at = `${day(-29)}T08:00:00.000Z`;
  data.tables.debriefs = [{ tripId: TRIP, status: 'done', weather: 'planned', amount: 'right', bags: 'fine', note: '', applied: [], km: 40, kmApplied: 0, doneAt: at, createdAt: at, updatedAt: at }];
  writeFileSync(path, JSON.stringify(data));
  return entries.length;
}

for (const lang of ['en', 'de']) {
  test(`an old debrief without its item list opens, ${lang}`, async ({ page, context }, info) => {
    const T = tr(lang);
    const title = `test_data_gtp_ Alte Runde ${lang}`;
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const file = info.outputPath('debrief-old-fixture.json');
    const n = fixture(file, title);
    await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
    await context.addInitScript((l) => localStorage.setItem('lang', l), lang);
    page.on('dialog', (d) => d.accept());
    await page.goto('./');
    const data = await openData(page);
    await data.getByLabel(T('Import backup')).setInputFiles(file);
    await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
    await settle(page);
    await expect(data.getByText(/importiert|Imported/)).toBeVisible();

    await page.goto(`./#/debrief/${TRIP}`);
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(title) })).toBeVisible();
    // the saved Rückblick: every packed item counts as used
    await expect(page.getByText(T('{used} of {total} items used').replace('{used}', n).replace('{total}', n))).toBeVisible();
    await expect(page.getByText(T('Everything on the list was used.'))).toBeVisible();
    // «Antworten ändern» opens the chips: none marked as not used
    await page.getByRole('button', { name: T('Change answers') }).click();
    await expect(page.locator('main .chips [aria-pressed]')).toHaveCount(n);
    await expect(page.locator('main .chips [aria-pressed="true"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
