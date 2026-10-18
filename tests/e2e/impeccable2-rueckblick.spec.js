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
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

test('Rückblick: «Rückblick schreiben», «Kurz: Alles gut» with Undo, every way only once at the page end', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, '2026-10-12T10:00:00+02:00');
  await page.goto('./#/debrief');
  await page.reload();
  const hero = page.locator('[data-open-debrief]');
  const name = (await hero.locator('.hname').textContent()).trim();
  const write = new RegExp(`^(${esc(T('Write the debrief'))}|${esc(T('Continue the debrief'))}): ${esc(name)}$`);
  await expect(hero.getByRole('link', { name: write })).toBeVisible();
  await expect(hero.getByRole('link', { name: new RegExp(`^${esc(T('Rate|debrief'))}`) })).toHaveCount(0);
  // the short way saves at once, «Rückgängig» brings the open debrief back
  await hero.getByRole('button', { name: `${T('Short: all good')}: ${name}` }).click();
  await expect(page.locator('.hub .undo')).toContainText(T('Saved: {title}, all good.', { title: name }));
  await expect(page.locator('[data-open-debrief] .hname')).not.toHaveText(name);
  await page.locator('.hub .undo').getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-open-debrief] .hname')).toHaveText(name);
  // the tile row leaves out what the page shows as a section or row already; it waits under «Kachel hinzufügen»
  const row = page.locator('[data-sk="debrief"]');
  await expect(row.locator('[data-sk-tile]').first()).toBeVisible();
  for (const id of ['logbook', 'pace', 'learnings', 'past']) await expect(row.locator(`[data-sk-tile="${id}"]`)).toHaveCount(0);
  await expect(row.locator('[data-sk-tile="tpl"]')).toBeVisible();
  await expect(row.locator('[data-sk-extras]')).toBeVisible();
  // «Mehr» keeps Logbuch, Vergangene Touren and Fahrten
  await expect(page.getByRole('region', { name: T('More') }).getByRole('link')).toHaveCount(3);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test('Rückblick einer Tour: «Fertig» once with the saved line, «Weiter» open with one button to the next trip', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, '2026-10-12T10:00:00+02:00');
  await page.goto('./#/debrief/test_data_gtp_trip01');
  await page.reload();
  // no card «Gespeichert» any more; its line sits in «Fertig. Gute Tour!»
  await expect(page.getByRole('heading', { name: T('Done. Good trip!') })).toBeVisible();
  await expect(page.getByRole('heading', { name: T('Saved'), exact: true })).toHaveCount(0);
  await expect(page.locator('[data-saved]')).toContainText(T('Saved on {date}', { date: '' }).trim());
  // «Weiter» is open and ends with one clear button
  const next = page.locator('section[data-group="next"]');
  await expect(next.locator('button[aria-expanded]').first()).toHaveAttribute('aria-expanded', 'true');
  const go = next.locator('[data-go-next]').locator('a, button');
  await expect(go).toHaveCount(1);
  await expect(go).toHaveText(new RegExp(`^(${esc(T('To the next trip: {name}', { name: '' }))}.+|${esc(T('Plan the next trip'))})$`));
  // the tile row without the ways the page has already
  const row = page.locator('[data-sk="debrief"]');
  for (const id of ['logbook', 'pace', 'learnings', 'past']) await expect(row.locator(`[data-sk-tile="${id}"]`)).toHaveCount(0);
  expect(await wide(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});
