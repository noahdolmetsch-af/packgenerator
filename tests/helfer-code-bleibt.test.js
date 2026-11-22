// «KI entfernen» Schritt 7: the page «KI-Helfer» is gone, but an old Helfer-Code may still sit in the settings of a
// device. It never goes into a backup or an export, and a restore keeps the device its own. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, DEVICE_SETTINGS } from '../src/lib/backup.js';

const SECRET = 'test-helfer-code-0000000000000000';

describe('the Helfer-Code stays on this device (answer 8a)', () => {
  let db;
  let n = 0;
  beforeEach(() => (db = createDb(`helper-${++n}`)));
  it('is never in a backup or an export, and a restore keeps the device its own', async () => {
    expect(DEVICE_SETTINGS).toContain('helper');
    await db.settings.bulkPut([{ key: 'helper', value: { code: SECRET, on: true, capChf: 5 } }, { key: 'riderWeightG', value: 64000 }]);
    const file = await buildBackup(db);
    expect(JSON.stringify(file)).not.toContain(SECRET);
    expect(file.tables.settings.map((s) => s.key)).toEqual(['riderWeightG']);
    await restoreBackup(db, { app: 'pack-generator', schemaVersion: 1, tables: { settings: [{ key: 'helper', value: { code: 'other' } }] } }, 'replace');
    expect((await db.settings.get('helper')).value.code).toBe(SECRET);
  });
});
