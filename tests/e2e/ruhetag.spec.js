// «Ruhetag-Hinweis» (Noah 05.11.2026, Aktiv 4a): after three hard days in a row one gentle line on Aktiv.
// German UI, fictional Strava activities, phone + desktop. SHOTS=<folder> saves screenshots.
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { actRecord } from '../../src/lib/training.js';
import { SUGGEST_KEY } from '../../src/lib/clear/suggest.js';
import { flowSeeded } from './wall-fixture.js';
import { put, addDays, TODAY, D0 } from './aktiv-fixture.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const act = (day, effort, name) => ({ ...actRecord({ id: `test_ruhe_${day}`, startLocal: `${day}T08:00:00`, name, type: 'Ride', km: 60, movingS: 3 * 3600, effort }), day, kind: 'bike' });
/** Ordinary weeks (load 40–80) behind three long, hard days. */
const calm = Array.from({ length: 20 }, (_, i) => act(addDays(TODAY, -12 - i), 40 + ((i * 7) % 41), 'Fictional easy ride'));
const hard = [-3, -2, -1].map((n, i) => act(addDays(TODAY, n), 130 + i * 5, 'Fictional long ride'));

async function open(page, context, rows) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  await page.goto('./#/');
  await flowSeeded(page);
  if (rows.length) await put(page, { activities: rows });
  await page.goto('./#/flow');
  await page.reload();
}
const shot = async (page, info, name, loc) => {
  if (!process.env.SHOTS) return;
  mkdirSync(process.env.SHOTS, { recursive: true });
  await page.waitForTimeout(300);
  await loc.screenshot({ path: `${process.env.SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png` });
};

test('RT-1 three hard days: the line shows, «Not today» hides it for the day', async ({ page, context }, info) => {
  await open(page, context, [...calm, ...hard]);
  const box = page.locator('[data-ruhetag]');
  await expect(box).toBeVisible();
  await expect(box.locator('[data-ruhetag-title]')).toHaveText('3 harte Tage in Folge. Heute locker?');
  await expect(box).toContainText(T('Only a hint from your activities. You decide, a hard day is fine too.'));
  // it stands above «Heute abhaken»
  const top = await box.evaluate((el) => el.getBoundingClientRect().top);
  const tick = await page.locator('#tick-h').evaluate((el) => el.getBoundingClientRect().top);
  expect(top).toBeLessThan(tick);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await shot(page, info, 'RT1-zeile', page.locator('.flow'));
  await expect(box.locator('[data-ruhetag-rest]')).toHaveAttribute('href', '#/flow/rest');
  await box.locator('[data-ruhetag-no]').click();
  await expect(box).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#tick-h')).toBeVisible();
  await expect(page.locator('[data-ruhetag]')).toHaveCount(0);
});

test('RT-2 no hint without three hard days, and none without activities', async ({ page, context }) => {
  await open(page, context, [...calm, hard[0], hard[2]]);
  await expect(page.locator('#tick-h')).toBeVisible();
  await expect(page.locator('[data-ruhetag]')).toHaveCount(0);
  await page.goto('./#/');
  await page.evaluate(async () => {
    const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
    await new Promise((res) => { const tx = db.transaction('activities', 'readwrite'); tx.objectStore('activities').clear(); tx.oncomplete = res; });
    db.close();
  });
  await page.goto('./#/flow');
  await page.reload();
  await expect(page.locator('#tick-h')).toBeVisible();
  await expect(page.locator('[data-ruhetag]')).toHaveCount(0);
});

test('RT-3 «Performance tips» off: the line stays away', async ({ page, context }) => {
  await open(page, context, [...calm, ...hard]);
  await expect(page.locator('[data-ruhetag]')).toBeVisible();
  await page.evaluate(async (key) => {
    const db = await new Promise((res) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => res(r.result); });
    await new Promise((res) => { const tx = db.transaction('settings', 'readwrite'); tx.objectStore('settings').put({ key, value: ['performance'] }); tx.oncomplete = res; });
    db.close();
  }, SUGGEST_KEY);
  await page.reload();
  await expect(page.locator('#tick-h')).toBeVisible();
  await expect(page.locator('[data-ruhetag]')).toHaveCount(0);
});
