// Paket U2 «Live-Karte»: the sums behind the live map, on the made-up sample race (sample.js).
import { describe, it, expect } from 'vitest';
import { lineKm, climbsOf, pointAt } from '../src/lib/race/race.js';
import { sampleRoute, samplePois } from '../src/lib/race/sample.js';
import {
  onRoute, gainBetween, rideH, stopsAhead, nextClimb, arrival, lightLeft, darkMinutes, pauses, eatDue,
  batteryEnough, drainOf, planDelta, offRouteStep, nextSay, navLinks, sosText, smsHref, nearestStation, liveKmCounts, distKm,
} from '../src/lib/live/live-lib.js';

const route = sampleRoute();
const pts = lineKm(route);
const pois = samplePois(route);
// a Wednesday in June at 10:00 Zurich (08:00 UTC)
const NOW = Date.UTC(2027, 5, 23, 8, 0);

describe('live map: where you are', () => {
  it('finds the km on the route and how far off you are', () => {
    const p = pointAt(pts, 412);
    expect(onRoute(pts, p).km).toBeCloseTo(412, 0);
    expect(onRoute(pts, p).offM).toBeLessThan(5);
    const off = { lat: p.lat + 0.002, lon: p.lon };
    expect(onRoute(pts, off).offM).toBeGreaterThan(100);
    expect(onRoute([], p)).toBeNull();
  });
  it('sums the climbing between two km', () => {
    expect(gainBetween([[0, 500], [1, 600], [2, 550], [3, 700]], 0, 3)).toBe(250);
    expect(gainBetween([[0, 500], [2, 700]], 0, 1)).toBe(100);
    expect(gainBetween(route.profile, 0, route.km)).toBeGreaterThan(25000);
  });
  it('rides flat km and climbing apart', () => {
    expect(rideH(20, 600, { kmh: 20, climbMh: 600 })).toBe(2);
  });
});

describe('live map: what comes next', () => {
  it('lists the next stops along the route with distance, time and hours', () => {
    const rows = stopsAhead({ pois, pts, km: 100, kinds: ['shop', 'water'], n: 3, now: NOW, profile: route.profile });
    expect(rows).toHaveLength(3);
    expect(rows[0].distKm).toBeGreaterThanOrEqual(0);
    expect(rows.map((r) => r.distKm)).toEqual([...rows.map((r) => r.distKm)].sort((a, b) => a - b));
    expect(rows.every((r) => r.eta >= NOW)).toBe(true);
    const shop = rows.find((r) => r.kind === 'shop');
    if (shop) expect(shop.open).not.toBeNull();
  });
  it('without a route: the stops around you by straight line', () => {
    const here = pointAt(pts, 300);
    const rows = stopsAhead({ pois, here, n: 4, now: NOW });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.along === false && r.distKm <= 30)).toBe(true);
  });
  it('finds the next climb', () => {
    const climbs = climbsOf(route.profile, 300);
    const c = nextClimb(climbs, 600);
    expect(c.toKm).toBeGreaterThan(600);
    expect(nextClimb(climbs, route.km)).toBeNull();
  });
  it('says when you arrive and how much light is left', () => {
    const a = arrival({ pts, profile: route.profile, km: 990, now: NOW, pace: { kmh: 20, climbMh: 600 } });
    expect(a.kmLeft).toBeCloseTo(14, 0);
    expect(a.eta).toBeGreaterThan(NOW);
    const l = lightLeft(46.8, 8.2, NOW);
    expect(l.dark).toBe(false);
    expect(l.minLeft).toBeGreaterThan(8 * 60);
    expect(darkMinutes(l.set + 30 * 6e4, l)).toBe(30);
    expect(darkMinutes(l.set - 6e4, l)).toBe(0);
  });
});

describe('live map: pauses, food, battery, plan', () => {
  it('finds a pause of 5 minutes and the moving time', () => {
    const fixes = [];
    for (let i = 0; i < 10; i++) fixes.push({ lat: 47 + i * 0.002, lon: 8, at: NOW + i * 30e3 });
    for (let i = 1; i <= 10; i++) fixes.push({ lat: 47.018, lon: 8, at: NOW + 270e3 + i * 30e3 });
    for (let i = 1; i <= 5; i++) fixes.push({ lat: 47.018 + i * 0.002, lon: 8, at: NOW + 570e3 + i * 30e3 });
    const p = pauses(fixes);
    expect(p.stops).toHaveLength(1);
    expect(p.stops[0].s).toBeGreaterThanOrEqual(300);
    expect(p.movingS).toBeGreaterThan(300);
  });
  it('reminds to eat after 45 minutes or 300 m up', () => {
    expect(eatDue({ lastAt: NOW - 50 * 6e4, now: NOW }).due).toBe(true);
    expect(eatDue({ lastAt: NOW - 10 * 6e4, now: NOW, gainSince: 320 }).due).toBe(true);
    expect(eatDue({ lastAt: NOW - 10 * 6e4, now: NOW, gainSince: 100 })).toEqual({ due: false, inMin: 35, hmLeft: 200 });
  });
  it('says whether the battery lasts', () => {
    expect(batteryEnough({ level: 0.8, drainPerH: 0.1, hoursLeft: 5 })).toMatchObject({ hours: 8, enough: true, atEnd: 0.3 });
    expect(batteryEnough({ level: 0.3, drainPerH: 0.1, hoursLeft: 5 }).enough).toBe(false);
    expect(drainOf({ level: 0.9, at: 0 }, { level: 0.8, at: 36e5 })).toBeCloseTo(0.1);
    expect(drainOf({ level: 0.8, at: 0 }, { level: 0.9, at: 36e5 })).toBeNull();
  });
  it('compares with the plan', () => {
    const plan = { etaOf: (km) => NOW + km * 3 * 6e4 };
    expect(planDelta(plan, 100, NOW + 260 * 6e4)).toBe(40);
    expect(planDelta(null, 100, NOW)).toBeNull();
  });
});

describe('live map: warnings and links', () => {
  it('warns once off the route and calms down only well back on it', () => {
    let s = offRouteStep(150, 'on');
    expect(s).toEqual({ warn: true, state: 'off' });
    s = offRouteStep(200, s.state);
    expect(s.warn).toBe(false);
    expect(offRouteStep(80, 'off').state).toBe('off');
    expect(offRouteStep(50, 'off').state).toBe('on');
  });
  it('announces a stop once and a climb before it starts', () => {
    const stop = { id: 'a', name: 'Dorfladen', distKm: 4.2, open: { open: true, closes: '19:00' } };
    const say = nextSay({ stop });
    expect(say.key).toBe('In {d} km: {name}, open until {at}');
    expect(nextSay({ stop, said: new Set([say.id]) })).toBeNull();
    const climb = { fromKm: 10, toKm: 14, grade: 7.1, distKm: 1.5, onIt: false };
    expect(nextSay({ climb, stop }).id).toBe('climb:10');
  });
  it('builds the links to Google Maps and OsmAnd and the SMS', () => {
    const l = navLinks({ lat: 46.5, lon: 7.25 });
    expect(l.google).toContain('destination=46.500000,7.250000');
    expect(l.google).toContain('travelmode=bicycling');
    expect(l.osmand).toContain('osmand.net/map?pin=46.500000,7.250000');
    const txt = sosText({ here: { lat: 46.5, lon: 7.25 }, km: 412.4, routeName: 'Muster', now: NOW });
    expect(txt).toContain('46.50000, 7.25000');
    expect(txt).toContain('km 412 of Muster');
    expect(smsHref('a b')).toBe('sms:?body=a%20b');
  });
  it('finds the nearest station for the abort', () => {
    const s = nearestStation({ pois, km: 400 });
    expect(s.kind).toBe('station');
    expect(s.distKm).toBeLessThanOrEqual(19);
  });
  it('counts live km for the bike only when no Strava ride overlaps', () => {
    const ride = { km: 42, startAt: NOW, endAt: NOW + 2 * 36e5, bikeId: 'b1' };
    expect(liveKmCounts(ride, [])).toBe(true);
    expect(liveKmCounts(ride, [{ start: NOW + 36e5, end: NOW + 3 * 36e5, bikeId: 'b1' }])).toBe(false);
    expect(liveKmCounts(ride, [{ start: NOW + 36e5, end: NOW + 3 * 36e5, bikeId: 'b2' }])).toBe(true);
  });
  it('measures distance', () => {
    expect(distKm({ lat: 47, lon: 8 }, { lat: 47.1, lon: 8 })).toBeCloseTo(11.12, 1);
  });
});
