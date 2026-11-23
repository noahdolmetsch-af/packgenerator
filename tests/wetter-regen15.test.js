// «Regen in den nächsten 3 Stunden» (Wetter-Ausbau B, Noah 22.11.2026 «a»): quarters, the first rain, the sentence, the cache.
import { describe, it, expect } from 'vitest';
import { parseRain15, rain15Strip, rain15Say, rain15Url, loadRain15, bar15Pct, QUARTER, RAIN15_MAX_AGE_MIN } from '../src/lib/wetter/regen15.js';

const t0 = Date.UTC(2026, 10, 22, 15, 45); // 22.11.2026 15:45 UTC (fictional place)
const rows = (mm) => mm.map((v, i) => ({ ms: t0 + i * QUARTER, mm: v }));
const dry = () => Array(16).fill(0);

describe('parseRain15', () => {
  it('reads Open-Meteo and leaves out a quarter without a value', () => {
    const j = { minutely_15: { time: [t0 / 1000, t0 / 1000 + 900, t0 / 1000 + 1800], precipitation: [0, null, 0.4] } };
    // the stamp is the end of the quarter: the quarter starts 15 minutes earlier
    expect(parseRain15(j)).toEqual([{ ms: t0 - QUARTER, mm: 0 }, { ms: t0 + 1800000 - QUARTER, mm: 0.4 }]);
    expect(parseRain15(null)).toEqual([]);
  });
  it('asks for 15-minute rain of the place', () => {
    const u = rain15Url({ lat: 46.95, lon: 7.45 });
    expect(u).toContain('minutely_15=precipitation');
    expect(u).toContain('latitude=46.950');
  });
});

describe('rain15Strip', () => {
  it('is null with too few quarters', () => {
    expect(rain15Strip(rows([0, 0]), t0)).toBeNull();
    expect(rain15Strip(null, t0)).toBeNull();
  });
  it('says dry when no quarter is wet', () => {
    const s = rain15Strip(rows(dry()), t0);
    expect(s.dry).toBe(true);
    expect(s.bars).toHaveLength(12);
    expect(rain15Say(s)).toEqual({ kind: 'dry' });
  });
  it('finds the first rain, its length and when it is dry again', () => {
    const m = dry();
    m[3] = 0.3;
    m[4] = 0.8;
    m[5] = 0.5; // 3 quarters = 45 minutes
    const s = rain15Strip(rows(m), t0);
    expect(s.nowWet).toBe(false);
    expect(s.from).toBe(t0 + 3 * QUARTER);
    expect(s.to).toBe(t0 + 6 * QUARTER);
    expect(s.minutes).toBe(45);
    expect(s.minutesToRain).toBe(45);
    expect(rain15Say(s)).toEqual({ kind: 'later', from: s.from, to: s.to, minutes: 45 });
  });
  it('says it rains now and until when', () => {
    const m = dry();
    m[0] = 0.4;
    m[1] = 0.2;
    const s = rain15Strip(rows(m), t0 + 60000);
    expect(s.nowWet).toBe(true);
    expect(s.minutesToRain).toBeNull();
    expect(rain15Say(s)).toEqual({ kind: 'now', to: t0 + 2 * QUARTER });
  });
  it('says rain that lasts to the end', () => {
    const s = rain15Strip(rows(Array(16).fill(0.5)), t0);
    expect(s.toEnd).toBe(true);
    expect(rain15Say(s)).toEqual({ kind: 'nowAll' });
    const m = dry();
    for (let i = 6; i < 16; i++) m[i] = 0.5;
    expect(rain15Say(rain15Strip(rows(m), t0))).toEqual({ kind: 'laterAll', from: t0 + 6 * QUARTER });
  });
  it('starts at the quarter that holds now and drops quarters that are over', () => {
    const s = rain15Strip(rows(dry()), t0 + 2 * QUARTER + 5 * 60000);
    expect(s.bars[0].ms).toBe(t0 + 2 * QUARTER);
  });
  it('keeps a dry quarter as a thin line and a wet one visible', () => {
    expect(bar15Pct({ mm: 0 }, 2)).toBe(3);
    expect(bar15Pct({ mm: 0.1 }, 4)).toBe(10);
    expect(bar15Pct({ mm: 4 }, 4)).toBe(100);
  });
});

const memDb = () => {
  const m = new Map();
  return { meta: { get: async (k) => m.get(k), put: async (r) => void m.set(r.key, r) }, m };
};
const answer = { minutely_15: { time: Array.from({ length: 16 }, (_, i) => t0 / 1000 + i * 900), precipitation: dry() } };
const ok = async () => ({ ok: true, json: async () => answer });
const place = { lat: 46.95, lon: 7.45 };

describe('loadRain15', () => {
  it('asks once, keeps the answer and does not ask again within the age', async () => {
    const db = memDb();
    let n = 0;
    const f = async () => (n++, ok());
    const a = await loadRain15(db, place, { fetcher: f, now: t0 });
    expect(a.old).toBe(false);
    await loadRain15(db, place, { fetcher: f, now: t0 + (RAIN15_MAX_AGE_MIN - 1) * 60000 });
    expect(n).toBe(1);
    await loadRain15(db, place, { fetcher: f, now: t0 + (RAIN15_MAX_AGE_MIN + 1) * 60000 });
    expect(n).toBe(2);
  });
  it('shows the kept answer when the service fails, but not older than an hour', async () => {
    const db = memDb();
    await loadRain15(db, place, { fetcher: ok, now: t0 });
    const bad = async () => ({ ok: false });
    expect((await loadRain15(db, place, { fetcher: bad, now: t0 + 30 * 60000 })).old).toBe(true);
    expect(await loadRain15(db, place, { fetcher: bad, now: t0 + 90 * 60000 })).toBeNull();
  });
  it('gives null without a place or offline without a kept answer', async () => {
    expect(await loadRain15(memDb(), null)).toBeNull();
    expect(await loadRain15(memDb(), place, { fetcher: ok, now: t0, online: false })).toBeNull();
  });
});
