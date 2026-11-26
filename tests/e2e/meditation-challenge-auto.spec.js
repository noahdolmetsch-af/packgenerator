// «Challenge zählt Meditation von selbst» (Noah 24.11.2026 «1-5a»/«ja», step 2): a challenge that belongs to Meditation counts
// every session of the page Meditation toward its daily goal. A session that reaches the goal ticks the day by itself.
// Fictional data only, no real network. SHOTS=<folder> saves pictures.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const T = (en, vars) => {
  const s = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const D0 = '2026-10-09T07:00:00+02:00';
const goal = { id: 'tz-test-auto', name: '30 days of meditation', unit: 'min', word: '', link: 'meditation', goal: 10, from: '2026-10-08', until: '2026-11-06', remindAt: '', hand: {}, stopped: false, closed: false };

// the records are written once the app has opened its database
async function seed(page, context, { sessions = [] } = {}) {
  await context.addInitScript(
    ([g, rows]) => {
      window.__seed = () =>
        new Promise((done) => {
          const r = indexedDB.open('pack-generator');
          r.onsuccess = () => {
            const db = r.result;
            const names = ['settings', 'flowLog'].filter((n) => db.objectStoreNames.contains(n));
            const tx = db.transaction(names, 'readwrite');
            tx.objectStore('settings').put({ key: 'tagesziele', value: [g] });
            rows.forEach((row) => tx.objectStore('flowLog').put(row));
            tx.oncomplete = () => (db.close(), done());
          };
        });
    },
    [goal, sessions],
  );
}
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
const tap = (page, info, loc) => (info.project.name === 'phone' ? loc.tap() : loc.click());
const shot = async (page, info, name) => {
  if (!process.env.SHOTS) return;
  await page.locator('.tcard').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('a session that reaches the goal ticks the day by itself, a smaller one counts its minutes', async ({ page, context }, info) => {
  await seed(page, context, { sessions: [{ id: 'fl-auto-1', actId: 'meditation', day: '2026-10-09', min: 12 }] });
  const errors = await open(page, context);
  await page.evaluate(() => window.__seed());
  await page.reload();
  await ready(page);
  const card = page.locator('[data-med-challenge="running"] [data-ziel-card]');
  await expect(card).toBeVisible();
  await expect(card.locator('[data-ziel-now]')).toContainText(T('Done today: {have} of {goal}', { have: T('{n} min', { n: 12 }), goal: T('{n} min', { n: 10 }) }));
  await expect(card.locator('[data-ziel-now]')).toContainText(T('{n} min from meditation', { n: 12 }));
  const tick = card.locator('[data-ziel-tick]');
  await expect(tick).toBeDisabled();
  await expect(tick).toContainText(T('Ticked by itself'));
  await shot(page, info, 'meditation-von-selbst-erreicht');
  expect(errors).toEqual([]);
});

test('a short session counts, minutes by hand are added, the next session brings it to the goal', async ({ page, context }, info) => {
  await seed(page, context, { sessions: [{ id: 'fl-auto-2', actId: 'meditation', day: '2026-10-09', min: 4 }] });
  const errors = await open(page, context);
  await page.evaluate(() => window.__seed());
  await page.reload();
  await ready(page);
  const card = page.locator('[data-med-challenge="running"] [data-ziel-card]');
  await expect(card.locator('[data-ziel-now]')).toContainText(T('{have} of {goal} today', { have: T('{n} min', { n: 4 }), goal: T('{n} min', { n: 10 }) }));
  await expect(card.locator('[data-ziel-tick]')).toBeEnabled();
  // «Tick off» adds only the six minutes that are missing
  await tap(page, info, card.locator('[data-ziel-tick]'));
  await expect(card.locator('[data-ziel-now]')).toContainText(T('Done today: {have} of {goal}', { have: T('{n} min', { n: 10 }), goal: T('{n} min', { n: 10 }) }));
  // taking the tick back takes away the minutes by hand, the session stays
  await tap(page, info, card.locator('[data-ziel-tick]'));
  await expect(card.locator('[data-ziel-now]')).toContainText(T('{have} of {goal} today', { have: T('{n} min', { n: 4 }), goal: T('{n} min', { n: 10 }) }));
  expect(errors).toEqual([]);
});

test('starting the idea links the challenge, the offer says every session counts by itself', async ({ page, context }, info) => {
  const errors = await open(page, context);
  const offer = page.locator('[data-med-challenge="offer"]');
  await expect(offer).toContainText(T('Every day at least {n} min. Every session counts by itself.', { n: 10 }));
  await tap(page, info, page.locator('[data-med-challenge-start]'));
  const link = page.locator('[data-ziel-link]');
  await expect(link).toBeChecked();
  await shot(page, info, 'meditation-fenster-gehoert-zu');
  await tap(page, info, page.locator('[data-ziel-save]'));
  await expect(page.locator('[data-med-challenge="running"] [data-ziel-card]')).toBeVisible();
  const saved = await page.evaluate(
    () =>
      new Promise((done) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const q = r.result.transaction('settings').objectStore('settings').get('tagesziele');
          q.onsuccess = () => (r.result.close(), done(q.result?.value ?? null));
        };
      }),
  );
  expect(saved[0].link).toBe('meditation');
  expect(saved[0].auto).toBeUndefined();
  // the pencil opens the window again with the link on, and it can be taken off
  await tap(page, info, page.locator('[data-ziel-edit]'));
  await expect(page.locator('[data-ziel-link]')).toBeChecked();
  await page.locator('[data-ziel-link]').uncheck();
  await tap(page, info, page.locator('[data-ziel-save]'));
  await expect(page.locator('[data-med-challenge="running"] [data-ziel-card]')).toBeVisible();
  expect(errors).toEqual([]);
});
