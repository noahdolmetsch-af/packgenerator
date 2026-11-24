// «Meditation: Starten zuerst, Challenge darunter» (Noah 24.11.2026 «1-5a»): on the page Meditation the big start button is on
// top, under the duration chips sits the row «Challenge: 30 Tage Meditation» with «Starten»; a running one shows its card
// with «Tick off». Fictional data only, no real network. SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-09T07:00:00+02:00';
const goal = { id: 'tz-test-1', name: '30 days of meditation', unit: 'min', word: '', goal: 10, from: '2026-10-08', until: '2026-11-06', remindAt: '', hand: { '2026-10-08': [10] }, stopped: false, closed: false };

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow/act/meditation');
  await ready(page);
  await expect(page.locator('[data-start]')).toBeVisible();
  return errors;
}
const shot = async (page, info, name) => {
  if (!process.env.SHOTS) return;
  await page.locator('.tcard').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('the start sits on top, the challenge offer under the durations, «Starten» opens the window with the idea', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const start = await page.locator('[data-start]').boundingBox();
  const chip = await page.locator('[data-dur="20"]').boundingBox();
  const offer = page.locator('[data-med-challenge="offer"]');
  await expect(offer).toBeVisible();
  await expect(offer).toContainText(T('Challenge: {name}', { name: T('30 days of meditation') }));
  const o = await offer.boundingBox();
  const dial = await page.locator('.tcard .dial').boundingBox();
  expect(start.y, 'start above the durations').toBeLessThan(chip.y);
  expect(chip.y, 'durations above the challenge').toBeLessThan(o.y);
  expect(o.y, 'challenge above the clock').toBeLessThan(dial.y);
  await shot(page, info, 'meditation-angebot');
  const btn = page.locator('[data-med-challenge-start]');
  await (info.project.name === 'phone' ? btn.tap() : btn.click());
  await expect(page.locator('[data-ziel-goal]')).toBeVisible();
  await expect(page.locator('dialog[open] input').first()).toHaveValue(T('30 days of meditation'));
  await expect(page.locator('[data-ziel-goal]')).toHaveValue('10');
  const save = page.locator('[data-ziel-save]');
  await (info.project.name === 'phone' ? save.tap() : save.click());
  const card = page.locator('[data-med-challenge="running"] [data-ziel-card]');
  await expect(card).toBeVisible();
  await expect(card).toContainText(T('Day {n} of {total}', { n: 1, total: 30 }));
  await expect(offer).toHaveCount(0);
  await shot(page, info, 'meditation-challenge-laeuft');
  expect(errors).toEqual([]);
});

test('a running meditation challenge shows its card with «Tick off»', async ({ page, context }, info) => {
  await context.addInitScript((g) => {
    // the record is written once the app has opened its database
    const put = () => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('settings')) return db.close();
        const tx = db.transaction('settings', 'readwrite');
        tx.objectStore('settings').put({ key: 'tagesziele', value: [g] });
        tx.oncomplete = () => db.close();
      };
    };
    window.__putGoal = put;
  }, goal);
  const errors = await open(page, context);
  await page.evaluate(() => window.__putGoal());
  await page.reload();
  await ready(page);
  const card = page.locator('[data-med-challenge="running"] [data-ziel-card]');
  await expect(card).toBeVisible();
  await expect(card).toContainText(T('Day {n} of {total}', { n: 2, total: 30 }));
  const tick = card.locator('[data-ziel-tick]');
  await (info.project.name === 'phone' ? tick.tap() : tick.click());
  await expect(card.locator('[data-ziel-now]')).toContainText(T('Done today: {have} of {goal}', { have: T('{n} min', { n: 10 }), goal: T('{n} min', { n: 10 }) }));
  await expect(page.locator('[data-med-challenge="offer"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
