// P3b Teil 2 «Bedienregeln» (Noah 15.10.2026), on a phone and a computer, in German. Fictional data only
// (tests/e2e/v048-fixture.js).
// Ü3a: «Ich» shows the number of notes in the Inbox. I2a: Darstellung has the full path «‹ Ich › Darstellung».
// T1a: a new trip is kept as soon as something is chosen, also when the window is closed.
// Ü1a: «g m» opens the Material tab opened last (computer). Ü2a: on a phone a window comes from below.
import { test, expect } from './clock.js';
import DE from '../../src/lib/i18n/de/index.js';
import { v048File } from './v048-fixture.js';
import { openData, settle } from './settle.js';

const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

async function start(page, context, info) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => {
    if (!localStorage.getItem('lang')) localStorage.setItem('lang', 'de');
    if (!localStorage.getItem('whatsnew.seen')) localStorage.setItem('whatsnew.seen', '9.9.9');
  });
  page.on('dialog', (d) => d.accept());
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(v048File(info));
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  return errors;
}

test('Ich shows the Inbox number; Darstellung has the full path', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/');
  const me = page.getByRole('link', { name: T('Me, Inbox: {n} to sort', { n: 4 }) }).filter({ visible: true }).first();
  await expect(me).toBeVisible();
  await expect(me.locator('[data-inbox-count]')).toHaveText('4');
  await page.goto('./#/me/look');
  const path = page.locator('main').getByRole('navigation', { name: T('Path') });
  await expect(path.getByRole('link', { name: T('Me|place') })).toBeVisible();
  await expect(path).toContainText(T('Appearance'));
  expect(errors).toEqual([]);
});

test('a new trip is kept as soon as something is chosen', async ({ page, context }, info) => {
  const errors = await start(page, context, info);
  await page.goto('./#/');
  const before = await page.evaluate(async () => (await new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const tx = r.result.transaction('trips'); const q = tx.objectStore('trips').count(); q.onsuccess = () => ok(q.result); }; })));
  await page.getByRole('button', { name: T('New'), exact: true }).filter({ visible: true }).click();
  await page.getByRole('dialog', { name: T('New') }).getByRole('button', { name: T('Plan a trip') }).click();
  const dlg = page.getByRole('dialog', { name: T('Conditions|newtrip') });
  await expect(dlg).toBeVisible();
  if (info.project.name === 'phone') {
    // Ü2a: the window sits at the bottom of the screen
    const box = await dlg.boundingBox();
    expect(Math.round(box.y + box.height)).toBeGreaterThanOrEqual(page.viewportSize().height - 2);
  }
  await dlg.getByRole('button', { name: T('2 days'), exact: true }).click();
  await expect(dlg.getByRole('status').filter({ hasText: T('Draft saved') })).toBeVisible();
  await expect(dlg.getByRole('button', { name: T('Discard') })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  const after = await page.evaluate(async () => (await new Promise((ok) => { const r = indexedDB.open('pack-generator'); r.onsuccess = () => { const tx = r.result.transaction('trips'); const q = tx.objectStore('trips').count(); q.onsuccess = () => ok(q.result); }; })));
  expect(after).toBe(before + 1);
  expect(errors).toEqual([]);
});

test('g and a letter open the tab opened last there', async ({ page, context }, info) => {
  test.skip(info.project.name === 'phone', 'keyboard shortcuts are for a computer');
  const errors = await start(page, context, info);
  await page.goto('./#/wardrobe');
  await expect(page.locator('main h1')).toBeVisible();
  await page.goto('./#/');
  await expect(page.locator('main')).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.keyboard.press('g');
  await page.keyboard.press('m');
  await expect(page).toHaveURL(/#\/wardrobe$/);
  expect(errors).toEqual([]);
});
