// «Was auffällt» (Noah 27.11.2026 «4a»): hints across the activities, a card under the Haken-Verlauf on Auswerten › Woche
// and one quiet line under «Heute abhaken» on Heute. German, phone + desktop, fictional ticks of the seeded activities.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { flowSeeded } from './wall-fixture.js';
import { openHome, homeFixture, D0 } from './home0460-fixture.js';
import { addDays, put } from './aktiv-fixture.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const tick = (actId, back) => ({ id: `test_hh_${actId}_${back}`, actId, day: addDays(D0, -back), at: `${addDays(D0, -back)}T08:00:00+02:00`, n: 1 });

async function open(page, context, info, log) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openHome(page, context, info, { data: homeFixture() });
  await flowSeeded(page);
  await put(page, { flowLog: log });
  await page.reload();
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  return errors;
}

test('Heute: four days of movement without recovery give one line, a tap opens the card', async ({ page, context }, info) => {
  const errors = await open(page, context, info, [0, 1, 2, 3].map((b) => tick('gym', b)));
  const line = page.locator('[data-haken-top] [data-haken-hinweis]');
  await expect(line).toBeVisible();
  await expect(line).toHaveAttribute('data-haken-hinweis', 'balance');
  await expect(line).toContainText(T('{n} days in a row with movement and no recovery. Recover today?', { n: '4' }));
  // the line stands under the block, not above it
  const below = await page.evaluate(() => {
    const blk = document.querySelector('[data-section="haken"]');
    return !!(blk.compareDocumentPosition(document.querySelector('[data-haken-hinweis]')) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(below).toBe(true);
  const box = await line.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  await (info.project.name === 'phone' ? line.tap() : line.click());
  await expect(page).toHaveURL(/#\/auswerten\/woche/);
  const card = page.locator('[data-haken-hinweise]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-hint="balance"]')).toContainText(T('{n} days in a row with movement and no recovery. Recover today?', { n: '4' }));
  await expect(card.locator('[data-hint="balance"]')).toContainText(T('Why: on each of the last {n} days you ticked something under «Move» and nothing under «Recovery».', { n: '4' }));
  // a series of the same four days is on the card too, under the recovery hint
  await expect(card.locator('[data-hint="streak"]')).toContainText(T('{name}: {n} days in a row', { name: 'Gym', n: '4' }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
  expect(errors).toEqual([]);
});

test('Heute: after a recovery tick the line names the series; with the kind switched off it is gone', async ({ page, context }, info) => {
  await open(page, context, info, [...[0, 1, 2, 3].map((b) => tick('gym', b)), tick('sauna', 0)]);
  const line = page.locator('[data-haken-top] [data-haken-hinweis]');
  await expect(line).toHaveAttribute('data-haken-hinweis', 'streak');
  await expect(line).toContainText(T('{name}: {n} days in a row', { name: 'Gym', n: '4' }));
  // Me › Look › Suggestions › Performance tips switches the line off
  await page.evaluate(async () => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction('settings', 'readwrite');
      tx.objectStore('settings').put({ key: 'suggestOff', value: ['performance'] });
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  });
  await page.reload();
  await expect(page.locator('[data-haken-top]')).toBeVisible();
  await expect(page.locator('[data-haken-hinweis]')).toHaveCount(0);
});

test('Auswerten Woche: without hints the card says so', async ({ page, context }, info) => {
  await open(page, context, info, [tick('gym', 5)]);
  await page.goto('./#/auswerten/woche');
  await ready(page);
  const card = page.locator('[data-haken-hinweise]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-hh-none]')).toBeVisible();
  await expect(card.locator('li')).toHaveCount(0);
});
