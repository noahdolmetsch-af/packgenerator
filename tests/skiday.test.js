// Skitour «Planen und Unterwegs» (SKB1–SKB3, SKB5, SKB6; Noah 15.10.2026 «1a 2a»). Fictional data only.
import { describe, it, expect } from 'vitest';
import { lastHere, turnFromTrain, daylight, addPoint, dropPoint, reachPoint, underWay, leftText, pointsOf } from '../src/lib/skiday.js';

const TODAY = '2026-12-20';
const trip = (id, startDate, ski = {}, more = {}) => ({ id, domain: 'ski', title: `Test ${id}`, startDate, status: startDate < TODAY ? 'done' : 'planned', ski, ...more });
const mins = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3));

describe('SKB1 the last time here', () => {
  const next = trip('n', '2026-12-27', { peak: 'Muster-Gipfel' });
  it('finds the last past tour to the same peak, with its time and note', () => {
    const trips = [trip('a', '2025-02-14', { peak: 'muster-gipfel ', activeMin: 185, good: 'Pulver am Nordhang' }), trip('b', '2026-01-10', { peak: 'Muster-Gipfel', change: 'früher los' }), trip('c', '2026-03-01', { peak: 'Anderer Gipfel' }), next];
    const r = lastHere(next, trips, TODAY);
    expect(r.trip.id).toBe('b');
    expect(r.note).toBe('früher los');
    expect(lastHere(trips[1], trips, TODAY).activeMin).toBe(185);
  });
  it('falls back to the place; nothing without a peak or place', () => {
    const p = trip('p', '2026-12-27', {}, { place: { name: 'Testdorf' } });
    expect(lastHere(p, [trip('q', '2026-02-01', {}, { place: { name: 'Testdorf' } }), p], TODAY).trip.id).toBe('q');
    expect(lastHere(trip('x', '2026-12-27'), [trip('y', '2026-02-01')], TODAY)).toBeNull();
  });
});

describe('SKB2 the last train back', () => {
  it('suggests a turnaround: train minus the way down and a buffer', () => {
    expect(turnFromTrain('17:12')).toBe('14:42');
    expect(turnFromTrain('17:12', 180, 30)).toBe('13:42');
    expect(turnFromTrain('17.12', 120, 0)).toBe('15:12');
    expect(turnFromTrain('')).toBe('');
    expect(turnFromTrain('01:00')).toBe('');
  });
});

describe('SKB3 daylight', () => {
  it('sunrise and sunset in Zurich time, a few minutes exact', () => {
    const d = daylight('2026-01-15', { lat: 46.95, lon: 7.45 });
    expect(Math.abs(mins(d.rise) - mins('08:13'))).toBeLessThanOrEqual(4);
    expect(Math.abs(mins(d.set) - mins('17:06'))).toBeLessThanOrEqual(4);
    expect(d.rough).toBe(false);
  });
  it('summer time counts; without a place the middle of Switzerland, marked rough', () => {
    const d = daylight('2026-04-15', null);
    expect(d.rough).toBe(true);
    expect(mins(d.set)).toBeGreaterThan(mins('20:00'));
    expect(daylight('nope')).toBeNull();
  });
});

describe('SKB5 and SKB6 on the way', () => {
  it('adds, reaches and removes decision points', () => {
    let p = addPoint([], '  Sattel ', 'a');
    p = addPoint(p, '', 'x');
    p = addPoint(p, 'Vorgipfel', 'b');
    expect(p.map((x) => x.name)).toEqual(['Sattel', 'Vorgipfel']);
    p = reachPoint(p, 'a', '10:05');
    expect(p[0].at).toBe('10:05');
    expect(reachPoint(p, 'a', '10:07')[0].at).toBe('');
    expect(dropPoint(p, 'a').map((x) => x.id)).toEqual(['b']);
    const two = addPoint(addPoint([], 'Eins'), 'Zwei'); // in the same moment: still two keys
    expect(new Set(two.map((x) => x.id)).size).toBe(2);
  });
  it('the time to the turnaround, only on the day once started', () => {
    const t = trip('u', TODAY, { startedAt: '2026-12-20T07:30:00Z', turnAt: '13:30', points: [{ id: 'a', name: 'Sattel', at: '10:05' }, { id: 'b', name: 'Grat', at: '' }] });
    const now = new Date(2026, 11, 20, 12, 10);
    const u = underWay(t, TODAY, now);
    expect(u).toMatchObject({ turnAt: '13:30', left: 80, reached: 1 });
    expect(leftText(u.left)).toBe('1:20');
    expect(underWay(t, TODAY, new Date(2026, 11, 20, 13, 45)).left).toBe(-15);
    expect(underWay({ ...t, ski: { ...t.ski, startedAt: null } }, TODAY, now)).toBeNull();
    expect(underWay(t, '2026-12-21', now)).toBeNull();
    expect(pointsOf(t)).toHaveLength(2);
  });
});
