// «Marker» (Noah 21.11.2026, Klügere Auswertungen K1): krank, verletzt, Stress, Ferien pro Zeitraum auf «Form und Erholung», mit Rückgängig.
// Fictional data only; the clock stands on Friday 9 October 2026; German UI, phone + desktop. SHOTS=<folder> saves pictures (Handy 390 / Computer 1440).
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0 } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.SHOTS || '';

async function open(page, context) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await flowSeeded(page);
  await page.goto('./#/flow/form');
  await page.reload();
  await ready(page);
  return errors;
}
async function shotCard(page, info, name) {
  if (!SHOTS) return;
  await page.waitForTimeout(700);
  await page.locator('[data-marker-card]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const stored = (page) => page.evaluate(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
  const row = await new Promise((res) => { const r = db.transaction('settings').objectStore('settings').get('training.marker'); r.onsuccess = () => res(r.result); });
  db.close();
  return row?.value ?? null;
});

test('Marker: empty card, set a stretch, change it, delete it, Undo brings it back', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const card = page.locator('[data-marker-card]');
  await expect(card.locator('[data-marker-empty]')).toBeVisible();
  await shotCard(page, info, 'marker-leer');

  await press(card.locator('[data-marker-new]'), info);
  const sheet = page.locator('dialog[open]');
  await expect(sheet).toBeVisible();
  await press(sheet.locator('[data-marker-kind="injured"]'), info);
  await sheet.locator('[data-marker-from]').fill('2026-10-05');
  await sheet.locator('[data-marker-to]').fill('2026-10-08');
  if (SHOTS) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/marker-fenster-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await press(sheet.locator('[data-marker-save]'), info);
  await expect(sheet).toBeHidden();
  const row = card.locator('[data-marker]');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(T('Injured'));
  await expect(row).toContainText('4');
  await expect.poll(() => stored(page)).toHaveLength(1);
  expect((await stored(page))[0]).toMatchObject({ kind: 'injured', from: '2026-10-05', to: '2026-10-08' });

  // a second one, only one day
  await press(card.locator('[data-marker-new]'), info);
  await press(page.locator('dialog[open] [data-marker-kind="holiday"]'), info);
  await page.locator('dialog[open] [data-marker-from]').fill('2026-09-20');
  await press(page.locator('dialog[open] [data-marker-save]'), info);
  await expect(card.locator('[data-marker]')).toHaveCount(2);
  await shotCard(page, info, 'marker-liste');

  // change the first (newest first: the injured one is on top)
  await press(card.locator('[data-marker-edit]').first(), info);
  await press(page.locator('dialog[open] [data-marker-kind="sick"]'), info);
  await press(page.locator('dialog[open] [data-marker-save]'), info);
  await expect(card.locator('[data-marker]').first()).toContainText(T('Sick'));

  // delete asks first, then Undo
  await press(card.locator('[data-marker-delete]').first(), info);
  await press(page.getByRole('button', { name: T('Delete') }).last(), info);
  await expect(card.locator('[data-marker]')).toHaveCount(1);
  await press(page.locator('.rtoast').getByRole('button', { name: T('Undo') }), info);
  await expect(card.locator('[data-marker]')).toHaveCount(2);
  await expect.poll(() => stored(page)).toHaveLength(2);
  expect(errors).toEqual([]);
});

test('Marker: the last day cannot be before the first day', async ({ page, context }, info) => {
  const errors = await open(page, context);
  await press(page.locator('[data-marker-new]'), info);
  const sheet = page.locator('dialog[open]');
  await sheet.locator('[data-marker-from]').fill('2026-10-08');
  await sheet.locator('[data-marker-to]').fill('2026-10-05');
  await expect(sheet.locator('[data-marker-save]')).toBeDisabled();
  await expect(sheet).toContainText(T('The last day cannot be before the first day.'));
  expect(errors).toEqual([]);
});
