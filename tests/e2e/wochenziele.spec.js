// «Eigene Wochenziele» (Noah 05.11.2026, Aktiv 4b): own goals for Monday to Sunday with a bar each; add, change, reorder, delete
// (with Undo). German UI, fictional data, phone + desktop. SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { actRecord } from '../../src/lib/training.js';
import { flowSeeded } from './wall-fixture.js';
import { put, D0 } from './aktiv-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
// the clock stands on Friday 9 Oct 2026: the week is Mon 5 … Sun 11 Oct
const ride = (day, km) => ({ ...actRecord({ id: `test_wg_${day}`, startLocal: `${day}T08:00:00`, name: 'Fictional ride', type: 'Ride', km, movingS: 2 * 3600 }), day, kind: 'bike' });
const tick = (day) => ({ id: `test_wgm_${day}`, actId: 'meditation', day, at: `${day}T07:05:00+02:00`, min: 15 });

async function open(page, context, { rides = true } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  await put(page, { flowLog: [tick('2026-10-04'), tick('2026-10-05')], ...(rides ? { activities: [ride('2026-10-06', 60), ride('2026-10-08', 45), ride('2026-10-03', 99)] } : {}) });
  await page.goto('./#/flow');
  await page.reload();
}
const shot = async (page, info, name, loc) => {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.waitForTimeout(300);
  await loc.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('WG-1 empty: the card says why and offers goals; a tap adds one; the bars count Monday to today', async ({ page, context }, info) => {
  await open(page, context);
  const card = page.locator('#wg-h').locator('xpath=ancestor::section[1]');
  await expect(card.locator('[data-wg-empty]')).toBeVisible();
  await expect(card).toContainText(T('No week goals yet. A small goal for the week, like 2× meditation or 150 km, shows how far you are.'));
  await shot(page, info, 'WG1-leer', card);
  await card.locator('[data-wg-add="meditation"]').click();
  await card.locator('[data-wg-add="km"]').click();
  await expect(card.locator('[data-wg-empty]')).toHaveCount(0);
  // one meditation tick in the week (Monday), the one of Sunday before does not count; 60 + 45 km, not the 99 km of Saturday before
  await expect(card.locator('[data-wg="act:meditation"] [data-wg-line]')).toHaveText('1× von 2×');
  await expect(card.locator('[data-wg="km"] [data-wg-line]')).toHaveText('105 km von 150 km');
  await expect(card).toContainText('Noch 3 Tage in dieser Woche.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await shot(page, info, 'WG1-ziele', card);
  // it stays after a reload
  await page.reload();
  await expect(card.locator('[data-wg="km"]')).toBeVisible();
});

test('WG-2 change: a number, the order, delete with Undo, add your own', async ({ page, context }, info) => {
  await open(page, context);
  const card = page.locator('#wg-h').locator('xpath=ancestor::section[1]');
  await card.locator('[data-wg-add="meditation"]').click();
  await card.locator('[data-wg-add="km"]').click();
  await card.getByRole('button', { name: T('Change') }).click();
  await shot(page, info, 'WG2-aendern', card);
  const rows = card.locator('li[data-wg]');
  await expect(rows).toHaveCount(2);
  // another number
  await card.locator('[data-wg="km"] input').fill('100');
  await card.locator('[data-wg="km"] input').blur();
  // the order: km first
  await card.locator('[data-wg="km"]').getByRole('button', { name: T('Move {name} up').replace('{name}', T('Bike km')) }).click();
  await expect(rows.first()).toHaveAttribute('data-wg', 'km');
  // delete asks, then offers Undo
  await card.locator('[data-wg="act:meditation"] [data-wg-del]').click();
  await page.getByTestId('ask-delete').getByRole('button', { name: T('Delete'), exact: true }).click();
  await expect(rows).toHaveCount(1);
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(rows).toHaveCount(2);
  await card.getByRole('button', { name: T('Done') }).click();
  await expect(card.locator('[data-wg="km"] [data-wg-line]')).toHaveText(T('Reached'));
  // 105 km of 100: one goal met, not all
  await expect(card.locator('[data-wg-next]')).toHaveCount(0);
  // add your own: a second sport
  await card.locator('[data-wg-new]').click();
  await expect(card.locator('[data-wg-form]')).toBeVisible();
  await card.locator('[data-wg-pick]').selectOption('act:yoga');
  await card.locator('[data-wg-amount]').fill('1');
  await shot(page, info, 'WG2-neu', card);
  await card.locator('[data-wg-save]').click();
  await expect(card.locator('[data-wg="act:yoga"]')).toBeVisible();
});

test('WG-3 all reached: the card says so and leads to the week in review', async ({ page, context }, info) => {
  await open(page, context);
  const card = page.locator('#wg-h').locator('xpath=ancestor::section[1]');
  await card.locator('[data-wg-add="km"]').click();
  await card.getByRole('button', { name: T('Change') }).click();
  await card.locator('[data-wg="km"] input').fill('100');
  await card.locator('[data-wg="km"] input').blur();
  await card.getByRole('button', { name: T('Done') }).click();
  await expect(card.locator('[data-wg-next]')).toBeVisible();
  await expect(card.locator('[data-wg-next] a')).toHaveAttribute('href', '#/flow/review');
  await shot(page, info, 'WG3-erreicht', card);
});

test('WG-4 ways: a week goal and a ring row lead to their value in Analyse (44 px)', async ({ page, context }, info) => {
  await open(page, context);
  const card = page.locator('#wg-h').locator('xpath=ancestor::section[1]');
  await card.locator('[data-wg-add="meditation"]').click();
  await card.locator('[data-wg-add="km"]').click();
  const med = card.locator('[data-wg-way="act:meditation"]');
  await expect(med).toHaveAttribute('href', '#/auswerten/analyse/act%3Ameditation?zeit=w');
  await expect(card.locator('[data-wg-way="km"]')).toHaveAttribute('href', '#/auswerten/analyse/km%3Abike?zeit=w');
  expect((await med.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(med.locator('[data-wg-line]')).toHaveText('1× von 2×');
  // a ring with one sport is a way, a ring with several folds open (2a)
  const rings = page.locator('[data-ring-way], [data-ring-fold]');
  await expect(rings).toHaveCount(3);
  for (const r of await rings.all()) expect((await r.boundingBox()).height).toBeGreaterThanOrEqual(44);
  for (const r of await page.locator('[data-ring-way]').all()) expect(await r.getAttribute('href')).toMatch(/^#\/(auswerten\/analyse\/act%3A[^/]+\?zeit=w|flow\/auswertung)$/);
  const fold = page.locator('[data-ring-fold]').first();
  await expect(fold).toHaveAttribute('aria-expanded', 'false');
  await fold.click();
  await expect(fold).toHaveAttribute('aria-expanded', 'true');
  const sports = page.locator('[data-ring-parts] [data-ring-part]');
  expect(await sports.count()).toBeGreaterThanOrEqual(2);
  for (const r of await sports.all()) {
    expect((await r.boundingBox()).height).toBeGreaterThanOrEqual(44);
    expect(await r.getAttribute('href')).toMatch(/^#\/auswerten\/analyse\/act%3A[^/]+\?zeit=w$/);
  }
  await expect(page.locator('[data-ring-all]').first()).toHaveAttribute('href', '#/flow/auswertung');
  await fold.click();
  await expect(sports).toHaveCount(0);
  await shot(page, info, 'WG4-wege', page.locator('#ring-h').locator('xpath=ancestor::section[1]'));
  await med.click();
  await expect(page).toHaveURL(/#\/auswerten\/analyse\/act%3Ameditation\?zeit=w$/);
  await expect(page.locator('main')).toContainText(T('Meditation'));
});
