// R1 «Rückblick in drei Stufen» (Noah 23.11.2026): on the saved debrief of a past trip three stages with three
// questions each; answer one, it stays after a reload, change it, take it away again (Undo). Fictional data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en) => DE[en] ?? en;
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

test('Debrief in three stages: answer, keep, change, undo', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  await page.goto('./');
  await importAndSettle(page, FIX);
  await page.goto('./#/debrief/test_data_gtp_trip01');
  const box = page.locator('[data-later]');
  await box.scrollIntoViewIfNeeded();
  await expect(box.getByRole('heading', { name: T('Later, three questions each') })).toBeVisible();
  await expect(box.locator('[data-later-stage]')).toHaveCount(3);
  // the trip is long over: all three stages are due
  await expect(box.locator('[data-later-state="open"]')).toHaveCount(3);
  const d1 = box.locator('[data-later-stage="d1"]');
  await d1.locator('[data-later-input="0"]').fill('test_data_gtp_ linkes Knie');
  await d1.locator('[data-later-input="2"]').fill('Die Abfahrt am Morgen');
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (process.env.BAGSHOT_DIR) await box.screenshot({ path: `${process.env.BAGSHOT_DIR}/r1-later-${info.project.name}.png` });
  await d1.locator('[data-later-save]').click();
  await expect(d1).toHaveAttribute('data-later-state', 'done');
  await expect(d1.getByText('test_data_gtp_ linkes Knie')).toBeVisible();
  await expect(d1.getByText(T('What hurts?'))).toBeVisible();
  // the second question had no answer: it is not listed
  await expect(d1.getByText(T('What do you know after a night of sleep?'))).toHaveCount(0);

  // it stays after opening the page again
  await page.reload();
  const again = page.locator('[data-later-stage="d1"]');
  await again.scrollIntoViewIfNeeded();
  await expect(again).toHaveAttribute('data-later-state', 'done');
  await expect(again.getByText('Die Abfahrt am Morgen')).toBeVisible();

  // change an answer
  await again.locator('[data-later-edit]').click();
  await again.locator('[data-later-input="0"]').fill('test_data_gtp_ rechtes Knie');
  await again.locator('[data-later-save]').click();
  await expect(again.getByText('test_data_gtp_ rechtes Knie')).toBeVisible();

  // take every answer away: the stage is due again; Undo brings the answers back
  await again.locator('[data-later-edit]').click();
  for (const i of [0, 1, 2]) await again.locator(`[data-later-input="${i}"]`).fill('');
  await again.locator('[data-later-save]').click();
  await expect(again).toHaveAttribute('data-later-state', 'open');
  await page.getByRole('button', { name: T('Undo') }).first().click();
  await expect(again).toHaveAttribute('data-later-state', 'done');
  expect(errors).toEqual([]);
});
