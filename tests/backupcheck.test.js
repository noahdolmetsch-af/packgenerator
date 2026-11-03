import { describe, it, expect } from 'vitest';
import { checkBackup, offsiteState } from '../src/lib/backupcheck.js';

const file = (tables) => ({ app: 'pack-generator', schemaVersion: 1, exportedAt: '2026-01-02T10:00:00Z', tables });

describe('checkBackup (dry run)', () => {
  it('a whole file is ok and counts its records', () => {
    const r = checkBackup(file({ trips: [{ id: 1 }, { id: 2 }], bikes: [{ id: 'b1' }] }));
    expect(r.ok).toBe(true);
    expect(r.counts.trips).toBe(2);
    expect(r.total).toBe(3);
  });
  it('a file of another app is not ok', () => {
    expect(checkBackup({ app: 'other', tables: {} }).ok).toBe(false);
    expect(checkBackup(null).ok).toBe(false);
  });
  it('records without an ID are reported', () => {
    const r = checkBackup(file({ trips: [{ id: 1 }, { name: 'x' }] }));
    expect(r.ok).toBe(false);
    expect(r.problems.join(' ')).toMatch(/damaged/);
  });
  it('the same ID twice is reported', () => {
    expect(checkBackup(file({ trips: [{ id: 1 }, { id: 1 }] })).ok).toBe(false);
  });
  it('an empty backup is flagged', () => {
    expect(checkBackup(file({ trips: [] })).ok).toBe(false);
  });
  it('uses the table key (debriefs by tripId)', () => {
    expect(checkBackup(file({ debriefs: [{ tripId: 3 }] })).ok).toBe(true);
  });
});

describe('offsiteState', () => {
  const now = new Date('2026-11-02T12:00:00Z');
  it('none, ok, old', () => {
    expect(offsiteState(undefined, now).kind).toBe('none');
    expect(offsiteState({ at: '2026-10-25T12:00:00Z' }, now).kind).toBe('ok');
    expect(offsiteState({ at: '2026-08-01T12:00:00Z' }, now).kind).toBe('old');
  });
});
