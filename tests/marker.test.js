// «Marker» (Noah 21.11.2026, K1): days marked as sick, injured, stress or holiday; with Undo; in the backup. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { MARKER_KEY, KINDS, MAX_DAYS, cleanDay, cleanMarker, markerList, withMarker, withoutMarker, markedDays, markerOn, daysOf, readMarkers, saveMarkers, restoreMarkers } from '../src/lib/flow/marker.js';

describe('a marker', () => {
  it('has four kinds', () => expect(KINDS).toEqual(['sick', 'injured', 'stress', 'holiday']));
  it('needs a real kind and a real day; an end before the start is the same day, a missing end too', () => {
    expect(cleanMarker({ id: 'a', kind: 'sick', from: '2026-10-05' })).toEqual({ id: 'a', kind: 'sick', from: '2026-10-05', to: '2026-10-05' });
    expect(cleanMarker({ id: 'a', kind: 'sick', from: '2026-10-05', to: '2026-10-01' }).to).toBe('2026-10-05');
    expect(cleanMarker({ id: 'a', kind: 'flu', from: '2026-10-05' })).toBeNull();
    expect(cleanMarker({ id: 'a', kind: 'sick', from: '2026-02-31' })).toBeNull();
    expect(cleanMarker({ kind: 'sick', from: '2026-10-05' })).toBeNull();
    expect(cleanMarker(null)).toBeNull();
    expect(cleanDay('2026-2-3')).toBe('');
  });
  it('a stretch is cut at one year', () => {
    const m = cleanMarker({ id: 'a', kind: 'injured', from: '2025-01-01', to: '2030-01-01' });
    expect(daysOf(m)).toBe(MAX_DAYS);
  });
  it('rubbish in the stored value is ignored; the list is newest first', () => {
    const list = markerList([{ id: 'a', kind: 'sick', from: '2026-01-01' }, { id: 'b', kind: 'x', from: '2026-02-01' }, { id: 'c', kind: 'holiday', from: '2026-03-01', to: '2026-03-07' }, 7]);
    expect(list.map((m) => m.id)).toEqual(['c', 'a']);
    expect(markerList(undefined)).toEqual([]);
    expect(markerList({})).toEqual([]);
  });
});

describe('adding, changing, removing', () => {
  it('adds a marker, replaces one with the same id and never changes the input', () => {
    const before = [];
    const one = withMarker(before, { kind: 'sick', from: '2026-10-05', to: '2026-10-09' }, 'a');
    expect(before).toEqual([]);
    expect(one).toEqual([{ id: 'a', kind: 'sick', from: '2026-10-05', to: '2026-10-09' }]);
    const two = withMarker(one, { id: 'a', kind: 'injured', from: '2026-10-05', to: '2026-10-20' });
    expect(two).toEqual([{ id: 'a', kind: 'injured', from: '2026-10-05', to: '2026-10-20' }]);
    expect(withMarker(two, { kind: 'nope', from: '2026-10-05' })).toEqual(two);
  });
  it('removes one marker', () => {
    const list = withMarker(withMarker([], { kind: 'sick', from: '2026-10-05' }, 'a'), { kind: 'stress', from: '2026-11-01' }, 'b');
    expect(withoutMarker(list, 'a').map((m) => m.id)).toEqual(['b']);
  });
});

describe('the marked days', () => {
  const list = [
    { id: 'a', kind: 'sick', from: '2026-10-05', to: '2026-10-07' },
    { id: 'b', kind: 'holiday', from: '2026-10-07', to: '2026-10-08' },
  ];
  it('lists every day of every stretch', () => {
    expect([...markedDays(list)].sort()).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08']);
  });
  it('can be narrowed to some kinds', () => {
    expect([...markedDays(list, ['holiday'])].sort()).toEqual(['2026-10-07', '2026-10-08']);
  });
  it('finds the marker of a day, also across a month end', () => {
    expect(markerOn(list, '2026-10-06').id).toBe('a');
    expect(markerOn(list, '2026-10-09')).toBeNull();
    const long = [{ id: 'x', kind: 'injured', from: '2026-10-30', to: '2026-11-02' }];
    expect([...markedDays(long)].sort()).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02']);
    expect(daysOf(long[0])).toBe(4);
  });
});

describe('the setting in the database (it goes into the backup with the other settings)', () => {
  it('saves, reads, empties and restores', async () => {
    const db = createDb('marker-1');
    expect(await readMarkers(db)).toEqual([]);
    const b0 = await saveMarkers(db, withMarker([], { kind: 'sick', from: '2026-10-05', to: '2026-10-07' }, 'a'));
    expect(b0).toEqual([]);
    expect((await db.settings.get(MARKER_KEY)).value).toEqual([{ id: 'a', kind: 'sick', from: '2026-10-05', to: '2026-10-07' }]);
    const b1 = await saveMarkers(db, []);
    expect(b1.length).toBe(1);
    expect(await db.settings.get(MARKER_KEY)).toBeUndefined();
    await restoreMarkers(db, b1);
    expect((await readMarkers(db)).map((m) => m.id)).toEqual(['a']);
  });
  it('never touches the ticks', async () => {
    const db = createDb('marker-2');
    await db.flowLog.put({ id: 'e1', actId: 'run', day: '2026-10-05', at: '2026-10-05T07:00:00.000Z', n: 1 });
    await saveMarkers(db, withMarker([], { kind: 'stress', from: '2026-10-05' }, 'a'));
    expect(await db.flowLog.get('e1')).toEqual({ id: 'e1', actId: 'run', day: '2026-10-05', at: '2026-10-05T07:00:00.000Z', n: 1 });
  });
});

describe('the backup (check with a copy, Noah rule 3)', () => {
  it('the markers travel in the backup and an older copy without them gives an empty list', async () => {
    const { buildBackup, restoreBackup, validateBackup } = await import('../src/lib/backup.js');
    const a = createDb('marker-backup-a');
    await saveMarkers(a, withMarker([], { kind: 'injured', from: '2026-10-05', to: '2026-10-20' }, 'a'));
    const copy = JSON.parse(JSON.stringify(await buildBackup(a)));
    expect(validateBackup(copy)).toEqual([]);
    expect(copy.tables.settings.some((r) => r.key === MARKER_KEY && r.value[0].kind === 'injured')).toBe(true);
    const b = createDb('marker-backup-b');
    await restoreBackup(b, copy, 'replace');
    expect((await readMarkers(b)).map((m) => m.kind)).toEqual(['injured']);
    const old = JSON.parse(JSON.stringify(copy));
    old.tables.settings = old.tables.settings.filter((r) => r.key !== MARKER_KEY);
    const c = createDb('marker-backup-c');
    await restoreBackup(c, old, 'replace');
    expect(await readMarkers(c)).toEqual([]);
  });
});
