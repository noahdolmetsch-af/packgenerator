// Gruppen-Live-Karte (Noah 25.10.2026 «b»): the pure helpers of src/lib/live/group.js. Fictional data only.
import { describe, it, expect } from 'vitest';
import { endKeptGroup, stillWaiting, groupGpx, gpxName, STOP_GLYPH, parseGroupLink, groupLinkOf, inviteLinks, routePayload, readRoute, placePayload, readPlace, memberRows, nearHome, initials, cleanName, groupRunning, minutesAgo, STALE_MIN, GONE_MIN, GROUP_V } from '../src/lib/live/group.js';
import { readPart } from '../src/lib/live/event.js';

const T0 = Date.parse('2026-07-03T08:00:00Z');
const route = { line: Array.from({ length: 21 }, (_, i) => [47 + i * 0.005, 8]), km: 11.1 };

describe('group.js', () => {
  it('the link: made and read back; anything else is no group link', () => {
    const gid = 'a'.repeat(22);
    const key = 'B'.repeat(43);
    const url = groupLinkOf(gid, key, 'https://example.test/app/');
    expect(url).toBe(`https://example.test/app/#/gruppe/${gid}/${key}`);
    expect(parseGroupLink(url.slice(url.indexOf('#')))).toEqual({ gid, key });
    expect(parseGroupLink('#/gruppe/short/key')).toBeNull();
    expect(parseGroupLink(`#/spur-link/${gid}/${key}`)).toBeNull();
  });
  it('the invitation goes to WhatsApp and SMS with the whole text', () => {
    const l = inviteLinks('Fahr mit: https://example.test/#/gruppe/x');
    expect(l.whatsapp).toBe('https://wa.me/?text=Fahr%20mit%3A%20https%3A%2F%2Fexample.test%2F%23%2Fgruppe%2Fx');
    expect(l.sms).toMatch(/^sms:\?&body=Fahr%20mit/);
  });
  it('the route leaves out the first and last 500 m (home) and comes back as a line', () => {
    const p = routePayload('test_data_gtp_ Runde', route);
    expect(p.v).toBe(GROUP_V);
    const back = readRoute(p);
    expect(back.title).toBe('test_data_gtp_ Runde');
    expect(back.route.km).toBe(11.1);
    expect(back.route.line[0][0]).toBeGreaterThan(47.004);
    expect(back.route.line.at(-1)[0]).toBeLessThan(47.096);
    expect(readRoute(routePayload('', null)).route).toBeNull();
    expect(readRoute(null)).toEqual({ title: '', route: null });
  });
  it('a place: rounded, with a clean name; broken places are dropped', () => {
    const p = placePayload('  Test   Fahrerin  ', { lat: 47.123456789, lon: 8.987654321, at: T0 });
    expect(p).toEqual({ v: GROUP_V, n: 'Test Fahrerin', lat: 47.12346, lon: 8.98765, at: new Date(T0).toISOString() });
    expect(readPlace(p)).toEqual({ name: 'Test Fahrerin', pos: [47.12346, 8.98765], at: new Date(T0).toISOString(), wait: false, part: readPart({}) });
    // Gruppenfahrt für Events: a member without a place (night pause, or only ready / help / things)
    const none = readPlace(placePayload('B', null, T0, { wait: true }));
    expect(none).toMatchObject({ name: 'B', pos: null, wait: false });
    expect(readPlace(placePayload('A', { lat: 47, lon: 8, at: T0 }, T0, { wait: true })).wait).toBe(true);
    expect(readPlace({ v: GROUP_V, n: 'x', lat: 'a', lon: 8, at: 'now' })).toBeNull();
    expect(cleanName('x'.repeat(80))).toHaveLength(40);
  });
  it('the list: km along the route, off the route, last seen, stale and gone; the newest first', () => {
    const at = (min) => new Date(T0 - min * 60_000).toISOString();
    const rows = memberRows(
      [
        { m: 'a', name: 'Test A', pos: [47.05, 8], at: at(20) },
        { m: 'b', name: 'Test B', pos: [47.08, 8.0001], at: at(1) },
        { m: 'c', name: 'Test C', pos: [46.5, 8], at: at(3) },
        { m: 'd', name: 'Test D', pos: [47.01, 8], at: at(GONE_MIN + 1) },
      ],
      route,
      { now: T0, me: 'b' },
    );
    expect(rows.map((r) => r.m)).toEqual(['b', 'c', 'a']);
    expect(rows[0]).toMatchObject({ me: true, ago: 1, stale: false });
    expect(rows[0].km).toBeCloseTo(8.9, 0);
    expect(rows[1].km).toBeNull(); // 60 km off the route
    expect(rows[2]).toMatchObject({ ago: 20, stale: 20 > STALE_MIN });
    expect(memberRows([{ m: 'a', name: 'A', pos: [47, 8], at: at(2) }], null, { now: T0 })[0].km).toBeNull();
  });
  it('waiting ends 300 m further; the route as GPX with a clean file name', () => {
    expect(stillWaiting({ lat: 47, lon: 8 }, { lat: 47.001, lon: 8 })).toBe(true);
    expect(stillWaiting({ lat: 47, lon: 8 }, { lat: 47.004, lon: 8 })).toBe(false);
    expect(stillWaiting(null, { lat: 47, lon: 8 })).toBe(false);
    const g = groupGpx('test_data_gtp_ Runde <1>', route);
    expect(g).toMatch(/<name>test_data_gtp_ Runde &lt;1&gt;<\/name>/);
    expect(g.match(/<trkpt/g)).toHaveLength(route.line.length);
    expect(groupGpx('x', null)).toBe('');
    expect(gpxName('Jura-Rundfahrt «Tag 1»')).toBe('Jura-Rundfahrt-Tag-1.gpx');
    expect(gpxName('')).toBe('gruppenfahrt.gpx');
    expect(STOP_GLYPH.water).toBeTruthy();
  });
  it('small helpers', () => {
    expect(initials('Test Fahrer')).toBe('TF');
    expect(initials('')).toBe('?');
    expect(minutesAgo(new Date(T0 + 60_000).toISOString(), T0)).toBe(0);
    expect(nearHome(route, { lat: 47.001, lon: 8 })).toBe(true);
    expect(nearHome(route, { lat: 47.05, lon: 8 })).toBe(false);
    expect(nearHome(null, { lat: 47, lon: 8 })).toBe(false);
    expect(groupRunning({ gid: 'g', key: 'k', end: new Date(T0 + 1000).toISOString() }, T0)).toBe(true);
    expect(groupRunning({ gid: 'g', key: 'k', end: new Date(T0 - 1000).toISOString() }, T0)).toBe(false);
    expect(groupRunning(null, T0)).toBe(false);
  });
});

// Gruppenfahrt für Events (Noah 26.10.2026): a group of several days goes on after the ride
describe('endKeptGroup', () => {
  const fakeDb = (value) => {
    let v = value;
    return { settings: { get: async () => (v ? { key: 'live-group', value: v } : undefined), delete: async () => (v = null) }, kept: () => v };
  };
  it('ends a group of one day, keeps an event group of several days', async () => {
    const end = new Date(Date.now() + 3600_000).toISOString();
    const one = fakeDb({ gid: 'g', key: 'k', del: 'd', end, days: 1 });
    expect(await endKeptGroup(one, { doFetch: async () => Response.json({ ok: true }) })).toBe(true);
    expect(one.kept()).toBeNull();
    const three = fakeDb({ gid: 'g', key: 'k', del: 'd', end, days: 3 });
    expect(await endKeptGroup(three)).toBe(false);
    expect(three.kept()).not.toBeNull();
  });
});
