import { describe, it, expect } from 'vitest';
import { parseWhen } from '../src/lib/merken/parse.js';

const today = '2026-11-05'; // a Thursday

describe('Datum in Alltagssprache (N1)', () => {
  it('finds day, time and repeat and leaves the words', () => {
    const r = parseWhen('Velo putzen morgen 18 Uhr, jeden Sonntag', today);
    expect(r.text).toBe('Velo putzen');
    expect(r.due).toBe('2026-11-06');
    expect(r.remind).toEqual({ at: '18:00', before: 0 });
    expect(r.repeat).toEqual({ every: 'week' });
  });
  it('«jeden Sonntag» alone gives the first Sunday', () => {
    const r = parseWhen('Kette ölen jeden Sonntag', today);
    expect(r).toMatchObject({ text: 'Kette ölen', due: '2026-11-08', repeat: { every: 'week' } });
  });
  it('weekday names, übermorgen, in N days, weekend', () => {
    expect(parseWhen('Hotel anrufen am Freitag', today).due).toBe('2026-11-06');
    expect(parseWhen('Hotel anrufen Donnerstag', today).due).toBe('2026-11-12'); // today is Thursday: the next one
    expect(parseWhen('Service übermorgen', today).due).toBe('2026-11-07');
    expect(parseWhen('Reifen prüfen in 3 Tagen', today).due).toBe('2026-11-08');
    expect(parseWhen('Reifen prüfen in 2 Wochen', today).due).toBe('2026-11-19');
    expect(parseWhen('Putzen am Wochenende', today).due).toBe('2026-11-07');
  });
  it('dates with dots and ISO', () => {
    expect(parseWhen('Geschenk kaufen 24.12.', today).due).toBe('2026-12-24');
    expect(parseWhen('Steuer 02.11.', today).due).toBe('2027-11-02'); // passed: next year
    expect(parseWhen('Test 2026-12-01', today).due).toBe('2026-12-01');
    expect(parseWhen('Test 31.02.', today).due).toBe(null);
  });
  it('a time alone means today; English words work too', () => {
    expect(parseWhen('Anruf um 14:30', today)).toMatchObject({ text: 'Anruf', due: today, remind: { at: '14:30', before: 0 } });
    expect(parseWhen('Call mum tomorrow at 6pm every week', today)).toMatchObject({ text: 'Call mum', due: '2026-11-06', remind: { at: '18:00' }, repeat: { every: 'week' } });
  });
  it('daily and monthly', () => {
    expect(parseWhen('Dehnen täglich', today).repeat).toEqual({ every: 'day' });
    expect(parseWhen('Miete jeden Monat', today).repeat).toEqual({ every: 'month' });
  });
  it('keeps text without any date word, and text made only of date words', () => {
    expect(parseWhen('Zahnriemen prüfen', today)).toMatchObject({ text: 'Zahnriemen prüfen', due: null, found: [] });
    expect(parseWhen('morgen', today)).toMatchObject({ text: 'morgen', due: null, found: [] });
    expect(parseWhen('', today).text).toBe('');
  });
  it('does not cut words that only contain a date word', () => {
    expect(parseWhen('Morgenroutine planen', today).due).toBe(null);
    expect(parseWhen('Heutiges Gewicht notieren', today).due).toBe(null);
  });
});
