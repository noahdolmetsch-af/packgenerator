// Klick-Rundgang H33 (parked until Noah's OK): a trip with an empty packing list offers
// «Beispiel-Liste übernehmen». One tap fills the list from a template of the same area, Undo empties it
// again. Fictional fixture (test_data_gtp_), German, phone + desktop.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { openData, settle } from './settle.js';

const FIX = fileURLToPath(new URL('./templates-fixture.json', import.meta.url));
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};

/** One trip, read straight from IndexedDB. */
const tripRow = (page, id) =>
  page.evaluate((key) => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const q = r.result.transaction('trips').objectStore('trips').get(key);
      q.onsuccess = () => { r.result.close(); ok(q.result); };
    };
  }), id);

test('an empty list takes over a template list in one tap, with Undo', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.clock.setFixedTime(new Date('2026-10-09T10:00:00+02:00'));
  await page.goto('./');
  const data = await openData(page);
  await data.getByLabel(T('Import backup')).setInputFiles(FIX);
  await data.getByRole('button', { name: T('Replace all data') }).press('Enter');
  await settle(page);
  await expect(data.getByText(/importiert/)).toBeVisible();

  // A new trip without gear: empty its list and open it.
  await page.evaluate(() => new Promise((ok) => {
    const r = indexedDB.open('pack-generator');
    r.onsuccess = () => {
      const st = r.result.transaction('trips', 'readwrite').objectStore('trips');
      const q = st.get('gtp-tessin');
      q.onsuccess = () => {
        st.put({ ...q.result, entries: [], templateId: null });
        st.transaction.oncomplete = () => { r.result.close(); ok(); };
      };
    };
  }));
  await page.evaluate(() => localStorage.setItem('pack.currentTrip', 'gtp-tessin'));
  await page.goto('./#/pack');
  await page.reload(); // Dexie's cache did not see the raw write

  const empty = page.locator('section.empty-list');
  await expect(empty).toBeVisible();
  const use = empty.getByRole('button', { name: T('Use example list') });
  await expect(use).toBeVisible();
  await use.click();

  // The list comes from the first bikepacking template, the trip keeps its own name.
  await expect.poll(async () => (await tripRow(page, 'gtp-tessin')).entries.length).toBeGreaterThan(0);
  const filled = await tripRow(page, 'gtp-tessin');
  expect(filled.title).toBe('test_data_gtp_ Herbsttour Tessin');
  expect(filled.templateId).toBeNull();
  await expect(empty).toBeHidden();
  const toast = page.locator('.rtoast');
  await expect(toast).toContainText(T('List of «{name}» taken over.', { name: 'test_data_gtp_ Feierabendrunde' }));

  // Undo: the list is empty again and the button is back.
  await toast.getByRole('button', { name: T('Undo') }).click();
  await expect.poll(async () => (await tripRow(page, 'gtp-tessin')).entries.length).toBe(0);
  await expect(use).toBeVisible();
  expect(errors).toEqual([]);
});
