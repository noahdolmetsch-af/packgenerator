// «Weg zum Ziel» › Wetterfenster (Noah 05.11.2026 «4a»): the days around the start, from the forecast the tour saved.
import { describe, it, expect } from 'vitest';
import { windowOf, sayWindow, SHOW_FROM, AROUND } from '../src/lib/weg/wetter.js';
import wetter from '../src/lib/weg/types/wetter.js';
import { TYPES, typeOf } from '../src/lib/weg/types/index.js';
import { newGoal, applyAuto, addSteps } from '../src/lib/weg/weg.js';
import DE from '../src/lib/i18n/de/weg-wetter.js';

const start = '2027-05-15';
const goal = (extra = {}) => ({ ...newGoal({ title: 'Rennen im Mai', kind: 'race', start }, { id: 'g1', now: '2027-01-01T00:00:00Z' }), ...extra });
const day = (date, rainPct) => ({ date, rainPct, rainMm: 0 });
const trip = (days, extra = {}) => ({ id: 't1', startDate: start, forecast: { days }, ...extra });
// Mo 10 … So 16 as in the mockup: wet Mon to Wed, dry Thu to Sat, Sun 30 %
const WEEK = [day('2027-05-10', 40), day('2027-05-11', 80), day('2027-05-12', 70), day('2027-05-13', 10), day('2027-05-14', 5), day('2027-05-15', 10), day('2027-05-16', 30)];

describe('Weather window for the start', () => {
  it('is a registered kind with one suggestion a week before', () => {
    expect(TYPES).toContain(wetter);
    expect(typeOf('wetter')).toBe(wetter);
    expect(wetter.defaults(goal())).toEqual([expect.objectContaining({ key: 'window', offset: SHOW_FROM })]);
    expect(DE['Weather window for the start']).toBe('Wetterfenster zum Start');
  });
  it('never ticks by itself', () => {
    const g = addSteps(goal(), wetter.defaults(goal()).map((s) => ({ ...s, type: 'wetter' })));
    expect(applyAuto(g, TYPES, { today: '2027-05-14' })).toBe(g);
  });
  it('shows nothing before the last week, after the start, or without a start day', () => {
    expect(windowOf(goal(), [trip(WEEK)], '2027-05-01', 30)).toBeNull();
    expect(windowOf(goal(), [trip(WEEK)], '2027-05-16', 30)).toBeNull();
    expect(windowOf(goal({ start: '' }), [trip(WEEK)], '2027-05-10', 30)).toBeNull();
  });
  it('shows the days around the start with their rain chance, wet from the limit on', () => {
    const w = windowOf(goal(), [trip(WEEK)], '2027-05-08', 30);
    expect(w.state).toBe('window');
    expect(w.days.map((d) => [d.date.slice(8), d.pct, d.wet])).toEqual([['12', 70, true], ['13', 10, false], ['14', 5, false], ['15', 10, false], ['16', 30, true]]);
    expect(AROUND).toBe(3);
  });
  it('finds the dry run that holds the start day', () => {
    const w = windowOf(goal(), [trip(WEEK)], '2027-05-10', 30);
    expect(w.run).toEqual({ from: '2027-05-13', to: '2027-05-15' });
    expect(w.startWet).toBe(false);
    expect(w.wetBefore).toEqual(['2027-05-12']); // only the days from three before the start on are shown
  });
  it('says so when the start day is wet, and keeps the limit of the app', () => {
    const wet = WEEK.map((d) => (d.date === start ? day(start, 60) : d));
    const w = windowOf(goal(), [trip(wet)], '2027-05-10', 30);
    expect(w.startWet).toBe(true);
    expect(w.run).toBeNull();
    expect(sayWindow(w)).toMatchObject({ title: 'Rain around the start', vars: { pct: 60 } });
    // with a higher limit the same 60 % day is dry
    expect(windowOf(goal(), [trip(wet)], '2027-05-10', 70).startWet).toBe(false);
  });
  it('uses the trip of the way: its tripId, else the trip that starts that day', () => {
    const other = trip(WEEK, { id: 't2', startDate: '2027-06-01' });
    const mine = trip(WEEK.map((d) => ({ ...d, rainPct: 90 })), { id: 't9', startDate: '2027-01-01' });
    expect(windowOf(goal({ tripId: 't9' }), [other, mine], '2027-05-10', 30).days.every((d) => d.wet)).toBe(true);
    expect(windowOf(goal(), [other, trip(WEEK)], '2027-05-10', 30).days.length).toBeGreaterThan(0);
  });
  it('says there is no forecast when the tour has none, never an error', () => {
    for (const trips of [[], [trip([])], [{ id: 't1', startDate: start }]]) {
      const w = windowOf(goal(), trips, '2027-05-10', 30);
      expect(w.state).toBe('nodata');
      expect(sayWindow(w).title).toBe('No forecast saved yet');
    }
  });
  it('names the dry window and has a German text for every key it can say', () => {
    const w = windowOf(goal(), [trip(WEEK)], '2027-05-10', 30);
    const s = sayWindow(w);
    expect(s).toMatchObject({ title: 'Dry from {from} to {to}', text: 'Your start is in a dry window.' });
    expect(s.extra).toBe('Wet days before the start: better a rehearsal indoors.');
    const keys = [s.title, s.text, s.extra, 'No forecast saved yet', 'Rain around the start', 'Dry on the start day', 'Forecast around the start', 'The start day is not in the forecast yet.', 'Your start looks wet ({pct} % rain). A hint only: you decide.', wetter.defaults(goal())[0].title, wetter.defaults(goal())[0].note, sayWindow(null).text];
    for (const k of keys) expect(DE[k], k).toBeTruthy();
  });
});
