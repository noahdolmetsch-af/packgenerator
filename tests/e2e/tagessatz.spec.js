// «Heute erholen» / «Welcher Berg ruft?» (Noah 24.11.2026 «1-5»): the sentence under the greeting on Today, from the answer of the day.
// Fictional days only (test_data_ts_); the clock stands on Friday 9 October 2026; German UI.
import { test, expect } from './clock.js';
import { TODAY, addDays } from './aktiv-fixture.js';
import { openHome, homeFixture } from './home0460-fixture.js';
import { settle } from './settle.js';

const P = 'test_data_ts_';

/** 40 normal days (HRV 46–49, sleep 7 h 30, resting pulse 50); `bad`: today HRV 26 and 3 h 55 sleep. Rides 12+ days ago, so the form is fresh. */
function rows(bad) {
  const healthDays = [];
  for (let i = 0; i < 40; i++) {
    const date = addDays(TODAY, -i);
    const low = bad && i === 0;
    healthDays.push({ date, restingHr: 50 + (i % 2), hrvMs: low ? 26 : 46 + (i % 4), steps: 8000, sleep: { asleepMin: low ? 235 : 450 + (i % 3) * 5, deepMin: 70, remMin: 90, lightMin: 230, awakeMin: 25, start: '23:05', end: '06:55', efficiency: 90 }, src: 'google', at: `${date}T08:00:00Z` });
  }
  const act = (id, day) => ({
    id: `${P}${id}`, day, time: '07:10', start: `${day}T05:10:00Z`, name: `${P}${id}`, type: 'Ride', kind: 'bike', km: 40, hm: 400, movingS: 5400, elapsedS: 5700, gearId: null,
    hrAvg: 135, hrMax: 160, commute: false, trainer: false, wAvg: null, wMax: null, wDevice: false, spdAvg: null, spdMax: null, cad: 84, hist: { 120: 2700, 150: 2700 },
    tempAvg: 8, wNorm: null, kj: null, effort: 80, line: null, workout: null, prs: 0, achv: 0, elevHigh: null, elevLow: null, kcal: 900,
  });
  const activities = [];
  for (let i = 12; i < 70; i += 3) activities.push(act(`r${i}`, addDays(TODAY, -i)));
  return { healthDays, activities };
}

async function open(page, context, info, bad) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const data = homeFixture();
  Object.assign(data.tables, rows(false));
  await openHome(page, context, info, { data });
  await settle(page);
  if (bad) {
    // today: HRV 26 and 3 h 55 sleep (put straight into the database, then a new load)
    await page.evaluate((day) => new Promise((done, fail) => {
      const req = indexedDB.open('pack-generator');
      req.onerror = fail;
      req.onsuccess = () => {
        const tx = req.result.transaction('healthDays', 'readwrite');
        const store = tx.objectStore('healthDays');
        const get = store.get(day);
        get.onsuccess = () => store.put({ ...get.result, hrvMs: 26, sleep: { ...get.result.sleep, asleepMin: 235 } });
        tx.oncomplete = () => (req.result.close(), done());
        tx.onerror = () => fail(tx.error);
      };
    }), TODAY);
    await page.reload();
    await settle(page);
  }
  const close = page.locator('dialog[open]').getByRole('button', { name: /Schliessen|Close/ });
  if (await close.count()) await close.first().click();
  const ab = page.locator('[data-section="abfragen"]');
  if (await ab.isVisible().catch(() => false)) await ab.locator('[data-ab-later]').click();
  return errors;
}

test('Tagessatz: low HRV and a short night say rest, lead to Form, Not today puts it away for the day', async ({ page, context }, info) => {
  const errors = await open(page, context, info, true);
  const line = page.locator('[data-say-day]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toHaveAttribute('data-kind', 'rest');
  await expect(line).toContainText('Heute erholen');
  await expect(line.getByRole('link')).toHaveAttribute('href', '#/flow/form');
  // it stands right under the sentence about the day, before «Heute entdecken»
  const yLine = (await line.boundingBox()).y;
  const ySay = (await page.locator('[data-say]').boundingBox()).y;
  expect(yLine).toBeGreaterThan(ySay);
  await line.locator('[data-say-day-away]').click();
  await expect(line).toHaveCount(0);
  await page.reload();
  await settle(page);
  await page.waitForTimeout(2500);
  await expect(page.locator('[data-say-day]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Tagessatz: a fresh day without rain names the mountain that calls', async ({ page, context }, info) => {
  const errors = await open(page, context, info, false);
  const line = page.locator('[data-say-day]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toHaveAttribute('data-kind', 'berg');
  // the summit of the Gipfelbuch thread (name, height, km) once the list is loaded
  await expect(line).toContainText('steht noch nicht in deinem Gipfelbuch', { timeout: 20_000 });
  await expect(line).toContainText('Welcher Berg ruft');
  await expect(line.getByRole('link')).toHaveAttribute('href', '#/flow/gipfelbuch/karte');
  expect(errors).toEqual([]);
});

test('Tagessatz: without a home place the question leads to the summit book', async ({ page, context }, info) => {
  const errors = await open(page, context, info, false);
  await page.evaluate(() => new Promise((done, fail) => {
    const req = indexedDB.open('pack-generator');
    req.onerror = fail;
    req.onsuccess = () => {
      const tx = req.result.transaction('settings', 'readwrite');
      tx.objectStore('settings').delete('homePlace');
      tx.oncomplete = () => (req.result.close(), done());
      tx.onerror = () => fail(tx.error);
    };
  }));
  await page.reload();
  await settle(page);
  const close = page.locator('dialog[open]').getByRole('button', { name: /Schliessen|Close/ });
  if (await close.count()) await close.first().click();
  const line = page.locator('[data-say-day]');
  await expect(line).toBeVisible({ timeout: 20_000 });
  await expect(line).toContainText('welcher Berg ruft');
  await page.waitForTimeout(2500);
  await expect(line).not.toContainText('Gipfelbuch.');
  await expect(line.getByRole('link')).toHaveAttribute('href', '#/flow/gipfelbuch');
  expect(errors).toEqual([]);
});
