// Paket U › Muster-Rennen and Plan: the made-up race has the structure of a real one, and the overview
// (summary, recommendation, the 40 cases, scenarios) works on it. Fictional data only.
import { describe, it, expect } from 'vitest';
import { sampleRoute, samplePois, sampleStored, sampleStart, SAMPLE_TASKS, tasksDone, SAMPLE_KM } from '../src/lib/race/sample.js';
import { summaryOf, recommend, casesOf, CASES, CASES_OF, scenarioFrom, applyScenario, playScenario } from '../src/lib/race/overview.js';
import { compareWays, assumptionsOf, simulate } from '../src/lib/race/strategy.js';
import { lineKm, raceOf } from '../src/lib/race/race.js';

const today = '2026-10-19';
const stored = sampleStored(today);
const route = stored.route;
const pois = stored.pois;
const as = assumptionsOf(stored, null);
const sims = compareWays({ km: route.km, profile: route.profile, pois, start: stored.start, as });

describe('sample race', () => {
  it('has 11 sectors, about 30 000 m up, one pass over 2000 m and a Saturday start', () => {
    expect(route.sectors).toHaveLength(11);
    expect(route.km).toBe(SAMPLE_KM);
    expect(route.gainM).toBeGreaterThan(26000);
    expect(route.gainM).toBeLessThan(36000);
    expect(route.maxM).toBeGreaterThan(2000);
    expect(new Date(`${sampleStart(today)}T12:00:00Z`).getUTCDay()).toBe(6);
    expect(stored.start.endsWith('T08:00')).toBe(true);
  });
  it('has no bed before km 139, a depot at 500 and long gaps without a shop near the end', () => {
    expect(Math.min(...pois.filter((p) => p.kind === 'sleep').map((p) => p.km))).toBeGreaterThanOrEqual(139);
    expect(pois.find((p) => p.kind === 'depot').km).toBe(500);
    const s = summaryOf({ sim: sims[1], pois, km: route.km });
    expect(s.gaps[0].km).toBeGreaterThanOrEqual(70);
    expect(s.depot.n).toBeGreaterThan(1);
  });
  it('plays through all three ways; the tent is the heaviest; a recommendation with reasons', () => {
    for (const r of sims) expect(r.done, r.way).toBe(true);
    expect(sims[2].kg).toBeGreaterThan(sims[1].kg);
    const rec = recommend(sims);
    expect(['hotel', 'mixed', 'tent']).toContain(rec.way);
    expect(rec.reasons.length).toBeGreaterThan(0);
  });
  it('a slower climbing rate makes more days (650 → 550)', () => {
    const slow = simulate({ km: route.km, profile: route.profile, pois, start: stored.start, way: 'mixed', as: assumptionsOf({ assume: { climbMh: 550 } }, null) });
    expect(slow.days.length).toBeGreaterThanOrEqual(sims[1].days.length);
    expect(slow.finish).toBeGreaterThan(sims[1].finish);
  });
  it('the 40 cases: numbered 1–40, each with a box and a text; most have a result here', () => {
    expect(CASES.map((c) => c.n)).toEqual(Array.from({ length: 40 }, (_, i) => i + 1));
    for (const c of CASES) expect(c.box, c.n).toBeTruthy();
    expect(CASES_OF.stages).toContain(1);
    const trip = { id: 'race-sample', title: 'Testrennen', startDate: sampleStart(today), days: 10 };
    const plan = null;
    const rows = casesOf({ race: raceOf(stored, trip), stored, trip, trips: [trip], races: {}, route, pts: lineKm(route), pois, sim: sims[1], sims, plan, today, fromRides: null });
    expect(rows).toHaveLength(40);
    for (const r of rows) expect(r.text, r.n).toBeTruthy();
    expect(rows.filter((r) => !r.open).length).toBeGreaterThanOrEqual(25);
  });
  it('scenarios keep the assumptions and come back', () => {
    const sc = scenarioFrom({ ...stored, assume: { climbMh: 550 }, way: 'hotel' }, '12 Tage', 's1');
    expect(sc.text).toBe('12 Tage');
    const back = applyScenario({ ...stored, way: 'tent', fixedNights: { 1: 'bivy' } }, sc);
    expect(back.way).toBe('hotel');
    expect(back.assume.climbMh).toBe(550);
    expect(back.fixedNights).toEqual(stored.fixedNights);
    const r = playScenario(sc, { km: route.km, profile: route.profile, pois, fromRides: null, trip: null });
    expect(r.way).toBe('hotel');
    expect(r.done).toBe(true);
  });
  it('the tasks tick themselves', () => {
    expect(tasksDone(stored)).toEqual([]);
    const done = tasksDone({ ...stored, assume: { climbMh: 550 }, way: 'tent', scenarios: [{ id: 'x' }] });
    expect(done).toEqual(['climb', 'tent', 'scenario']);
    expect(tasksDone({ ...stored, tasksTicked: ['own'] })).toEqual(['own']);
    expect(SAMPLE_TASKS.length).toBe(6);
  });
});
