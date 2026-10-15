// SN6+ «SN6 plus» (mockups SN6p-funktionen and SN6p-so-gehts, Noah 13.10.2026 «freigabe SN6p», answers 1b 2b
// 3b 4a 5b): «Was die App alles kann» from the top: progress bar, «Passt gerade», «Deine Top 5», search,
// «Neu seit deinem letzten Besuch» (instead of «Neu für dich»), the six cards with their bars; «So geht's»
// open in the «…» of a row; a quiet line for every block without data.
// Fictional fixture (test_data_gtp_), German, phone + desktop, no horizontal scroll.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync } from 'node:fs';
import DE from '../../src/lib/i18n/de/index.js';
import { HOWTO } from '../../src/lib/know/howto.js';
import { importAndSettle, ready } from './settle.js';

// the order of the blocks, read from the app source (sn6plus.js uses the Svelte runes, not importable here)
const SRC = readFileSync(fileURLToPath(new URL('../../src/lib/know/sn6plus.js', import.meta.url)), 'utf8');
const BLOCKS = JSON.parse(SRC.match(/export const BLOCKS = (\[[^\]]*\]);/)[1].replace(/'/g, '"'));

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const wide = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
const SHOTS = '/tmp/claude-0/sn-shots/sn6plus';
// what this device counted (fictional): the top 5 since the start
const USES = { gpx: 41, 'f.plan': 12, wxsuggest: 9, care: 6, backup: 5, note: 2 };
const TOP = ['gpx', 'f.plan', 'wxsuggest', 'care', 'backup'];

/** Start in German at a fixed time; `opens` and `uses` go in before the app runs (only on the session's first load). */
async function start(page, context, { clock = '2026-10-09T10:00:00+02:00', opens = null, uses = null, data = true } = {}) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(
    ({ opens, uses }) => {
      localStorage.setItem('lang', 'de');
      if (sessionStorage.getItem('sn6p.opened')) return;
      if (opens) localStorage.setItem('sn6p.opens', JSON.stringify(opens));
      if (uses) localStorage.setItem('wasneu.uses', JSON.stringify(uses));
    },
    { opens, uses },
  );
  page.on('dialog', (d) => d.accept());
  await page.clock.setFixedTime(new Date(clock));
  await page.goto('./');
  if (data) await importAndSettle(page, FIX);
  else await ready(page);
}

async function fits(page, info) {
  expect(await wide(page)).toBeLessThanOrEqual(0);
  if (info.project.name === 'phone') {
    await page.setViewportSize({ width: 320, height: 760 });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(320);
    expect(await wide(page)).toBeLessThanOrEqual(0);
    await page.setViewportSize({ width: 390, height: 844 });
  }
}

async function shot(page, info, name) {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? 390 : 1440}.png`, fullPage: true });
}

test('SN6+ Funktionen: order, progress, Passt gerade, Top 5, Neu seit deinem letzten Besuch', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, { opens: { last: { at: '2026-10-02T07:00:00.000Z', v: '0.124.0' } }, uses: USES });
  await page.goto('./#/features');
  await expect(page.getByRole('heading', { name: T('What the app can do'), level: 1 })).toBeVisible();

  // answer 3b: the order from the top
  await expect(page.locator('[data-block]')).toHaveCount(BLOCKS.length - 1);
  const order = await page.locator('[data-block], section[data-group]').evaluateAll((els) => els.map((e) => e.dataset.block ?? 'groups'));
  expect([...new Set(order)]).toEqual(BLOCKS);

  // K1: «x von y genutzt» with the real numbers, a bar in every card
  const prog = page.locator('[data-block="progress"]');
  await expect(prog).toContainText(new RegExp(T('{n} of {total} used', { n: '\\d+', total: '\\d+' })));
  // the same total as the head line «91 Funktionen · du nutzt 15»
  const head = await page.locator('.vhead .vsub').textContent();
  const [total, usedN] = head.match(/\d+/g).map(Number);
  await expect(prog).toContainText(T('{n} of {total} used', { n: usedN, total }));
  for (const g of await page.locator('section[data-group]').all()) {
    await expect(g.locator('.fgn')).toContainText(new RegExp(T('{n} of {total} used', { n: '\\d+', total: '\\d+' })));
    await expect(g.locator('.bar')).toHaveCount(1);
  }

  // K3: a trip on the way, chain care due, a trip waiting for its debrief
  const fit = page.getByRole('region', { name: T('Fits right now') });
  await expect(fit.locator('[data-fit]')).toHaveCount(3);
  await expect(fit.locator('[data-fit="trip"]')).toContainText(T('Check the packing list'));
  await expect(fit.locator('[data-fit="chain"]')).toContainText(T('Care for the chain'));
  await expect(fit.locator('[data-fit="rate"]')).toContainText(T('Rate|tip'));

  // K2: the five most used since the start, with rank and count; a tap takes you there
  const top = page.getByRole('region', { name: T('Your top 5') });
  await expect(top.locator('[data-top]')).toHaveCount(5);
  expect(await top.locator('[data-top]').evaluateAll((els) => els.map((e) => e.dataset.top))).toEqual(TOP);
  await expect(top.locator('[data-top="gpx"]')).toContainText(T('{n} times|top', { n: 41 }));
  await expect(top).toContainText(T('what you use most since the start · tap to go there'));

  // K6 replaces «Neu für dich»: what came since the previous opening of the app (2 Oct, 0.124)
  await expect(page.getByRole('region', { name: T('New for you') })).toHaveCount(0);
  await expect(page.locator('.ftip')).toHaveCount(0);
  const news = page.getByRole('region', { name: T('New since your last visit') });
  await expect(news.locator('[data-new="f.tripstate"]')).toBeVisible();
  await expect(news).toContainText(T('since {date}', { date: '2. Okt.' }));
  await expect(news.locator('[data-new="gpx"]')).toHaveCount(0);

  if (info.project.name === 'phone') {
    for (const b of await page.locator('main [data-fit] .btn, main .ftopb, main [data-new] button').all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(44);
  }
  await shot(page, info, 'SN6p-funktionen');
  await fits(page, info);

  // a search hides K6, the cards show the hits
  await page.getByLabel(T('Find a function')).fill('garantie');
  await expect(news).toHaveCount(0);
  await page.getByLabel(T('Find a function')).fill('');

  // a top 5 tap counts once more and takes you there
  await top.locator('[data-top="f.plan"] button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test('SN6+ «So geht\'s» opens with three steps in the «…» of a function', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context);
  await page.goto('./#/features');
  await page.getByLabel(T('Find a function')).fill('gpx');
  const row = page.locator('[data-feature="gpx"]');
  await row.getByRole('button', { name: T('More for {title}', { title: T('Load a route (GPX)') }) }).click();
  const how = page.getByRole('region', { name: T('How it works') });
  await expect(how).toBeVisible();
  await expect(how.locator('li')).toHaveCount(3);
  for (const [i, s] of HOWTO.gpx.entries()) await expect(how.locator('li').nth(i)).toHaveText(T(s));
  await expect(how).toContainText(T('{n} steps', { n: 3 }));
  // phone: in the sheet from the bottom; computer: in the list under «…»
  if (info.project.name === 'phone') await expect(page.locator('dialog.ma-sheet .ma-how')).toBeVisible();
  else await expect(page.locator('.ma-list .ma-how')).toBeVisible();
  // «Hinbringen» stays under it
  await expect(page.getByRole('menuitem', { name: new RegExp(T('Take me there')) })).toBeVisible();
  await shot(page, info, 'SN6p-so-gehts');
  await fits(page, info);
  await page.keyboard.press('Escape');
  await expect(how).toBeHidden();
  expect(errors).toEqual([]);
});

test('SN6+ without data: one quiet line in Passt gerade, Top 5 and Neu seit deinem letzten Besuch', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await start(page, context, { data: false });
  // the playground counts as tried (raw write, then a reload)
  await page.evaluate(
    () =>
      new Promise((ok, no) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = no;
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put({ key: 'tips', value: { tapped: { 'f.playground': '2026-10-09' } } });
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = no;
        };
      }),
  );
  await page.goto('./#/features');
  await page.reload();
  await ready(page);
  const fit = page.getByRole('region', { name: T('Fits right now') });
  await expect(fit.locator('[data-fit]')).toHaveCount(0);
  await expect(fit.getByRole('status')).toHaveText(T('Nothing fits right now. A trip coming up, chain care or a debrief brings a tip here.'));
  const top = page.getByRole('region', { name: T('Your top 5') });
  await expect(top.locator('[data-top]')).toHaveCount(0);
  await expect(top.getByRole('status')).toHaveText(T('After a few days your most used functions stand here.'));
  const news = page.getByRole('region', { name: T('New since your last visit') });
  await expect(news.locator('[data-new]')).toHaveCount(0);
  await expect(news.getByRole('status')).toHaveText(T('Nothing new has come since your last visit.'));
  await expect(page.locator('[data-block="progress"] .more')).toHaveCount(0);
  await shot(page, info, 'SN6p-leer');
  await fits(page, info);
  expect(errors).toEqual([]);
});
