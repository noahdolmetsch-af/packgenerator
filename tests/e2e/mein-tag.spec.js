// «Mein Tag» (Noah 23.11.2026), step 1: one day as a timeline that only reads. Own dates and to-dos of a day with and
// without a time, the day chips, the way to the page from Woche, German texts, no sideways scroll, no page errors.
// Fictional data only; the browser runs in Europe/Zurich.
import { test, expect } from '@playwright/test';
import DE from '../../src/lib/i18n/de/index.js';

const T = (en) => DE[en] ?? en.replace(/\|[a-z]+$/, '');
const TODAY = '2026-10-13'; // a Tuesday
const D0 = `${TODAY}T09:00:00+02:00`;
const addDays = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

async function open(page, context, hash) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.install({ time: new Date(D0) });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`./${hash}`);
  return errors;
}
const put = (page, rows) =>
  page.evaluate(async (rows) => {
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('pack-generator');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    await new Promise((res, rej) => {
      const tx = db.transaction(Object.keys(rows), 'readwrite');
      for (const [t, list] of Object.entries(rows)) for (const x of list) tx.objectStore(t).put(x);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
    db.close();
  }, rows);

const ITEMS = [
  { id: 'wi1', kind: 'date', title: 'Zahnarzt', day: TODAY, time: '12:00', mins: 45 },
  { id: 'wi2', kind: 'todo', title: 'Einkaufen', day: TODAY, time: '17:30', mins: 30 },
  { id: 'wi3', kind: 'todo', title: 'Garage anrufen', day: TODAY, time: '' },
  { id: 'wi4', kind: 'date', title: 'Abendessen', day: addDays(TODAY, 1), time: '19:00', mins: 90 },
];

test('Mein Tag: the day as a timeline, with and without a time', async ({ page, context }) => {
  const errors = await open(page, context, '#/day');
  await page.waitForSelector('h1');
  await put(page, { settings: [{ key: 'week.items', value: ITEMS }] });
  await page.reload();
  await expect(page.locator('h1')).toHaveText(T('My day'));
  await expect(page.locator('[data-entry="wi1"]')).toContainText('Zahnarzt');
  await expect(page.locator('[data-entry="wi1"]')).toContainText('12:00–12:45');
  await expect(page.locator('[data-entry="wi2"]')).toContainText('17:30');
  // without a time: above the timeline, not in it
  await expect(page.locator('.untimed')).toContainText('Garage anrufen');
  await expect(page.locator('.untimed')).toContainText(T('Without a time'));
  await expect(page.locator('.tl [data-entry="wi3"]')).toHaveCount(0);
  // the order of the day: dentist above shopping
  const a = await page.locator('[data-entry="wi1"]').boundingBox();
  const b = await page.locator('[data-entry="wi2"]').boundingBox();
  expect(a.y).toBeLessThan(b.y);
  // the day is today, said in words
  await expect(page.locator('.line')).toContainText(T('Today|day'));
  const w = page.viewportSize().width;
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(w);
  expect(errors).toEqual([]);
});

test('Mein Tag: another day through the chips, back to today', async ({ page, context }) => {
  const errors = await open(page, context, '#/day');
  await page.waitForSelector('h1');
  await put(page, { settings: [{ key: 'week.items', value: ITEMS }] });
  await page.reload();
  await page.locator(`a.chip[href="#/day/${addDays(TODAY, 1)}"]`).click();
  await expect(page.locator('[data-entry="wi4"]')).toContainText('Abendessen');
  await expect(page.locator('.line')).toContainText(T('Tomorrow|day'));
  await expect(page.locator('[data-entry="wi1"]')).toHaveCount(0);
  await page.locator('.today-link').click();
  await expect(page.locator('[data-entry="wi1"]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Mein Tag: an empty day says why and where to plan', async ({ page, context }) => {
  const errors = await open(page, context, `#/day/${addDays(TODAY, 3)}`);
  await expect(page.locator('h1')).toHaveText(T('My day'));
  await expect(page.getByText(T('Nothing planned on this day'))).toBeVisible();
  await expect(page.getByRole('link', { name: T('Open Woche') })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Mein Tag: the chip stands next to Woche', async ({ page, context }) => {
  const errors = await open(page, context, '#/week');
  await page.waitForSelector('h1');
  await page.locator('a[href="#/day"]').first().click();
  await expect(page.locator('h1')).toHaveText(T('My day'));
  expect(errors).toEqual([]);
});

test('Mein Tag: add, change and delete an own entry (with Undo)', async ({ page, context }) => {
  const errors = await open(page, context, '#/day');
  await page.waitForSelector('h1');
  await put(page, { settings: [{ key: 'week.items', value: ITEMS }] });
  await page.reload();
  await expect(page.locator('[data-entry="wi1"]')).toContainText('Zahnarzt');
  // add
  await page.locator('[data-add-entry]').click();
  const sheet = page.locator('[data-entry-sheet]');
  await expect(sheet).toBeVisible();
  await sheet.locator('#es-title').fill('Bibliothek');
  await sheet.locator('#es-time').fill('14:00');
  await sheet.locator('#es-mins').fill('60');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('.tl')).toContainText('Bibliothek');
  await expect(page.locator('.tl')).toContainText('14:00–15:00');
  // change: a tap on an own entry opens the window instead of leaving the page
  await page.locator('[data-entry="wi1"]').click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator('#es-title')).toHaveValue('Zahnarzt');
  await sheet.locator('#es-time').fill('13:30');
  await sheet.getByRole('button', { name: T('Save') }).click();
  await expect(page.locator('[data-entry="wi1"]')).toContainText('13:30–14:15');
  // delete with Undo
  await page.locator('[data-entry="wi1"]').click();
  await sheet.getByRole('button', { name: T('Delete') }).click();
  await expect(page.locator('[data-entry="wi1"]')).toHaveCount(0);
  await page.getByRole('button', { name: T('Undo') }).click();
  await expect(page.locator('[data-entry="wi1"]')).toContainText('Zahnarzt');
  expect(errors).toEqual([]);
});
