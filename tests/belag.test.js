// «Belag und Schwierigkeit» (Noah 05.11.2026 «4a»): the surface and the warnings from BRouter's message table.
import { describe, it, expect } from 'vitest';
import { surfaceOf, kindOfWay, isRough, warnOf, surfaceLine, pct } from '../src/lib/live/belag.js';
import { parseBrouter } from '../src/lib/reroute.js';
import de from '../src/lib/i18n/de/umweg.js';

const HEAD = ['Longitude', 'Latitude', 'Elevation', 'Distance', 'CostPerKm', 'ElevCost', 'TurnCost', 'NodeCost', 'InitialCost', 'WayTags', 'NodeTags', 'Time', 'Energy'];
const row = (d, tags) => ['7000000', '47000000', '500', String(d), '0', '0', '0', '0', '0', tags, '', '0', '0'];
const table = (...rows) => [HEAD, ...rows];

describe('kindOfWay and isRough', () => {
  it('reads the surface tag, else the kind of road', () => {
    expect(kindOfWay({ surface: 'asphalt' })).toBe('paved');
    expect(kindOfWay({ surface: 'fine_gravel' })).toBe('unpaved');
    expect(kindOfWay({ surface: 'weird' })).toBe('unknown');
    expect(kindOfWay({ highway: 'residential' })).toBe('paved');
    expect(kindOfWay({ highway: 'track', tracktype: 'grade4' })).toBe('unpaved');
    expect(kindOfWay({ highway: 'path' })).toBe('unknown');
    expect(kindOfWay({ highway: 'steps' })).toBe('unknown');
  });
  it('rough: bad smoothness, poor track, mtb scale 2 and more, mountain hiking', () => {
    expect(isRough({ smoothness: 'very_bad' })).toBe(true);
    expect(isRough({ tracktype: 'grade5' })).toBe(true);
    expect(isRough({ 'mtb:scale': '2' })).toBe(true);
    expect(isRough({ 'mtb:scale': '0' })).toBe(false);
    expect(isRough({ sac_scale: 'mountain_hiking' })).toBe(true);
    expect(isRough({ smoothness: 'good', surface: 'asphalt' })).toBe(false);
  });
});

describe('surfaceOf', () => {
  it('adds up the stretches in km', () => {
    const s = surfaceOf(table(row(3000, 'highway=residential surface=asphalt'), row(800, 'highway=track surface=gravel smoothness=bad'), row(150, 'highway=path'), row(40, 'highway=steps')));
    expect(s.km).toBe(3.99);
    expect(s.paved).toBe(3);
    expect(s.unpaved).toBe(0.8);
    expect(s.unknown).toBe(0.19);
    expect(s.rough).toBe(0.8);
    expect(s.stepsM).toBe(40);
  });
  it('gives null without a usable table', () => {
    expect(surfaceOf(undefined)).toBeNull();
    expect(surfaceOf([])).toBeNull();
    expect(surfaceOf([['a', 'b']])).toBeNull();
    expect(surfaceOf(table(row(0, 'highway=path')))).toBeNull();
  });
  it('parseBrouter carries it along, and is null for an answer without messages', () => {
    const geo = (messages) => ({ features: [{ geometry: { coordinates: [[8, 47, 400], [8.01, 47.01, 420]] }, properties: { 'track-length': '1000', messages } }] });
    expect(parseBrouter(geo(table(row(1000, 'highway=residential surface=asphalt')))).surface.paved).toBe(1);
    expect(parseBrouter(geo(undefined)).surface).toBeNull();
  });
});

describe('warnOf and surfaceLine', () => {
  const s = { km: 10, paved: 7, unpaved: 2.5, unknown: 0.5, rough: 0.4, stepsM: 20 };
  it('road bike and quiet roads warn about unpaved parts, gravel about rough ones, everybody about steps', () => {
    expect(warnOf(s, 'fastbike').map((w) => w.key)).toEqual(['About {km} km of this way are unpaved. A road bike may find it hard.', 'Steps on the way ({m} m): you may have to carry the bike.', 'Rough stretches (about {km} km): ride slowly.']);
    expect(warnOf(s, 'trekking')[0].key).toBe('About {km} km of this way are unpaved. Check that your tyres suit it.');
    expect(warnOf(s, 'gravel').map((w) => w.key)).toEqual(['Steps on the way ({m} m): you may have to carry the bike.', 'Rough stretches (about {km} km): ride slowly.']);
    expect(warnOf(s, 'mtb').map((w) => w.key)).toEqual(['Steps on the way ({m} m): you may have to carry the bike.']);
  });
  it('a clean way gives no warning and no data gives none either', () => {
    expect(warnOf({ km: 8, paved: 8, unpaved: 0, unknown: 0, rough: 0, stepsM: 0 }, 'fastbike')).toEqual([]);
    expect(warnOf(null, 'fastbike')).toEqual([]);
  });
  it('the line names the unclear part only from 10 %', () => {
    expect(surfaceLine(s).key).toBe('Surface: {paved} % paved, {unpaved} % unpaved');
    expect(surfaceLine({ ...s, unknown: 2 }).key).toBe('Surface: {paved} % paved, {unpaved} % unpaved, {unknown} % unclear');
    expect(surfaceLine(null)).toBeNull();
    expect(pct(7, 10)).toBe(70);
  });
  it('every text has its German', () => {
    const keys = [...warnOf(s, 'fastbike'), ...warnOf(s, 'trekking'), surfaceLine(s), surfaceLine({ ...s, unknown: 2 })].map((x) => x.key);
    for (const k of keys) expect(de[k], k).toBeTruthy();
  });
});
