// Paket U «Bikepacking und Ultra-Rennen» (Noah 19.10.2026, ideas 1–40): the race engine. A fictional race
// «Testrennen» with three sectors (no real route, no real names).
import { describe, it, expect } from 'vitest';
import * as R from '../src/lib/race/race.js';
import * as O from '../src/lib/race/outside.js';
import * as F from '../src/lib/race/files.js';
import * as M from '../src/lib/race/more.js';

// a straight fictional line, 0.9 km per point east, three sectors of 30 km, a climb in the middle
const sector = (from, n, ele0, up) => Array.from({ length: n }, (_, i) => ({ lat: 47, lon: 8 + (from + i) * 0.0118, ele: ele0 + (up * i) / (n - 1) }));
const files = [
  { name: 'Testsektor 1', points: sector(0, 35, 400, 0) },
  { name: 'Testsektor 2', points: sector(34, 35, 400, 900) },
  { name: 'Testsektor 3', points: sector(68, 35, 1300, -900) },
];

describe('the race route from sectors (learning: 11 files) and own stops', () => {
  it('joins the sectors in order, each end a checkpoint', () => {
    const { route, gaps } = F.joinSectors(files);
    expect(gaps).toEqual([]);
    expect(route.sectors.map((s) => s.name)).toEqual(['Testsektor 1', 'Testsektor 2', 'Testsektor 3']);
    expect(route.km).toBeGreaterThan(85);
    expect(route.km).toBeLessThan(95);
    expect(route.gainM).toBeGreaterThan(850);
    expect(route.maxM).toBe(1300);
    const cps = F.sectorCheckpoints(route);
    expect(cps.at(-1).km).toBe(route.sectors.at(-1).toKm);
    const tr = F.tripRouteOf(route, 'Testrennen');
    expect(tr.line.length).toBeLessThanOrEqual(200);
    expect(tr.km).toBe(route.km);
  });
  it('counts a jump between files instead of hiding it', () => {
    const far = [files[0], { name: 'weit weg', points: sector(200, 5, 400, 0) }];
    expect(F.joinSectors(far).gaps.length).toBe(1);
  });
  it('natural order: 2 before 10', () => {
    expect(F.naturalSort(['S-10.gpx', 'S-2.gpx', 'S-1.gpx'])).toEqual(['S-1.gpx', 'S-2.gpx', 'S-10.gpx']);
  });
  it('waypoints with Garmin symbols become kinds; far ones are left out', () => {
    const gpx = `<gpx><wpt lat="47.001" lon="8.1"><name>Testbeck</name><sym>Pizza</sym></wpt><wpt lat="47" lon="8.5"><name>Brunnen Test</name><sym>Water Source</sym></wpt><wpt lat="47" lon="8.6"><name>Depot</name><sym>Residence</sym></wpt><wpt lat="48" lon="8.6"><name>Weit</name><sym>Lodging</sym></wpt></gpx>`;
    const w = F.parseWaypoints(gpx);
    expect(w.map((x) => F.kindOfWpt(x))).toEqual(['shop', 'water', 'depot', 'sleep']);
    const { route } = F.joinSectors(files);
    const { pois, far } = F.ownPois(w, route);
    expect(far).toBe(1);
    expect(pois.map((p) => p.kind)).toEqual(['shop', 'water', 'depot']);
    expect(pois[1].km).toBeGreaterThan(pois[0].km);
  });
  it('the biggest gaps per kind (learning: 92 km without a shop at the end)', () => {
    const pois = [{ kind: 'shop', km: 10 }, { kind: 'shop', km: 20 }, { kind: 'sleep', km: 40 }];
    const g = F.biggestGaps(pois, 100, ['shop', 'sleep']);
    expect(g[0]).toMatchObject({ kind: 'shop', fromKm: 20, toKm: 100, km: 80 });
    expect(g[1]).toMatchObject({ kind: 'sleep', fromKm: 40, toKm: 100 });
  });
});

describe('1 · the race plan (schedule), 3 sleep, 31 rest days, 25 cut-off', () => {
  const race = R.raceOf({ start: '2026-07-01T06:00', targetH: 48, sleepAt: '23:00', sleepH: 4 }, null);
  it('rides evenly outside the sleep blocks and ends on time', () => {
    const plan = R.schedule(race, 600);
    expect(plan.offH).toBeCloseTo(8, 5); // two nights of 4 h inside 48 h
    expect(plan.rideH).toBeCloseTo(40, 5);
    expect(plan.etaOf(600)).toBe(R.msOf('2026-07-03T06:00'));
    expect(R.hhmm(plan.etaOf(0))).toBe('06:00');
    expect(plan.days.reduce((s, d) => s + d.km, 0)).toBeGreaterThanOrEqual(599);
    // nothing is ridden during the night
    expect(plan.kmAt(R.msOf('2026-07-02T03:00')) - plan.kmAt(R.msOf('2026-07-01T23:00'))).toBeCloseTo(0, 5);
  });
  it('climbs take longer than the flat (learning: 35 000 m up)', () => {
    const { route } = F.joinSectors(files);
    const plan = R.schedule(race, route.km, route.profile);
    const flatH = (plan.etaOf(30) - plan.etaOf(0)) / 36e5;
    const upH = (plan.etaOf(60) - plan.etaOf(30)) / 36e5;
    expect(upH).toBeGreaterThan(flatH * 1.5);
    expect(R.effortOf(route.profile, route.km).gain).toBeGreaterThan(850);
  });
  it('a rest day adds a whole day off', () => {
    const r = R.raceOf({ start: '2026-07-01T06:00', targetH: 96, sleepH: 6, restDays: [2] }, null);
    const plan = R.schedule(r, 600);
    expect(plan.blocks.filter((b) => b.kind === 'rest').length).toBe(1);
    expect(plan.offH).toBeGreaterThan(24);
  });
  it('checkpoints with plan, actual and cut-off buffer; section analysis', () => {
    const r = R.raceOf({ ...race, checkpoints: [{ id: 'c1', name: 'CP 1', km: 300, cutoff: '2026-07-02T12:00', actual: '2026-07-02T08:00' }] }, null);
    const plan = R.schedule(r, 600);
    const rows = R.checkpointRows(r, plan);
    expect(rows[0].bufferH).toBeGreaterThan(0);
    expect(rows[0].diffH).not.toBeNull();
    const sec = M.sectionAnalysis(rows, plan.start);
    expect(sec[0].diffH).toBeCloseTo(rows[0].diffH, 5);
  });
  it('the speed you need for a cut-off counts the sleep in between', () => {
    const plan = R.schedule(race, 600);
    const need = R.cutoffNeed({ fromKm: 100, now: R.msOf('2026-07-01T20:00'), toKm: 300, cutMs: R.msOf('2026-07-02T12:00'), blocks: plan.blocks });
    expect(need.h).toBeCloseTo(12, 5); // 16 h minus 4 h sleep
    expect(need.kmh).toBeCloseTo(200 / 12, 5);
  });
  it('nights: your choice, planned minutes and the total', () => {
    const r = R.raceOf({ ...race, nights: [{ n: 0, kind: 'hotel', min: 300 }] }, null);
    const nights = R.nightRows(r, R.schedule(r, 600));
    expect(nights[0]).toMatchObject({ kind: 'hotel', min: 300 });
    expect(R.sleepTotal(nights)).toBe(300 + 240); // the second night keeps the plan's 4 h
  });
});

describe('route helpers: 20 climbs, 13 light, 29 mini goals, 12 countries', () => {
  it('finds the climb and says when it is hot', () => {
    const { route } = F.joinSectors(files);
    const c = R.climbsOf(route.profile);
    expect(c.length).toBe(1);
    expect(c[0].gain).toBeGreaterThan(850);
    expect(R.climbWhen(14, 28)).toBe('hot');
    expect(R.climbWhen(7, 28)).toBe('ok');
    expect(R.climbWhen(23, 10, true)).toBe('dark');
  });
  it('counts the dark riding hours against the lamp', () => {
    const race = R.raceOf({ start: '2026-07-01T06:00', targetH: 48, sleepH: 0 }, null);
    const plan = R.schedule(race, 600);
    const sun = (d) => ({ rise: R.msOf(`${d}T05:30`), set: R.msOf(`${d}T21:30`) });
    const dark = R.darkRiding(plan, sun, 6);
    expect(dark[0].darkH).toBeCloseTo(8, 1);
    expect(dark[0].need).toBe(true);
  });
  it('mini goals at checkpoints and every 50 km', () => {
    const race = R.raceOf({ checkpoints: [{ id: 'a', name: 'CP', km: 120 }] }, null);
    const g = R.miniGoals(race, 200);
    expect(g.map((x) => x.km)).toEqual([50, 100, 120, 150, 200]);
  });
  it('guesses the countries along a route', () => {
    expect(R.countriesOf([{ lat: 47.4, lon: 8.5 }, { lat: 47.27, lon: 11.4 }, { lat: 45.5, lon: 9.2 }])).toEqual(['CH', 'AT', 'IT']);
    expect(R.COUNTRY.CH.sos).toMatch(/1414/);
  });
});

describe('outside data: opening hours, supply, water, beds, stations, weather', () => {
  it('reads the usual opening hours', () => {
    const mon = new Date(2026, 6, 6, 17, 0); // a Monday
    expect(O.openAt('Mo-Fr 08:00-18:30; Sa 08:00-16:00; Su off', mon)).toMatchObject({ open: true, closes: '18:30' });
    expect(O.openAt('Mo-Fr 08:00-18:30', new Date(2026, 6, 6, 19, 0))).toMatchObject({ open: false, opens: '08:00' });
    expect(O.openAt('Mo-Sa 07:00-12:00,13:30-18:30', new Date(2026, 6, 6, 12, 30))).toMatchObject({ open: false, opens: '13:30' });
    expect(O.openAt('24/7', mon).open).toBe(true);
    expect(O.openAt('Fr 18:00-02:00', new Date(2026, 6, 11, 1, 0)).open).toBe(true); // Saturday 01:00
    expect(O.openAt('sunrise-sunset', mon).open).toBeNull();
    expect(O.openAt('Su off', new Date(2026, 6, 5, 10, 0)).open).toBe(false);
  });
  it('the next shop that is open when you get there', () => {
    const pois = [
      { kind: 'shop', km: 20, hours: 'Mo-Fr 08:00-12:00' },
      { kind: 'shop', km: 40, hours: '' },
    ];
    const eta = (km) => new Date(2026, 6, 6, 13, 0).getTime() + km * 36e4;
    const n = O.nextSupply(pois, 10, eta);
    expect(n.poi.km).toBe(40);
    expect(n.km).toBe(30);
  });
  it('dry stretches longer than 30 km and the bottles for them', () => {
    const pois = [{ kind: 'water', km: 10 }, { kind: 'shop', km: 70, hours: '' }];
    expect(O.dryStretches(pois, 100, 30)).toEqual([{ fromKm: 10, toKm: 70, km: 60 }]);
    expect(M.bottlesFor(3)).toBe(3);
  });
  it('beds near a planned night, stations once every 15 km', () => {
    const pois = [{ kind: 'sleep', km: 100, name: 'A' }, { kind: 'sleep', km: 130, name: 'B' }, { kind: 'station', km: 5, name: 'X', offKm: 1 }, { kind: 'station', km: 9, name: 'Y', offKm: 0.2 }, { kind: 'station', km: 40, name: 'Z', offKm: 0.5 }];
    expect(O.sleepNear(pois, 105).map((p) => p.name)).toEqual(['A']);
    expect(O.exitStations(pois).map((p) => p.name)).toEqual(['Y', 'Z']);
  });
  it('OSM answer → places along the route', () => {
    const { route } = F.joinSectors(files);
    const pts = R.lineKm(route);
    const json = { elements: [{ type: 'node', id: 1, lat: 47.001, lon: 8.2, tags: { shop: 'supermarket', name: 'Testladen', opening_hours: 'Mo-Sa 08:00-20:00' } }, { type: 'node', id: 2, lat: 47, lon: 8.6, tags: { tourism: 'hotel', name: 'Testhotel', phone: '+41 00 000 00 00' } }] };
    const p = O.poisFrom(json, pts);
    expect(p.map((x) => x.kind)).toEqual(['shop', 'sleep']);
    expect(p[1].phone).toMatch(/^\+41/);
    expect(O.poiQuery(pts)).toMatch(/around:1500/);
  });
  it('weather at the hour, the coldest of a night, advice and UV', () => {
    const t0 = Date.UTC(2026, 6, 1, 0) / 1000;
    const series = { hourly: { time: Array.from({ length: 24 }, (_, i) => t0 + i * 3600), temperature_2m: Array.from({ length: 24 }, (_, i) => 10 + i), uv_index: Array(24).fill(7) } };
    expect(O.wxAt(series, (t0 + 5 * 3600) * 1000).temp).toBe(15);
    expect(O.wxAt(series, (t0 + 99 * 3600) * 1000)).toBeNull();
    expect(O.lowBetween(series, t0 * 1000, (t0 + 3 * 3600) * 1000)).toBe(10);
    expect(O.wxAdvice({ temp: 5 })[0]).toMatch(/Long gloves/);
    expect(O.uvAdvice(7).level).toBe('high');
    expect(M.creamDue(7, null, 0)).toBe(true);
    expect(M.creamDue(7, 0, 36e5)).toBe(false);
  });
});

describe('in the race: 10 food, 18 ride or sleep, 6 stops, 14 contact points', () => {
  it('food per hour and the gaps', () => {
    const start = Date.UTC(2026, 6, 1, 6);
    const times = [1, 2, 6].map((h) => new Date(start + h * 36e5).toISOString());
    const f = R.foodStats(times, { start, now: start + 8 * 36e5 });
    expect(f.perH).toBeCloseTo(3 / 8, 1);
    expect(f.gaps.map((g) => g.h)).toEqual([4, 2]);
  });
  it('ride or sleep: a suggestion with reasons', () => {
    expect(R.rideOrSleep({ tired: 5 }).pick).toBe('nap');
    expect(R.rideOrSleep({ tired: 4, hour: 3, awakeH: 21 }).pick).toBe('sleep');
    expect(R.rideOrSleep({ tired: 1, hour: 20, awakeH: 10 }).pick).toBe('ride');
  });
  it('stop analysis from the rides', () => {
    const a = R.stopAnalysis([{ movingH: 10, totalH: 15, pauses: [{ min: 30 }, { min: 25 }, { min: 40 }, { min: 5 }] }]);
    expect(a.share).toBe(33);
    expect(a.long).toBe(3);
    expect(a.learn).toMatch(/quarter/);
  });
  it('contact points: the highest level per part', () => {
    const s = R.contactSummary([{ parts: { saddle: 2, hands: 1 } }, { parts: { saddle: 3 } }]);
    expect(s.find((x) => x.key === 'saddle')).toMatchObject({ max: 3, hurt: 2 });
  });
});

describe('before and after: 4 rules, 7 countdown, 32 training, 11 rig, 15 recovery, 16 same race, 26 stomach', () => {
  it('race rules against the packing list', () => {
    const rules = R.rulesFromText('- Rettungsdecke\n- Rücklicht, mind. 2\n\n- Pfeife');
    expect(rules).toEqual(['Rettungsdecke', 'Rücklicht, mind. 2', 'Pfeife']);
    const rows = R.checkRules(rules.map((text, i) => ({ id: `${i}`, text })), [{ id: 'x', name: 'Rettungsdecke Alu' }, { id: 'y', name: 'Rücklicht USB' }]);
    expect(rows.map((r) => !!r.item)).toEqual([true, true, false]);
  });
  it('countdown and the dress rehearsal date', () => {
    expect(R.countdown('2026-11-30', '2026-10-19')).toMatchObject({ days: 42, weeks: 6, probeBy: '2026-11-16' });
  });
  it('training: growing long rides, back-to-back from 6 weeks, taper at the end', () => {
    const plan = R.trainingPlan('2026-12-07', '2026-10-19', 250);
    expect(plan.length).toBe(7);
    expect(plan.at(-1).taper).toBe(true);
    expect(plan.some((w) => w.b2b)).toBe(true);
    expect(Math.max(...plan.map((w) => w.longKm))).toBeLessThanOrEqual(150);
    expect(R.longestByWeek([{ day: '2026-10-20', km: 80 }, { day: '2026-10-22', km: 120 }])).toEqual({ '2026-10-19': 120 });
  });
  it('rig: front, middle and rear', () => {
    const trip = { entries: [{ itemId: 'a', slot: 'bar' }, { itemId: 'b', slot: 'seat', qty: 2 }, { itemId: 'c', slot: 'frame' }] };
    const items = [{ id: 'a', weightG: 500, volumeL: 8 }, { id: 'b', weightG: 300 }, { id: 'c' }];
    const r = R.rigOf(trip, items);
    expect(r).toMatchObject({ g: 1100, l: 8, missing: 1 });
    expect(r.parts.rear.g).toBe(600);
  });
  it('recovery: back to normal when pulse and HRV are back', () => {
    const days = [];
    for (let i = 1; i <= 28; i++) days.push({ date: R.addDay('2026-07-01', -i), restingHr: 50, hrvMs: 60 });
    days.push({ date: '2026-07-06', restingHr: 58, hrvMs: 40 }, { date: '2026-07-07', restingHr: 53, hrvMs: 50 }, { date: '2026-07-08', restingHr: 51, hrvMs: 57 }, { date: '2026-07-09', restingHr: 50, hrvMs: 60 });
    const r = R.recovery(days, '2026-07-01', '2026-07-05');
    expect(r.base).toEqual({ restingHr: 50, hrvMs: 60 });
    expect(r.backOn).toBe('2026-07-08');
    expect(r.days).toBe(3);
  });
  it('the same race in other years', () => {
    expect(R.seriesKey('Testrennen 2025')).toBe('testrennen');
    const trips = [{ id: 'a', title: 'Testrennen 2025', startDate: '2025-07-01', event: {} }, { id: 'b', title: 'Testrennen 2026', startDate: '2026-07-01', event: {} }, { id: 'c', title: 'Anderes', startDate: '2026-07-01', event: {} }];
    expect(R.sameRace(trips[1], trips).map((t) => t.id)).toEqual(['a', 'b']);
  });
  it('stomach tests: what works first', () => {
    const l = R.stomachList([{ food: 'Riegel A', verdict: 'bad', day: '2026-09-01' }, { food: 'Gel B', verdict: 'good', day: '2026-09-02', h: 6 }]);
    expect(l.map((x) => x.food)).toEqual(['Gel B', 'Riegel A']);
  });
});

describe('33–40', () => {
  it('34 spares grow with gravel; 35 busy roads in the dark', () => {
    const a = M.sparesFor(1000, 0);
    const b = M.sparesFor(1000, 60);
    expect(b.find((x) => x.key === 'Tubeless plugs').n).toBeGreaterThan(a.find((x) => x.key === 'Tubeless plugs').n);
    const busy = M.busyInDark([{ fromKm: 10, toKm: 20 }], (km) => km * 36e5, (ms) => ms >= 15 * 36e5);
    expect(busy.length).toBe(1);
  });
  it('34/35 OSM ways in bins', () => {
    const { route } = F.joinSectors(files);
    const pts = R.lineKm(route);
    const json = { elements: [{ center: { lat: 47, lon: 8.05 }, tags: { highway: 'track' } }, { center: { lat: 47, lon: 8.3 }, tags: { highway: 'primary', surface: 'asphalt' } }] };
    const r = M.roadsFrom(json, pts, route.km);
    expect(r.gravelShare).toBe(50);
    expect(r.busy.length).toBe(1);
  });
  it('36 the weight is highest after filling up', () => {
    const w = M.weightAlong({ base: 20, totalKm: 100, eta: (km) => km * 36e4, waterAt: [50], foodAt: [] });
    expect(w.max.km).toBe(0);
    expect(w.points.find((p) => p.km === 50).kg).toBeGreaterThan(w.points.find((p) => p.km === 45).kg);
  });
  it('37 laundry: with 2 sets every 2 days, on a hotel night when one is near', () => {
    expect(M.laundryPlan({ days: 5, sets: 2, hotelDays: [3] }).washes).toEqual([{ day: 3, where: 'hotel' }, { day: 4, where: 'rinse' }]);
    expect(M.laundryPlan({ days: 2, sets: 2 }).washes).toEqual([]);
  });
  it('39 the tool fits the bike', () => {
    expect(M.sizesOf('Inbus 4, 5 · Torx T25')).toEqual(['hex4', 'hex5', 't25']);
    expect(M.toolCheck('Inbus 4, 5, 6; Torx T25', 'Inbus 4 5 6 8')).toEqual({ missing: ['t25'], ok: ['hex4', 'hex5', 'hex6'] });
  });
  it('22 care from km, rain and gravel; 31 rest-day spots; merge own and OSM stops', () => {
    expect(M.careAfter({ km: 1000, rainH: 8, gravelShare: 50 }).length).toBeGreaterThan(6);
    const pois = [{ kind: 'sleep', km: 500, name: 'H' }, { kind: 'laundry', km: 501 }, { kind: 'bike', km: 499 }, { kind: 'sleep', km: 100 }];
    expect(M.restDaySpots(pois, 1000)[0].poi.name).toBe('H');
    const merged = M.mergePois([{ kind: 'shop', lat: 47, lon: 8, km: 1, own: true }], [{ kind: 'shop', lat: 47.0005, lon: 8.0005, km: 1 }, { kind: 'water', lat: 47, lon: 8, km: 1 }]);
    expect(merged.length).toBe(2);
  });
});

describe('Strategie: the race played through, three ways to sleep, every assumption yours', async () => {
  const S = await import('../src/lib/race/strategy.js');
  // a fictional 600 km race: flat 0–200, a long climb 200–400, flat to 600; beds every 60 km, campgrounds every 120
  const profile = [];
  for (let k = 0; k <= 600; k += 5) profile.push([k, k < 200 ? 400 : k < 400 ? 400 + (k - 200) * 15 : 3400]);
  const pois = [];
  for (let k = 60; k < 600; k += 60) pois.push({ id: `h${k}`, kind: 'sleep', km: k, name: `Testhotel ${k}`, sub: 'hotel' });
  for (let k = 120; k < 600; k += 120) pois.push({ id: `c${k}`, kind: 'sleep', km: k + 10, name: `Testcamping ${k}`, sym: 'Campground' });
  const input = { km: 600, profile, pois, start: '2027-06-15T06:00' };
  it('pace from rides: flat speed and climbing rate fitted', () => {
    const acts = [
      { kind: 'ride', km: 100, hm: 0, movingS: 4 * 3600, elapsedS: 5 * 3600 },
      { kind: 'ride', km: 50, hm: 1000, movingS: (2 + 1000 / 800) * 3600, elapsedS: 4 * 3600 },
      { kind: 'ride', km: 80, hm: 2000, movingS: (3.2 + 2.5) * 3600, elapsedS: 7 * 3600 },
    ];
    const p = S.paceFromRides(acts, []);
    expect(p.light.flatKmh).toBeCloseTo(25, 0);
    expect(p.light.climbMh).toBeCloseTo(800, -1);
    expect(p.loaded).toBeNull();
    expect(S.paceFromRides(acts.slice(0, 2), []).light).toBeNull();
    // loaded: days of a trip of two days or more, or marked by hand
    const isLoaded = S.loadedBy([{ startDate: '2026-06-05', days: 2 }], ['x']);
    expect(isLoaded({ day: '2026-06-06' })).toBe(true);
    expect(isLoaded({ id: 'x', day: '2026-01-01' })).toBe(true);
    expect(isLoaded({ id: 'y', day: '2026-01-01' })).toBe(false);
  });
  it('the assumptions say where they come from; yours win', () => {
    const as = S.assumptionsOf({ assume: { climbMh: 600 } }, { light: { flatKmh: 29, climbMh: 775 }, loaded: { flatKmh: 24, climbMh: 640 }, pausePct: 30 });
    expect(as.climbMh).toEqual({ value: 600, src: 'yours' });
    expect(as.flatKmh).toEqual({ value: 24, src: 'loaded' });
    expect(as.pausePct).toEqual({ value: 30, src: 'rides' });
    expect(as.fatiguePct.src).toBe('standard');
  });
  it('hotels: every night at a bed before check-in; tent: lighter on time, heavier to carry', () => {
    const as = S.assumptionsOf({}, null);
    const [hotel, mixed, tent] = S.compareWays({ ...input, as });
    for (const r of [hotel, mixed, tent]) expect(r.done).toBe(true);
    expect(hotel.days.slice(0, -1).every((d) => d.bed === 'hotel' && d.place.startsWith('Testhotel'))).toBe(true);
    expect(hotel.chf).toBeGreaterThan(0);
    expect(tent.kg).toBeGreaterThan(hotel.kg);
    expect(hotel.days.at(-1).place).toBe('Finish');
    expect(S.simulate({ ...input, start: '2027-06-19T06:00', way: 'hotel', as }).days[1].sunday).toBe(true); // 2027-06-20 is a Sunday
  });
  it('a night you set yourself: night 1 in the bivy', () => {
    const as = S.assumptionsOf({});
    const r = S.simulate({ ...input, way: 'hotel', as, fixed: { 1: 'bivy' } });
    expect(r.days[0].bed).toBe('bivy');
  });
  it('loaded climbs slower: 550 instead of 775 makes the race longer', () => {
    const light = S.simulate({ ...input, way: 'mixed', as: S.assumptionsOf({ assume: { climbMh: 775 } }) });
    const loaded = S.simulate({ ...input, way: 'mixed', as: S.assumptionsOf({ assume: { climbMh: 550 } }) });
    expect(loaded.totalH).toBeGreaterThan(light.totalH);
  });
  it('own assumptions: an extra hour every day makes it later', () => {
    const as = S.assumptionsOf({});
    const a = S.simulate({ ...input, way: 'hotel', as });
    const b = S.simulate({ ...input, way: 'hotel', as, own: [{ id: 'o', name: 'Massage', kind: 'minDay', value: 60 }] });
    expect(b.totalH).toBeGreaterThanOrEqual(a.totalH);
  });
});

describe('the time plan follows the stages of the chosen way', async () => {
  const S = await import('../src/lib/race/strategy.js');
  it('every stage ends at its place at its time', () => {
    const profile = [];
    for (let k = 0; k <= 300; k += 5) profile.push([k, 400 + (k % 50) * 10]);
    const pois = [100, 200].map((k) => ({ id: `h${k}`, kind: 'sleep', km: k, name: `Testhotel ${k}`, sub: 'hotel' }));
    const sim = S.simulate({ km: 300, profile, pois, start: '2027-06-19T08:00', way: 'hotel', as: S.assumptionsOf({}) });
    const plan = S.simPlan(sim, 300, profile);
    for (const d of sim.days) {
      expect(plan.etaOf(d.toKm)).toBeCloseTo(d.arrive, -4);
      expect(plan.kmAt(d.arrive)).toBeCloseTo(d.toKm, 0);
    }
    expect(R.hhmm(plan.start)).toBe('08:00');
    expect(plan.blocks.length).toBe(sim.days.length - 1);
  });
});
