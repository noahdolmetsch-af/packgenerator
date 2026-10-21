// «Strava-Namen schöner» (Noah 21.10.2026 «2a»): Strava's default names in German, at display time.
import { describe, it, expect, afterEach } from 'vitest';
import { lang } from '../src/lib/i18n.svelte.js';
import { deName, stravaName, nameWords, SPORTS } from '../src/lib/stravanames.js';
import { entryTitle } from '../src/lib/kmbook.js';
import { actRow, stravaOfTrip } from '../src/lib/touren/aktivitaeten.js';

afterEach(() => (lang.v = 'en'));

const PARTS = { Morning: 'am Morgen', Lunch: 'am Mittag', Afternoon: 'am Nachmittag', Evening: 'am Abend', Night: 'in der Nacht' };
const MAIN = { Ride: 'Velofahrt', 'Mountain Bike Ride': 'MTB', 'Gravel Ride': 'Gravel', 'E-Bike Ride': 'E-Bike-Fahrt', 'E-Mountain Bike Ride': 'E-MTB', 'Virtual Ride': 'Indoor-Fahrt', Run: 'Lauf', 'Trail Run': 'Traillauf', Walk: 'Spaziergang', Hike: 'Wanderung', Swim: 'Schwimmen', Workout: 'Training', 'Weight Training': 'Krafttraining', Yoga: 'Yoga', 'Nordic Ski': 'Langlauf', 'Backcountry Ski': 'Skitour' };

describe('deName', () => {
  it('gives the examples Noah approved', () => {
    expect(deName('Lunch Mountain Bike Ride', 'de')).toBe('MTB am Mittag');
    expect(deName('Morning Ride', 'de')).toBe('Velofahrt am Morgen');
    expect(deName('Evening Gravel Ride', 'de')).toBe('Gravel am Abend');
    expect(deName('Afternoon Run', 'de')).toBe('Lauf am Nachmittag');
    expect(deName('Night Ride', 'de')).toBe('Velofahrt in der Nacht');
    expect(deName('Morning Walk', 'de')).toBe('Spaziergang am Morgen');
    expect(deName('Lunch Hike', 'de')).toBe('Wanderung am Mittag');
    expect(deName('Evening Weight Training', 'de')).toBe('Krafttraining am Abend');
  });

  it('knows every day part with every main sport', () => {
    for (const [p, dp] of Object.entries(PARTS)) for (const [s, ds] of Object.entries(MAIN)) expect(deName(`${p} ${s}`, 'de')).toBe(`${ds} ${dp}`);
  });

  it('every sport word has a German name without ß', () => {
    for (const v of Object.values(SPORTS)) expect(v).not.toMatch(/ß/);
  });

  it('ignores case and spaces at the edges', () => {
    expect(deName('  lunch mountain bike ride ', 'de')).toBe('MTB am Mittag');
    expect(deName('MORNING  RIDE', 'de')).toBe('Velofahrt am Morgen');
  });

  it('leaves any other name as it is', () => {
    for (const n of ['Über den Pass', 'Velofahrt am Morgen', 'Morning Ride to the lake', 'Ride', 'Morning', 'Sunday Ride', 'Morning Rides', 'Lunch Mountain Bike', '', 'Evening Paragliding']) expect(deName(n, 'de')).toBe(n);
    expect(deName(null, 'de')).toBe(null);
    expect(deName(undefined, 'de')).toBe(undefined);
  });

  it('English keeps Strava’s name', () => {
    expect(deName('Lunch Mountain Bike Ride', 'en')).toBe('Lunch Mountain Bike Ride');
    expect(stravaName('Morning Ride')).toBe('Morning Ride');
    lang.v = 'de';
    expect(stravaName('Morning Ride')).toBe('Velofahrt am Morgen');
  });

  it('search words hold both names', () => {
    lang.v = 'de';
    expect(nameWords('Morning Ride')).toBe('Velofahrt am Morgen Morning Ride');
    expect(nameWords('Zum See')).toBe('Zum See');
  });
});

describe('where the names show', () => {
  it('km-Buch: Strava rides in German, a name typed by hand stays', () => {
    lang.v = 'de';
    expect(entryTitle({ kind: 'ride', source: 'strava', name: 'Lunch Gravel Ride' })).toBe('Gravel am Mittag');
    expect(entryTitle({ kind: 'ride', source: 'hand', name: 'Morning Ride' })).toBe('Morning Ride');
    lang.v = 'en';
    expect(entryTitle({ kind: 'ride', source: 'strava', name: 'Lunch Gravel Ride' })).toBe('Lunch Gravel Ride');
  });

  it('Touren › Fahrten: Strava’s name in German, the own name wins', () => {
    lang.v = 'de';
    expect(actRow({ id: '1', day: '2026-05-02', name: 'Evening Ride', type: 'Ride', kind: 'bike', km: 20 }).name).toBe('Velofahrt am Abend');
    expect(actRow({ id: '2', day: '2026-05-02', name: 'Evening Ride', type: 'Ride', kind: 'bike', km: 20, own: { name: 'Morning Ride' } }).name).toBe('Morning Ride');
    expect(stravaOfTrip({ id: 't', startDate: '2026-05-02', days: 1, status: 'done' }, [], []).n).toBe(0);
  });
});
