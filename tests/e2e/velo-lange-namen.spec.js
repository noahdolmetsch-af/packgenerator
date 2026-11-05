// Velo-Namen (Durchklick Etappe 4, Befund E4-001): a bike with a very long name must not make Pflege (or the
// pages with the bike chips) wider than the screen. Fictional data only (tests/fixtures/gesamttest).
import { test, expect } from './clock.js';
import { start, fixture, sideways } from './gesamttest/lib.js';

const WITH_SPACES = 'Mein allerliebstes Gravelvelo fuer lange Touren im Jura und Emmental 2026';

/** Renames a bike straight in IndexedDB (the same record the edit window saves). */
const rename = (page, id, name) =>
  page.evaluate(
    ([bikeId, n]) =>
      new Promise((ok) => {
        const r = indexedDB.open('pack-generator');
        r.onsuccess = () => {
          const db = r.result;
          const tx = db.transaction('bikes', 'readwrite');
          const s = tx.objectStore('bikes');
          const g = s.get(bikeId);
          g.onsuccess = () => s.put({ ...g.result, name: n });
          tx.oncomplete = () => (db.close(), ok());
        };
      }),
    [id, name],
  );

// a name with spaces on the three Pflege pages that show bike names in chips or badges
for (const [label, name, hashes] of [['with spaces', WITH_SPACES, ['#/bikes?tab=care', '#/bikes?tab=care&view=season', '#/bikes?tab=care&view=wear']]]) {
  test(`a bike name ${label} does not push Pflege sideways`, async ({ page, context }, info) => {
    const errors = await start(page, context, info);
    await rename(page, fixture().data.tables.bikes[0].id, name);
    for (const hash of hashes) {
      await page.goto(`./${hash}`);
      await page.reload();
      await page.locator('main').waitFor();
      await expect(page.locator('main')).toContainText(name.slice(0, 20));
      const sw = await sideways(page);
      expect(sw.sw, `${hash}: ${sw.wide.join(' | ')}`).toBeLessThanOrEqual(sw.w + 1);
    }
    expect(errors).toEqual([]);
  });
}
