// «Was auffällt» (Noah 21.11.2026, Klügere Auswertungen K3): resting pulse of the last days against your normal, an observation and a question.
// Fictional days only; the clock stands on Friday 9 October 2026; German UI, phone + desktop. SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z ]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const SHOTS = process.env.SHOTS || '';

/** Normal 48/49 for 40 days, then the last days as given (newest last, ending today). */
function days(last, normalDays = 40) {
  const healthDays = [];
  for (let i = normalDays; i >= 1; i--) {
    const date = addDays(TODAY, -(last.length - 1) - i);
    healthDays.push({ date, restingHr: 48 + (i % 2), src: 'google', at: `${date}T08:00:00Z` });
  }
  last.forEach((v, i) => {
    const date = addDays(TODAY, -(last.length - 1 - i));
    healthDays.push({ date, restingHr: v, src: 'google', at: `${date}T08:00:00Z` });
  });
  return { healthDays };
}

async function open(page, context, data) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/flow');
  await ready(page);
  await put(page, data);
  await page.goto('./#/flow/form');
  await page.reload();
  await ready(page);
  return errors;
}
async function shotCard(page, info, name) {
  if (!SHOTS) return;
  await page.waitForTimeout(700);
  await page.locator('[data-auffaellt]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
}
const stored = (page) => page.evaluate(async () => {
  const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
  const row = await new Promise((res) => { const r = db.transaction('settings').objectStore('settings').get('training.marker'); r.onsuccess = () => res(r.result); });
  db.close();
  return row?.value ?? null;
});

test('Auffaellt: a resting pulse above the normal is told as an observation, then a marker quiets it', async ({ page, context }, info) => {
  const errors = await open(page, context, days([53, 54, 55]));
  const card = page.locator('[data-auffaellt]');
  await expect(card).toHaveAttribute('data-auffaellt-state', 'up');
  await expect(card.locator('[data-sure]')).toHaveAttribute('data-sure', 'trend');
  const text = card.locator('[data-auffaellt-text]');
  await expect(text).toContainText('3 Tagen');
  await expect(text).toContainText('über deinem Normal');
  // never a cause, never advice
  await expect(card).not.toContainText(/zu viel|weil|Ruhetag|Erholung nötig/i);
  await shotCard(page, info, 'auffaellt-hinweis');

  await press(card.locator('[data-auffaellt-mark]'), info);
  const sheet = page.locator('dialog[open]');
  await expect(sheet.locator('[data-marker-from]')).toHaveValue(addDays(TODAY, -2));
  await expect(sheet.locator('[data-marker-to]')).toHaveValue(TODAY);
  if (SHOTS) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/auffaellt-marker-${info.project.name === 'phone' ? 390 : 1440}.png` });
  }
  await press(sheet.locator('[data-marker-kind="sick"]'), info);
  await press(sheet.locator('[data-marker-save]'), info);
  await expect.poll(() => stored(page)).toHaveLength(1);
  await expect(card).toHaveAttribute('data-auffaellt-state', 'marked');
  await shotCard(page, info, 'auffaellt-danach');
  await press(page.locator('.rtoast').getByRole('button', { name: T('Undo') }), info);
  await expect(card).toHaveAttribute('data-auffaellt-state', 'up');
  expect(errors).toEqual([]);
});

test('Auffaellt: within the normal nothing stands out; the limit can be changed', async ({ page, context }, info) => {
  const errors = await open(page, context, days([50, 51, 51]));
  const card = page.locator('[data-auffaellt]');
  await expect(card).toHaveAttribute('data-auffaellt-state', 'none');
  await expect(card.locator('[data-auffaellt-mark]')).toHaveCount(0);
  await card.locator('[data-auffaellt-how] summary').click();
  await card.locator('[data-auffaellt-delta]').fill('2');
  await card.locator('[data-auffaellt-delta]').dispatchEvent('change');
  await expect(card).toHaveAttribute('data-auffaellt-state', 'up');
  await shotCard(page, info, 'auffaellt-grenze');
  await press(card.locator('[data-auffaellt-reset]'), info);
  await expect(card).toHaveAttribute('data-auffaellt-state', 'none');
  expect(errors).toEqual([]);
});

test('Auffaellt: too few values say so', async ({ page, context }, info) => {
  const errors = await open(page, context, days([53, 54, 55], 4));
  const card = page.locator('[data-auffaellt]');
  await expect(card).toHaveAttribute('data-auffaellt-state', 'few');
  await expect(card.locator('[data-sure]')).toHaveAttribute('data-sure', 'few');
  expect(errors).toEqual([]);
});
