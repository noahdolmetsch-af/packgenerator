import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { writeNow, folderStatus } from '../src/lib/folderBackup.js';

/** A stand-in for the browser's folder handle that keeps files in memory. */
function fakeFolder(permission = 'granted') {
  const files = {};
  return {
    name: 'Backups',
    files,
    queryPermission: async () => permission,
    getFileHandle: async (name) => ({
      createWritable: async () => ({ write: async (text) => (files[name] = text), close: async () => {} }),
    }),
  };
}

/**
 * A real folder handle can be stored in IndexedDB; this fake one cannot (it has functions),
 * so the test keeps the "meta" record in memory instead.
 */
function useMemoryMeta(db, handle) {
  let rec = { key: 'backupFolder', handle, lastWrite: null };
  const meta = { get: async (key) => (key === rec?.key ? rec : undefined), put: async (r) => (rec = r), delete: async () => (rec = undefined) };
  const table = db.table.bind(db);
  db.table = (name) => (name === 'meta' ? meta : table(name));
}

describe('folder backup', () => {
  it('writes the latest file and a daily file', async () => {
    const db = createDb('folder-1');
    await db.items.put({ id: 'EL01', name: 'Cable' });
    const handle = fakeFolder();
    useMemoryMeta(db, handle);

    expect(await writeNow(db)).toBe(true);
    const names = Object.keys(handle.files);
    expect(names).toContain('pack-generator-latest.json');
    expect(names.some((n) => /^pack-generator-\d{4}-\d{2}-\d{2}\.json$/.test(n))).toBe(true);
    expect(JSON.parse(handle.files['pack-generator-latest.json']).tables.items[0].id).toBe('EL01');
  });

  it('does not write without permission and says it needs an OK', async () => {
    const db = createDb('folder-2');
    const handle = fakeFolder('prompt');
    useMemoryMeta(db, handle);
    expect(await writeNow(db)).toBe(false);
    expect((await folderStatus(db)).state).toBe('needs-ok');
  });
});
