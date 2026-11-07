import { describe, it, expect } from 'vitest';
import { rainAhead, skyAhead, stormUrl, HEAVY_RAIN_MM } from '../src/lib/live/live-lib.js';
import { shelterQuery, sheltersFrom, nearestShelter, MAYBE_CLOSED_KM, SHELTER_MAX_KM } from '../src/lib/live/unterstand.js';

const NOW = Date.UTC(2026, 5, 10, 12, 0, 0);
const pts = [{ lat: 46.95, lon: 7.45, km: 10 }, { lat: 46.96, lon: 7.46, km: 20 }];
const h = (code, mm = [0, 0, 0], cape = [0, 0, 0]) => ({ hourly: { time: [NOW / 1000, NOW / 1000 + 3600, NOW / 1000 + 7200], weather_code: code, cape, precipitation: mm } });

describe('Wetter-Ausweichen: heavy rain and thunderstorm', () => {
  it('asks for the rain too', () => {
    expect(stormUrl(pts)).toContain('weather_code%2Ccape%2Cprecipitation');
  });
  it('sees heavy rain by the code or by the amount, not light rain', () => {
    expect(rainAhead([h([1, 2, 3])], pts, NOW)).toBeNull();
    expect(rainAhead([h([61, 61, 61], [1, 2, 3])], pts, NOW)).toBeNull();
    expect(rainAhead([h([1, 65, 3])], pts, NOW)).toEqual({ km: 10, at: NOW + 36e5, sure: true });
    expect(rainAhead([h([1, 2, 3], [0, HEAVY_RAIN_MM, 0])], pts, NOW)).toEqual({ km: 10, at: NOW + 36e5, sure: false });
    expect(rainAhead([h([1, 2, 3]), h([82, 2, 3])], pts, NOW).km).toBe(20);
  });
  it('later than 2 h does not count', () => {
    expect(rainAhead([{ hourly: { time: [NOW / 1000 + 4 * 3600], weather_code: [65], precipitation: [9] } }], pts, NOW)).toBeNull();
  });
  it('a thunderstorm comes before heavy rain', () => {
    expect(skyAhead([h([1, 65, 3], [0, 0, 0], [0, 0, 0])], pts, NOW).kind).toBe('rain');
    expect(skyAhead([h([1, 65, 95])], pts, NOW)).toMatchObject({ kind: 'storm', sure: true });
    expect(skyAhead([h([1, 2, 3])], pts, NOW)).toBeNull();
  });
});

describe('Wetter-Ausweichen: the nearest roof', () => {
  const here = { lat: 46.95, lon: 7.45 };
  const at = (dLat, kind, name = '') => ({ id: `${kind}${dLat}`, kind, name, lat: 46.95 + dLat, lon: 7.45 });
  it('asks Overpass around you for roofs', () => {
    const q = shelterQuery(here);
    expect(q).toContain('(around:3000,46.9500,7.4500)');
    expect(q).toContain('amenity"="shelter');
    expect(q).toContain('bus_stop');
  });
  it('keeps only stops with a roof from the answer', () => {
    const json = { elements: [
      { type: 'node', id: 1, lat: 46.951, lon: 7.45, tags: { amenity: 'shelter', name: 'A' } },
      { type: 'way', id: 2, center: { lat: 46.952, lon: 7.45 }, tags: { railway: 'station', name: 'B' } },
      { type: 'node', id: 3, lat: 46.953, lon: 7.45, tags: { amenity: 'drinking_water' } },
    ] };
    expect(sheltersFrom(json).map((p) => p.name)).toEqual(['A', 'B']);
  });
  it('takes the nearest; a café counts a little further away than a shelter', () => {
    const near = nearestShelter({ here, pois: [at(0.002, 'shelter', 'Dach'), at(0.001, 'water')] });
    expect(near).toMatchObject({ kind: 'shelter', name: 'Dach' });
    expect(near.distKm).toBeCloseTo(0.2, 1);
    // café 100 m away, shelter 300 m away: the café is ranked as 600 m, so the shelter wins
    expect(nearestShelter({ here, pois: [at(0.0009, 'food', 'Café'), at(0.0027, 'shelter', 'Dach')] }).name).toBe('Dach');
    // but a far shelter loses against a café at the door
    expect(nearestShelter({ here, pois: [at(0.0009, 'food', 'Café'), at(0.02, 'shelter', 'Dach')] }).name).toBe('Café');
    expect(MAYBE_CLOSED_KM).toBe(0.5);
  });
  it('knows nothing beyond the range, without a position, or the same place twice', () => {
    expect(nearestShelter({ here, pois: [at((SHELTER_MAX_KM + 1) / 111, 'shelter')] })).toBeNull();
    expect(nearestShelter({ here: null, pois: [at(0.001, 'shelter')] })).toBeNull();
    const twice = nearestShelter({ here, found: [at(0.002, 'shelter', 'Neu')], pois: [at(0.002, 'shelter', 'Alt')] });
    expect(twice.name).toBe('Neu');
  });
});
