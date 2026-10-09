// v0.49.0 R1 «Rückblick ruhig»: the numbers of the one Rückblick page, the table of Past trips and a
// trip's saved Rückblick (src/lib/review/rueckblick.js), and the old addresses that lead there.
// Fictional data (tests/e2e/r1-fixture.js), clock on 9 October 2026.
import { describe, it, expect } from 'vitest';
import { r1Data, D0, day, P } from './e2e/r1-fixture.js';
import { tripFacts, periodStats, periodOf, compareSet, planVsReal, dayRows, nextTripAfter, nextHints, searchFacts, matchesArt, artOf, weatherOf } from '../src/lib/review/rueckblick.js';
import { redirectOf, pageOf } from '../src/lib/nav.js';
import { FUNCTION } from '../src/lib/home/functions.js';

const T = r1Data().tables;
const facts = tripFacts({ ...T, today: D0 });
const row = (id) => facts.find((r) => r.id === `${P}${id}`);

describe('tripFacts: one row per trip that happened', () => {
  it('lists the finished trips newest first, not the one still ahead', () => {
    expect(facts.map((r) => r.title)[0]).toBe('Abendrunde Hügel');
    expect(facts.some((r) => r.id === `${P}next`)).toBe(false);
    expect(facts.map((r) => r.start)).toEqual([...facts.map((r) => r.start)].sort().reverse());
  });

  it('reads km, Hm, time and pace from the rides, the weather from the saved forecast', () => {
    const h = row('herbst');
    expect(h).toMatchObject({ km: 148, gainM: 2210, movingH: 11.08, kmh: 13.4, days: 2, art: 'multi', bike: 'Gravel Grau', tmin: 4, tmax: 15 });
    expect(h.rain).toEqual({ wet: true, days: [2] });
    expect(h.learnings.map((l) => l.id)).toEqual([1, 6]);
    expect(h.learning).toBe('Überschuhe ab 8 °C mitnehmen');
    expect(h.special).toBeNull(); // the debrief sentence is the learning already
    expect(h.baseG).toBeGreaterThan(0);
    expect(h.debrief).toBe('done');
    expect(row('abend').debrief).toBe('open');
    expect(row('pass').art).toBe('event');
  });

  it('unknown stays unknown: no rides, no forecast → null, never 0', () => {
    const trip = { id: 'x', title: 'Ohne alles', startDate: day(-5), days: 1, status: 'done', entries: [], setup: {} };
    const [r] = tripFacts({ trips: [trip], today: D0 });
    expect(r).toMatchObject({ km: null, gainM: null, movingH: null, kmh: null, tmin: null, tmax: null, learning: null, baseG: null });
    expect(r.rain.wet).toBeNull();
  });

  it('a ride on its own is a row too; a trip made from a ride is not counted twice', () => {
    const ride = { id: 'solo', name: 'Feierabend', date: day(-1), km: 30, movingH: 1.5, gainM: 300, tripId: null };
    const made = { id: 'made', title: 'Aus Fahrt', startDate: day(-2), days: 1, status: 'done', entries: [], fromRide: 'r2', route: { km: 20 } };
    const out = tripFacts({ trips: [made], rides: [ride, { id: 'r2', name: 'Aus Fahrt', date: day(-2), km: 20, tripId: 'made' }], today: D0 });
    expect(out.map((r) => r.id)).toEqual(['solo', 'made']);
    expect(out[0]).toMatchObject({ kind: 'ride', kmh: 20, href: '#/debrief/ride/solo' });
  });

  it('the weather falls back to the packing weather, else nothing', () => {
    expect(weatherOf({ startDate: day(-1), days: 1, wx: { min: 3, max: 9, rain: 'showers' } })).toMatchObject({ wet: true, tmin: 3, tmax: 9 });
    expect(weatherOf({ startDate: day(-1) })).toMatchObject({ wet: null, tmin: null });
  });
});

describe('the Art filter and the search', () => {
  it('Art: day ride, multi-day, race, no bike, rain', () => {
    expect(artOf({ days: 1 })).toBe('day');
    expect(artOf({ days: 3 })).toBe('multi');
    expect(artOf({ days: 1, event: true })).toBe('event');
    expect(artOf({ days: 2, packs: [] })).toBe('other');
    expect(facts.filter((r) => matchesArt(r, 'rain')).every((r) => r.rain.wet)).toBe(true);
    expect(facts.filter((r) => matchesArt(r, 'all'))).toHaveLength(facts.length);
  });

  it('the search finds a trip by one of its learnings', () => {
    expect(searchFacts(facts, 'riegel').map((r) => r.title)).toEqual(['Drei-Täler-Loop']);
    expect(searchFacts(facts, 'gravel herbst').map((r) => r.title)).toEqual(['Herbsttour Hochland']);
    expect(searchFacts(facts, '')).toHaveLength(facts.length);
  });
});

describe('periodStats: Letzte 12 Monate, Jahr, Alle', () => {
  it('the rolling 12 months against the 12 months before', () => {
    const p = periodStats(facts, T.learnings, '12m', D0);
    expect(p.period).toMatchObject({ from: '2025-10-10', to: D0 });
    const s = Object.fromEntries(p.stats.map((x) => [x.key, x]));
    expect(s.trips).toMatchObject({ value: 9, prev: 2, delta: 7 });
    expect(s.km.value).toBe(1541);
    expect(s.km.best).toMatchObject({ title: 'Sommertour drei Etappen', value: 498 });
    expect(s.kmh.best.title).toBe('Seerunde');
    expect(s.rain.value).toBe(6);
    expect(s.learnings.value).toBe(6);
    expect(p.bars).toHaveLength(13); // Oct 2025 … Oct 2026, both partly in the window
    expect(p.bars.at(-1)).toEqual({ key: '2026-10', km: 42 });
  });

  it('this year from 1 January, against the same days last year; all without a year before', () => {
    expect(periodOf('year', D0)).toMatchObject({ from: '2026-01-01', prevFrom: '2025-01-01', prevTo: '2025-10-09' });
    const all = periodStats(facts, T.learnings, 'all', D0);
    expect(all.rows).toHaveLength(facts.length);
    expect(all.stats[0].prev).toBeNull();
    expect(all.bars.map((b) => b.key)).toEqual(['2025', '2026']);
  });

  it('no trips: empty, nothing breaks', () => {
    const p = periodStats([], [], '12m', D0);
    expect(p.empty).toBe(true);
    expect(p.stats.find((x) => x.key === 'km').value).toBeNull();
  });
});

describe('compareSet: Touren im Vergleich', () => {
  it('the last 10 trips, 7 numbers, the newest marked, a sentence', () => {
    const c = compareSet(facts, 'last10', D0);
    expect(c.rows).toHaveLength(10);
    expect(c.metrics.map((m) => m.key)).toEqual(['km', 'gainM', 'movingH', 'kmh', 'baseG', 'rainDays', 'learnings']);
    expect(c.metrics[0].values.at(-1)).toEqual({ id: `${P}abend`, v: 42 });
    expect(c.sentence).toMatchObject({ title: 'Abendrunde Hügel', shorter: true, hmPerKm: 19 });
    expect(c.metrics.find((m) => m.key === 'baseG').low).toBe(true);
  });

  it('same kind: only day rides like the newest; 12 months: the window', () => {
    expect(compareSet(facts, 'same', D0).rows.every((r) => r.art === 'day')).toBe(true);
    expect(compareSet(facts, '12m', D0).total).toBe(9);
    expect(compareSet([], 'last10', D0)).toMatchObject({ latest: null, rows: [], sentence: null });
  });
});

describe("a trip's saved Rückblick", () => {
  it('plan against real from the route and the rides', () => {
    const pvr = Object.fromEntries(planVsReal(row('herbst')).map((x) => [x.key, x]));
    expect(pvr.km).toMatchObject({ plan: 142, real: 148, diff: 6 });
    expect(pvr.gainM).toMatchObject({ plan: 2100, real: 2210, diff: 110 });
    expect(pvr.movingH.plan).toBeCloseTo(11.7, 1);
    expect(pvr.movingH.diff).toBeLessThan(0);
  });

  it('one row per day on a trip of several days', () => {
    const d = dayRows(row('herbst'));
    expect(d.map((x) => [x.n, x.km, x.rain])).toEqual([[1, 74, 0], [2, 74, 6]]);
    expect(dayRows(row('abend'))).toEqual([]);
  });

  it('what it means for the next trip', () => {
    const herbst = T.trips.find((x) => x.id === `${P}herbst`);
    const next = nextTripAfter(herbst, T.trips, D0);
    expect(next.id).toBe(`${P}next`);
    const deb = T.debriefs.find((x) => x.tripId === herbst.id);
    const byId = Object.fromEntries(T.items.map((i) => [i.id, i]));
    const hints = nextHints({ debrief: deb, next, learnings: row('herbst').learnings, byId });
    expect(hints.filter((h) => h.kind === 'unused').map((h) => h.itemId).sort()).toEqual(['HY02', 'LX01', 'OF01']);
    expect(hints.some((h) => h.kind === 'broken' && h.itemId === 'LI01')).toBe(true);
    expect(hints.some((h) => h.kind === 'missing' && h.text === 'Buff')).toBe(true);
    expect(hints.some((h) => h.kind === 'note')).toBe(false); // the sentence is a learning already
  });
});

describe('no dead links (Noah 4a)', () => {
  it('#/review and #/debrief/compare lead to the one Rückblick page', () => {
    expect(redirectOf('#/review')).toEqual({ hash: '#/debrief', spot: 'period' });
    expect(redirectOf('#/debrief/compare')).toEqual({ hash: '#/debrief', spot: 'compare' });
    expect(redirectOf('#/debrief/pace')).toBeNull();
    expect(redirectOf('#/debrief/learnings')).toBeNull();
    expect(pageOf('#/review')).toBe('debrief');
  });

  it('"Look back" on Today opens the Rückblick, "Debriefs" the past trips', () => {
    expect(FUNCTION.review.go.href).toBe('#/debrief');
    expect(FUNCTION.debriefs.go.href).toBe('#/pack/past');
  });
});
