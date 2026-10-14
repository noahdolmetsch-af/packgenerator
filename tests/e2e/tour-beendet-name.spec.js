// 0.132.1 «Langer Name passt» (Noah 14.10.2026 18:41 UTC «BUG auf live version dringend»): on «Tour beendet» a
// trip name that is one long word (no spaces) ran out of the grey km box. Now it breaks inside the box, on a
// phone and a computer. Fictional fixture (test_data_gtp_), German.
import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const FIX = fileURLToPath(new URL('../fixtures/gesamttest/test_data_gtp_daten.json', import.meta.url));
const ENDED = 'test_data_gtp_trip24';
const LONG = 'Erfundene-Testtour/ohne/Leerschlaege/Morgen/Wetter/Skala/Temperatur,35Teile/3Notizen/4Taschen/';

test('Tour beendet: a long name without spaces stays inside the grey box', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.setFixedTime(new Date('2026-10-12T10:00:00+02:00'));
  await page.goto('./');
  await importAndSettle(page, FIX);
  // give the ended trip a long name straight in IndexedDB, then reload so the app reads it
  await page.evaluate(
    async ({ id, title }) => {
      const db = await new Promise((res, rej) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      await new Promise((res, rej) => {
        const tx = db.transaction('trips', 'readwrite');
        const store = tx.objectStore('trips');
        const g = store.get(id);
        g.onsuccess = () => store.put({ ...g.result, title });
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      db.close();
    },
    { id: ENDED, title: LONG },
  );
  await page.goto(`./#/trip/${ENDED}/ended`);
  await page.reload();
  const box = page.locator('main .tally');
  await expect(box.locator('small')).toContainText(LONG);
  const out = await box.evaluate((p) => {
    const b = p.getBoundingClientRect();
    const s = p.querySelector('small').getBoundingClientRect();
    return { left: Math.round(s.left - b.left), right: Math.round(b.right - s.right) };
  });
  expect(out.left, 'the name starts inside the box').toBeGreaterThanOrEqual(0);
  expect(out.right, 'the name ends inside the box').toBeGreaterThanOrEqual(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `qa/tour-beendet-name-${test.info().project.name}.png` });
  expect(errors).toEqual([]);
});
