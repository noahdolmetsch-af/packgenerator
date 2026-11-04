// «Tourenpass mit Stempel» (Paket E, Idee 18): the stamps, what the offer lists, change and remove.
import { describe, it, expect } from 'vitest';
import { stateOf, proposal, openTrips, stamp, stampAll, addOwn, change, remove, decline, resetDeclined, newestFirst, turnOf, summary, stampOfTrip, isDeclined } from '../src/lib/tourenpass/pass.js';

const trip = (id, title, startDate, extra = {}) => ({ id, title, startDate, days: 1, status: 'done', ...extra });
const T1 = trip('t1', 'Test Pass Loop', '2026-10-12', { route: { km: 84.4 } });
const T2 = trip('t2', 'Seeland Test', '2026-09-03', { days: 3 });
const rated = (...ids) => ids.map((tripId) => ({ tripId, status: 'done' }));

describe('stateOf', () => {
  it('makes any stored value whole', () => {
    expect(stateOf(null)).toEqual({ stamps: [], declined: [] });
    expect(stateOf({ stamps: 5, declined: 'x' })).toEqual({ stamps: [], declined: [] });
    const s = stateOf({ stamps: [{ id: 'a', place: ' Ort ', km: '12.6', date: 5 }, { id: 'b', place: ' ' }, { place: 'x' }], declined: ['t', 3] });
    expect(s.stamps).toEqual([{ id: 'a', tripId: '', place: 'Ort', date: '', km: 13 }]);
    expect(s.declined).toEqual(['t']);
  });
});

describe('proposal and offer', () => {
  it('proposes the title, the last day and the km of the trip', () => {
    expect(proposal(T1)).toEqual({ place: 'Test Pass Loop', date: '2026-10-12', km: 84 });
    expect(proposal(T2)).toEqual({ place: 'Seeland Test', date: '2026-09-05', km: null });
    expect(proposal(T2, 150.2).km).toBe(150);
  });

  it('lists only trips with a saved Rückblick and no stamp, newest first', () => {
    const rows = openTrips([T2, T1, trip('t3', 'Open', '2026-10-20')], rated('t1', 't2'), stateOf(null));
    expect(rows.map((r) => r.trip.id)).toEqual(['t1', 't2']);
    expect(openTrips([T1], [{ tripId: 't1', status: 'open' }], stateOf(null))).toEqual([]);
    expect(openTrips([{ ...T1, skipped: true }], rated('t1'), stateOf(null))).toEqual([]);
    expect(openTrips([trip('t4', ' ', '2026-10-01')], rated('t4'), stateOf(null))).toEqual([]);
  });

  it('a stamped trip leaves the offer; a declined one stays listed as declined', () => {
    let s = stamp(stateOf(null), T1);
    expect(openTrips([T1, T2], rated('t1', 't2'), s).map((r) => r.trip.id)).toEqual(['t2']);
    s = decline(s, 't2');
    const rows = openTrips([T1, T2], rated('t1', 't2'), s);
    expect(rows).toHaveLength(1);
    expect(rows[0].declined).toBe(true);
    expect(isDeclined(s, 't2')).toBe(true);
    expect(resetDeclined(s).declined).toEqual([]);
  });
});

describe('stamps', () => {
  it('stamps a trip once, with the proposal or what the person typed', () => {
    const s = stamp(stateOf(null), T1);
    expect(s.stamps).toEqual([{ id: 's-t1', tripId: 't1', place: 'Test Pass Loop', date: '2026-10-12', km: 84 }]);
    expect(stamp(s, T1)).toBe(s);
    const own = stamp(stateOf(null), T2, { place: ' Seeland ', km: 120 });
    expect(own.stamps[0]).toMatchObject({ place: 'Seeland', date: '2026-09-05', km: 120 });
    expect(stamp(stateOf(null), T2, { place: '  ' }).stamps).toEqual([]);
    expect(stampOfTrip(s, 't1').id).toBe('s-t1');
  });

  it('stamping a declined trip takes it out of the declined list', () => {
    const s = stamp(decline(stateOf(null), 't1'), T1);
    expect(s.declined).toEqual([]);
  });

  it('stamps several trips at once', () => {
    const rows = openTrips([T1, T2], rated('t1', 't2'), stateOf(null));
    expect(stampAll(stateOf(null), rows).stamps.map((x) => x.tripId).sort()).toEqual(['t1', 't2']);
  });

  it('adds an own stamp, changes it and removes it', () => {
    let s = addOwn(stateOf(null), { place: ' Col Test ', date: '2025-07-01', km: '55' }, 'own1');
    expect(s.stamps[0]).toEqual({ id: 'own1', tripId: '', place: 'Col Test', date: '2025-07-01', km: 55 });
    expect(addOwn(s, { place: ' ' })).toBe(s);
    s = change(s, 'own1', { place: 'Col Neu', km: '' });
    expect(s.stamps[0]).toMatchObject({ place: 'Col Neu', km: null, date: '2025-07-01' });
    expect(change(s, 'own1', { place: '  ' }).stamps[0].place).toBe('Col Neu');
    expect(remove(s, 'own1').stamps).toEqual([]);
  });
});

describe('collection', () => {
  it('sorts newest first and sums up', () => {
    const list = [{ id: 'a', place: 'A', date: '2026-01-01', km: 10 }, { id: 'b', place: 'B', date: '2026-05-01', km: 20 }, { id: 'c', place: 'C', date: '', km: null }];
    expect(newestFirst(list).map((x) => x.id)).toEqual(['b', 'a', 'c']);
    expect(summary(list)).toEqual({ n: 3, km: 30, first: '2026-01-01', last: '2026-05-01' });
    expect(summary([])).toEqual({ n: 0, km: 0, first: '', last: '' });
  });

  it('turns a stamp a little, always the same for the same id', () => {
    for (const id of ['a', 's-t1', 'own-xyz', '']) {
      const v = turnOf(id);
      expect(v).toBeGreaterThanOrEqual(-5);
      expect(v).toBeLessThanOrEqual(5);
      expect(turnOf(id)).toBe(v);
    }
  });
});
