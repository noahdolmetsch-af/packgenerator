// SN1b–SN1d «Tour aus komoot» (Noah 13.10.2026 «freigabe», answers 1a 2b 3b 4a): a shared GPX without
// times is a planned route (the sheet), one with times stays a ride; the komoot link from the shared text;
// komoot's suggestions near you (the location only in the link); today as the first day (Europe/Zurich);
// the hint when the day falls in a running trip; the planned trip made from the route.
// Fictional routes only (tests/test_data_gtp_gpx.js and made-up points), generic komoot links.
import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { sharedKind, hasTimes, komootLink, komootLinkIn, komootSport, komootFindUrl, clashOn, defaultDay, routeMinutes, hoursText, tripFromKomoot, SHARE_TEXT } from '../src/lib/komoot.js';
import { parseGpx, routeStats } from '../src/lib/route.js';
import { lang } from '../src/lib/i18n.svelte.js';
import { makeGpx } from './test_data_gtp_gpx.js';

afterEach(() => (lang.v = 'en'));

/** A planned route as komoot shares it: track points with height, no times. */
const routeGpx = (name = 'test_data_gtp_ Schlaufe', n = 40) => {
  const pts = Array.from({ length: n }, (_, i) => `<trkpt lat="${(46.5 + Math.sin(i / 6) * 0.05).toFixed(5)}" lon="${(7.5 + i * 0.01).toFixed(5)}"><ele>${400 + Math.round(Math.sin(i / 4) * 120)}</ele></trkpt>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="test_data_gtp_"><metadata><name>${name}</name></metadata><trk><name>${name}</name><trkseg>\n${pts}\n</trkseg></trk></gpx>`;
};
const rideGpx = () => makeGpx({ name: 'test_data_gtp_ ride', start: '2026-10-08T07:00:00Z', legs: [{ km: 10, kmh: 20 }] });
const TCX = '<?xml version="1.0"?><TrainingCenterDatabase><Activities><Activity><Lap><Track><Trackpoint><Time>2026-10-08T07:00:00Z</Time><Position><LatitudeDegrees>46.5</LatitudeDegrees><LongitudeDegrees>7.5</LongitudeDegrees></Position></Trackpoint></Track></Lap></Activity></Activities></TrainingCenterDatabase>';

describe('a shared file: a planned route or a ride', () => {
  it('a GPX without times is a route, one with times a ride', () => {
    expect(hasTimes(routeGpx())).toBe(false);
    expect(sharedKind(routeGpx())).toBe('route');
    expect(hasTimes(rideGpx())).toBe(true);
    expect(sharedKind(rideGpx())).toBe('ride');
  });
  it('one time alone does not make a ride; route points (rtept) are a route too', () => {
    const one = routeGpx().replace('</ele></trkpt>', '</ele><time>2026-10-08T07:00:00Z</time></trkpt>');
    expect(sharedKind(one)).toBe('route');
    const rte = '<gpx version="1.1"><rte><rtept lat="46.5" lon="7.5"/><rtept lat="46.6" lon="7.6"/></rte></gpx>';
    expect(sharedKind(rte)).toBe('route');
  });
  it('a TCX, an empty or a wrong file go to the ride upload, which says why', () => {
    expect(sharedKind(TCX)).toBe('ride');
    expect(sharedKind('')).toBe('ride');
    expect(sharedKind('hello')).toBe('ride');
    expect(sharedKind(null)).toBe('ride');
  });
});

describe('the service worker makes the same decision (public/share-target.js)', () => {
  const SRC = readFileSync(fileURLToPath(new URL('../public/share-target.js', import.meta.url)), 'utf8');
  /** Runs the worker with a fake Cache and returns where it sends the app and what it kept. */
  async function share(fields, file = null) {
    let handler;
    const stored = new Map();
    const self = { addEventListener: (type, fn) => type === 'fetch' && (handler = fn) };
    const caches = { open: async () => ({ put: async (key, res) => stored.set(key, res) }) };
    vm.runInNewContext(SRC, { self, caches, Response, URL, URLSearchParams, Date, Number, encodeURIComponent });
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, v);
    if (file) form.append('ride', new File([file.text], file.name, { type: 'application/gpx+xml' }));
    let answer;
    handler({ request: new Request('https://example.org/packgenerator/share-target', { method: 'POST', body: form }), respondWith: (p) => (answer = p) });
    const res = await answer;
    return { to: new URL(res.headers.get('location')).hash, search: new URL(res.headers.get('location')).search, kept: stored.get('/packgenerator/shared-ride') ?? null };
  }

  it('a GPX without times opens the sheet, with times the ride upload', async () => {
    expect((await share({}, { text: routeGpx(), name: 'test_data_gtp_route.gpx' })).to).toBe('#/komoot/shared');
    expect((await share({}, { text: rideGpx(), name: 'test_data_gtp_ride.gpx' })).to).toBe('#/debrief/ride/shared');
    expect((await share({}, { text: TCX, name: 'test_data_gtp_ride.tcx' })).to).toBe('#/debrief/ride/shared');
    expect((await share({}, { text: 'hello', name: 'test_data_gtp_x.gpx' })).to).toBe('#/debrief/ride/shared');
  });
  it('agrees with sharedKind on every file', async () => {
    const one = routeGpx().replace('</ele></trkpt>', '</ele><time>2026-10-08T07:00:00Z</time></trkpt>');
    for (const text of [routeGpx(), rideGpx(), TCX, one, 'hello']) {
      const { to } = await share({}, { text, name: 'test_data_gtp_x.gpx' });
      expect(to).toBe(sharedKind(text) === 'route' ? '#/komoot/shared' : '#/debrief/ride/shared');
    }
  });
  it('keeps the text and link shared with the file; text alone still goes to the Inbox', async () => {
    const { kept } = await share({ text: 'Schau dir diese Tour an: https://www.komoot.com/tour/123456' }, { text: routeGpx(), name: 'test_data_gtp_route.gpx' });
    const said = decodeURIComponent(kept.headers.get(SHARE_TEXT));
    expect(komootLinkIn(said)).toBe('https://www.komoot.com/tour/123456');
    expect(await kept.text()).toContain('test_data_gtp_ Schlaufe');
    const text = await share({ title: 'test_data_gtp_ note' });
    expect(text.to).toBe('');
    expect(text.search).toContain('title=test_data_gtp_');
  });
});

describe('the komoot link', () => {
  it('found in what was shared, without the punctuation after it', () => {
    expect(komootLinkIn('Schau dir diese Tour an: https://www.komoot.com/tour/123456?ref=wtd.')).toBe('https://www.komoot.com/tour/123456?ref=wtd');
    expect(komootLinkIn('(komoot.de/tour/123456)')).toBe('https://komoot.de/tour/123456');
    expect(komootLinkIn('https://www.komoot.com/de-ch/tour/123456?share_token=abc »')).toBe('https://www.komoot.com/de-ch/tour/123456?share_token=abc');
  });
  it('no komoot link: null (another site, a look-alike, a script)', () => {
    expect(komootLinkIn('nothing here')).toBe(null);
    expect(komootLinkIn('https://example.org/tour/123456')).toBe(null);
    expect(komootLinkIn('https://notkomoot.com/tour/1')).toBe(null);
    expect(komootLinkIn('https://komoot.com.example.org/tour/1')).toBe(null);
    expect(komootLink('javascript:alert(1)')).toBe(null);
    expect(komootLink('https://user:pw@www.komoot.com/tour/1')).toBe(null);
    expect(komootLink('https://www.komoot.com/tour/123456')).toBe('https://www.komoot.com/tour/123456');
    expect(komootLink('')).toBe(null);
  });
});

describe('komoot suggestions near you: the location only in the link', () => {
  it('the place rounded to about 1 km, the sport from the bike', () => {
    const url = komootFindUrl({ lat: 47.376887, lon: 8.541694 }, komootSport('bikepacking', 'gravel'));
    expect(url).toBe('https://www.komoot.com/discover/Location/@47.38,8.54/tours?sport=mtb_easy');
    expect(url).not.toContain('47.376');
  });
  it('without a place komoot asks itself; no sport, no filter', () => {
    expect(komootFindUrl(null, komootSport('hiking'))).toBe('https://www.komoot.com/discover?sport=hike');
    expect(komootFindUrl(null, null)).toBe('https://www.komoot.com/discover');
    expect(komootFindUrl({ lat: NaN, lon: 8 }, null)).toBe('https://www.komoot.com/discover');
  });
  it('the sport from the area and the bike type', () => {
    expect(komootSport('bikepacking', 'Gravel').name).toBe('Gravel');
    expect(komootSport('bikepacking', 'fully').key).toBe('mtb');
    expect(komootSport('bikepacking', 'road').key).toBe('racebike');
    expect(komootSport('bikepacking', '').key).toBe('touringbicycle');
    expect(komootSport('hiking').key).toBe('hike');
    expect(komootSport('ski')).toBe(null);
    expect(komootSport('weekend')).toBe(null);
  });
});

describe('the first day is today, on the clock in Zurich', () => {
  const tz = process.env.TZ;
  afterEach(() => (process.env.TZ = tz));
  it('just after midnight in Zurich it is already the next day (UTC still says the day before)', () => {
    process.env.TZ = 'Europe/Zurich';
    const now = new Date('2026-10-09T22:30:00Z'); // 00:30 on Saturday 10 October in Zurich
    expect(now.toISOString().slice(0, 10)).toBe('2026-10-09');
    expect(defaultDay(now)).toBe('2026-10-10');
    expect(defaultDay(new Date('2026-10-09T07:00:00Z'))).toBe('2026-10-09');
  });
});

describe('the hint when the day falls in a running trip', () => {
  const jura = { id: 'test_data_gtp_jura', title: 'test_data_gtp_ Jura', startDate: '2026-10-08', days: 3, status: 'planned' };
  it('day 3 of a three-day trip; both may stand', () => {
    expect(clashOn([jura], '2026-10-10')).toEqual({ trip: jura, day: 3, days: 3 });
    expect(clashOn([jura], '2026-10-08').day).toBe(1);
  });
  it('the trip you are still on comes before one that starts that day', () => {
    const next = { id: 'test_data_gtp_next', title: 'test_data_gtp_ next', startDate: '2026-10-10', days: 2, status: 'planned' };
    expect(clashOn([next, jura], '2026-10-10').trip).toBe(jura);
    expect(clashOn([next], '2026-10-10').day).toBe(1);
  });
  it('none outside the trip, for a finished or a called-off trip', () => {
    expect(clashOn([jura], '2026-10-11')).toBe(null);
    expect(clashOn([{ ...jura, status: 'done' }], '2026-10-09')).toBe(null);
    expect(clashOn([{ ...jura, finished: '2026-10-09' }], '2026-10-09')).toBe(null);
    expect(clashOn([{ ...jura, skipped: true }], '2026-10-09')).toBe(null);
    expect(clashOn([], '2026-10-09')).toBe(null);
  });
});

describe('the planned trip from the route', () => {
  const route = routeStats(parseGpx(routeGpx()), 'test_data_gtp_route.gpx');
  const bike = { id: 'test_data_gtp_bike', name: 'test_data_gtp_ Gravel', type: 'gravel', setup: { seat: 'b1' } };
  const items = [{ id: 'test_data_gtp_i1', name: 'test_data_gtp_ pump', category: 'tools', defaultBag: 'seat', sets: ['standard'] }];
  const NOW = Date.parse('2026-10-09T07:00:00Z');

  it('route numbers like «GPX-Route hinzufügen», the komoot link kept, the start as the weather place', () => {
    expect(route.km).toBeGreaterThan(0);
    const trip = tripFromKomoot(route, { title: '', startDate: '2026-10-09', bike, days: 1, start: '08:30', link: 'https://www.komoot.com/tour/123456' }, [], items, null, NOW);
    expect(trip.title).toBe('test_data_gtp_ Schlaufe');
    expect(trip.status).toBe('planned');
    expect(trip.startDate).toBe('2026-10-09');
    expect(trip.bikeId).toBe(bike.id);
    expect(trip.route.km).toBe(route.km);
    expect(trip.route.komoot).toBe('https://www.komoot.com/tour/123456');
    expect(trip.place).toMatchObject(route.start);
    expect(trip.rideStart).toEqual({ 0: '08:30' });
    expect(trip.hours).toBeGreaterThan(0);
    expect(trip.entries.every((e) => !e.packed)).toBe(true);
  });
  it('no link or a wrong one: no link; «Leer beginnen» empties the list; a taken name gets a number', () => {
    const taken = [{ id: 'x', title: 'test_data_gtp_ Schlaufe', startDate: '2026-09-01', days: 1, bikeId: 'other', entries: [] }];
    const trip = tripFromKomoot(route, { title: '', startDate: '2026-10-10', bike, days: 2, link: 'https://example.org/x', list: 'empty' }, taken, items, null, NOW);
    expect(trip.route.komoot).toBe(null);
    expect(trip.entries).toEqual([]);
    expect(trip.days).toBe(2);
    expect(trip.title).toBe('test_data_gtp_ Schlaufe (2)');
    expect(trip.rideStart).toBeUndefined();
  });
  it('without a bike: a planned trip all the same', () => {
    const trip = tripFromKomoot(route, { title: 'test_data_gtp_ walk', startDate: '2026-10-09', bike: null }, [], items, null, NOW);
    expect(trip.bikeId).toBe(null);
    expect(trip.entries).toEqual([]);
    expect(trip.route.komoot).toBe(null);
  });
  it('about how long: rounded to 10 minutes, written «5 h 20»', () => {
    expect(routeMinutes({ km: 58, gainM: 1040 }, null)).toBe(320); // 3.625 h + 1.733 h = 5 h 21
    expect(hoursText(320)).toBe('5 h 20');
    expect(hoursText(120)).toBe('2 h');
    expect(hoursText(40)).toBe('40 min');
    expect(routeMinutes(null)).toBe(null);
    lang.v = 'de';
    expect(hoursText(320)).toBe('5 h 20');
    expect(hoursText(120)).toBe('2 h');
  });
});
