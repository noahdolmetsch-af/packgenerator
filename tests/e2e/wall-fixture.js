// «Heute neu» A «Ein Blick» (0.165.0, Noah 20.10.2026 «1A … 3a»): the ready wall of Heute is short now; the
// tiles that left it stay in the catalog («Kachel hinzufügen»). Tests of such a tile put the wall of
// 0.155–0.163 (HN4) on the device first, as a user who added those tiles would have it.
import { expect } from '@playwright/test';
import { wallOf8, wallRecord, WALL_KEY } from '../../src/lib/home/tiles.js';

/** The wall Heute had from 0.155.0 to 0.163.0, with every tile added since (routine, values, tip). */
export const HN4 = () => wallOf8(null);

/** The settings row of a stored wall (the current version, so it is kept as it is). */
export const wallRow = (tiles = HN4()) => ({ key: WALL_KEY, value: wallRecord(tiles) });

/** Put the wall into a backup fixture (homeFixture() and friends). */
export function withWall(d, tiles = HN4()) {
  d.tables.settings = [...(d.tables.settings ?? []).filter((x) => x.key !== WALL_KEY), wallRow(tiles)];
  return d;
}

/** Write the wall on an open app and reload Heute. */
export async function putWall(page, tiles = HN4()) {
  const row = wallRow(tiles);
  await page.evaluate(
    (row) =>
      new Promise((res, rej) => {
        const r = indexedDB.open('pack-generator');
        r.onerror = () => rej(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction('settings', 'readwrite');
          tx.objectStore('settings').put(row);
          tx.oncomplete = () => {
            r.result.close();
            res();
          };
          tx.onerror = () => rej(tx.error);
        };
      }),
    row,
  );
  await page.reload();
}

/** The ready activities of «Im Flow» (meditation …) are written on the first start of Heute. */
export async function flowSeeded(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise((res) => {
            const r = indexedDB.open('pack-generator');
            r.onsuccess = () => {
              const c = r.result.transaction('flowActs').objectStore('flowActs').count();
              c.onsuccess = () => res(c.result);
              c.onerror = () => res(0);
            };
            r.onerror = () => res(0);
          }),
      ),
    )
    .toBeGreaterThan(0);
}
