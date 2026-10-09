// v0.61.0 R2 «Tempo + Logbuch» (Noah ★a): your rule takes over from 5 rides, one tap back to the
// standard rule; the Logbuch lists all trips and the logbook's entries, filtered by year and area.
import { describe, it, expect } from 'vitest';
import { paceOf, ruleOf, withStandard, paceSeries, learnPace, PACE_MIN } from '../src/lib/pace.js';
import { addToPace, dropFromPace } from '../src/lib/gpx.js';
import { ridingHours } from '../src/lib/route.js';
import { openTodos } from '../src/lib/todos.js';
import { logEntries, logYears, logAreas, logFilter } from '../src/lib/review/logbook.js';

const ride = (n, extra = {}) => ({ id: `r${n}`, name: `Ride ${n}`, date: `2026-0${n}-10`, km: 50, gainM: 600, movingH: (50 / 16 + 1) * 0.8, totalH: 4.5, use: true, ...extra });
const setting = (n, extra = {}) => {
  const rides = Array.from({ length: n }, (_, i) => ride(i + 1));
  return { ...(learnPace(rides) ?? { kmh: null, climbMh: null }), rides, ...extra };
};

describe('your rule from 5 rides (v0.61.0)', () => {
  it('below 5 rides the standard guesses, and says how many are missing', () => {
    expect(PACE_MIN).toBe(5);
    const p = paceOf(setting(4));
    expect(p).toMatchObject({ mine: false, kmh: 16, climbMh: 600, n: 4, need: 1 });
    expect(p.learned).toEqual({ kmh: 20, climbMh: 750 });
    expect(paceOf(null)).toMatchObject({ mine: false, n: 0, need: 5, learned: null });
  });
  it('from 5 rides your rule guesses the riding time by itself', () => {
    const p = paceOf(setting(5));
    expect(p).toMatchObject({ mine: true, kmh: 20, climbMh: 750, n: 5, need: 0 });
    expect(ridingHours({ km: 100, gainM: 1500 }, 1, p)).toBe(7);
    expect(ridingHours({ km: 100, gainM: 1500 }, 1, paceOf(setting(4)))).toBe(9);
  });
  it('«Zurück zur Standardregel» keeps the standard, and adding a ride does not undo that', () => {
    const off = withStandard(setting(6), true);
    expect(paceOf(off)).toMatchObject({ mine: false, kmh: 16, standard: true, need: 0 });
    const more = addToPace(off, ride(7));
    expect(more.standard).toBe(true);
    expect(more.rides).toHaveLength(7);
    expect(dropFromPace(more, 'r7').standard).toBe(true);
    expect(paceOf(withStandard(more, false))).toMatchObject({ mine: true, kmh: 20 });
    // chosen on purpose, the standard is no open to-do
    expect(openTodos({ pace: paceOf(off) }).some((r) => r.key === 'pace')).toBe(false);
    expect(openTodos({ pace: paceOf(setting(2)) }).some((r) => r.key === 'pace')).toBe(true);
  });
  it('the sentence rounds: km/h to a half, climbing to 50 m', () => {
    expect(ruleOf({ kmh: 18.74, climbMh: 738 })).toEqual({ kmh: 18.5, climbMh: 750 });
    expect(ruleOf(null)).toBe(null);
  });
  it('the charts: rides that count, oldest first, from a day on', () => {
    const rides = [ride(3), ride(1), ride(2, { use: false }), ride(4, { km: 12 })];
    expect(paceSeries(rides).map((r) => r.id)).toEqual(['r1', 'r3']);
    expect(paceSeries(rides, '2026-02-01').map((r) => r.id)).toEqual(['r3']);
    expect(paceSeries([ride(1)])[0]).toMatchObject({ kmh: 15.2, hmPerKm: 12 });
  });
});

describe('the Logbuch (v0.61.0)', () => {
  const facts = [
    { id: 't2', kind: 'trip', trip: { id: 't2' }, rides: [], title: 'Herbst', start: '2026-09-26', end: '2026-09-27', days: 2, domain: 'bikepacking', km: 148, gainM: 2210, movingH: 11, rain: { wet: true, days: [2] }, tmin: 4, tmax: 15, learnings: [] },
    { id: 't1', kind: 'trip', trip: { id: 't1' }, rides: [], title: 'Skitour', start: '2026-02-01', end: '2026-02-02', days: 2, domain: 'ski', km: null, gainM: null, movingH: null, rain: { wet: false, days: [] }, tmin: -8, tmax: -2, learnings: [] },
    { id: 'r9', kind: 'ride', trip: null, rides: [{ id: 'r9' }], title: 'Abendrunde', start: '2025-08-01', end: '2025-08-01', days: 1, domain: 'bikepacking', km: 42, gainM: 780, movingH: 3, rain: { wet: null, days: [] }, tmin: null, tmax: null, learnings: [] },
  ];
  const events = [{ id: 'e1', name: 'Alte Tour', note: 'Viel Wind', date: '2024', sortDate: '2024-06-01', source: 'excel' }];
  const debriefs = [{ tripId: 't2', status: 'done', note: 'Überschuhe ab 8 °C' }];
  const notes = [{ id: 'n1', tripId: 't2', day: 1, at: '2026-09-27T10:00:00Z', text: 'Kette quietscht' }];
  const all = logEntries({ facts, events, debriefs, notes });

  it('all trips, rides and logbook entries, newest first, with their notes', () => {
    expect(all.map((e) => e.id)).toEqual(['t2', 't1', 'r9', 'ev:e1']);
    expect(all[0]).toMatchObject({ km: 148, gainM: 2210, year: '2026', notes: ['Überschuhe ab 8 °C', 'Kette quietscht'] });
    expect(all[3]).toMatchObject({ kind: 'event', year: '2024', domain: 'bikepacking', notes: ['Viel Wind'] });
  });
  it('filters by year and area, and finds words in the notes', () => {
    expect(logYears(all)).toEqual(['2026', '2025', '2024']);
    expect(logAreas(all)).toEqual(['bikepacking', 'ski']);
    expect(logFilter(all, { year: '2026' }).map((e) => e.id)).toEqual(['t2', 't1']);
    expect(logFilter(all, { area: 'ski' }).map((e) => e.id)).toEqual(['t1']);
    expect(logFilter(all, { year: '2026', area: 'bikepacking' }).map((e) => e.id)).toEqual(['t2']);
    expect(logFilter(all, { q: 'kette' }).map((e) => e.id)).toEqual(['t2']);
    expect(logFilter(all, { year: '2023' })).toEqual([]);
  });
});
