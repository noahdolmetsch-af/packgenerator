import { describe, it, expect } from 'vitest';
import { BREAK_KINDS, breakKind, breakdownsOf, newBreakdown, repairFor, spareHints, sleepSpots, spotsNear, starText, postcardFacts, fitLine } from '../src/lib/tourlernen/tourlernen.js';
import { listOf, newPoint } from '../src/lib/map/ownpoints.js';

// Paket Z «Aus jeder Tour lernen» (Noah 20.10.2026): fictional data only
const tube = { id: 'i1', name: 'Spare tube' };
const patch = { id: 'i2', name: 'Patch kit' };
const link = { id: 'i3', name: 'Quick link' };
const tent = { id: 'i4', name: 'Tent' };
const items = [tube, patch, link, tent];

describe('breakdowns (1120)', () => {
  it('knows its kinds and falls back to «something else»', () => {
    expect(BREAK_KINDS.map((k) => k.key)).toContain('flat');
    expect(breakKind('nope').key).toBe('other');
  });
  it('makes a breakdown only with a known kind and keeps the list safe', () => {
    expect(newBreakdown({ kind: 'x' }, { id: 'b' })).toBeNull();
    const b = newBreakdown({ kind: 'flat', part: ' rear tube ', place: 'after the pass' }, { id: 'b1', now: '2026-08-01T10:00:00Z' });
    expect(b).toMatchObject({ id: 'b1', kind: 'flat', part: 'rear tube', taskId: null });
    expect(breakdownsOf({ breakdowns: [b, null, { kind: 'flat' }] })).toHaveLength(1);
    expect(breakdownsOf({})).toEqual([]);
  });
  it('a bike-care job in the shape of a planning-note repair', () => {
    const b = newBreakdown({ kind: 'chain', place: 'Jura' }, { id: 'b2' });
    const job = repairFor(b, { id: 't1', bikeId: 'bk1' }, { id: 'r1', text: 'Check the chain', today: '2026-08-02' });
    expect(job).toMatchObject({ id: 'r1', bikeId: 'bk1', task: 'Check the chain', source: 'Breakdown', status: 'open', beforeRide: true, tripId: 't1', note: 'Jura', logDate: '2026-08-02' });
  });
  it('suggests the spare parts of earlier breakdowns, not those already on the trip or skipped', () => {
    const old = { id: 'a', title: 'Jura loop', startDate: '2026-06-01', breakdowns: [{ id: 'x', kind: 'flat' }, { id: 'y', kind: 'chain' }] };
    const later = { id: 'z', title: 'Later', startDate: '2026-12-01', breakdowns: [{ id: 'w', kind: 'brake' }] };
    const trip = { id: 't', startDate: '2026-09-01', entries: [{ itemId: 'i2' }] };
    const hints = spareHints(trip, [old, later, trip], items);
    expect(hints.map((h) => h.kind)).toEqual(['flat', 'chain']);
    expect(hints[0].items.map((i) => i.id)).toEqual(['i1']);
    expect(hints[0].from.title).toBe('Jura loop');
    expect(spareHints({ ...trip, spareSkip: ['flat'] }, [old], items).map((h) => h.kind)).toEqual(['chain']);
    expect(spareHints(null, [old], items)).toEqual([]);
  });
});

describe('sleep spots (1122)', () => {
  const a = { id: 'p1', kind: 'sleep', lat: 47.0, lon: 7.0, stars: 3, createdAt: '2026-01-01', tripId: 'old' };
  const b = { id: 'p2', kind: 'sleep', lat: 47.01, lon: 7.01, stars: 5, createdAt: '2026-01-02', tripId: 'old' };
  const far = { id: 'p3', kind: 'sleep', lat: 46.0, lon: 9.0, stars: 5, tripId: 'old' };
  const water = { id: 'p4', kind: 'water', lat: 47.0, lon: 7.0 };
  it('the own points keep stars, night and trip; broken values are dropped', () => {
    const list = listOf({ points: [{ ...a, night: '2026-07-04' }, { id: 'q', lat: 1, lon: 1, stars: 9, night: 'soon' }] });
    expect(list[0]).toMatchObject({ stars: 3, night: '2026-07-04', tripId: 'old' });
    expect(list[1].stars).toBeUndefined();
    expect(list[1].night).toBeUndefined();
    expect(newPoint({ lat: 47, lon: 7, kind: 'sleep', stars: 4, night: '2026-07-05', tripId: 't9' })).toMatchObject({ kind: 'sleep', stars: 4, night: '2026-07-05', tripId: 't9' });
  });
  it('only sleep spots, the best first', () => {
    expect(sleepSpots([a, water, b]).map((p) => p.id)).toEqual(['p2', 'p1']);
  });
  it('near the route or the place, not those of this trip', () => {
    const trip = { id: 't', route: { line: [[47.0, 7.05], [47.02, 7.1]] } };
    expect(spotsNear([a, b, far, water], trip).map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(spotsNear([a], { id: 'old', place: { lat: 47, lon: 7 } })).toEqual([]);
    expect(spotsNear([a], { id: 'x', place: { lat: 47, lon: 7 } })[0].km).toBeLessThan(1);
    expect(spotsNear([a], { id: 'x' })).toEqual([]);
  });
  it('stars as text', () => {
    expect(starText(3)).toBe('★★★☆☆');
    expect(starText(0)).toBe('');
  });
});

describe('postcard (1123)', () => {
  it('rides count first, else the route', () => {
    const trip = { id: 't', days: 2, route: { km: 99.6, gainM: 1200 } };
    expect(postcardFacts(trip, [])).toEqual({ km: 100, gainM: 1200, hours: null, days: 2 });
    const rides = [{ tripId: 't', km: 110.4, gainM: 1500, movingH: 5.25 }, { tripId: 't', km: 101.2, gainM: 1600, movingH: 4.5 }, { tripId: 'other', km: 50 }];
    expect(postcardFacts(trip, rides)).toEqual({ km: 212, gainM: 3100, hours: 9.8, days: 2 });
  });
  it('fits the line in the box, north up', () => {
    const pts = fitLine([[47, 7], [47.1, 7.1]], 0, 0, 100, 100);
    expect(pts).toHaveLength(2);
    for (const [x, y] of pts) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
    expect(pts[0][1]).toBeGreaterThan(pts[1][1]); // the south point is lower
    expect(fitLine([[47, 7]], 0, 0, 10, 10)).toEqual([]);
  });
});
