// «Aktiv neu» (Noah 22.10.2026, Beschreibung «Aktiv-Bereich»): Aktiv is for doing (Heute, Meine Sportarten,
// Training, Erholung), «Auswerten» for looking; it shares Aktiv's place in the bar. Pure functions, no data.
import { describe, it, expect } from 'vitest';
import { PLACES, SIDE_PLACES, PLACE_TABS, ANALYSIS, barPlace, placeOf, pageOf } from '../src/lib/nav.js';
import { sportHref, actSport } from '../src/lib/flow/mysports.js';
import { BIKE_ACT } from '../src/lib/sportsbase.js';

describe('the places', () => {
  it('the bar: Heute, Planen, Touren, Aktiv, Velos (and Material); Auswerten shares Aktiv', () => {
    expect(PLACES.map((p) => p.key)).toContain('active');
    expect(PLACES.map((p) => p.key)).not.toContain('analysis');
    expect(PLACES.find((p) => p.key === 'active').href).toBe('#/flow');
    expect(ANALYSIS.shares).toBe('active');
    expect(barPlace('analysis')).toBe('active');
    const side = SIDE_PLACES.map((p) => p.key);
    expect(side.indexOf('analysis')).toBe(side.indexOf('active') + 1);
  });
  it('Aktiv has the four tabs of the spec, Auswerten the looking pages', () => {
    expect(PLACE_TABS.active.map((x) => x.key)).toEqual(['today', 'sports', 'training', 'rest']);
    expect(PLACE_TABS.analysis.map((x) => x.key)).toEqual(expect.arrayContaining(['start', 'form', 'body', 'rides', 'ticks', 'history', 'wohl', 'impulse', 'insights', 'weight', 'milestones']));
  });
  it('the start of Auswerten is its own page', () => {
    expect(pageOf('#/auswerten')).toBe('auswerten');
    expect(placeOf('auswerten')).toBe('analysis');
    expect(placeOf('flow', '#/flow')).toBe('active');
    expect(placeOf('flow', '#/flow/form')).toBe('analysis');
  });
});

describe('Meine Sportarten', () => {
  it('a sport opens its page; Meditation keeps its page with the timer', () => {
    expect(sportHref({ id: 'yoga' })).toBe('#/flow/sport/act%3Ayoga');
    expect(sportHref({ id: 'meditation' })).toBe('#/flow/act/meditation');
    expect(sportHref({ id: 'm2', page: 'meditation' })).toBe('#/flow/act/m2');
    expect(sportHref(null)).toBe('#/flow/sports');
  });
  it('the sport of an activity, also of the bike activity the list of sports leaves out', () => {
    expect(actSport({ id: 'yoga', name: 'Yoga', icon: 'leaf', ring: 'rest' })).toMatchObject({ id: 'act:yoga', kind: 'act', key: 'yoga', icon: 'leaf', ring: 'rest', bike: false });
    expect(actSport({ id: BIKE_ACT, name: 'Velo' }).bike).toBe(true);
    expect(actSport(undefined)).toBe(null);
  });
});
