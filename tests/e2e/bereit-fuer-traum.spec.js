// «Bereit für den Traum?» (Träume und Neuland N16, Noah 27.10.2026 «1-5 a»): in a dream's window, what your
// (fictional) rides already show and what is still missing; with sleeping gear the ring fills; one day hides
// the lines for several days. Fictional data only, no real network.
import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import DE from '../../src/lib/i18n/de/index.js';
import { ready } from './settle.js';

const P = 'test_data_gtp_';
const T = (en, vars) => {
  const text = DE[en] ?? en.replace(/\|[a-z ]+$/, '');
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m) : text;
};
const base = JSON.parse(readFileSync(fileURLToPath(new URL('./fixture.json', import.meta.url)), 'utf8'));
const SLEEP = base.tables.items.find((i) => i.category === 'sleep');
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Zurich' });
const dayBefore = (n) => ((d) => (d.setUTCDate(d.getUTCDate() - n), d.toISOString().slice(0, 10)))(new Date(`${today()}T12:00:00Z`));
const SHOTS = process.env.SHOTS_DIR ?? null;
const shot = async (loc, info, name) => {
  if (!SHOTS) return;
  mkdirSync(SHOTS, { recursive: true });
  await loc.screenshot({ path: `${SHOTS}/${name}-${info.project.name === 'phone' ? '390' : '1440'}.png` });
};

async function put(page, store, rows) {
  await page.evaluate(
    ([name, list]) =>
      new Promise((ok, bad) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => bad(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction(name, 'readwrite');
          for (const row of list) tx.objectStore(name).put(row);
          tx.oncomplete = () => (r.result.close(), ok());
          tx.onerror = () => bad(tx.error);
        };
      }),
    [store, rows],
  );
}

test('Ready for the dream: what the rides show, what is missing, sleeping gear, one day', async ({ page, context }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await context.route(/^https?:\/\/(?!localhost[:/])/, (r) => r.abort());
  await context.addInitScript(() => localStorage.setItem('lang', 'de'));
  await page.goto('./#/trips/dreams');
  await ready(page);
  await put(page, 'settings', [{ key: 'dreams', value: { dreams: [{ id: `${P}d1`, title: `${P}Drei Alpenpässe`, kind: 'alps', days: 3, facts: { km: 360, gainM: 6000 } }] } }]);
  await put(page, 'activities', [
    { id: '9201', day: dayBefore(30), type: 'Ride', name: `${P}Lange Runde`, km: 110, hm: 1200 },
    { id: '9202', day: dayBefore(29), type: 'GravelRide', name: `${P}Schotter`, km: 95, hm: 1500 },
  ]);
  await page.reload();
  await ready(page);

  await page.locator('[data-dream]').filter({ hasText: `${P}Drei Alpenpässe` }).locator('button.open').click();
  const sheet = page.locator('dialog.dsheet[open]');
  const box = sheet.locator('[data-dream-ready]');
  await expect(box).toContainText(T('Ready for it?'));
  // 110 km of 120 a day: ready; 1500 of 2000 m: 500 missing; 2 days in a row of 3; no sleeping gear yet
  await expect(box.locator('[data-ready="km"]')).toHaveAttribute('data-ok', 'true');
  await expect(box.locator('[data-ready="km"]')).toContainText(T('Longest ride in 12 months: {km} km', { km: '110' }));
  await expect(box.locator('[data-ready="gain"]')).toHaveAttribute('data-ok', 'false');
  await expect(box.locator('[data-ready="gain"]')).toContainText(T('{m} m still missing', { m: '500' }));
  await expect(box.locator('[data-ready="days"]')).toContainText(T('Most days in a row: {n}', { n: 2 }));
  await expect(box.locator('[data-ready="sleep"]')).toHaveAttribute('data-ok', 'false');
  await box.scrollIntoViewIfNeeded();
  await shot(box, info, 'BT1-bereit');
  expect(await page.evaluate(() => document.querySelector('dialog.dsheet[open]').scrollWidth <= document.querySelector('dialog.dsheet[open]').clientWidth)).toBe(true);

  // sleeping gear in the gear list fills the ring
  await put(page, 'items', [{ ...SLEEP, id: `${P}schlafsack`, name: `${P}Schlafsack` }]);
  await page.reload();
  await ready(page);
  await page.locator('[data-dream]').filter({ hasText: `${P}Drei Alpenpässe` }).locator('button.open').click();
  await expect(box.locator('[data-ready="sleep"]')).toHaveAttribute('data-ok', 'true');

  // one day: the lines for several days go away
  await sheet.getByRole('spinbutton', { name: T('Days') }).fill('1');
  await expect(box.locator('[data-ready="days"]')).toHaveCount(0);
  await expect(box.locator('[data-ready="sleep"]')).toHaveCount(0);
  await expect(box.locator('[data-ready="km"]')).toContainText(T('needs about {km} km a day', { km: "360" }));
  expect(errors).toEqual([]);
});
