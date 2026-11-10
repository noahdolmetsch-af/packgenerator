// «Traum der Woche» (Noah 07.11.2026 «1a … 3a»): which dream the tile on Heute shows, and when it stays away.
import { describe, it, expect } from 'vitest';
import { wochentraum, candidates, datesOf, goodWindow, badReasons, dayGood, NIGHT } from '../src/lib/dreams/wochentraum.js';
import { placeKey } from '../src/lib/dreams/wetterfenster.js';
import { withWochentraum, wallOf, wallRecord, TILE, READY } from '../src/lib/home/tiles.js';

const HOME = { lat: 47.38, lon: 8.54 };
const KEY = placeKey(HOME);
const day = (date, o = {}) => ({ date, rainMm: 0, rainPct: 10, min: 9, wind: 12, max: 18, ...o });
const kept = (days) => ({ places: { [KEY]: { fetchedAt: '2026-11-07T08:00:00Z', days } } });
const TODAY = '2026-11-07';
// fictional dreams
const race = { id: 'r', title: 'Nachtrennen Beispiel', kind: 'race', days: 2, raceDate: '2026-11-12', night: true, at: 'x' };
const tour = { id: 't', title: 'Jura-Runde', kind: 'gravel', days: 2, months: [11], at: 'x' };
const store = (...dreams) => ({ dreams });

describe('good days and nights', () => {
  it('a night ride also needs a night above 5 °C and little wind', () => {
    expect(NIGHT).toEqual({ minTemp: 5, maxWind: 30 });
    expect(dayGood(day('2026-11-12'), true)).toBe(true);
    expect(badReasons(day('2026-11-12', { min: 3 }), true)).toEqual(['cold']);
    expect(badReasons(day('2026-11-12', { wind: 45 }), true)).toEqual(['wind']);
    expect(badReasons(day('2026-11-12', { rainMm: 4, min: 2 }), true)).toEqual(['rain', 'cold']);
    expect(dayGood(day('2026-11-12', { min: 3 }), false)).toBe(true);
    expect(dayGood(day('2026-11-12', { min: undefined, wind: undefined }), true)).toBe(true); // unknown never counts against it
  });

  it('dates of a dream with a fixed date, and the first good window', () => {
    expect(datesOf(race)).toEqual(['2026-11-12', '2026-11-13']);
    expect(datesOf(tour)).toEqual([]);
    const days = [day('2026-11-07'), day('2026-11-08', { rainMm: 5 }), day('2026-11-09'), day('2026-11-10'), day('2026-11-11')];
    expect(goodWindow(days, TODAY, 2)).toEqual({ from: '2026-11-09', to: '2026-11-11', n: 3 });
    expect(goodWindow(days, TODAY, 4)).toBe(null);
  });
});

describe('the dream of the week', () => {
  it('a dated dream inside the forecast shows its countdown and the weather for exactly its days', () => {
    const w = wochentraum(store(race), HOME, kept([day('2026-11-11'), day('2026-11-12'), day('2026-11-13')]), TODAY);
    expect(w.dated).toBe(true);
    expect(w.until).toBe(5);
    expect(w.known).toBe(true);
    expect(w.good).toBe(true);
    expect(w.days.map((d) => d.date)).toEqual(['2026-11-12', '2026-11-13']);
  });

  it('a cold night or rain on one race day makes it «not ideal» and names why', () => {
    const w = wochentraum(store(race), HOME, kept([day('2026-11-12'), day('2026-11-13', { min: 2, rainMm: 3 })]), TODAY);
    expect(w.good).toBe(false);
    expect(w.days[1].why).toEqual(['rain', 'cold']);
  });

  it('a dated dream beyond the forecast counts down only and says when the forecast reaches it', () => {
    const far = { ...race, raceDate: '2026-12-20' };
    const w = wochentraum(store(far), HOME, kept([day('2026-11-08')]), TODAY);
    expect(w.until).toBe(43);
    expect(w.known).toBe(false);
    expect(w.good).toBe(null);
    expect(w.wait).toBe(28);
    // more than 90 days away: nothing
    expect(wochentraum(store({ ...race, raceDate: '2027-05-05' }), HOME, null, TODAY)).toBe(null);
  });

  it('a dream without a date needs the right month and dry days in a row, else the tile stays away', () => {
    const wet = kept([day('2026-11-08', { rainMm: 5 }), day('2026-11-09'), day('2026-11-10', { rainMm: 5 })]);
    expect(wochentraum(store(tour), HOME, wet, TODAY)).toBe(null);
    const dry = kept([day('2026-11-08', { rainMm: 5 }), day('2026-11-09'), day('2026-11-10')]);
    const w = wochentraum(store(tour), HOME, dry, TODAY);
    expect(w.dated).toBe(false);
    expect(w.window).toEqual({ from: '2026-11-09', to: '2026-11-10', n: 2 });
    // the wrong month: nothing
    expect(wochentraum(store({ ...tour, months: [7] }), HOME, dry, TODAY)).toBe(null);
    // a dream that is a trip already, or nothing at all
    expect(wochentraum(store({ ...tour, tripId: 'x' }), HOME, dry, TODAY)).toBe(null);
    expect(wochentraum(null, HOME, null, TODAY)).toBe(null);
  });

  it('a dated dream inside the forecast leads over a dream without a date; a past dream is never shown', () => {
    const dry = kept([day('2026-11-09'), day('2026-11-10'), day('2026-11-12'), day('2026-11-13')]);
    expect(wochentraum(store(tour, race), HOME, dry, TODAY).dream.id).toBe('r');
    expect(wochentraum(store({ ...race, raceDate: '2026-11-01', days: 2 }), HOME, dry, TODAY)).toBe(null);
  });

  it('fetches the forecast for the dreams that can show', () => {
    expect(candidates(store(tour, race, { ...tour, id: 'u', months: [7] }, { ...race, id: 'far', raceDate: '2027-05-05' }), TODAY).map((d) => d.id)).toEqual(['t', 'r']);
  });
});

describe('the tile on the wall', () => {
  it('a wall of before (v < 20) gets it once under «Discover»; a wall without the moment cards stays as it is', () => {
    expect(withWochentraum([{ id: 'moment', size: 'long' }, { id: 'discover', size: 'long' }, { id: 'week', size: 'l' }]).map((x) => x.id)).toEqual(['moment', 'discover', 'wochentraum', 'week']);
    expect(withWochentraum([{ id: 'week', size: 'l' }]).map((x) => x.id)).toEqual(['week']);
    expect(wallOf({ v: 18, tiles: [{ id: 'moment', size: 'long' }, { id: 'week', size: 'l' }] }).map((x) => x.id)).toEqual(['meinetour', 'moment', 'wochentraum', 'spruch', 'week']); // + «Meine Tour» (v < 21) on top
    // stored as v 19 (after «Spruch»): gets it once; stored as v 20: taken away stays away (both get «Meine Tour», v < 21)
    expect(wallOf({ v: 19, tiles: [{ id: 'moment', size: 'long' }, { id: 'week', size: 'l' }] }).map((x) => x.id)).toEqual(['meinetour', 'moment', 'wochentraum', 'week']);
    expect(wallOf({ v: 20, tiles: [{ id: 'moment', size: 'long' }, { id: 'week', size: 'l' }] }).map((x) => x.id)).toEqual(['meinetour', 'moment', 'week']);
    expect(wallRecord([]).v).toBe(21);
    expect(TILE.wochentraum.sizes).toEqual(['long']);
    expect(READY.some((x) => x.id === 'wochentraum')).toBe(true);
  });
});
