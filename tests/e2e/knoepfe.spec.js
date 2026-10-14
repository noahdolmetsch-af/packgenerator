// v0.117.0 «Knöpfe neu» (mockups N1–N4, Noah 12.10.2026 22:47 «n1-n4 freigeben», answers 1a 2a 3a 4a 5b):
// - every button explains itself: a bubble on hover and keyboard focus (computer), on a long press
//   (phone) without running the button;
// - a row's actions: one main button + «…»; right-aligned on a computer (same right edge, main button
//   at least 128 px), under the text and as wide as the card on a phone; no sideways scroll at 390/320;
// - «…» lists every other action with a title and a one-line explanation (a sheet on the phone);
// - «Erledigt» in Velopflege says what was saved, with «Rückgängig» that takes it back.
// Fictional data only (test_data_gtp_ names), built from tests/e2e/pf-fixture.json like care-accordion.
// KNOEPFE_SHOTS=<folder> saves screenshots (never into the repo).
import { test, expect } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { openData, settle } from './settle.js';
import DE from '../../src/lib/i18n/de/index.js';
import { EXPLAIN } from '../../src/lib/ui/explaintexts.js';

const P = 'test_data_gtp_';
const RAW = readFileSync(fileURLToPath(new URL('./pf-fixture.json', import.meta.url)), 'utf8');
const day = (n = 0) => ((d) => (d.setUTCDate(d.getUTCDate() + n), d.toISOString().slice(0, 10)))(new Date(`${new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' })}T12:00:00Z`));
const SPARK = `${P}spark`;
const de = (k) => DE[k] ?? k.replace(/\|[a-z]+$/, '');
const DONE = de('Done|task');
const DONE_WHY = de(EXPLAIN['Done|task']);

function fixtureFile(info) {
  const fix = JSON.parse(RAW.replace(/"@([+-]\d+)"/g, (m, n) => `"${day(Number(n))}"`));
  const spark = fix.tables.bikes.find((b) => b.id === SPARK);
  const e = (n, km, over) => ({ date: day(n), km, value: null, action: 'check', result: 'ok', by: 'self', model: null, note: '', ...over });
  spark.tyreSetup = { front: 'tubeless', rear: 'tubeless' };
  spark.parts = [
    { key: 'chain', model: 'Shimano XT', history: [e(-30, 4700, { action: 'service', result: 'done' }), e(-9, 4950, { value: 0.4 })] },
    { key: 'padsF', model: '', history: [e(-9, 4950, { value: 55 })] },
    { key: 'tyres', model: 'Maxxis Rekon', history: [e(-120, 4300, { action: 'service', result: 'done', sealantMl: 60 })] },
    { key: 'shifting', model: '', history: [e(-60, 4600, { result: 'needed', note: `${P} springt im 3. Gang` })] },
  ];
  const path = info.outputPath('knoepfe-fixture.json');
  writeFileSync(path, JSON.stringify(fix));
  return path;
}

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel('Backup importieren').setInputFiles(fixtureFile(info));
  await data.getByRole('button', { name: 'Alle Daten ersetzen' }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert.*alle Daten ersetzt/i)).toBeVisible();
  return errors;
}

const stored = (page, id) =>
  page.evaluate(
    (id) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('pack-generator');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction('bikes').objectStore('bikes').get(id);
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
    id,
  );
const entries = async (page) => (await stored(page, SPARK)).parts.reduce((n, p) => n + (p.history?.length ?? 0), 0);
const noSideways = async (page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize().width);
const shot = async (page, info, name) => {
  if (process.env.KNOEPFE_SHOTS) await page.screenshot({ path: `${process.env.KNOEPFE_SHOTS}/${name}-${info.project.name}.png` });
};

/** The «Due now» rows of Velopflege and the first one with «Erledigt». */
async function overview(page) {
  await page.goto('./#/bikes?tab=care');
  const rows = page.locator('li.dcard');
  await expect(rows.first()).toBeVisible();
  const doneRow = rows.filter({ has: page.getByRole('button', { name: DONE, exact: true }) }).first();
  await expect(doneRow).toBeVisible();
  return { rows, doneRow, done: doneRow.getByRole('button', { name: DONE, exact: true }) };
}

/** A finger held on an element for `ms` (Chromium touch events through CDP). */
async function longPress(page, locator, ms = 700) {
  const box = await locator.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('computer: the bubble on hover and keyboard focus; actions right-aligned; the more menu with explanations', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'desktop', 'mouse and keyboard');
  const errors = await start(page, context, info);
  const { rows, doneRow, done } = await overview(page);
  const tip = page.locator('.xtip.on');

  // hover: the explanation with the row's context (N1)
  await done.hover();
  await expect(tip).toBeVisible();
  await expect(tip.locator('b')).toHaveText(DONE_WHY);
  await expect(tip.locator('small')).toContainText(new RegExp(`${de('today|done')} · [\\d’]+ km`));
  expect(await done.getAttribute('aria-describedby')).toBe('xtip-bubble');
  await shot(page, info, 'n1-tooltip');
  await page.mouse.move(5, 5);
  await expect(tip).toHaveCount(0);

  // keyboard: Tab onto «Erledigt» shows it too, Escape hides it
  const n = await rows.evaluateAll((els, done) => els.findIndex((el) => [...el.querySelectorAll('button')].some((b) => b.textContent.trim() === done)), DONE);
  // SK (13.10.2026, changed on purpose): a due row has its «Woanders» links under it, so the control
  // right before «Erledigt» is the last one of the row above (or its links), not always its «…»
  if (n > 0) await done.evaluate((b) => { const all = [...document.querySelectorAll('a[href], button:not([disabled])')].filter((x) => x.getClientRects().length); all[all.indexOf(b) - 1].focus(); });
  else await page.locator('#due-h').evaluate((h) => (h.tabIndex = -1, h.focus()));
  await page.keyboard.press('Tab');
  await expect(done).toBeFocused();
  await expect(tip).toBeVisible();
  await expect(tip.locator('b')).toHaveText(DONE_WHY);
  await page.keyboard.press('Escape');
  await expect(tip).toHaveCount(0);

  // a button with only a symbol explains itself with its name (N3 rule 5)
  const more = doneRow.locator('.btn.dots');
  await more.hover();
  await expect(tip.locator('b')).toHaveText(await more.getAttribute('aria-label'));
  await page.mouse.move(5, 5);

  // every row ends at the same right edge, the main button at least 128 px, labels on one line
  const boxes = await rows.locator('.rowacts').evaluateAll((els) => els.map((el) => el.getBoundingClientRect().right));
  expect(Math.max(...boxes) - Math.min(...boxes)).toBeLessThanOrEqual(1);
  for (const b of await rows.locator('.rowacts > .btn.k').all()) {
    const r = await b.boundingBox();
    expect(r.width).toBeGreaterThanOrEqual(127.5);
    expect(r.height).toBeGreaterThanOrEqual(43.5);
    expect(r.height).toBeLessThanOrEqual(46);
  }
  for (const b of await rows.locator('.btn.dots').all()) {
    const r = await b.boundingBox();
    expect(Math.round(r.width)).toBe(44);
  }

  // «…»: every other action with a title and a one-line explanation (N2); Escape closes, focus back
  await more.click();
  const menu = doneRow.getByRole('menu');
  await expect(menu).toBeVisible();
  const items = menu.getByRole('menuitem');
  expect(await items.count()).toBeGreaterThanOrEqual(2);
  for (const it of await items.all()) {
    await expect(it.locator('b')).not.toBeEmpty();
    await expect(it.locator('small')).not.toBeEmpty();
  }
  await expect(items.first()).toContainText(DONE);
  await expect(items.first()).toContainText(DONE_WHY);
  await shot(page, info, 'n2-menu');
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(more).toBeFocused();
  // a click elsewhere closes it too
  await more.click();
  await expect(menu).toBeVisible();
  await page.locator('h1').click();
  await expect(menu).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Done says what was saved, and Undo takes it back', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  const { done } = await overview(page);
  const before = await entries(page);
  await done.click();
  const notice = page.locator('p.notice[role="status"]');
  await expect(notice).toContainText('Gespeichert:');
  await expect.poll(() => entries(page)).toBe(before + 1);
  const undo = notice.getByRole('button', { name: de('Undo') });
  await expect(undo).toBeVisible();
  await shot(page, info, 'n2-confirm');
  await undo.click();
  await expect(notice).toHaveCount(0);
  await expect.poll(() => entries(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('phone: actions under the text, full width; long press explains and does not run; the more menu as a sheet', async ({ page, context }, info) => {
  test.skip(info.project.name !== 'phone', 'the phone layout and touch');
  const errors = await start(page, context, info);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const { rows, doneRow } = await overview(page);
    await noSideways(page);
    for (let i = 0; i < (await rows.count()); i++) {
      const row = rows.nth(i);
      const text = await row.locator('.m').boundingBox();
      const acts = await row.locator('.rowacts').boundingBox();
      const card = await row.boundingBox();
      // under the text, from the row's left to its right edge
      expect(acts.y).toBeGreaterThanOrEqual(text.y + text.height - 1);
      expect(Math.abs(acts.x - card.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(acts.x + acts.width - (card.x + card.width))).toBeLessThanOrEqual(1);
      const main = await row.locator('.rowacts > .btn.k').boundingBox();
      const more = await row.locator('.btn.dots').boundingBox();
      expect(Math.round(more.width)).toBe(44);
      expect(main.width).toBeGreaterThan(acts.width - 44 - 8 - 2);
      expect(main.height).toBeGreaterThanOrEqual(43.5);
    }
    expect(await doneRow.locator('.rowacts > .btn.k').evaluate((el) => getComputedStyle(el).whiteSpace)).toBe('nowrap');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const { doneRow, done } = await overview(page);

  // a long press shows the explanation and does not save anything
  const before = await entries(page);
  await longPress(page, done);
  const tip = page.locator('.xtip.on');
  await expect(tip).toBeVisible();
  await expect(tip.locator('b')).toHaveText(DONE_WHY);
  await shot(page, info, 'n1-longpress');
  await page.waitForTimeout(600);
  expect(await entries(page)).toBe(before);
  await expect(page.locator('p.notice')).toHaveCount(0);
  // a normal tap still works
  await done.tap();
  await expect.poll(() => entries(page)).toBe(before + 1);
  await expect(page.locator('p.notice').getByRole('button', { name: de('Undo') })).toBeVisible();

  // «…» opens a sheet from the bottom with the explanations
  const row = page.locator('li.dcard').first();
  await row.locator('.btn.dots').tap();
  const sheet = page.locator('dialog.ma-sheet[open]');
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  expect(Math.round(box.x)).toBe(0);
  expect(Math.round(box.x + box.width)).toBe(390);
  expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(843);
  for (const it of await sheet.getByRole('menuitem').all()) await expect(it.locator('small')).not.toBeEmpty();
  await shot(page, info, 'n2-sheet');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  await noSideways(page);
  expect(errors).toEqual([]);
  void doneRow;
});
