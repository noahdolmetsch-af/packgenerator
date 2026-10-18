// Impeccable Runde 2 (Noah 18.10.2026 «alle vorschläge aus allen dokumenten angenommen»), Gruppe 1:
// Unterwegs (lamps behind one line, the newest three notes, «Entfernen» in «…» with «Rückgängig»),
// Rückblick, Rückblick einer Tour and Fahrten. Fictional fixture (test_data_gtp_), German, phone + desktop.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
// the fixture: a 3-day trip running from 8 October
const RUNNING = 'test_data_gtp_trip24';

async function start(page, context, clock, trip = null) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date(clock));
  await page.goto('./');
  await importAndSettle(page, FIX);
  if (trip) await page.evaluate((x) => localStorage.setItem('pack.currentTrip', x), trip);
}

test('Unterwegs: the lamps behind one line, the newest 3 notes, «Entfernen» in «…» with «Rückgängig»', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // day 2 of 3, early evening: the light is on
  await start(page, context, '2026-10-09T18:30:00+02:00', RUNNING);
  await page.goto('./#/ride');
  await page.reload();
  const now = page.locator('section.now');
  await expect(now.locator('.tiles li')).toHaveCount(4);
  const lamps = now.locator('details.lamps');
  await expect(lamps).toHaveCount(1);
  // the list is folded; one tap shows it
  await expect(lamps.locator('.lamplist')).toBeHidden();
  await lamps.locator('summary').click();
  await expect(lamps.locator('.lamplist')).toBeVisible();
  // four notes: three show, the fourth behind «Alle 4 Notizen»
  const sec = page.locator('.notesec');
  for (const n of [1, 2, 3, 4]) {
    if (!(await sec.locator('textarea').isVisible())) await sec.getByRole('button', { name: T('Free text') }).click();
    await sec.locator('textarea').fill(`test_data_gtp_ Notiz ${n}`);
    await sec.getByRole('button', { name: T('Save note') }).click();
    await expect(sec.locator('.notes')).toContainText(`test_data_gtp_ Notiz ${n}`);
    await page.clock.setFixedTime(new Date(`2026-10-09T18:3${n}:00+02:00`));
  }
  const rows = sec.locator('.notes li');
  const total = await sec.locator('.allnotes').textContent();
  await expect(rows).toHaveCount(3);
  await expect(sec.locator('.notes')).not.toContainText('test_data_gtp_ Notiz 1');
  await sec.getByRole('button', { name: total.trim() }).click();
  await expect(sec.locator('.notes')).toContainText('test_data_gtp_ Notiz 1');
  await sec.getByRole('button', { name: T('Show the newest 3 only') }).click();
  await expect(rows).toHaveCount(3);
  // «Entfernen» sits in the «…» of each note and has «Rückgängig»
  await expect(sec.getByRole('button', { name: T('Remove'), exact: true })).toHaveCount(0);
  const last = rows.filter({ hasText: 'test_data_gtp_ Notiz 4' });
  await last.getByRole('button', { name: T('More for this note|ride') }).click();
  await page.getByRole('menuitem', { name: new RegExp(T('Remove')) }).click();
  await expect(sec.locator('.notes')).not.toContainText('test_data_gtp_ Notiz 4');
  const toast = page.locator('.toast');
  await expect(toast).toContainText(T('Note removed: {text}', { text: 'test_data_gtp_ Notiz 4' }));
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect(sec.locator('.notes')).toContainText('test_data_gtp_ Notiz 4');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
