// «Dein Tag und deine Woche», «Art der Sportart» und «Der Satz nach dem Haken» (Noah 27.11.2026 «1b 2a 3b 4a 5b»): the card on Auswerten › Woche,
// the window for the kinds, the sentence on «Geschafft». German, phone + desktop, fictional ticks, the clock on Friday 9 October 2026.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { D0, TODAY, addDays, aktivRows, put } from './aktiv-fixture.js';
import { flowSeeded } from './wall-fixture.js';
import { ready } from './settle.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const press = (loc, info) => (info.project.name === 'phone' ? loc.tap() : loc.click());

const tick = (actId, back, i = 0) => ({ id: `test_ha_${actId}_${back}_${i}`, actId, day: addDays(TODAY, -back), at: `${addDays(TODAY, -back)}T08:00:00+02:00`, n: 1 });

async function open(page, context, hash, rows) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow');
  await ready(page);
  await flowSeeded(page);
  await put(page, rows);
  await page.goto(hash);
  await page.reload();
  await ready(page);
  return errors;
}

test('Woche: the card names the day, the mix needs the kinds, the window sets them and the mix appears', async ({ page, context }, info) => {
  const flowLog = [0, 1, 2, 4, 5, 7, 9, 12].map((b) => tick('gym', b));
  const errors = await open(page, context, './#/auswerten/woche', { flowLog });
  const card = page.locator('[data-tagwoche]');
  await expect(card).toBeVisible();
  await expect(card.getByRole('heading', { name: T('Your day and your week') })).toBeVisible();
  // today one activity ticked (no minutes: the ticks are counted), against a usual day with one tick
  await expect(card.locator('[data-tw="day"]')).toContainText(T('Today|tw'));
  await expect(card.locator('[data-tw="day"]')).toContainText(T('a usual day for you'));
  // the card stands first, over the period switch (it is about now)
  const first = await page.evaluate(() => !!(document.querySelector('[data-tagwoche]').compareDocumentPosition(document.querySelector('[data-haken-zeitraum]')) & Node.DOCUMENT_POSITION_FOLLOWING));
  expect(first).toBe(true);
  // no kind yet: the mix row offers the window
  const choose = card.locator('[data-tw-art]');
  await expect(choose).toBeVisible();
  expect((await choose.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await press(choose, info);
  const sheet = page.locator('[data-art-sheet]');
  await expect(sheet).toBeVisible();
  const row = sheet.locator('[data-art-act="gym"]');
  await expect(row).toBeVisible();
  await press(row.locator('[data-art-pick="strength"]'), info);
  await expect(row.locator('[data-art-pick="strength"]')).toHaveAttribute('aria-pressed', 'true');
  // the main button is fully inside the window
  const done = sheet.locator('[data-art-done]');
  const b = await done.boundingBox();
  expect(b.y + b.height).toBeLessThanOrEqual(page.viewportSize().height);
  await press(done, info);
  await expect(sheet).toBeHidden();
  await expect(card.locator('[data-tw="mix"]')).toContainText(`${T('Strength|art')} 8 ${T('{n} days').replace('{n} ', '')}`);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Woche: the card «Nach harten Tagen» says so when there are too few days', async ({ page, context }) => {
  const errors = await open(page, context, './#/auswerten/woche', { flowLog: [tick('gym', 0)] });
  const card = page.locator('[data-nach-hart]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-he-none]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Geschafft: the first card says what the tick means for this activity', async ({ page, context }, info) => {
  const errors = await open(page, context, './#/flow', aktivRows());
  const push = page.locator('main [data-act="pushups"]').first();
  await expect(push).toBeVisible();
  await press(push, info);
  await expect(page).toHaveURL(/#\/flow\/geschafft\?e=/);
  const satz = page.locator('[data-geschafft-satz]');
  await expect(satz).toBeVisible();
  await expect(satz.locator('[data-satz-kind]').first()).not.toBeEmpty();
  const first = await page.evaluate(() => !!(document.querySelector('[data-geschafft-satz]').compareDocumentPosition(document.querySelector('[data-geschafft] .how')) & Node.DOCUMENT_POSITION_FOLLOWING));
  expect(first).toBe(true);
  expect(errors).toEqual([]);
});
