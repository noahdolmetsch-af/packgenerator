import { describe, it, expect } from 'vitest';
import { tripDays, diaryFacts, diaryDraft, hasFacts, withDiary } from '../src/lib/lernen/tagebuch.js';
import { filesOfDays, fileDay } from '../src/lib/lernen/fotos.js';

// Paket M «Tour-Tagebuch von selbst»: fictional trip and rides
const trip = {
  id: 'trip-test-1',
  title: 'Zwei Seen Runde',
  startDate: '2026-07-11',
  days: 2,
  forecast: { days: [{ date: '2026-07-11', min: 14, max: 24, rainMm: 0 }, { date: '2026-07-12', min: 12, max: 19, rainMm: 6 }] },
};
const acts = [
  { day: '2026-07-11', name: 'Morgenfahrt', km: 84.2, hm: 1240, movingS: 4 * 3600 + 10 * 60 },
  { day: '2026-07-13', name: 'Heimweg', km: 20, hm: 100, movingS: 3600 },
];
const notes = [{ day: 1, text: 'Kette quietscht', at: '2026-07-12T10:00:00Z' }];

describe('Tour-Tagebuch', () => {
  it('lists the days of a trip', () => {
    expect(tripDays(trip)).toEqual(['2026-07-11', '2026-07-12']);
    expect(tripDays({ startDate: '2026-12-31', days: 2 })).toEqual(['2026-12-31', '2027-01-01']);
  });
  it('collects rides, weather and notes per day, only of the trip days', () => {
    const f = diaryFacts({ trip, activities: acts, notes });
    expect(f).toHaveLength(2);
    expect(f[0].acts).toEqual([{ name: 'Morgenfahrt', km: 84.2, hm: 1240, s: 15000 }]);
    expect(f[1].acts).toEqual([]);
    expect(f[1].weather).toEqual({ min: 12, max: 19, rainMm: 6 });
    expect(f[1].notes).toEqual(['Kette quietscht']);
    expect(hasFacts(f)).toBe(true);
  });
  it('an uploaded ride counts only when Strava has nothing that day', () => {
    const f = diaryFacts({ trip, activities: acts, rides: [{ date: '2026-07-11', km: 80 }, { date: '2026-07-12', km: 55, gainM: 600 }] });
    expect(f[0].rides).toEqual([]);
    expect(f[1].rides).toEqual([{ name: '', km: 55, hm: 600, s: 0 }]);
  });
  it('writes a draft with the totals, each day, what was new and the photos', () => {
    const text = diaryDraft({ trip, facts: diaryFacts({ trip, activities: acts, notes }), neu: ['Kanton Uri', 'Klausenpass'], photos: 3 });
    expect(text.split('\n')[0]).toBe('Zwei Seen Runde: 2 days · 84.2 km · 1,240 m up');
    expect(text).toContain('Strava «Morgenfahrt»');
    expect(text).toContain('in 4 h 10 min');
    expect(text).toContain('Weather: 12 to 19 °C, rain 6 mm');
    expect(text).toContain('Note: «Kette quietscht»');
    expect(text).toContain('New for you: Kanton Uri, Klausenpass');
    expect(text).toContain('3 photos are with it.');
  });
  it('keeps the user text: a draft is written only once', () => {
    const d = withDiary({ tripId: 'x' }, 'Entwurf', new Date('2026-07-13T08:00:00Z'));
    expect(d.diary).toEqual({ text: 'Entwurf', at: '2026-07-13T08:00:00.000Z', edited: false });
    expect(withDiary({ diary: { text: 'Mein Text', edited: true } }, 'neu').diary.text).toBe('Mein Text');
  });
  it('photos: only the files of the trip days stay (a file without a date too)', () => {
    const at = (iso) => ({ lastModified: Date.parse(iso) });
    const files = [at('2026-07-11T21:30:00Z'), at('2026-07-12T23:30:00Z'), {}];
    expect(fileDay(files[0])).toBe('2026-07-11');
    expect(fileDay(files[1])).toBe('2026-07-13'); // 01:30 in Zurich
    expect(filesOfDays(files, '2026-07-11', '2026-07-12')).toHaveLength(2);
  });
});
