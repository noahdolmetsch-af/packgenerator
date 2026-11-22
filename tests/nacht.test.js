// «Nachttemperatur» (Noah 06.11.2026): the lowest value of the night 18–8 h, the hints, the trend; made-up weather.
import { describe, it, expect } from 'vitest';
import { atLocal } from '../src/lib/wetter/kern.js';
import { nachtUrl, parseNacht, nightOf, series, summary, loadNacht, cacheKey, addDay, BACK_DAYS, AHEAD_DAYS } from '../src/lib/wetter/nacht.js';

const OFF = 3600;
const TODAY = '2026-11-05'; // a Thursday
const NOW = atLocal(TODAY, 12, OFF);

/**
 * Hours from `BACK_DAYS` days before today to `AHEAD_DAYS` days after. `lows[k]` = the lowest value of the night that ends
 * on the morning of today+k (at 4 h); every other hour is 6 °C warmer than that night's low.
 */
function build(lows) {
  const first = addDay(TODAY, -BACK_DAYS);
  const t0 = atLocal(first, 0, OFF);
  const n = (BACK_DAYS + AHEAD_DAYS) * 24;
  const time = [];
  const temp = [];
  for (let i = 0; i < n; i++) {
    const ms = t0 + i * 36e5;
    time.push(ms / 1000);
    // which night does this hour belong to: the evening hours (18–23 h) belong to the next morning
    const local = new Date(ms + OFF * 1000);
    const dayIdx = Math.floor((ms - atLocal(TODAY, 0, OFF)) / 864e5) + (local.getUTCHours() >= 18 ? 1 : 0);
    const low = lows[dayIdx];
    temp.push(low == null ? null : local.getUTCHours() === 4 ? low : low + 6);
  }
  return { latitude: 46.95, longitude: 7.45, elevation: 540, utc_offset_seconds: OFF, hourly: { time, temperature_2m: temp } };
}
const lowsOf = (f) => {
  const o = {};
  for (let k = -BACK_DAYS; k <= AHEAD_DAYS; k++) o[k] = f(k);
  return o;
};
const parse = (f) => parseNacht(build(lowsOf(f)));

describe('the address and the answer', () => {
  it('asks only for the temperature, back and ahead', () => {
    const u = nachtUrl({ lat: 46.95, lon: 7.45 });
    expect(u).toContain('hourly=temperature_2m');
    expect(u).toContain(`past_days=${BACK_DAYS}`);
    expect(u).toContain(`forecast_days=${AHEAD_DAYS}`);
    expect(u).not.toContain('cape');
  });
  it('keeps the hours with a value and the offset', () => {
    const n = parse(() => 3);
    expect(n.offset).toBe(OFF);
    expect(n.hours.length).toBe((BACK_DAYS + AHEAD_DAYS) * 24);
    expect(cacheKey({ lat: 46.951, lon: 7.449 })).toBe('wx-nacht:46.95,7.45');
  });
});

describe('the night', () => {
  const n = parse((k) => 5 + k); // today 5, tomorrow 6, yesterday 4 …
  it('is the lowest value between 18 and 8 h, named by the morning', () => {
    expect(nightOf(n, TODAY).min).toBe(5);
    expect(nightOf(n, addDay(TODAY, 1)).min).toBe(6);
    expect(nightOf(n, addDay(TODAY, -1)).min).toBe(4);
    expect(nightOf(n, TODAY).n).toBe(14);
  });
  it('has no value when most hours are missing', () => {
    const half = parseNacht(build({ ...lowsOf(() => 5), 1: null }));
    expect(nightOf(half, addDay(TODAY, 1))).toBeNull();
    expect(nightOf(half, TODAY)).not.toBeNull();
  });
  it('gives 14 bars from 7 back to 6 ahead', () => {
    const s = series(n, TODAY);
    expect(s.length).toBe(14);
    expect(s[0]).toMatchObject({ k: -7, deg: -2 });
    expect(s[7]).toMatchObject({ k: 0, deg: 5 });
    expect(s[13]).toMatchObject({ k: 6, deg: 11 });
  });
});

describe('the words', () => {
  it('«Heute min 5, morgen min 7»: the two numbers and the change against the day before', () => {
    const s = summary(parse((k) => ({ '-7': -5, '-1': 3, 0: 5, 1: 7 })[k] ?? 4), NOW);
    expect(s.last).toBe(5);
    expect(s.next).toBe(7);
    expect(s.vsYesterday).toBe(2); // +2 warmer than yesterday
    expect(s.vsWeek).toBe(10); // 10 warmer than a week ago
    expect(s.week).toBe(-5);
    expect(s.nextVsLast).toBe(2);
  });
  it('says nothing about a small change', () => {
    const s = summary(parse((k) => (k === 0 ? 5 : k === -1 ? 4 : k === -7 ? 3 : 5)), NOW);
    expect(s.vsYesterday).toBeNull(); // 1 degree
    expect(s.vsWeek).toBeNull(); // 2 degrees, under 3
    expect(s.nextVsLast).toBeNull();
  });
  it('a colder night is a negative change', () => {
    const s = summary(parse((k) => (k === 0 ? 1 : 6)), NOW);
    expect(s.vsYesterday).toBe(-5);
  });
  it('trend falling, and the first night with 5 or more', () => {
    // last night 3: colder than 5; nights ahead 4, 2, 1, 0, -1, 3, 6 → falling, 5 Plus on night 7
    const ahead = { 1: 4, 2: 2, 3: 1, 4: 0, 5: -1, 6: 3, 7: 6 };
    const s = summary(parse((k) => (k <= 0 ? 3 : ahead[k] ?? 6)), NOW);
    expect(s.trend).toBe('falling');
    expect(s.plus).toEqual({ days: 7, unsure: true });
    expect(s.frost).toEqual({ days: 5, unsure: false, ends: false }); // 0 °C is not frost; the first night under 0 is the 5th
  });
  it('frost: the first night under 0 °C when it is not frosty now', () => {
    const s = summary(parse((k) => (k <= 0 ? 4 : k === 3 ? -1 : 2)), NOW);
    expect(s.frost).toEqual({ days: 3, unsure: false, ends: false });
    expect(s.plus).toBeNull(); // it is under 5 only after: no «5 Plus»
  });
  it('frost over: the first night from 0 °C when last night was frosty', () => {
    const s = summary(parse((k) => (k <= 1 ? -3 : k === 2 ? -1 : 1)), NOW);
    expect(s.frost).toEqual({ days: 3, unsure: false, ends: true });
  });
  it('rising, no frost, no «5 Plus» when it is warm already', () => {
    const s = summary(parse((k) => (k <= 0 ? 8 : 8 + k * 2)), NOW);
    expect(s.trend).toBe('rising');
    expect(s.plus).toBeNull();
    expect(s.frost).toBeNull();
  });
  it('a flat week has no trend', () => {
    const s = summary(parse(() => 7), NOW);
    expect(s.trend).toBeNull();
    expect(s.vsYesterday).toBeNull();
  });
  it('no values at all: null', () => {
    expect(summary({ offset: OFF, hours: [] }, NOW)).toBeNull();
    expect(summary(null, NOW)).toBeNull();
  });
});

describe('loadNacht', () => {
  const place = { lat: 46.95, lon: 7.45 };
  const mem = () => {
    const rows = new Map();
    return { meta: { get: async (k) => rows.get(k), put: async (r) => rows.set(r.key, r) } };
  };
  const json = build(lowsOf(() => 3));
  const ok = () => ({ ok: true, json: async () => json });
  it('asks once, keeps the answer 3 h and asks again after', async () => {
    const db = mem();
    let calls = 0;
    const fetcher = async () => (calls++, ok());
    const a = await loadNacht(db, place, { fetcher, now: 1000 });
    expect(a.old).toBe(false);
    await loadNacht(db, place, { fetcher, now: 1000 + 2 * 36e5 });
    expect(calls).toBe(1);
    await loadNacht(db, place, { fetcher, now: 1000 + 4 * 36e5 });
    expect(calls).toBe(2);
  });
  it('offline shows the kept answer as old, and nothing without one', async () => {
    const db = mem();
    expect(await loadNacht(db, place, { fetcher: async () => { throw new Error('x'); }, now: 1000 })).toBeNull();
    await loadNacht(db, place, { fetcher: async () => ok(), now: 1000 });
    const old = await loadNacht(db, place, { fetcher: async () => { throw new Error('x'); }, now: 1000 + 5 * 36e5 });
    expect(old.old).toBe(true);
  });
  it('a place without numbers gives null', async () => {
    expect(await loadNacht(mem(), { lat: 'x', lon: 1 })).toBeNull();
  });
});
