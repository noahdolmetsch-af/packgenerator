// Noah 23.11.2026: «Was mir gut tut» came not through on the second device and he feared the same elsewhere. This guard keeps
// the map of what is synced and what stays on the device complete (src/lib/sync/geraet.js, docs/abgleich.md). Fictional data only.
import 'fake-indexeddb/auto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { createDb, DATA_TABLES, NOT_IN_BACKUP, DEVICE_SETTINGS, syncLocal } from '../src/lib/db.js';
import { GERAET_DATEIEN, GERAET_KINDS, TABELLEN_NUR_GERAET } from '../src/lib/sync/geraet.js';

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(path.join(d, f.name)) : /\.(js|svelte)$/.test(f.name) ? [path.join(d, f.name)] : []));
const usesStorage = (file) => /\b(localStorage|sessionStorage)\b/.test(fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, ''));
const rel = (f) => path.relative('src', f).split(path.sep).join('/');

describe('the map: what goes to the other device, what stays', () => {
  it('every table of the database is synced or named as «only this device» with its reason', () => {
    const db = createDb('abgleich-karte');
    const names = db.tables.map((t) => t.name);
    for (const n of names) {
      const ok = DATA_TABLES.includes(n) || Object.hasOwn(TABELLEN_NUR_GERAET, n);
      expect(ok, `table «${n}» is in no sync list: add it to DATA_TABLES (db.js) or to TABELLEN_NUR_GERAET (sync/geraet.js) with a reason`).toBe(true);
    }
    for (const n of Object.keys(TABELLEN_NUR_GERAET)) expect(names, `«${n}» in TABELLEN_NUR_GERAET is no table`).toContain(n);
    // the tables that go into the sync are the ones that go into the backup, minus what stays here on purpose
    expect(NOT_IN_BACKUP.every((n) => Object.hasOwn(TABELLEN_NUR_GERAET, n))).toBe(true);
  });

  it('every row that stays on the device inside a synced table has a reason (DEVICE_SETTINGS)', () => {
    for (const key of DEVICE_SETTINGS) {
      expect(syncLocal('settings', key)).toBe(true);
    }
    expect(syncLocal('settings', 'routine')).toBe(false); // «Was mir gut tut» goes to the other device
    expect(syncLocal('settings', 'homeLayout')).toBe(false);
    expect(syncLocal('settings', 'training.weeklog')).toBe(false);
    expect(syncLocal('logbuch', 1)).toBe(true);
    expect(syncLocal('trips', 'T1')).toBe(false);
  });

  it('every file that keeps something in the browser storage (localStorage, sessionStorage) is named with its kind', () => {
    const used = walk('src').filter(usesStorage).map(rel).sort();
    const missing = used.filter((f) => !Object.hasOwn(GERAET_DATEIEN, f));
    expect(missing, `new use of localStorage/sessionStorage: add the file to GERAET_DATEIEN (sync/geraet.js) with its kind, or keep the choice in the database (a setting) so it reaches the other device: ${missing.join(', ')}`).toEqual([]);
    const gone = Object.keys(GERAET_DATEIEN).filter((f) => !used.includes(f));
    expect(gone, `no longer uses the browser storage: remove from GERAET_DATEIEN: ${gone.join(', ')}`).toEqual([]);
    for (const kind of Object.values(GERAET_DATEIEN)) expect(Object.keys(GERAET_KINDS)).toContain(kind);
  });
});
