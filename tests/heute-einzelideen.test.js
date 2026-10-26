// Einzelideen Heute (Noah 25./26.10.2026 «1-8 alle so bauen»): the pure parts of ideas 1, 2, 4, 5, 6, 7, 8.
import { describe, it, expect } from 'vitest';
import { LEVELS, SECTORS, bearing, destination, sectorOf, knownSectors, pickSector, surprisePlan, minutesOf, planSurprise, gpxOfRound } from '../src/lib/ueberraschung.js';
import { forecastOf, homeFeelsOf, addHomeFeel, removeHomeFeel, homeHints, hintFor, hintText, sideOf } from '../src/lib/wetter/terrasse.js';
import { partsOf, rateEveningPart, POOR_FROM } from '../src/lib/lernen/abendtour.js';
import { wetSince, wetTaskShows, wetPushToday, standstill, standChecks, standRec, markStand, finishStand, STAND_DAYS } from '../src/lib/griff.js';
import { examplesFile, interestsOf, ALL_INTERESTS } from '../src/lib/firststart.js';
import { CHANGES, changeOf } from '../src/lib/clear/yearcheck.js';
import { distKm } from '../src/lib/route.js';

const HOME = { lat: 47, lon: 8 };
// calendar days (UTC noon arithmetic on plain dates, no clock involved)
const add = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const TODAY = '2026-03-20';

describe('2 Überraschungsrunde', () => {
  it('bearing and sectors go clockwise from north', () => {
    expect(Math.round(bearing(HOME, { lat: 48, lon: 8 }))).toBe(0);
    expect(sectorOf(bearing(HOME, { lat: 47, lon: 9 }))).toBe(2);
    expect(sectorOf(359)).toBe(0);
    expect(SECTORS).toHaveLength(8);
  });
  it('destination lies the asked km away', () => {
    expect(distKm(HOME, destination(HOME, 90, 10))).toBeCloseTo(10, 0);
  });
  it('known sectors count only route points near home', () => {
    const trips = [{ route: { line: [[47.1, 8], [47.2, 8], { lat: 47, lon: 8.2 }, [52, 8]] } }];
    const k = knownSectors(trips, HOME);
    expect(k[0]).toBe(2);
    expect(k[2]).toBe(1);
    expect(k.reduce((a, b) => a + b, 0)).toBe(3);
  });
  it('strict picks the least known side and «another round» skips it', () => {
    const known = [5, 5, 0, 5, 5, 5, 5, 5];
    expect(pickSector(known, { strict: true, rnd: 0.9 })).toBe(2);
    expect(pickSector(known, { strict: true, skip: [2], rnd: 0 })).not.toBe(2);
  });
  it('the plan has two via points and a length from time and level', () => {
    const p = surprisePlan(HOME, { level: 'curious', hours: 2, rnd: 0.5, turn: 0 });
    const L = LEVELS.find((x) => x.key === 'curious');
    expect(p.km).toBe(2 * L.kmh);
    expect(p.via).toHaveLength(2);
    expect(surprisePlan(null)).toBeNull();
    expect(minutesOf(30, 600, 20)).toBe(150);
  });
  it('planSurprise asks the router once and reads busy and no route', async () => {
    const plan = surprisePlan(HOME, { rnd: 0.5, turn: 0 });
    const json = { features: [{ properties: { 'track-length': '34200', 'filtered ascend': '320' }, geometry: { coordinates: [[8, 47, 400], [8.1, 47.1, 450], [8, 47, 400]] } }] };
    let urls = 0;
    const ok = await planSurprise(HOME, plan, { fetcher: async () => (urls++, { ok: true, status: 200, json: async () => json }) });
    expect(urls).toBe(1);
    expect(ok.km).toBeCloseTo(34.2, 0);
    await expect(planSurprise(HOME, plan, { fetcher: async () => ({ ok: false, status: 429 }) })).rejects.toThrow('busy');
    await expect(planSurprise(HOME, plan, { fetcher: async () => ({ ok: false, status: 400 }) })).rejects.toThrow('noroute');
    await expect(planSurprise(HOME, plan, { fetcher: async () => { throw new Error('x'); } })).rejects.toThrow('failed');
    expect(gpxOfRound(ok).points.length).toBe(3);
    expect(gpxOfRound({ line: [] })).toBeNull();
  });
});

describe('1 Wetter zu Hause', () => {
  it('the forecast of the day: mean wind, direction, sunny hours', () => {
    const fc = forecastOf([{ wind: 10, dir: 270, code: 0 }, { wind: 20, dir: 270, code: 3 }]);
    expect(fc).toEqual({ wind: 15, dir: 270, sunH: 1 });
    expect(sideOf(265)).toBe('west');
    expect(forecastOf([])).toBeNull();
  });
  it('notes replace the same day and can be removed', () => {
    let l = addHomeFeel([], { day: '2026-03-01', fc: { wind: 12, dir: 270, sunH: 4 }, feltWind: 'less' }, 1);
    l = addHomeFeel(l, { day: '2026-03-01', fc: null, feltSun: 'more' }, 2);
    expect(l).toHaveLength(1);
    expect(l[0].feltSun).toBe('more');
    expect(addHomeFeel(l, { day: '2026-03-02' })).toBe(l);
    expect(removeHomeFeel(l, l[0].id)).toEqual([]);
    expect(homeFeelsOf([{ day: 'x', feltWind: 'less' }, null])).toEqual([]);
  });
  it('two agreeing notes make a hint for that wind side', () => {
    const l = [1, 2, 3].map((n) => ({ id: `n${n}`, day: `2026-03-0${n}`, wind: 15, dir: 270, sunH: 5, feltWind: n < 3 ? 'less' : 'same', feltSun: null }));
    const h = homeHints(l);
    expect(h).toEqual([{ kind: 'wind', side: 'west', felt: 'less', n: 2, of: 3 }]);
    expect(hintFor(h, { wind: 20, dir: 260 })).toEqual(h[0]);
    expect(hintFor(h, { wind: 20, dir: 90 })).toBeNull();
    expect(hintText(h[0]).key).toMatch(/calmer/);
  });
});

describe('4 Bewertung aufteilen', () => {
  it('a part is set, a second tap takes it back', () => {
    const trip = { id: 'tr1', title: 'Test' };
    let d = rateEveningPart(null, trip, '2026-03-01', 'plan', 'hard', 'T');
    expect(partsOf(d, '2026-03-01')).toEqual({ plan: 'hard' });
    d = rateEveningPart(d, trip, '2026-03-01', 'plan', 'hard', 'T');
    expect(d.eveningParts).toBeUndefined();
    expect(rateEveningPart(d, trip, '2026-03-01', 'nope', 'hard')).toBe(d);
    expect(POOR_FROM).toBe(5);
  });
});

describe('5 Regen bündeln', () => {
  const bike = { id: 'b1', parts: [{ key: 'chain', history: [{ action: 'service', date: add(TODAY, -10) }] }] };
  const ride = (n, wet, id = 'b1') => ({ kind: 'ride', state: 'counted', bikeId: id, date: add(TODAY, n), km: 20, wet });
  const isWet = (e) => e.wet;
  it('wet rides after the last chain care make one series', () => {
    const run = wetSince([ride(-12, true), ride(-3, true), ride(-1, true), ride(-2, false), ride(-1, true, 'b2')], bike, TODAY, isWet);
    expect(run.n).toBe(2);
    expect(run.km).toBe(40);
    expect(run.start).toBe(add(TODAY, -3));
    expect(wetTaskShows(run)).toBe(true);
    expect(wetPushToday(run, TODAY)).toBe(false);
  });
  it('the reminder comes only on the first wet day of a series', () => {
    const first = wetSince([ride(0, true)], bike, TODAY, isWet);
    expect(wetPushToday(first, TODAY)).toBe(true);
    const second = wetSince([ride(-1, true), ride(0, true)], bike, TODAY, isWet);
    expect(wetPushToday(second, TODAY)).toBe(false);
    expect(wetTaskShows(wetSince([ride(-1, true)], bike, TODAY, isWet))).toBe(false);
  });
});

describe('6 Nach der Standzeit', () => {
  const ride = (n) => ({ kind: 'ride', state: 'counted', bikeId: 'b1', date: add(TODAY, n), km: 10 });
  it('a bike that stands, and one that just came back', () => {
    expect(standstill([ride(-STAND_DAYS)], 'b1', TODAY)).toEqual({ from: add(TODAY, -STAND_DAYS), days: STAND_DAYS, back: null });
    expect(standstill([ride(-70), ride(-5)], 'b1', TODAY)).toEqual({ from: add(TODAY, -70), days: 65, back: add(TODAY, -5) });
    expect(standstill([ride(-70), ride(-20)], 'b1', TODAY)).toBeNull();
    expect(standstill([ride(-3)], 'b1', TODAY)).toBeNull();
    expect(standstill([], 'b1', TODAY)).toBeNull();
  });
  it('checks need their parts; marks toggle; done rests until the next standstill', () => {
    expect(standChecks({ parts: [] }).map((c) => c.key)).not.toContain('sealant');
    expect(standChecks({ parts: [{ key: 'tyres' }, { key: 'fork' }] }).map((c) => c.key)).toEqual(expect.arrayContaining(['sealant', 'suspension']));
    let v = markStand({}, 'b1', 'F', 'chain', 'ok');
    expect(standRec(v, 'b1', 'F').marks).toEqual({ chain: 'ok' });
    v = markStand(v, 'b1', 'F', 'chain', 'ok');
    expect(standRec(v, 'b1', 'F').marks).toEqual({});
    v = finishStand(v, 'b1', 'F', TODAY);
    expect(standRec(v, 'b1', 'F').done).toBe(TODAY);
    expect(standRec(v, 'b1', 'G').done).toBeNull();
  });
});

describe('7 Beispiele nach Interesse', () => {
  it('unknown or no interests mean all', () => {
    expect(interestsOf(['x'])).toEqual(ALL_INTERESTS);
    expect(interestsOf(['days', 'days'])).toEqual(['days']);
  });
  it('day rides only: the ridden ride and its debrief, no sleeping gear', () => {
    const all = examplesFile(TODAY);
    const days = examplesFile(TODAY, ['days']);
    expect(days.tables.trips.map((x) => x.id)).toEqual(['ex-past']);
    expect(days.tables.items.length).toBeLessThan(all.tables.items.length);
    expect(examplesFile(TODAY, ['nights']).tables.debriefs).toEqual([]);
    expect(examplesFile(TODAY, ['active']).tables.trips).toEqual([]);
  });
});

describe('8 Lebensänderung', () => {
  it('each change lists its places, each with an address', () => {
    for (const c of CHANGES) {
      expect(changeOf(c.key)).toBe(c);
      expect(c.checks.length).toBeGreaterThan(2);
      for (const x of c.checks) expect(x.href).toMatch(/^#\//);
    }
    expect(changeOf('nope')).toBeNull();
  });
});
