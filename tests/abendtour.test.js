import { describe, it, expect } from 'vitest';
import { tripToday, rateEvening } from '../src/lib/lernen/abendtour.js';
import { diaryFacts, diaryDraft } from '../src/lib/lernen/tagebuch.js';

// Paket M #223 «Heutige Tour im Abend-Rückblick bewerten»: fictional trips
const trips = [
  { id: 'a', title: 'Seenrunde', startDate: '2026-07-10', days: 3 },
  { id: 'b', title: 'Ausgelassen', startDate: '2026-07-11', days: 1, skipped: true },
  { id: 'c', title: 'Später', startDate: '2026-07-20', days: 1 },
];

describe('rate the trip in the evening', () => {
  it('finds the trip that runs today, not a skipped or later one', () => {
    expect(tripToday(trips, '2026-07-11')?.id).toBe('a');
    expect(tripToday(trips, '2026-07-12')?.id).toBe('a');
    expect(tripToday(trips, '2026-07-13')).toBeNull();
    expect(tripToday(trips, '2026-07-20')?.id).toBe('c');
  });
  it('keeps the score per day in the debrief, makes a draft when there is none, and takes it back', () => {
    const d1 = rateEvening(null, trips[0], '2026-07-10', 8, '2026-07-10T20:00:00Z');
    expect(d1).toMatchObject({ tripId: 'a', status: 'draft', evening: { '2026-07-10': 8 } });
    const d2 = rateEvening({ ...d1, note: 'schön' }, trips[0], '2026-07-11', 12);
    expect(d2.evening).toEqual({ '2026-07-10': 8, '2026-07-11': 10 });
    expect(d2.note).toBe('schön');
    expect(rateEvening(d2, trips[0], '2026-07-10', null).evening).toEqual({ '2026-07-11': 10 });
  });
  it('the diary draft names the score of the day', () => {
    const facts = diaryFacts({ trip: trips[0], evening: { '2026-07-11': 7 } });
    expect(facts.map((f) => f.score)).toEqual([null, 7, null]);
    expect(diaryDraft({ trip: trips[0], facts })).toContain('Rated in the evening: 7 of 10');
  });
});
