// «Schneefallgrenze» (Noah 04.11.2026): the snow line from the weather core, made-up weather.
import { describe, it, expect } from 'vitest';
import { parseCore, coreUrl, atLocal } from '../src/lib/wetter/kern.js';
import { lineOf, lineNow, lineRange, lineSlots, allApprox, ownHeight, lowHint } from '../src/lib/wetter/schneegrenze.js';

const OFF = 7200;
const DAY = '2026-11-04';
const t0 = Date.parse(`${DAY}T00:00:00Z`) - OFF * 1000;
// one day of hours; frz and snowfall_height come from (hour)
function core({ frz = (h) => 1800 + h * 20, snowH = () => null } = {}) {
  const time = Array.from({ length: 24 }, (_, i) => (t0 + i * 36e5) / 1000);
  return parseCore({
    latitude: 47.37, longitude: 8.54, elevation: 410, utc_offset_seconds: OFF,
    hourly: { time, temperature_2m: time.map(() => 5), freezing_level_height: time.map((_, h) => frz(h)), snowfall_height: time.map((_, h) => snowH(h)) },
    daily: { time: [t0 / 1000], sunrise: [], sunset: [], uv_index_max: [] },
  });
}
const at = (h) => atLocal(DAY, h, OFF);

describe('the snow line of one hour', () => {
  it('takes Open-Meteo\'s own value when there is one', () => {
    expect(lineOf({ snowH: 1540, frz: 3000 })).toEqual({ m: 1500, own: true });
  });
  it('falls back to the freezing level minus 300 m, rounded to 100 m', () => {
    expect(lineOf({ snowH: null, frz: 2140 })).toEqual({ m: 1800, own: false });
    expect(lineOf({ frz: 2160 })).toEqual({ m: 1900, own: false });
  });
  it('never goes below sea level and says nothing without a value', () => {
    expect(lineOf({ snowH: -200 })).toEqual({ m: 0, own: true });
    expect(lineOf({ frz: 100 }).m).toBe(0);
    expect(lineOf({})).toBeNull();
    expect(lineOf(null)).toBeNull();
  });
  it('the request asks for the new value; a kept answer without it still works', () => {
    expect(coreUrl({ lat: 47.37, lon: 8.54 })).toContain('snowfall_height');
    const old = { hours: [{ ms: at(9), frz: 2100 }], offset: OFF };
    expect(lineNow(old, at(9) + 60_000)).toEqual({ m: 1800, own: false });
  });
});

describe('the line over the day', () => {
  const c = core();
  it('now: the hour that holds the time', () => {
    expect(lineNow(c, at(12) + 20 * 60_000)).toEqual({ m: 1700, own: false }); // (1800+240-300) → 1740 → 1700
    expect(lineNow(c, at(-2))).toBeNull();
  });
  it('low and high of the day (6–21 h)', () => {
    const r = lineRange(c, at(10));
    expect(r.min).toBe(1600); // 6 h: 1920-300 = 1620
    expect(r.max).toBe(1900); // 21 h: 2220-300 = 1920
    expect(r.own).toBe(false);
  });
  it('six times', () => {
    const s = lineSlots(c, at(10));
    expect(s.map((x) => x.hour)).toEqual([6, 9, 12, 15, 18, 21]);
    expect(s.every((x) => Number.isFinite(x.m))).toBe(true);
  });
  it('mixes Open-Meteo\'s value and the rule per hour; the note counts only when all are guesses', () => {
    const m = core({ snowH: (h) => (h >= 12 ? 1000 : null) });
    const s = lineSlots(m, at(10));
    expect(s.find((x) => x.hour === 12)).toMatchObject({ m: 1000, own: true });
    expect(s.find((x) => x.hour === 9)).toMatchObject({ own: false });
    expect(allApprox(s)).toBe(false);
    expect(allApprox(lineSlots(c, at(10)))).toBe(true);
    expect(allApprox([])).toBe(false);
  });
  it('no data, no range', () => {
    expect(lineRange({ hours: [], offset: OFF }, at(10))).toBeNull();
    expect(lineSlots(null, at(10))).toEqual([]);
  });
});

describe('the hint at your height (4a)', () => {
  const low = core({ snowH: () => 450 });
  it('the height of the place counts unless you set one', () => {
    expect(ownHeight(low, undefined)).toBe(410);
    expect(ownHeight(low, 900)).toBe(900);
    expect(ownHeight({}, undefined)).toBeNull();
    expect(ownHeight(low, -5)).toBe(410);
  });
  it('a line down to your height gives the hint (one rounding step above it still counts)', () => {
    expect(lowHint(low, at(10), 410)).toEqual({ m: 500, ownM: 410 }); // 450 rounds to 500, within 100 m of 410
    expect(lowHint(core({ snowH: () => 700 }), at(10), 410)).toBeNull();
  });
  it('the lowest line from now on counts, an earlier hour does not', () => {
    const c = core({ snowH: (h) => (h < 8 ? 300 : 1500) });
    expect(lowHint(c, at(10), 410)).toBeNull(); // the cold hours are over
    expect(lowHint(c, at(6) + 1, 410)).not.toBeNull();
  });
  it('no height or no data: no hint', () => {
    expect(lowHint(low, at(10), null)).toBeNull();
    expect(lowHint({ hours: [], offset: OFF }, at(10), 410)).toBeNull();
  });
});
