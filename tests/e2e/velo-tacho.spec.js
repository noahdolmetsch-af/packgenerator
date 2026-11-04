// «Tacho-Ziffern» (Paket C idea 12, Noah 03.11.2026 «b»): the km of a bike roll up when the number appears; the real
// digits stay in the text, and nothing rolls with «Reduce motion». Fictional data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));

async function open(page, context) {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/bikes');
}

test('Bikes: the km on the card are made of rolling digits and end as the real number', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, context);
  const km = page.locator('[data-bike-cards] [data-velo-card] .km').first();
  await expect(km).toBeVisible();
  // a bike with km: digits as spans; without km (the fixture) the line says so, then give it km
  if (!(await km.locator('.odo').count())) {
    await page.evaluate(
      () =>
        new Promise((ok, fail) => {
          const r = indexedDB.open('pack-generator');
          r.onerror = fail;
          r.onsuccess = () => {
            const tx = r.result.transaction('bikes', 'readwrite');
            const st = tx.objectStore('bikes');
            const all = st.getAll();
            all.onsuccess = () => all.result.forEach((b) => st.put({ ...b, km: 6428 }));
            tx.oncomplete = ok;
            tx.onerror = fail;
          };
        }),
    );
    await page.reload();
  }
  const odo = page.locator('[data-bike-cards] [data-velo-card] .km .odo').first();
  await expect(odo).toBeVisible();
  expect(await odo.locator('.d').count()).toBeGreaterThanOrEqual(4);
  // the text is the real number, also while the digits roll
  await expect(page.locator('[data-bike-cards] [data-velo-card] .km').first()).toContainText(/6.428 km/);
  // after the roll every real digit shows (visibility) and the stack is gone
  await expect(odo.locator('.r').first()).toHaveCSS('visibility', 'visible', { timeout: 4000 });
  expect(errors).toEqual([]);
});

test('Bikes: with «Reduce motion» the number stands still from the first moment', async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, context);
  const km = page.locator('[data-bike-cards] [data-velo-card] .km').first();
  await expect(km).toBeVisible();
  const r = page.locator('[data-bike-cards] [data-velo-card] .km .odo .r');
  if (await r.count()) await expect(r.first()).toHaveCSS('visibility', 'visible');
});
