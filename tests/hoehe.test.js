// «Temperaturen nach Höhe» (Noah 05.11.2026): the temperature at fixed heights from the shared air layers, made-up weather.
import { describe, it, expect } from 'vitest';
import { atLocal } from '../src/lib/wetter/kern.js';
import { parseProfil, LEVELS } from '../src/lib/wetter/profil.js';
import { HEIGHTS, SKI_HEIGHTS, SPOTS, PEAKS, tempIn, tempNow, rowOf, rowsOf, hasValue, zeroLine, selOf, itemOf, ownOf, toggleSel, newOwnId, peaksNear } from '../src/lib/wetter/hoehe.js';

const OFF = 3600;
const DAY = '2026-11-05';
const t0 = Date.parse(`${DAY}T00:00:00Z`) - OFF * 1000;
const at = (h) => atLocal(DAY, h, OFF);

// A made-up day over a place at 410 m: layers as in a standard atmosphere (m above sea level, °C)
const Z = { 1000: 110, 975: 330, 950: 550, 925: 780, 900: 1000, 850: 1500, 800: 1950, 700: 3000, 600: 4200 };
const T = { 1000: 10, 975: 8, 950: 6.5, 925: 5, 900: 3.5, 850: 0.5, 800: -2.5, 700: -9, 600: -19 };

// 72 hours; day n is `n * 4` degrees warmer, from 12 h on the air is 2 degrees warmer than in the morning
function api({ elevation = 410, shift = (h) => Math.floor(h / 24) * 4 + (h % 24 >= 12 ? 2 : 0), levels = LEVELS } = {}) {
  const n = 72;
  const hourly = { time: Array.from({ length: n }, (_, i) => (t0 + i * 36e5) / 1000), temperature_2m: Array.from({ length: n }, (_, i) => 9 + shift(i)), relative_humidity_2m: Array.from({ length: n }, () => 60) };
  for (const l of levels) {
    hourly[`geopotential_height_${l}hPa`] = Array.from({ length: n }, () => Z[l]);
    hourly[`temperature_${l}hPa`] = Array.from({ length: n }, (_, i) => T[l] + shift(i));
    hourly[`relative_humidity_${l}hPa`] = Array.from({ length: n }, () => 50);
  }
  return { latitude: 47.37, longitude: 8.54, elevation, utc_offset_seconds: OFF, hourly };
}
const prof = parseProfil(api());
const NOW = at(10);

describe('the temperature at a height', () => {
  it('on a layer it is the layer, between two layers it is linear', () => {
    expect(tempNow(prof, 1000, NOW)).toBe(3.5); // 900 hPa sits at 1000 m
    expect(tempNow(prof, 2000, NOW)).toBe(-2.8); // 800 hPa (1950 m, −2.5) to 700 hPa (3000 m, −9)
    expect(tempNow(prof, 3000, NOW)).toBe(-9);
  });
  it('the ground counts as a layer: a height just above it is between the ground and the first layer', () => {
    expect(tempNow(prof, 410, NOW)).toBe(9);
    expect(tempNow(prof, 500, NOW)).toBeGreaterThan(6.5);
    expect(tempNow(prof, 500, NOW)).toBeLessThan(9);
  });
  it('a height under the ground or above the highest layer has no value', () => {
    expect(tempNow(prof, 300, NOW)).toBeNull(); // under the ground of the place (410 m), the layers there are left out
    expect(tempNow(prof, 4300, NOW)).toBeNull();
    expect(tempIn(prof, null, 2000)).toBeNull();
    expect(tempIn(prof, prof.hours[0], NaN)).toBeNull();
    expect(tempNow(null, 2000, NOW)).toBeNull();
  });
  it('a place high up (Davos, 1560 m): the 1000 m row has no value, 2000 and 3000 m have', () => {
    const davos = parseProfil(api({ elevation: 1560 }));
    expect(tempNow(davos, 1000, NOW)).toBeNull();
    expect(tempNow(davos, 2000, NOW)).toBe(-2.8);
    expect(hasValue(rowsOf(davos, HEIGHTS, NOW))).toBe(true);
  });
  it('an inversion shows as it is: warmer above than below', () => {
    const inv = parseProfil(api({ shift: () => 0 }));
    inv.hours.forEach((h) => (h.lay = h.lay.map(([z, t, rh]) => [z, z >= 1400 && z <= 1600 ? t + 12 : t, rh])));
    expect(tempNow(inv, 1500, NOW)).toBeGreaterThan(tempNow(inv, 1000, NOW));
  });
});

describe('the rows of the card', () => {
  const [r3, r2, r1] = rowsOf(prof, HEIGHTS, NOW);
  it('three heights, highest first, with now, 6, 12 and 18 h today and the next two days', () => {
    expect(HEIGHTS).toEqual([3000, 2000, 1000]);
    expect([r3.z, r2.z, r1.z]).toEqual([3000, 2000, 1000]);
    expect(r1.slots.map((s) => s.hour)).toEqual([6, 12, 18]);
    expect(r1.days).toHaveLength(2);
    expect(r1.days[0].date).toBe('2026-11-06');
    expect(r1.days[1].date).toBe('2026-11-07');
  });
  it('the slots read the hour at that local time', () => {
    expect(r1.slots[0].t).toBe(3.5); // 6 h: morning air
    expect(r1.slots[1].t).toBe(5.5); // 12 h: 2 degrees warmer
    expect(r1.slots[2].t).toBe(5.5);
  });
  it('a day shows the lowest and highest value from 6 to 21 h', () => {
    // tomorrow: +4 in the morning, +6 from 12 h
    expect(r1.days[0]).toMatchObject({ min: 7.5, max: 9.5 });
    expect(r1.days[1]).toMatchObject({ min: 11.5, max: 13.5 }); // the day after: +8, +10
  });
  it('now is the hour that holds the time', () => {
    expect(r1.now).toBe(3.5);
    expect(rowOf(prof, 1000, at(14)).now).toBe(5.5);
  });
  it('hasValue is false when no height has any value', () => {
    expect(hasValue(rowsOf(prof, [100, 5000], NOW))).toBe(false);
    expect(hasValue([])).toBe(false);
  });
});

describe('the 0 °C line', () => {
  it('is the height where the air crosses zero, rounded to 100 m', () => {
    expect(zeroLine(prof, NOW)).toBe(1600); // 850 hPa (1500 m, 0.5 °C) to 800 hPa (1950 m, −2.5 °C): 1575 m
  });
  it('is the lowest height when it is freezing from the ground up; null when it never freezes', () => {
    const cold = parseProfil(api({ shift: () => -15 }));
    expect(zeroLine(cold, NOW)).toBe(400); // the ground (410 m) is already below zero
    const warm = parseProfil(api({ shift: () => 40 }));
    expect(zeroLine(warm, NOW)).toBeNull();
    expect(zeroLine(null, NOW)).toBeNull();
  });
});

describe('the lists of places and peaks', () => {
  it('ski planning heights run from 4000 down to 500 in steps of 500', () => {
    expect(SKI_HEIGHTS).toEqual([4000, 3500, 3000, 2500, 2000, 1500, 1000, 500]);
  });
  it('places: the ones Noah named are there, every one has a name and a point in Switzerland', () => {
    for (const n of ['Sedrun', 'Lenzerheide', 'Davos', 'Saas-Fee', 'Ascona']) expect(SPOTS.some((s) => s.name === n)).toBe(true);
    for (const s of SPOTS) {
      expect(s.lat).toBeGreaterThan(45.8);
      expect(s.lat).toBeLessThan(47.9);
      expect(s.lon).toBeGreaterThan(5.9);
      expect(s.lon).toBeLessThan(10.6);
    }
    expect(new Set(SPOTS.map((s) => s.id)).size).toBe(SPOTS.length);
  });
  it('peaks: sorted by height, each in Switzerland, none higher than the air layers reach (600 hPa ≈ 4200 m), all three heights are covered', () => {
    expect(PEAKS.map((p) => p.z)).toEqual([...PEAKS.map((p) => p.z)].sort((a, b) => a - b));
    for (const p of PEAKS) {
      expect(p.z).toBeLessThanOrEqual(3700);
      expect(p.lat).toBeGreaterThan(45.8);
      expect(p.lat).toBeLessThan(47.9);
      expect(p.lon).toBeGreaterThan(5.9);
      expect(p.lon).toBeLessThan(10.6);
    }
    expect(new Set(PEAKS.map((p) => p.id)).size).toBe(PEAKS.length);
    for (const z of [1000, 2000, 3000]) expect(peaksNear(z).length).toBeGreaterThan(1);
  });
  it('the temperature AT a summit: the layers up to 3600 m answer', () => {
    const corvatsch = PEAKS.find((p) => p.id === 'corvatsch');
    expect(tempNow(prof, corvatsch.z, NOW)).toBe(-11.5); // 700 hPa (3000 m, −9) to 600 hPa (4200 m, −19)
  });
});

describe('the chosen items', () => {
  const page = { lat: 47.37, lon: 8.54, name: 'Zürich' };
  const own = ownOf([{ id: 'a1', name: 'Splügen', lat: '46.55', lon: 9.33 }, { id: 'bad', lat: 'x' }, null]);
  it('without a setting only the place of the page shows; a broken setting too', () => {
    expect(selOf(undefined)).toEqual(['page']);
    expect(selOf([])).toEqual(['page']);
    expect(selOf(['sedrun', 3, 'peak:titlis'])).toEqual(['sedrun', 'peak:titlis']);
  });
  it('every id becomes an item; a gone one (a deleted own place, an unknown peak) is null', () => {
    expect(itemOf('page', { page })).toMatchObject({ kind: 'page', name: 'Zürich', lat: 47.37 });
    expect(itemOf('page', { page: null })).toBeNull();
    expect(itemOf('davos')).toMatchObject({ kind: 'spot', name: 'Davos' });
    expect(itemOf('peak:titlis')).toMatchObject({ kind: 'peak', name: 'Titlis', z: 3238 });
    expect(itemOf('peak:nope')).toBeNull();
    expect(itemOf('own:a1', { own })).toMatchObject({ kind: 'own', name: 'Splügen', lat: 46.55 });
    expect(itemOf('own:zz', { own })).toBeNull();
  });
  it('own places: only complete ones are kept', () => {
    expect(own).toHaveLength(1);
    expect(ownOf(undefined)).toEqual([]);
  });
  it('picking adds an id at the end, picking again takes it away', () => {
    expect(toggleSel(['page'], 'davos')).toEqual(['page', 'davos']);
    expect(toggleSel(['page', 'davos'], 'page')).toEqual(['davos']);
    expect(selOf(toggleSel(['davos'], 'davos'))).toEqual(['page']);
  });
  it('a new own id never repeats', () => {
    const id = newOwnId([], 1000);
    expect(newOwnId([{ id }], 1000)).not.toBe(id);
  });
});
