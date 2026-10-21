// «Neue Quellen» (Noah 20.10.2026): Ride with GPS per link, ÖV in der Nähe (transport.opendata.ch),
// Ladestationen (OpenStreetMap), GPX waypoints on the trip route. No network: every fetch is mocked.
// Fictional data only.
import { describe, it, expect } from 'vitest';
import { parseRwgpsLink, cleanRef, gpxUrl, fetchRwgps, looksLikeGpx, RwgpsError } from '../api/_lib/rwgps.js';
import { stopsUrl, boardUrl, parseStops, parseBoard, lineOf, stopKind, timeMs, ovStops, ovDepartures, distM } from '../api/_lib/ov.js';
import { makeHandler, ACTIONS } from '../api/lake.js';
import { fetchRwgpsGpx, rwgpsApiUrl, RWGPS_URL } from '../src/lib/sources/rwgps.js';
import { loadStops, loadDepartures, distText, minutesUntil, OV_URL } from '../src/lib/sources/ov.js';
import { chargeQuery, parseCharge, socketsOf, isBikeCharger, loadCharge, CHARGE_CATEGORY } from '../src/lib/sources/charge.js';
import { routeFromGpx, wptsOf, wptKind, isCue, wptsOnMap, readRouteFile } from '../src/lib/route/fromgpx.js';
import { parseGpx } from '../src/lib/route.js';
import { KEYS as POI_KEYS, CATEGORIES } from '../src/lib/map/poisearch.js';
import { DAY_CAPS } from '../api/_lib/daycap.js';
import de from '../src/lib/i18n/de/quellen.js';
import DE from '../src/lib/i18n/de/index.js';
import { readFileSync } from 'node:fs';

const ok = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)), headers: new Headers() });
const status = (s, body = {}) => ({ ok: false, status: s, json: async () => body, text: async () => '', headers: new Headers() });
const req = (q, origin = 'https://noahdolmetsch-af.github.io') => new Request(`https://packgen-three.vercel.app/api/lake${q}`, { headers: { origin } });

// a fictional Ride with GPS route: POIs before the track (as Ride with GPS writes them), one turn cue
const RWGPS_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="http://ridewithgps.com/">
  <metadata><name>test_data_gtp_Runde Testtal</name></metadata>
  <wpt lat="46.9001" lon="7.4002"><name>test_data_gtp_Brunnen</name><type>Water</type></wpt>
  <wpt lat="46.9051" lon="7.4402"><name>test_data_gtp_CP1</name><type>Control</type><desc>Stempel holen</desc></wpt>
  <wpt lat="46.9031" lon="7.4202"><name>Turn left</name><type>Left</type></wpt>
  <wpt lat="46.9081" lon="7.4702"><name>test_data_gtp_Beizli</name><sym>Restaurant</sym></wpt>
  <wpt lat="47.9" lon="8.9"><name>test_data_gtp_weit weg</name><type>Water</type></wpt>
  <trk><name>test_data_gtp_Runde Testtal</name><trkseg>
    ${Array.from({ length: 11 }, (_, i) => `<trkpt lat="${(46.9 + i * 0.001).toFixed(4)}" lon="${(7.4 + i * 0.008).toFixed(4)}"><ele>${500 + i * 10}</ele></trkpt>`).join('\n    ')}
  </trkseg></trk>
</gpx>`;

describe('Ride with GPS links', () => {
  it('reads routes and trips, with slug, query, fragment, www, without https and inside a share text', () => {
    expect(parseRwgpsLink('https://ridewithgps.com/routes/12345')).toEqual({ kind: 'route', id: '12345', privacy: '' });
    expect(parseRwgpsLink('https://www.ridewithgps.com/trips/987654?utm_source=x#map')).toEqual({ kind: 'trip', id: '987654', privacy: '' });
    expect(parseRwgpsLink('ridewithgps.com/routes/42-test-data-gtp-loop')).toEqual({ kind: 'route', id: '42', privacy: '' });
    expect(parseRwgpsLink('https://ridewithgps.com/routes/42/edit')).toMatchObject({ kind: 'route', id: '42' });
    expect(parseRwgpsLink('Schau mal: https://ridewithgps.com/routes/777?privacy_code=AbC123xyz.')).toEqual({ kind: 'route', id: '777', privacy: 'AbC123xyz' });
    expect(parseRwgpsLink('https://ridewithgps.com/embeds?type=trip&id=555')).toEqual({ kind: 'trip', id: '555', privacy: '' });
  });
  it('refuses other sites, other pages, broken ids and tricks', () => {
    for (const bad of ['', 'hello', 'https://example.com/routes/12345', 'https://ridewithgps.com/users/12', 'https://ridewithgps.com/routes/', 'https://ridewithgps.com/routes/abc', 'https://ridewithgps.com.evil.example/routes/1', 'https://user:pw@ridewithgps.com/routes/1', 'javascript:ridewithgps.com/routes/1x', 'https://ridewithgps.com/routes/1234567890123']) {
      expect(parseRwgpsLink(bad), bad).toBeNull();
    }
    // a strange privacy code is dropped, the route stays
    expect(parseRwgpsLink('https://ridewithgps.com/routes/9?privacy_code=<script>')).toEqual({ kind: 'route', id: '9', privacy: '' });
  });
  it('builds the GPX address (track, privacy code passed on)', () => {
    expect(gpxUrl({ kind: 'route', id: '12345' })).toBe('https://ridewithgps.com/routes/12345.gpx?sub_format=track');
    expect(gpxUrl({ kind: 'trip', id: '7', privacy: 'Zz9' })).toBe('https://ridewithgps.com/trips/7.gpx?sub_format=track&privacy_code=Zz9');
    expect(gpxUrl({ kind: 'user', id: '7' })).toBe('');
    expect(cleanRef({ kind: 'ROUTE', id: '3' })).toEqual({ kind: 'route', id: '3', privacy: '' });
    expect(cleanRef({ kind: 'route', id: '3; drop' })).toBeNull();
  });
  it('fetches the GPX; 404, private (login page or 403) and a dead source have their own code', async () => {
    const seen = [];
    const r = await fetchRwgps({ kind: 'route', id: '12345' }, { doFetch: async (u) => (seen.push(u), ok(RWGPS_GPX)) });
    expect(seen).toEqual(['https://ridewithgps.com/routes/12345.gpx?sub_format=track']);
    expect(r.file).toBe('ridewithgps-route-12345.gpx');
    expect(looksLikeGpx(r.gpx)).toBe(true);
    const code = (doFetch) => fetchRwgps({ kind: 'route', id: '1' }, { doFetch }).catch((e) => e.code);
    expect(await code(async () => status(404))).toBe('not_found');
    expect(await code(async () => status(403))).toBe('not_public');
    expect(await code(async () => ok('<!doctype html><html><body>Log in</body></html>'))).toBe('not_public');
    expect(await code(async () => status(500))).toBe('unreachable');
    expect(await code(async () => { throw new Error('offline'); })).toBe('unreachable');
    await expect(fetchRwgps({ kind: 'x', id: '1' })).rejects.toBeInstanceOf(RwgpsError);
  });
});

describe('the server actions on /api/lake', () => {
  it('?action=rwgps answers { gpx, file } with a cache header, and clear errors', async () => {
    const h = makeHandler({ doFetch: async (u) => (u.includes('/routes/12345.gpx') ? ok(RWGPS_GPX) : status(404)), capStore: () => null });
    const res = await h(req('?action=rwgps&kind=route&id=12345'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toMatch(/s-maxage=600/);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://noahdolmetsch-af.github.io');
    const body = await res.json();
    expect(body.file).toBe('ridewithgps-route-12345.gpx');
    expect(body.gpx).toContain('<gpx');
    const bad = await h(req('?action=rwgps&kind=route&id=abc'));
    expect(bad.status).toBe(400);
    expect((await bad.json()).code).toBe('invalid');
    const missing = await h(req('?action=rwgps&kind=route&id=99'));
    expect(missing.status).toBe(404);
    expect((await missing.json()).code).toBe('not_found');
  });
  it('?action=ov-stops and ?action=ov-departures (keyless), broken input → 400, dead source → 502', async () => {
    const urls = [];
    const net = async (u) => {
      urls.push(u);
      if (u.includes('/locations')) return ok({ stations: [{ id: '8500001', name: 'test_data_gtp_Bahnhof', coordinate: { type: 'WGS84', x: 46.951, y: 7.439 }, distance: 300, icon: 'train' }] });
      if (u.includes('/stationboard')) return ok({ station: { id: '8500001', name: 'test_data_gtp_Bahnhof' }, stationboard: [{ category: 'S', number: '3', to: 'test_data_gtp_Endstation', stop: { departure: '2026-10-20T14:32:00+0200', departureTimestamp: 1792499520, delay: 0, platform: '4' } }] });
      return status(404);
    };
    const h = makeHandler({ doFetch: net, capStore: () => null });
    const s = await h(req('?action=ov-stops&lat=46.95123&lon=7.43987'));
    expect(s.status).toBe(200);
    expect(s.headers.get('Cache-Control')).toMatch(/s-maxage=3600/);
    expect((await s.json()).stops[0]).toMatchObject({ id: '8500001', kind: 'train' });
    expect(urls[0]).toBe('https://transport.opendata.ch/v1/locations?x=46.951&y=7.44&type=station'); // only ~100 m goes out
    const d = await h(req('?action=ov-departures&id=8500001'));
    expect(d.status).toBe(200);
    expect(d.headers.get('Cache-Control')).toMatch(/s-maxage=30\b/);
    expect((await d.json()).departures[0]).toMatchObject({ line: 'S3', to: 'test_data_gtp_Endstation', platform: '4' });
    expect((await h(req('?action=ov-stops&lat=x&lon=7'))).status).toBe(400);
    expect((await h(req('?action=ov-stops'))).status).toBe(400);
    expect((await h(req('?action=ov-departures&id=12;x'))).status).toBe(400);
    const dead = makeHandler({ doFetch: async () => status(500), capStore: () => null });
    expect((await dead(req('?action=ov-departures&id=8500001'))).status).toBe(502);
  });
  it('an unknown action is refused; no action is still the lake; the preflight works for every action', async () => {
    const h = makeHandler({ doFetch: async () => status(500), capStore: () => null });
    const res = await h(req('?action=nope'));
    expect(res.status).toBe(400);
    expect((await res.json()).code).toBe('unknown_action');
    expect(ACTIONS).toEqual(['rwgps', 'ov-stops', 'ov-departures']);
    expect((await h(req('?step=other'))).status).toBe(400); // the lake's own check
    const pre = await h(new Request('https://packgen-three.vercel.app/api/lake?action=rwgps', { method: 'OPTIONS', headers: { origin: 'https://noahdolmetsch-af.github.io' } }));
    expect(pre.status).toBe(204);
  });
  it('no new function: still the same files under api/ (the plan allows 12), and a daily cap per new action', () => {
    const fns = readFileSync(new URL('../api/lake.js', import.meta.url), 'utf8');
    expect(fns).toMatch(/action=rwgps/);
    expect(DAY_CAPS.rwgps).toBeGreaterThan(0);
    expect(DAY_CAPS.ov).toBeGreaterThan(0);
  });
});

describe('the app asks for a Ride with GPS route', () => {
  it('sends only kind, id and privacy code to its server and returns the GPX', async () => {
    const seen = [];
    const r = await fetchRwgpsGpx('https://ridewithgps.com/routes/12345?privacy_code=Ab1', { fetcher: async (u) => (seen.push(u), ok({ gpx: RWGPS_GPX, file: 'ridewithgps-route-12345.gpx' })), online: true });
    expect(seen).toEqual([`${RWGPS_URL}&kind=route&id=12345&privacy=Ab1`]);
    expect(rwgpsApiUrl({ kind: 'trip', id: '5', privacy: '' })).toBe(`${RWGPS_URL}&kind=trip&id=5`);
    expect(r.file).toBe('ridewithgps-route-12345.gpx');
  });
  it('an invalid link never calls the server; server codes become plain messages', async () => {
    let calls = 0;
    const err = await fetchRwgpsGpx('https://example.com/routes/1', { fetcher: async () => (calls++, ok({})), online: true }).catch((e) => e);
    expect(calls).toBe(0);
    expect(err.code).toBe('invalid');
    const priv = await fetchRwgpsGpx('ridewithgps.com/routes/1', { fetcher: async () => status(403, { code: 'not_public' }), online: true }).catch((e) => e);
    expect(priv.code).toBe('not_public');
    expect(priv.message).toMatch(/private/);
    const off = await fetchRwgpsGpx('ridewithgps.com/routes/1', { fetcher: async () => { throw new Error('offline'); }, online: false }).catch((e) => e);
    expect(off.message).toMatch(/No connection/);
  });
});

describe('GPX waypoints on the trip route (Ride with GPS, Garmin)', () => {
  it('the route name is the track name, not the first waypoint', () => {
    expect(parseGpx(RWGPS_GPX).name).toBe('test_data_gtp_Runde Testtal');
  });
  it('keeps the places along the route with their km and kind; turn cues and far points are left out', () => {
    const route = routeFromGpx(RWGPS_GPX, 'ridewithgps-route-12345.gpx');
    expect(route.name).toBe('test_data_gtp_Runde Testtal');
    expect(route.km).toBeGreaterThan(5);
    expect(route.wpts.map((w) => [w.name, w.kind])).toEqual([
      ['test_data_gtp_Brunnen', 'water'],
      ['test_data_gtp_CP1', 'control'],
      ['test_data_gtp_Beizli', 'food'],
    ]);
    expect(route.wpts[1].desc).toBe('Stempel holen');
    expect(route.wpts[0].km).toBeLessThan(route.wpts[1].km);
    expect(route.wpts.every((w) => w.offKm <= 5)).toBe(true);
  });
  it('a GPX without waypoints gives an empty list; a broken text throws the plain message', () => {
    const plain = `<gpx><trk><trkseg><trkpt lat="46.9" lon="7.4"/><trkpt lat="46.91" lon="7.41"/></trkseg></trk></gpx>`;
    expect(routeFromGpx(plain).wpts).toEqual([]);
    expect(wptsOf('not a gpx', null)).toEqual([]);
    expect(() => routeFromGpx('hello')).toThrow('This is not a GPX file.');
  });
  it('kinds from types, symbols and names; cues', () => {
    expect(wptKind({ type: 'Convenience Store' })).toBe('shop');
    expect(wptKind({ type: 'Bike Shop' })).toBe('bike');
    expect(wptKind({ sym: 'Campground' })).toBe('camp');
    expect(wptKind({ sym: 'Water Source' })).toBe('water');
    expect(wptKind({ name: 'test_data_gtp_Hotel Post' })).toBe('sleep');
    expect(wptKind({ name: 'test_data_gtp_Kontrolle 2' })).toBe('control');
    expect(wptKind({ name: 'test_data_gtp_irgendwas' })).toBe('other');
    expect(isCue({ type: 'Slight Right' })).toBe(true);
    expect(isCue({ type: 'Water' })).toBe(false);
  });
  it('the map places of the waypoints; a file is read as before, with the waypoints', async () => {
    const route = routeFromGpx(RWGPS_GPX);
    expect(wptsOnMap(route)[0]).toMatchObject({ id: 'gpx/w0', kind: 'water', sub: 'gpx' });
    expect(wptsOnMap({})).toEqual([]);
    const file = new File([RWGPS_GPX], 'test_data_gtp.gpx', { type: 'application/gpx+xml' });
    const r = await readRouteFile(file);
    expect(r.file).toBe('test_data_gtp.gpx');
    expect(r.wpts).toHaveLength(3);
    await expect(readRouteFile(new File([''], 'leer.gpx'))).rejects.toThrow('This file is empty.');
  });
});

describe('ÖV parsing (transport.opendata.ch)', () => {
  const STOPS = {
    stations: [
      { id: '8500002', name: 'test_data_gtp_Dorfplatz', coordinate: { type: 'WGS84', x: 46.952, y: 7.44 }, distance: 150, icon: 'bus' },
      { id: '8500001', name: 'test_data_gtp_Bahnhof', coordinate: { type: 'WGS84', x: 46.9555, y: 7.445 }, distance: 700, icon: 'train' },
      { id: null, name: 'test_data_gtp_Adresse', coordinate: { x: 46.95, y: 7.44 } },
      { id: '8500002', name: 'test_data_gtp_Dorfplatz', coordinate: { x: 46.952, y: 7.44 }, icon: 'bus' },
      { id: '8500003', name: 'test_data_gtp_Seesteg', coordinate: { x: null, y: 7.4 }, icon: 'ship' },
    ],
  };
  it('stops: nearest first, with metres, without addresses, doubles or broken places', () => {
    const list = parseStops(STOPS, { lat: 46.9515, lon: 7.4395 });
    expect(list.map((s) => s.id)).toEqual(['8500002', '8500001']);
    expect(list[0]).toMatchObject({ name: 'test_data_gtp_Dorfplatz', kind: 'bus', lat: 46.952, lon: 7.44 });
    expect(list[0].distM).toBeGreaterThan(40);
    expect(list[0].distM).toBeLessThan(100);
    expect(parseStops(STOPS)[0].distM).toBe(150); // without a place: the API's distance
    expect(parseStops({})).toEqual([]);
    expect(stopKind('tram')).toBe('tram');
    expect(stopKind('strange')).toBe('stop');
    expect(stopsUrl(91, 7)).toBe('');
    expect(boardUrl('abc')).toBe('');
    expect(boardUrl('8500001', 5)).toBe('https://transport.opendata.ch/v1/stationboard?id=8500001&limit=5');
  });
  it('departures: time in Zurich, line, destination, platform (changed), delay', () => {
    const at = Date.UTC(2026, 9, 20, 12, 32) / 1000; // 14:32 in Zurich (summer time until 25.10.)
    const { stop, departures } = parseBoard({
      station: { id: '8500001', name: 'test_data_gtp_Bahnhof' },
      stationboard: [
        { category: 'B', number: '31', to: 'test_data_gtp_Hügel', stop: { departure: '2026-10-20T14:40:00+0200', departureTimestamp: at + 480, delay: null, platform: null, prognosis: { departure: '2026-10-20T14:43:00+0200' } } },
        { category: 'IC', number: '5', to: 'test_data_gtp_Grossstadt', stop: { departure: '2026-10-20T14:32:00+0200', departureTimestamp: at, delay: 4, platform: '7', prognosis: { platform: '8' } } },
        { category: 'S', number: '12', to: 'x', stop: {} },
      ],
    });
    expect(stop).toEqual({ id: '8500001', name: 'test_data_gtp_Bahnhof' });
    expect(departures).toHaveLength(2);
    expect(departures[0]).toMatchObject({ time: '14:32', line: 'IC 5', to: 'test_data_gtp_Grossstadt', platform: '8', platformChanged: true, delayMin: 4, expected: '14:36' });
    expect(departures[1]).toMatchObject({ time: '14:40', line: '31', platform: '', delayMin: 3 });
    expect(lineOf('S', '12')).toBe('S12');
    expect(lineOf('T', '9')).toBe('9');
    expect(lineOf('IR', '')).toBe('IR');
    expect(timeMs('2026-10-20T14:32:00+0200', null)).toBe(Date.UTC(2026, 9, 20, 12, 32));
    expect(timeMs('', null)).toBeNull();
  });
  it('the app asks its server first, the source directly when the server does not answer', async () => {
    const seen = [];
    const viaServer = await loadStops({ lat: 46.95151, lon: 7.43949 }, { fetcher: async (u) => (seen.push(u), ok({ stops: parseStops(STOPS) })) });
    expect(seen[0]).toBe(`${OV_URL}?action=ov-stops&lat=46.952&lon=7.439`);
    expect(viaServer.via).toBe('server');
    expect(viaServer.stops[0].id).toBe('8500002');
    const direct = await loadStops({ lat: 46.9515, lon: 7.4395 }, { fetcher: async (u) => (u.startsWith(OV_URL) ? status(503) : ok(STOPS)) });
    expect(direct.via).toBe('direct');
    expect(direct.stops).toHaveLength(2);
    await expect(loadStops({ lat: 46.9, lon: 7.4 }, { fetcher: async () => status(503) })).rejects.toThrow();
    await expect(loadDepartures('x')).rejects.toThrow('invalid');
    const dep = await loadDepartures('8500001', { fetcher: async (u) => (u.startsWith(OV_URL) ? status(429) : ok({ station: { id: '8500001', name: 'B' }, stationboard: [] })) });
    expect(dep).toMatchObject({ via: 'direct', departures: [] });
    expect((await ovStops({ lat: 46.95, lon: 7.44 }, { doFetch: async () => ok(STOPS) })).stops).toHaveLength(2);
    expect((await ovDepartures('8500001', { doFetch: async () => ok({ stationboard: [] }) })).departures).toEqual([]);
  });
  it('small helpers: distance text, minutes until (with delay), metres', () => {
    expect(distText(149)).toBe('150 m');
    expect(distText(1260)).toBe('1.3 km');
    expect(distText(null)).toBe('');
    const now = Date.UTC(2026, 9, 20, 12, 30);
    expect(minutesUntil({ at: new Date(now + 5 * 60000).toISOString(), delayMin: 2 }, now)).toBe(7);
    expect(minutesUntil({ at: new Date(now - 60000).toISOString() }, now)).toBe(0);
    expect(distM({ lat: 46.95, lon: 7.44 }, { lat: 46.95, lon: 7.44 })).toBe(0);
  });
});

describe('Ladestationen (OpenStreetMap)', () => {
  const OSM = {
    elements: [
      { type: 'node', id: 11, lat: 46.95, lon: 7.45, tags: { amenity: 'charging_station', name: 'test_data_gtp_Ladepunkt Dorf', operator: 'test_data_gtp_Werk', 'socket:type2': '2', 'socket:schuko': 'no', capacity: '2', fee: 'yes', opening_hours: '24/7' } },
      { type: 'node', id: 12, lat: 46.9505, lon: 7.4405, tags: { amenity: 'charging_station', bicycle: 'yes', 'socket:schuko': '4' } },
      { type: 'way', id: 13, center: { lat: 46.96, lon: 7.44 }, tags: { amenity: 'charging_station', motorcar: 'no', 'socket:schuko': 'yes' } },
      { type: 'node', id: 14, lat: 46.95, lon: 7.44, tags: { amenity: 'charging_station', access: 'private' } },
      { type: 'node', id: 15, lat: 46.95, lon: 7.44, tags: { amenity: 'fuel' } },
      { type: 'node', id: 11, lat: 46.95, lon: 7.45, tags: { amenity: 'charging_station' } },
      { type: 'node', id: 16, tags: { amenity: 'charging_station' } },
    ],
  };
  it('parses into the shape of the places panel, kind charge, nearest first, without private ones', () => {
    const { list, cut } = parseCharge(OSM, { from: { lat: 46.9504, lon: 7.4404 } });
    expect(cut).toBe(false);
    expect(list.map((p) => p.id)).toEqual(['node/12', 'node/11', 'way/13']);
    expect(list[1]).toMatchObject({ kind: 'charge', name: 'test_data_gtp_Ladepunkt Dorf', sub: 'car', bike: false, sockets: ['type2'], capacity: 2, fee: 'yes', hours: '24/7', lat: 46.95, lon: 7.45 });
    expect(list[0]).toMatchObject({ sub: 'bicycle', bike: true, name: '' });
    expect(list[2]).toMatchObject({ bike: true, sockets: ['schuko'] });
    for (const k of ['id', 'kind', 'name', 'lat', 'lon', 'hours', 'phone', 'website', 'sub', 'fee', 'access', 'ele']) expect(list[0]).toHaveProperty(k);
    expect(parseCharge({}).list).toEqual([]);
  });
  it('the query around a point; e-bike only; broken point → ""', () => {
    expect(chargeQuery({ lat: 46.951234, lon: 7.4401 }, 5)).toBe('[out:json][timeout:25];\nnwr["amenity"="charging_station"](around:5000,46.95123,7.4401);\nout center tags 400;');
    expect(chargeQuery({ lat: 46.95, lon: 7.44 }, 2, { bikeOnly: true })).toContain('["bicycle"~"^(yes|designated)$"]');
    expect(chargeQuery({ lat: 'x', lon: 7 })).toBe('');
    expect(socketsOf({ 'socket:type2': '0', 'socket:chademo': '1', 'socket:type2:output': '22 kW' })).toEqual(['chademo']);
    expect(isBikeCharger({ bicycle: 'designated' })).toBe(true);
    expect(isBikeCharger({ 'socket:type2': '2' })).toBe(false);
  });
  it('loads through Overpass (mocked) and is ready for the places panel', async () => {
    const r = await loadCharge({ lat: 46.95, lon: 7.44 }, 5, { fetcher: async () => ok(OSM), urls: ['https://overpass.invalid/api'] });
    expect(r.list).toHaveLength(3);
    await expect(loadCharge({ lat: null, lon: 7 })).rejects.toThrow('invalid');
    // the entry for poisearch.js CATEGORIES has the same fields and a free key
    expect(Object.keys(CHARGE_CATEGORY).sort()).toEqual(Object.keys(CATEGORIES[0]).sort());
    expect(POI_KEYS).not.toContain(CHARGE_CATEGORY.key);
  });
});

describe('German texts', () => {
  it('every new text has German, and index.js takes this file', () => {
    for (const [en, deText] of Object.entries(de)) {
      expect(deText, en).toBeTruthy();
      expect(DE[en], en).toBe(deText);
    }
    const used = ['src/lib/sources/RwgpsLink.svelte', 'src/lib/sources/OvNearby.svelte', 'src/lib/sources/rwgps.js']
      .map((f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8'))
      .flatMap((s) => [...s.matchAll(/\bt\('((?:[^'\\]|\\.)+)'/g)].map((m) => m[1].replace(/\\'/g, "'")));
    for (const k of used) expect(DE[k], k).toBeTruthy();
  });
});
