// «Kursblick» K-C: holdings, goals and the dividend switch are private data. They travel in the backup file like every setting
// (nothing is lost on export → import) and stay out of the price service. Invented numbers only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb, DEVICE_SETTINGS, syncLocal } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup } from '../src/lib/backup.js';
import { BESTAND_KEY, lies as liesB, neuerPosten, neuesEreignis } from '../src/lib/kurse/bestand.js';
import { ZIELE_KEY, lies as liesZ, neuesZiel } from '../src/lib/kurse/ziele.js';

let n = 0;
const frisch = () => createDb(`kursblick-privat-${++n}`);

function beispiel() {
  let b = neuerPosten(liesB(null), { art: 'titel', symbol: 'abc.sw', menge: '10', einstand: '1000', gekauft: '2024-02-01' }, 'p1').state;
  b = neuerPosten(b, { art: 'hand', name: 'Mein Sparkonto', wert: '5000', stand: '2026-11-01' }, 'p2').state;
  b = neuesEreignis(b, 'p1', { typ: 'dividende', tag: '2025-05-01', betrag: '30' }, 'e1').state;
  b = neuesEreignis(b, 'p1', { typ: 'split', tag: '2025-09-01', faktor: '2' }, 'e2').state;
  const z = neuesZiel(liesZ(null), { was: 'gold', richtung: 'ueber', wert: '120000', name: 'Verkaufen' }, 'z1').state;
  return { b, z };
}

describe('private data of Kursblick and the backup', () => {
  it('the three settings go through export and import unchanged', async () => {
    const { b, z } = beispiel();
    const db = frisch();
    await db.settings.bulkPut([{ key: BESTAND_KEY, value: b }, { key: ZIELE_KEY, value: z }, { key: 'kurse.mitdividenden', value: true }]);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(validateBackup(file)).toEqual([]);
    const rows = Object.fromEntries(file.tables.settings.map((r) => [r.key, r.value]));
    expect(rows[BESTAND_KEY]).toEqual(b);
    expect(rows[ZIELE_KEY]).toEqual(z);
    expect(rows['kurse.mitdividenden']).toBe(true);

    const other = frisch();
    await restoreBackup(other, file, 'replace');
    expect(liesB((await other.settings.get(BESTAND_KEY)).value)).toEqual(b);
    expect(liesZ((await other.settings.get(ZIELE_KEY)).value)).toEqual(z);
    expect((await other.settings.get('kurse.mitdividenden')).value).toBe(true);
  });

  it('an older backup without them imports fine and the device keeps what it has (merge)', async () => {
    const { b } = beispiel();
    const db = frisch();
    await db.settings.put({ key: BESTAND_KEY, value: b });
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 1, tables: { settings: [{ key: 'other', value: 1 }] } }, 'merge');
    expect(liesB((await db.settings.get(BESTAND_KEY)).value).posten).toHaveLength(2);
  });

  it('they are not device-only: they sync to the other devices (sealed with the sync code), not into the price service', () => {
    for (const key of [BESTAND_KEY, ZIELE_KEY, 'kurse.mitdividenden']) {
      expect(DEVICE_SETTINGS).not.toContain(key);
      expect(syncLocal('settings', key)).toBe(false);
    }
  });
});
