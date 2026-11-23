// «Zusammenhänge» (Noah 22.11.2026 «a», Schritt L): the night after a ritual against the other nights and the felt sleep against the watch,
// in the week review (#/flow/review), in German. From 20 times on a line says what it found, with how sure it is; before that it only
// counts («noch N»). Fictional days written straight into IndexedDB. SHOTS=<dir> saves zusammenhaenge-390.png / -1440.png.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en, vars) => {
  const s = DE[en] ?? en;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : s;
};
const P = 'test_data_zh_';
const TODAY = '2026-10-19'; // a Monday; the browser runs in Europe/Zurich
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

function rows() {
  const flowLog = [];
  const ticked = new Set();
  for (let i = 0; i < 22; i++) {
    const day = addDays(TODAY, -3 - 2 * i);
    ticked.add(day);
    flowLog.push({ id: `${P}sa${i}`, actId: 'sauna', day, at: `${day}T18:00:00.000Z`, n: 1 });
  }
  for (let i = 0; i < 6; i++) flowLog.push({ id: `${P}me${i}`, actId: 'meditation', day: addDays(TODAY, -1 - 5 * i), at: `${addDays(TODAY, -1 - 5 * i)}T06:30:00.000Z`, n: 1, min: 10 });
  const healthDays = [];
  const abAnswers = [];
  for (let i = 0; i < 90; i++) {
    const date = addDays(TODAY, -i);
    const after = ticked.has(addDays(date, -1));
    const rested = i % 2 === 0;
    healthDays.push({ date, sleep: { asleepMin: rested ? 450 : 380, deepMin: (after ? 90 : 60) + (i % 3) - 1, remMin: 95, lightMin: 245, awakeMin: 30 }, src: 'test', at: `${TODAY}T08:00:00.000Z` });
    if (i < 26) abAnswers.push({ id: `${P}f${i}`, qid: 'erholung.schlaf', area: 'erholung', day: date, at: `${date}T07:00`, slot: null, kind: 'scale', value: rested ? 8 : 4, note: null, unit: null, src: 'hand' });
  }
  return { flowLog, healthDays, abAnswers };
}

const put = (page, data) =>
  page.evaluate(async (data) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(data), 'readwrite');
      for (const [t, list] of Object.entries(data)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, data);

test('Zusammenhänge: speaks from 20 times on with how sure it is, counts before that', async ({ page, context }, info) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  await page.clock.install({ time: new Date(`${TODAY}T09:00:00+02:00`) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./#/flow'); // Aktiv seeds its activities (sauna, meditation, …) once
  await expect(page.locator('main [data-week-glance]')).toBeVisible();
  await put(page, rows());
  await page.goto('./#/flow/review');
  await page.reload();
  const card = page.locator('main [data-zusammenhang]');
  await expect(card.getByRole('heading', { name: T('What goes together in your days') })).toBeVisible();

  // 22 sauna days: a line with the numbers and how sure it is
  const sauna = card.locator('[data-zh-ritual="sauna"]');
  await expect(sauna).toHaveAttribute('data-zh-kind', 'done');
  await expect(sauna).toContainText('Tiefschlaf 90 Min. gegen 60 Min.');
  await expect(sauna).toContainText('22 Mal');
  await expect(sauna.locator('[data-zh-sure]')).toHaveAttribute('data-zh-sure', 'clear');
  // 6 meditation days: only the count
  const med = card.locator('[data-zh-ritual="meditation"]');
  await expect(med).toHaveAttribute('data-zh-kind', 'wait');
  await expect(med).toContainText('Noch 14 Mal (6 bisher)');
  // the felt sleep against the watch (26 answers)
  const feel = card.locator('[data-zh-feel]');
  await expect(feel).toHaveAttribute('data-zh-kind', 'done');
  await expect(feel).toContainText('450 Min.');
  await expect(feel).toContainText('380 Min.');
  // «So gerechnet»
  await card.locator('[data-zh-how] summary').click();
  await expect(card.locator('[data-zh-how] p')).toContainText('20 Mal');

  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth), 'no sideways scroll').toBeLessThanOrEqual(w);
  if (process.env.SHOTS) await card.screenshot({ path: `${process.env.SHOTS}/zusammenhaenge-${info.project.name === 'phone' ? 390 : 1440}.png` });
  expect(errors).toEqual([]);
});
