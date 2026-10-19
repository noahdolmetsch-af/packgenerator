// Paket Q #135: a backup locked with a password opens only with that password.
import { describe, it, expect } from 'vitest';
import { lockBackup, unlockBackup, isLocked } from '../src/lib/backupcrypt.js';
import { APP_ID } from '../src/lib/backup.js';

const sample = { app: APP_ID, schemaVersion: 1, exportedAt: '2026-10-19T10:00:00.000Z', tables: { items: [{ id: 1, name: 'Testzelt' }] } };

describe('backup with a password', () => {
  it('locks and opens again with the same password', async () => {
    const file = await lockBackup(sample, 'velo-2026');
    expect(isLocked(file)).toBe(true);
    expect(JSON.stringify(file)).not.toContain('Testzelt');
    expect(file.exportedAt).toBe(sample.exportedAt);
    expect(await unlockBackup(file, 'velo-2026')).toEqual(sample);
  });

  it('gives null for a wrong password', async () => {
    const file = await lockBackup(sample, 'richtig');
    expect(await unlockBackup(file, 'falsch')).toBeNull();
  });

  it('handles a large backup', async () => {
    const big = { ...sample, tables: { items: Array.from({ length: 20000 }, (_, i) => ({ id: i, name: `Teil ${i}` })) } };
    const file = await lockBackup(big, 'x');
    expect((await unlockBackup(file, 'x')).tables.items.length).toBe(20000);
  });

  it('an ordinary backup is not locked', () => {
    expect(isLocked(sample)).toBe(false);
  });
});
