// «Velo-Geburtstag» (Paket C idea 21, Noah 03.11.2026 «b»): on the day a bike was bought years ago, Today congratulates
// with the km ridden together; «Hide» hides it for that year. Fictional data only.
import { test, expect } from './clock.js';
import { fileURLToPath } from 'node:url';
import { importAndSettle, ready } from './settle.js';

const fixture = fileURLToPath(new URL('./fixture.json', import.meta.url));
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(new Date());
const yearsBack = (n) => `${Number(today().slice(0, 4)) - n}${today().slice(4)}`;

async function setBought(page, bought) {
  await page.evaluate(
    (bought) =>
      new Promise((ok, fail) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = fail;
        r.onsuccess = () => {
          const tx = r.result.transaction('bikes', 'readwrite');
          const st = tx.objectStore('bikes');
          const all = st.getAll();
          all.onsuccess = () => all.result.forEach((b) => st.put({ ...b, bought, km: 6428 }));
          tx.oncomplete = ok;
          tx.onerror = fail;
        };
      }),
    bought,
  );
  await page.reload();
  await ready(page);
}

test('Today: the birthday of a bike shows with the km together and can be hidden', async ({ page, context }) => {
  await context.route(/^https?:\/\/(?!localhost[:/])/, (route) => route.abort());
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('./');
  await importAndSettle(page, fixture);
  await page.goto('./#/');
  await expect(page.locator('[data-section="bikes"]')).toBeVisible();

  // another day: nothing
  await setBought(page, yearsBack(2).replace(/-\d\d$/, (d) => (d === '-01' ? '-02' : '-01')));
  await expect(page.locator('[data-section="bikes"]')).toBeVisible();
  await expect(page.locator('[data-bike-birthday]')).toHaveCount(0);

  // bought on this day two years ago
  await setBought(page, yearsBack(2));
  const card = page.locator('[data-bike-birthday]');
  await expect(card).toBeVisible();
  await expect(card).toContainText('2');
  await expect(card).toContainText(/6.?428/);

  // bought today: no birthday yet
  await setBought(page, today());
  await expect(page.locator('[data-bike-birthday]')).toHaveCount(0);

  // hide for this year: it stays away after a reload
  await setBought(page, yearsBack(2));
  await expect(card).toBeVisible();
  await card.locator('button').click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await ready(page);
  await expect(page.locator('[data-section="bikes"]')).toBeVisible();
  await expect(page.locator('[data-bike-birthday]')).toHaveCount(0);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
