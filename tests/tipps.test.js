// «Heute passt: Ausflugstipps» (Träume und Neuland N3, Noah 27.10.2026 «1-5 a»): three new places that fit the day.
import { describe, it, expect } from 'vitest';
import { tripTips, reachKm, freeTime, startHours, pointOf, TIP_HOURS, TIP_HOURS_STD, MIN_KM } from '../src/lib/neuland/tipps.js';

const HOME = { lat: 47.0, lon: 8.0 };
const P = 'test_data_gtp_';
// fictional places: 0.1° north ≈ 11 km, 0.15° east ≈ 11 km at this latitude
const col = (id, items, visited = []) => ({ id, items, visited: new Map(visited.map((v) => [v, { day: '2026-01-01' }])) });
const pt = (id, name, lat, lon) => ({ id, name: `${P}${name}`, lat, lon });

describe('trip tips', () => {
  it('reach grows with the hours and stays a round there and back', () => {
    expect(reachKm(3)).toBeGreaterThan(reachKm(2));
    expect(reachKm(3)).toBeCloseTo((3 * 19) / 2 / 1.3, 5);
  });

  it('reads points and the middle of areas', () => {
    expect(pointOf({ lat: 47, lon: 8 })).toEqual([47, 8]);
    expect(pointOf({ c: [8, 47] })).toEqual([47, 8]);
    expect(pointOf({})).toBe(null);
  });

  it('gives three places never visited, within reach, from different directions and kinds', () => {
    const cols = [
      col('passes', [pt('p1', 'Nordpass', 47.15, 8.0), pt('p2', 'Weitpass', 48.5, 8.0)]),
      col('lakes', [pt('l1', 'Ostsee', 47.0, 8.2), pt('l2', 'Besucht', 46.9, 8.0)], ['l2']),
      col('municipalities', [{ id: 'm1', name: `${P}Südwil`, c: [8.0, 46.85] }, { id: 'm2', name: `${P}Nahdorf`, c: [8.0, 47.01] }]),
      col('peaks', [pt('k1', 'Gipfel', 47.0, 7.8)]),
    ];
    const tips = tripTips(cols, HOME, { hours: 3 });
    expect(tips.map((x) => x.id).sort()).toEqual(['l1', 'm1', 'p1']);
    expect(new Set(tips.map((x) => x.sector)).size).toBe(3);
    for (const x of tips) {
      expect(x.km).toBeGreaterThanOrEqual(MIN_KM);
      expect(x.km).toBeLessThanOrEqual(reachKm(3));
      expect(Math.abs(x.roundKm - 2 * x.km * 1.3)).toBeLessThanOrEqual(1);
    }
  });

  it('gives nothing without a home place, and fewer when little is in reach', () => {
    expect(tripTips([col('passes', [pt('p1', 'A', 47.15, 8.0)])], null)).toEqual([]);
    expect(tripTips([col('passes', [pt('p1', 'A', 47.1, 8.0), pt('p2', 'B', 47.5, 8.0)])], HOME, { hours: 2 })).toHaveLength(1);
  });

  it('fills up from the same direction when there is nothing else', () => {
    const cols = [col('lakes', [pt('a', 'A', 47.12, 8.0), pt('b', 'B', 47.14, 8.0), pt('c', 'C', 47.16, 8.0), pt('d', 'D', 47.18, 8.0)])];
    expect(tripTips(cols, HOME, { hours: 3 })).toHaveLength(3);
  });
});

describe('free time from the calendar', () => {
  const day = '2026-10-28';
  const ev = (start, end, more = {}) => ({ id: start, start: `${day}T${start}:00+01:00`, end: `${day}T${end}:00+01:00`, ...more });

  it('finds the longest gap between 08:00 and 20:00', () => {
    expect(freeTime([ev('08:30', '12:00'), ev('13:00', '14:00')], day)).toEqual({ hours: 6, from: '14:00', to: '20:00' });
    expect(freeTime([], day)).toEqual({ hours: 12, from: '08:00', to: '20:00' });
  });

  it('leaves out free events, and a full day gives null', () => {
    expect(freeTime([ev('08:00', '20:00', { busy: false })], day)?.hours).toBe(12);
    expect(freeTime([ev('07:00', '21:00')], day)).toBe(null);
    expect(freeTime([{ allDay: true, day, lastDay: day }], day)).toBe(null);
  });

  it('starts at now on the day itself', () => {
    expect(freeTime([], day, `${day}T15:10:00+01:00`)).toEqual({ hours: 4.5, from: '15:30', to: '20:00' });
    expect(freeTime([], day, `${day}T20:10:00+01:00`)).toBe(null);
  });

  it('snaps the hours to a choice', () => {
    expect(startHours(null)).toBe(TIP_HOURS_STD);
    expect(startHours({ hours: 4.5 })).toBe(4);
    expect(startHours({ hours: 12 })).toBe(6);
    expect(startHours({ hours: 1 })).toBe(TIP_HOURS[0]);
  });
});
