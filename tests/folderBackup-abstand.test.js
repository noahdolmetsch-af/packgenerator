// Tempo (Noah 11.11.2026 «1-4 umsetzen»): the folder backup writes at most every 30 s.
import 'fake-indexeddb/auto';
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => vi.useRealTimers());
// the fake database answers in real time (setImmediate); give a started write the time to finish
const settle = async () => { for (let i = 0; i < 50; i++) await new Promise((r) => setImmediate(r)); };

describe('waitFor', () => {
  it('waits the quiet time of a burst, and the gap after the last write when that is longer', async () => {
    const { waitFor } = await import('../src/lib/folderBackup.js');
    expect(waitFor(100_000, 0)).toBe(2000); // no write yet: the quiet time
    expect(waitFor(100_000, 50_000)).toBe(2000); // the last write is long ago
    expect(waitFor(100_000, 90_000)).toBe(20_000); // 10 s ago: 20 s more to the 30 s gap
    expect(waitFor(100_000, 99_000)).toBe(29_000);
  });
});

describe('watchForChanges', () => {
  it('writes once after a burst, then not again before 30 s have passed', async () => {
    vi.resetModules();
    const { createDb } = await import('../src/lib/db.js');
    const { watchForChanges } = await import('../src/lib/folderBackup.js');
    const db = createDb('test_data_gtp_folder_gap');
    const files = [];
    const handle = {
      name: 'B',
      queryPermission: async () => 'granted',
      getFileHandle: async (name) => ({ createWritable: async () => ({ write: async () => files.push(name), close: async () => {} }) }),
    };
    let rec = { key: 'backupFolder', handle, lastWrite: null };
    const meta = { get: async (key) => (key === rec?.key ? rec : undefined), put: async (r) => (rec = r), delete: async () => {} };
    const table = db.table.bind(db);
    db.table = (name) => (name === 'meta' ? meta : table(name));
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    watchForChanges(db, null);
    await db.trips.put({ id: 't1', title: 'A', entries: [] });
    await vi.advanceTimersByTimeAsync(2100);
    await vi.waitFor(() => expect(files.length).toBe(2)); // latest + daily file
    await db.trips.put({ id: 't1', title: 'B', entries: [] });
    await vi.advanceTimersByTimeAsync(10_000);
    await settle();
    expect(files.length).toBe(2); // 10 s after the write: still waiting for the gap
    await vi.advanceTimersByTimeAsync(21_000);
    await vi.waitFor(() => expect(files.length).toBe(4));
  });
});
