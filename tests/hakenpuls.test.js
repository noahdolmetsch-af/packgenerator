// «Garmin gegen Fitbit» (Noah 27.11.2026, Paket B): src/lib/flow/hakenpuls.js
import { describe, it, expect } from 'vitest';
import { pulsePairs, pulseSummary, windowDays, windowFrom } from '../src/lib/flow/hakenpuls.js';

const bike = (start, min, hr) => ({ type: 'OUTDOOR_BIKE', name: 'Radfahren', start, min, hr });
const ride = (day, time, hrAvg, device = 'Garmin Edge 1040') => ({ id: `${day}${time}`, day, time, device, hrAvg, type: 'Ride', name: 'Abendrunde', elapsedS: 3600, movingS: 3500 });

describe('Garmin gegen Fitbit', () => {
  it('pairs a Fitbit workout with the Garmin recording of the same session', () => {
    const health = [{ date: '2026-11-20', exercises: [bike('18:05', 55, 128)] }];
    const p = pulsePairs({ health, activities: [ride('2026-11-20', '18:00', 140)], from: '2026-11-01', to: '2026-11-25' });
    expect(p).toEqual([{ day: '2026-11-20', name: 'Abendrunde', garmin: 140, fitbit: 128, diff: -12 }]);
  });

  it('leaves out Strava rides that are not from a Garmin, plain walks, other days and missing pulses', () => {
    const health = [
      { date: '2026-11-20', exercises: [bike('18:05', 55, 128), { type: 'WALKING', name: 'Gehen', start: '12:00', min: 30, hr: 90 }] },
      { date: '2026-11-10', exercises: [bike('18:05', 55, 128)] },
      { date: '2026-11-21', exercises: [bike('18:05', 55, undefined)] },
    ];
    const acts = [ride('2026-11-20', '18:00', 140, 'iPhone'), ride('2026-11-10', '18:00', 140), ride('2026-11-21', '18:00', 140)];
    expect(pulsePairs({ health, activities: acts, from: '2026-11-15', to: '2026-11-25' })).toEqual([]);
  });

  it('joins the pieces the watch cut a ride into and lists the newest first', () => {
    const health = [
      { date: '2026-11-20', exercises: [{ ...bike('18:05', 25, 120), end: '18:30' }, { ...bike('18:35', 25, 130), end: '19:00' }] },
      { date: '2026-11-22', exercises: [bike('09:02', 50, 100)] },
    ];
    const acts = [ride('2026-11-20', '18:00', 140), ride('2026-11-22', '09:00', 110)];
    const p = pulsePairs({ health, activities: acts, from: '2026-11-01', to: '2026-11-25' });
    expect(p.map((x) => x.day)).toEqual(['2026-11-22', '2026-11-20']);
    expect(p[1].fitbit).toBe(125); // the mean of the pieces, weighted by minutes
  });

  it('gives a summary only from 3 pairs', () => {
    const mk = (diff) => ({ day: 'd', name: '', garmin: 140, fitbit: 140 + diff, diff });
    expect(pulseSummary([mk(-5), mk(-7)])).toBeNull();
    expect(pulseSummary([mk(-5), mk(-7), mk(-3)])).toEqual({ n: 3, mean: -5, abs: 5, direction: 'under' });
    expect(pulseSummary([mk(4), mk(6), mk(5)]).direction).toBe('over');
    expect(pulseSummary([mk(1), mk(-1), mk(0)]).direction).toBe('same');
  });

  it('looks back at least 90 days', () => {
    expect(windowDays(10)).toBe(90);
    expect(windowDays(365)).toBe(365);
    expect(windowFrom('2026-11-25', 10)).toBe('2026-08-28');
  });
});
