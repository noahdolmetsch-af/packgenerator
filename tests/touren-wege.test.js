// UI-Prüfung 07.11.2026 T2: the ways on a planned trip's card, by phase. Fictional data, calendar days.
import { describe, it, expect } from 'vitest';
import { tripWays, phaseOf, lastDay } from '../src/lib/touren/wege.js';

const trip = (startDate, days = 1) => ({ id: 'tour-1', startDate, days });

describe('Wege auf der Tourkarte', () => {
  it('last day counts calendar days, also over the change to winter time', () => {
    expect(lastDay(trip('2026-10-24', 3))).toBe('2026-10-26');
    expect(lastDay(trip('2026-10-31', 2))).toBe('2026-11-01');
    expect(lastDay({ id: 'x' })).toBeNull();
  });

  it('before and on the last day: Packen, Wetter (of this trip), Form', () => {
    const w = tripWays(trip('2026-11-21'), '2026-11-18');
    expect(w.map((x) => x.key)).toEqual(['pack', 'weather', 'form']);
    expect(w.find((x) => x.key === 'weather').href).toBe('#/wetter?trip=tour-1');
    expect(phaseOf(trip('2026-11-18', 2), '2026-11-19')).toBe('before'); // day 2 of 2 is still the trip
  });

  it('after the last day: Rückblick of this trip and Form, no Packen and no Wetter', () => {
    const w = tripWays(trip('2026-11-10', 2), '2026-11-12');
    expect(w.map((x) => x.key)).toEqual(['review', 'form']);
    expect(w[0].href).toBe('#/debrief/tour-1');
  });

  it('a trip without a date counts as before; no trip, no ways', () => {
    expect(tripWays({ id: 'a' }, '2026-11-18').map((x) => x.key)).toEqual(['pack', 'weather', 'form']);
    expect(tripWays(null, '2026-11-18')).toEqual([]);
  });

  it('the id is encoded in the links', () => {
    expect(tripWays({ id: 'a b', startDate: '2026-11-30' }, '2026-11-18')[1].href).toBe('#/wetter?trip=a%20b');
  });
});
