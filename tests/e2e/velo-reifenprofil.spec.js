// «Reifenprofil als Verschleiss» (Paket C idea 16, Noah 03.11.2026 «b»): the page «Wear» draws the tread of the tyres; the
// more km, the lower the blocks. Fictional data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle, ready } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));

/** Gives every bike km and tyres mounted at 0 km, then reloads. */
async function tyresAt(page, km) {
  await page.evaluate(
    (km) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const tx = r.result.transaction('bikes', 'readwrite');
          const st = tx.objectStore('bikes');
          const all = st.getAll();
          all.onsuccess = () => all.result.forEach((b) => st.put({ ...b, km, kmDate: '2026-01-01', parts: [{ key: 'tyres', model: 'test_data_gtp_ Reifen', history: [{ date: '2025-01-01', km: 0, action: 'replace', result: 'done' }] }] }));
          tx.oncomplete = ok;
          tx.onerror = fail;
        };
      }),
    km,
  );
  await page.reload();
  await ready(page);
}

test('Wear: the tread of the tyres gets lower with the km', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await importAndSettle(page, fixture);

  const left = async () => {
    await page.goto('./#/bikes?tab=care&view=wear&bike=bike-test');
    const t = page.locator('[data-wear="tyres"] [data-tread]');
    await expect(t).toBeVisible();
    return Number(await t.getAttribute('data-tread'));
  };

  await tyresAt(page, 400); // 10 % of 4000 km
  const fresh = await left();
  await tyresAt(page, 3000); // 75 %
  const worn = await left();
  expect(fresh).toBeGreaterThan(worn);
  expect(fresh).toBeGreaterThanOrEqual(85);
  expect(worn).toBeLessThanOrEqual(30);

  // the drawing has a text alternative and nothing runs over the edge
  await expect(page.locator('[data-wear="tyres"] svg.tread')).toHaveAttribute('aria-label', /25|Profil|Tread/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
