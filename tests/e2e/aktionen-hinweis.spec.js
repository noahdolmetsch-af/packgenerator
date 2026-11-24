// «Aktionen in Auswerten» (Noah 23.11.2026 «1-5a»): «Not now» on an idea tip says «rests for 7 days» with Undo. German, phone + desktop.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

const TODAY = '2026-10-16';
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

test('Ideas: Not now shows a note with Undo that brings the tip back', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00+02:00`));
  // seven days of Fitbit so that the balance has values (fictional)
  const data = JSON.parse(readFileSync(FIX, 'utf8'));
  data.tables.healthDays = Array.from({ length: 10 }, (_, i) => {
    const date = addDays(TODAY, -i);
    return { date, restingHr: 52 + (i % 3), sleep: { asleepMin: 400 }, steps: 9000, src: 'google', at: `${date}T08:00:00Z` };
  });
  const file = info.outputPath('ideen-daten.json');
  writeFileSync(file, JSON.stringify(data));
  await page.goto('./');
  await importAndSettle(page, file);
  await page.goto('./#/flow/ideen');
  const tips = page.locator('[data-tip]');
  await expect(tips.first()).toBeVisible({ timeout: 20000 });
  const n = await tips.count();
  const first = await tips.first().getAttribute('data-tip');
  await tips.first().getByRole('button', { name: T('Not now') }).click();
  const note = page.locator('.rtoast');
  await expect(note).toContainText('ruht 7 Tage');
  await expect(page.locator(`[data-tip="${first}"]`)).toHaveCount(0);
  await note.getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator(`[data-tip="${first}"]`)).toHaveCount(1);
  expect(await tips.count()).toBe(n);
  expect(errors).toEqual([]);
});
