// Paket S «Reise-Spur» (Noah 19.10.2026 «1a und b möglich 2a 3a 4a 5a»): the pure parts.
// Fictional lines only (made up around a made-up lake), never a real route.
import { describe, it, expect } from 'vitest';
import { decodePolyline, encodePolyline, lineKm, simplify, pointAlong, boundsOf, distKm } from '../src/lib/spur/polyline.js';
import { tourSpur, keepFix, gapsOf, recParts, tripDays, shownLines, mapPoints, placeAt, GAP_S } from '../src/lib/spur/spur.js';
import { merc, unmerc, fitView, zoomAt, toScreen, tilesFor, panBy, pathOf } from '../src/lib/spur/mapmath.js';
import { groundFor, tileUrl, inSwitzerland } from '../src/lib/spur/tiles.js';
import { cellsOf, neuland, cellBounds } from '../src/lib/spur/neuland.js';
import { linkPayload, readPayload, seal, unseal, newKey, parseLink, cutEnds } from '../src/lib/spur/link.js';

// a made-up line: 21 points, about 10 km eastwards
const LINE = Array.from({ length: 21 }, (_, i) => [46.5 + Math.sin(i / 3) * 0.002, 7.0 + i * 0.0065]);
const TRIP = { id: 't1', title: 'Testtour Seerunde', startDate: '2026-07-03', days: 2 };

describe('polyline', () => {
  it('encodes and decodes Google polylines (the known example)', () => {
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
    expect(encodePolyline([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]])).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    const back = decodePolyline(encodePolyline(LINE));
    expect(back.length).toBe(LINE.length);
    back.forEach((p, i) => expect(distKm(p, LINE[i])).toBeLessThan(0.002));
  });
  it('a broken text gives an empty line', () => {
    expect(decodePolyline('')).toEqual([]);
    expect(decodePolyline(null)).toEqual([]);
    expect(decodePolyline('_p~iF~ps|U_')).toEqual([]);
  });
  it('length, thinning, a point along, bounds', () => {
    expect(lineKm(LINE)).toBeGreaterThan(9.5);
    expect(lineKm(LINE)).toBeLessThan(10.5);
    const straight = [[46, 7], [46, 7.01], [46, 7.02], [46, 7.03]];
    expect(simplify(straight, 5)).toEqual([[46, 7], [46, 7.03]]);
    expect(simplify(LINE, 1).length).toBeGreaterThan(5);
    const mid = pointAlong(straight, 0.5);
    expect(mid[1]).toBeCloseTo(7.015, 4);
    expect(boundsOf([straight])).toEqual({ s: 46, w: 7, n: 46, e: 7.03 });
    expect(boundsOf([])).toBeNull();
  });
});

describe('recording', () => {
  const at = Date.UTC(2026, 6, 3, 8, 0, 0);
  it('keeps a fix every 30 s or 50 m, skips bad fixes', () => {
    expect(keepFix(null, { lat: 46.5, lon: 7, acc: 10, at })).toBe(true);
    const prev = { lat: 46.5, lon: 7, at };
    expect(keepFix(prev, { lat: 46.5, lon: 7.0001, acc: 10, at: at + 10_000 })).toBe(false);
    expect(keepFix(prev, { lat: 46.5, lon: 7.001, acc: 10, at: at + 10_000 })).toBe(true);
    expect(keepFix(prev, { lat: 46.5, lon: 7, acc: 10, at: at + 31_000 })).toBe(true);
    expect(keepFix(prev, { lat: 46.5, lon: 7.01, acc: 250, at: at + 60_000 })).toBe(false);
  });
  it('a long pause between points is a gap; the parts are split there', () => {
    const rec = { startAt: at, pts: [[46.5, 7, 0], [46.5, 7.001, 30], [46.5, 7.002, 60], [46.5, 7.01, 60 + GAP_S + 60], [46.5, 7.011, 60 + GAP_S + 90]] };
    expect(gapsOf(rec)).toEqual([{ from: at + 60_000, to: at + (60 + GAP_S + 60) * 1000 }]);
    expect(recParts(rec).map((p) => p.length)).toEqual([3, 2]);
  });
});

describe('tourSpur', () => {
  const start = Date.UTC(2026, 6, 3, 7, 0, 0);
  const act = { id: '11', day: '2026-07-03', kind: 'bike', name: 'Seerunde', km: 10, start: new Date(start).toISOString(), elapsedS: 3600, line: encodePolyline(LINE) };
  const rec = { id: 'r1', kind: 'rec', tripId: 't1', day: '2026-07-03', startAt: start + 600_000, endAt: start + 1_800_000, pts: [[46.5, 7, 0], [46.501, 7.01, 120], [46.502, 7.02, 240]] };
  const recDay2 = { id: 'r2', kind: 'rec', tripId: 't1', day: '2026-07-04', startAt: start + 86_400_000, endAt: start + 86_400_000 + 2_000_000, pts: [[46.5, 7.1, 0], [46.5, 7.11, 30], [46.5, 7.2, 30 + GAP_S + 100], [46.5, 7.21, 30 + GAP_S + 130]] };
  const place = { id: 'p1', kind: 'place', tripId: 't1', day: '2026-07-04', at: new Date(start + 86_400_000 + 600_000).toISOString(), lat: 46.51, lon: 7.15, text: 'Badeplatz' };
  const note = { id: 'n1', tripId: 't1', at: new Date(start + 1_800_000).toISOString(), text: 'Kaffee am See', photo: 'data:image/jpeg;base64,AAAA' };

  it('the Strava line wins over an own recording at the same time', () => {
    const s = tourSpur(TRIP, { acts: [act], tracks: [rec, recDay2, place], notes: [note] });
    expect(s.days.map((d) => d.day)).toEqual(['2026-07-03', '2026-07-04']);
    const d1 = s.days[0];
    expect(d1.lines.find((l) => l.src === 'rec').hidden).toBe(true);
    expect(d1.lines.find((l) => l.src === 'strava').hidden).toBe(false);
    expect(d1.km).toBe(10);
    expect(d1.sources).toEqual(['strava']);
  });
  it('without Strava the recording shows, with its gap', () => {
    const s = tourSpur(TRIP, { acts: [act], tracks: [rec, recDay2, place], notes: [note] });
    const d2 = s.days[1];
    expect(d2.lines.filter((l) => l.src === 'rec' && !l.hidden).length).toBe(2);
    expect(d2.gaps.length).toBe(1);
    expect(d2.gaps[0].filled).toBe(false);
    expect(d2.places[0].pos).toEqual([46.51, 7.15]);
    expect(s.hasLine).toBe(true);
  });
  it('a note without a place sits where the line was at that time (an estimate)', () => {
    const s = tourSpur(TRIP, { acts: [act], tracks: [], notes: [note] });
    const n = s.days[0].notes[0];
    expect(n.guessed).toBe(true);
    expect(distKm(n.pos, pointAlong(LINE, 0.5))).toBeLessThan(0.05);
    expect(s.withPhoto).toBe(1);
    const pts = mapPoints(s);
    expect(pts.map((p) => p.kind)).toEqual(['photo']);
    expect(shownLines(s).length).toBe(1);
  });
  it('a note with its own place keeps it; days come from the trip and the data', () => {
    expect(tripDays({ startDate: '2026-12-31', days: 2 })).toEqual(['2026-12-31', '2027-01-01']);
    expect(tripDays({ startDate: '2026-07-03', days: 1 }, ['2026-07-05'])).toEqual(['2026-07-03', '2026-07-05']);
    const s = tourSpur(TRIP, { notes: [{ ...note, place: { lat: 46.6, lon: 7.3 } }] });
    expect(s.days[0].notes[0]).toMatchObject({ pos: [46.6, 7.3], guessed: false });
    expect(placeAt(s.days[0], Date.now())).toBeNull();
  });
  it('an activity without a line counts its km and says the line is missing', () => {
    const s = tourSpur(TRIP, { acts: [{ ...act, line: null }] });
    expect(s.days[0].km).toBe(10);
    expect(s.missingLines).toBe(1);
    expect(s.hasLine).toBe(false);
  });
  it('another trip’s recordings and notes stay out', () => {
    const s = tourSpur(TRIP, { tracks: [{ ...rec, tripId: 'other' }], notes: [{ ...note, tripId: 'other' }] });
    expect(s.days.flatMap((d) => d.lines)).toEqual([]);
    expect(s.days.flatMap((d) => d.notes)).toEqual([]);
  });
});

describe('map sums', () => {
  it('mercator there and back', () => {
    const p = unmerc(merc([46.5, 7.2]));
    expect(p[0]).toBeCloseTo(46.5, 6);
    expect(p[1]).toBeCloseTo(7.2, 6);
  });
  it('the fit shows the bounds inside the box', () => {
    const b = boundsOf([LINE]);
    const v = fitView(b, 400, 300);
    for (const c of [[b.n, b.w], [b.s, b.e]]) {
      const s = toScreen(merc(c), v, 400, 300);
      expect(s.x).toBeGreaterThanOrEqual(31);
      expect(s.x).toBeLessThanOrEqual(369);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(300);
    }
  });
  it('zooming keeps the point under the finger; panning moves the middle', () => {
    const v = { x: 0.52, y: 0.35, zoom: 10 };
    const under = merc([46.6, 7.4]);
    const s = toScreen(under, v, 400, 300);
    const z = zoomAt(v, 2, s.x, s.y, 400, 300);
    expect(z.zoom).toBe(11);
    const s2 = toScreen(under, z, 400, 300);
    expect(s2.x).toBeCloseTo(s.x, 6);
    expect(s2.y).toBeCloseTo(s.y, 6);
    expect(panBy(v, 256 * 2 ** 10, 0).x).toBeCloseTo(0.52 - 1, 6);
  });
  it('tiles cover the box, the path is drawn', () => {
    const v = { x: 0.52, y: 0.35, zoom: 12.4 };
    const tiles = tilesFor(v, 400, 300);
    expect(tiles.length).toBeGreaterThan(1);
    expect(tiles.every((t) => t.z === 12)).toBe(true);
    expect(tiles.some((t) => t.left <= 0 && t.left + t.size > 0)).toBe(true);
    expect(pathOf(LINE, v, 400, 300)).toMatch(/^M[-\d.]+,[-\d.]+L/);
  });
  it('swisstopo in Switzerland, OpenStreetMap elsewhere', () => {
    expect(inSwitzerland(46.9, 7.4)).toBe(true);
    expect(groundFor(46.9, 7.4, 'auto', 7).key).toBe('swisstopo');
    expect(groundFor(46.9, 7.4, 'auto', 12).key).toBe('swisstopoWinter');
    expect(groundFor(48.1, 11.5).key).toBe('osm');
    expect(groundFor(46.9, 7.4, 'osm').key).toBe('osm');
    expect(tileUrl(groundFor(48, 11), 3, 4, 5)).toBe('https://tile.openstreetmap.org/3/4/5.png');
  });
});

describe('Neuland', () => {
  it('counts the squares a line passes, new ones per day', () => {
    const cells = cellsOf(LINE);
    expect(cells.size).toBeGreaterThan(3);
    const n = neuland([{ day: '2026-07-04', pts: LINE }, { day: '2026-07-03', pts: LINE.slice(0, 11) }]);
    expect(n.all.size).toBe(cells.size);
    expect(n.byDay.get('2026-07-03').size + n.byDay.get('2026-07-04').size).toBe(cells.size);
    const [[nn, w], [s, e]] = cellBounds([...cells][0]);
    expect(nn).toBeGreaterThan(s);
    expect(e).toBeGreaterThan(w);
  });
});

describe('read link', () => {
  const start = Date.UTC(2026, 6, 3, 7, 0, 0);
  const act = { id: '11', day: '2026-07-03', kind: 'bike', name: 'Seerunde', km: 10, start: new Date(start).toISOString(), elapsedS: 3600, line: encodePolyline(LINE) };
  const spur = tourSpur(TRIP, {
    acts: [act],
    tracks: [{ id: 'p1', kind: 'place', tripId: 't1', day: '2026-07-03', at: new Date(start + 900_000).toISOString(), lat: 46.501, lon: 7.06, text: 'Glace' }],
    notes: [{ id: 'n1', tripId: 't1', at: new Date(start + 1_800_000).toISOString(), text: 'Privat', photo: 'data:image/jpeg;base64,AAAA' }],
  });
  it('carries line, km and places, never a photo; notes only when ticked', () => {
    const p = linkPayload(TRIP, spur, { places: true, notes: false, cut: false });
    expect(JSON.stringify(p)).not.toMatch(/data:image/);
    expect(p.days[0].p[0][3]).toBe('Glace');
    expect(p.days[0].x).toEqual([]);
    const withNotes = linkPayload(TRIP, spur, { notes: true, cut: false });
    expect(withNotes.days[0].x[0][1]).toBe('Privat');
    expect(JSON.stringify(withNotes)).not.toMatch(/data:image/);
    const back = readPayload(p);
    expect(back.title).toBe('Testtour Seerunde');
    expect(back.days[0].lines[0].length).toBeGreaterThan(2);
    expect(readPayload({ v: 9 })).toBeNull();
  });
  it('cuts 500 m off the start and the end', () => {
    const [l] = cutEnds([LINE]);
    expect(distKm(l[0], LINE[0])).toBeGreaterThan(0.45);
    expect(distKm(l.at(-1), LINE.at(-1))).toBeGreaterThan(0.45);
    expect(lineKm(l)).toBeCloseTo(lineKm(LINE) - 1, 1);
    const p = linkPayload(TRIP, spur, { cut: true });
    expect(distKm(readPayload(p).days[0].lines[0][0], LINE[0])).toBeGreaterThan(0.45);
  });
  it('sealed with the key, unreadable without it', async () => {
    const key = await newKey();
    expect(key).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const e = await seal({ v: 1, a: 'Seerunde' }, key);
    expect(e).not.toMatch(/Seerunde/);
    expect(await unseal(e, key)).toEqual({ v: 1, a: 'Seerunde' });
    expect(await unseal(e, await newKey())).toBeNull();
  });
  it('reads the link address', () => {
    const id = 'A'.repeat(22);
    const key = 'b'.repeat(43);
    expect(parseLink(`#/spur-link/${id}/${key}`)).toEqual({ id, key });
    expect(parseLink('#/spur-link/short/key')).toBeNull();
  });
});

describe('travel book', () => {
  it('a PDF with a cover and one page per day; text the font cannot write is left out', async () => {
    const { makeBook, pdfText } = await import('../src/lib/spur/book.js');
    expect(pdfText('Zmittag «am See» – 🚴 schön')).toBe('Zmittag "am See" -  schön');
    const start = Date.UTC(2026, 6, 3, 7, 0, 0);
    const act = { id: '11', day: '2026-07-03', kind: 'bike', name: 'Seerunde', km: 10, start: new Date(start).toISOString(), elapsedS: 3600, line: encodePolyline(LINE) };
    const spur = tourSpur(TRIP, { acts: [act], notes: [{ id: 'n1', tripId: 't1', at: new Date(start + 1_800_000).toISOString(), text: 'Kaffee am See 🚴 '.repeat(30) }] });
    const bytes = await makeBook(TRIP, spur);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe('%PDF-');
    const { PDFDocument } = await import('pdf-lib');
    expect((await PDFDocument.load(bytes)).getPageCount()).toBe(3);
  });
});
