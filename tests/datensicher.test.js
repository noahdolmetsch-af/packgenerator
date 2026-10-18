// P3b «Daten sicher» (Noah 15.10.2026 «1a»): storage kept, phone and computer in step, Ich › Dokumente.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { syncAdvice, markSync, SYNC_KEY, LAST_CHANGE } from '../src/lib/backup.js';
import { keepState, askKeep } from '../src/lib/storagekeep.js';
import { expiry, reminderRows, dueCount, packRows, untilOf, ID_GROUP, DEFAULT_REMIND } from '../src/lib/docs.js';
import { KEEP, pruneIds } from '../src/lib/maintenance/snapshots.js';
import { createDb, DATA_TABLES } from '../src/lib/db.js';

describe('storage kept by the browser', () => {
  it('reads and asks, never throws', async () => {
    expect(await keepState({ storage: { persisted: async () => true } })).toBe('kept');
    expect(await keepState({ storage: { persisted: async () => false } })).toBe('not');
    expect(await keepState({})).toBe('unknown');
    expect(await keepState({ storage: { persisted: async () => { throw new Error('x'); } } })).toBe('unknown');
    expect(await askKeep({ storage: { persist: async () => true } })).toBe('kept');
    expect(await askKeep({ storage: { persist: async () => false } })).toBe('not');
    expect(await askKeep(undefined)).toBe('unknown');
  });
});

describe('phone and computer: the suggestion on import', () => {
  const at = (h) => `2026-10-15T${String(h).padStart(2, '0')}:00:00.000Z`;
  it('without dates: no suggestion; the same state: nothing to do', () => {
    expect(syncAdvice(null, at(8)).advice).toBe(null);
    expect(syncAdvice(at(8), at(8)).advice).toBe('same');
  });
  it('never exchanged: the newer one wins', () => {
    expect(syncAdvice(at(9), at(8)).advice).toBe('take');
    expect(syncAdvice(at(8), at(9)).advice).toBe('keep');
  });
  it('after an exchange: only there, only here, or both changed', () => {
    const mark = { mine: at(8), theirs: null };
    expect(syncAdvice(at(10), at(8), mark).advice).toBe('take'); // the other device changed
    expect(syncAdvice(at(8), at(10), mark).advice).toBe('keep'); // only this one
    expect(syncAdvice(at(10), at(11), mark)).toMatchObject({ advice: 'both', hereChanged: true, thereChanged: true });
  });
  it('remembers the exchange with this device\'s change time', async () => {
    const db = createDb(`ds-${Math.random()}`);
    await db.meta.put({ key: LAST_CHANGE, at: at(7) });
    await markSync(db, { theirs: at(6), now: new Date(at(9)) });
    expect(await db.meta.get(SYNC_KEY)).toMatchObject({ at: at(9), mine: at(7), theirs: at(6) });
    db.close();
  });
});

describe('rule 5a: a copy before every import', () => {
  it('keeps the newest 3 import copies beside the update copies', () => {
    expect(KEEP.import).toBe(3);
    const list = [1, 2, 3, 4].map((i) => ({ id: i, at: `2026-10-1${i}T10:00:00Z`, kind: 'import' }));
    expect(pruneIds([...list, { id: 9, at: '2026-10-01T10:00:00Z', kind: 'update' }])).toEqual([1]);
  });
});

describe('Ich › Dokumente', () => {
  const today = '2026-10-15';
  it('documents are data: in every backup', () => {
    expect(DATA_TABLES).toContain('docs');
  });
  it('valid until: months left, the reminder 6 months before by default, over after the month', () => {
    expect(untilOf({ until: '2027-13' })).toBe(null);
    expect(expiry({ until: '2027-03' }, today)).toEqual({ until: '2027-03', left: 5, remindFrom: '2026-09', soon: true, over: false });
    expect(expiry({ until: '2031-03' }, today)).toMatchObject({ soon: false, over: false, remindFrom: '2030-09' });
    expect(expiry({ until: '2026-10' }, today)).toMatchObject({ left: 0, over: false, soon: true });
    expect(expiry({ until: '2026-09' }, today)).toMatchObject({ over: true, soon: false });
    expect(expiry({ until: '2027-03', remind: 0 }, today)).toMatchObject({ remindFrom: null, soon: false });
    expect(expiry({ until: '2027-03', remind: 1 }, today).soon).toBe(false);
    expect(expiry({}, today)).toBe(null);
    expect(DEFAULT_REMIND).toBe(6);
  });
  it('reminders: soonest first; the count of what needs you', () => {
    const list = [
      { id: 'a', name: 'Pass', until: '2031-03' },
      { id: 'b', name: 'Identitätskarte', until: '2027-03' },
      { id: 'c', name: 'Notfallblatt' },
    ];
    expect(reminderRows(list, today).map((r) => r.doc.id)).toEqual(['b', 'a']);
    expect(dueCount(list, today)).toBe(1);
  });
  it('packing list: one row «ID and cash with you?» for the IDs, one per other paper, only the marked ones', () => {
    const list = [
      { id: 'p', name: 'Pass', group: ID_GROUP, inPack: true },
      { id: 'i', name: 'Identitätskarte', group: ID_GROUP, inPack: true },
      { id: 'v', name: 'Reiseversicherung', group: 'Insurance and emergency', inPack: true },
      { id: 'f', name: 'Flug Beispielstadt', group: 'Travel' },
    ];
    const rows = packRows(list);
    expect(rows.map((r) => r.key)).toEqual(['ids', 'v']);
    expect(rows[0]).toMatchObject({ label: 'ID and cash with you?', doc: { id: 'i' } });
    expect(rows[1]).toMatchObject({ label: '{name} with you?', name: 'Reiseversicherung' });
    expect(packRows([])).toEqual([]);
  });
});
