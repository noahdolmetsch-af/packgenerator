// E2-001 (Durchklick Etappe 2): «Packliste aufräumen» with a long thing name (a word of 18 letters in a
// name of 70 letters) made the whole page wider than a phone: the boxes grew to the longest word of a row.
// Fictional data (home0460-fixture); the name is only longer, like a real «Wallet / grip (cash, cards, ID …)».
import { test, expect } from './clock.js';
import { openHome } from './home0460-fixture.js';

const LONG = 'Wallet / grip (cash CHF+EUR, bank card, passport, healthinsurancecard)';

test('Packliste aufraeumen: a long name stays inside the screen', async ({ page, context }, info) => {
  test.setTimeout(120_000);
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const T = await openHome(page, context, info);
  await page.evaluate(
    (name) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const tx = r.result.transaction('items', 'readwrite');
          const st = tx.objectStore('items');
          st.get('RA01').onsuccess = (e) => st.put({ ...e.target.result, name, nameDe: name });
          tx.oncomplete = () => (r.result.close(), ok());
        };
      }),
    LONG,
  );
  await page.goto('./#/blocks/aufraeumen');
  await page.reload(); // the app reads its data again (it does not see a write that did not go through it)
  const rows = page.locator('main [data-tidy="std"] ol.order > li');
  const row = rows.filter({ hasText: 'Wallet / grip' });
  await expect(row).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  const box = await row.boundingBox();
  const vw = page.viewportSize().width;
  expect(box.x + box.width).toBeLessThanOrEqual(vw);
  expect(errors).toEqual([]);
  void T;
});
