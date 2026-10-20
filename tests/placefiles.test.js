// «Weitere Quellen» (Noah 20.10.2026 «2b»): own places from a file (src/lib/map/placefiles.js) and the
// sources of own points (src/lib/map/ownpoints.js). Fictional places only (test_data_gtp_ names).
import { describe, it, expect } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import * as F from '../src/lib/map/placefiles.js';
import { listOf, sourcesOf, removeSource, renameSource, newPoint } from '../src/lib/map/ownpoints.js';

const GPX = `<?xml version="1.0"?>
<gpx version="1.1" creator="test">
  <wpt lat="46.95" lon="7.45"><name>test_data_gtp_ Brunnen Dorf</name><sym>Drinking Water</sym></wpt>
  <wpt lat="46.96" lon="7.46"><name><![CDATA[test_data_gtp_ Kontrolle & Verpflegung]]></name><desc>Stempel holen</desc></wpt>
  <wpt lat="46.97" lon="7.47"><name>test_data_gtp_ Punkt</name></wpt>
  <trk><trkseg><trkpt lat="46.9" lon="7.4"/></trkseg></trk>
</gpx>`;

const KML = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>test_data_gtp_ Karte</name>
  <Folder><name>Wasser</name>
    <Placemark><name>test_data_gtp_ Quelle</name><description><![CDATA[kalt<br>gut]]></description><Point><coordinates>7.45,46.95,0</coordinates></Point></Placemark>
  </Folder>
  <Folder><name>test_data_gtp_ Kontrollpunkte</name>
    <Placemark><name>test_data_gtp_ CP1</name><Point><coordinates> 7.5,47.0 </coordinates></Point></Placemark>
    <Placemark><name>test_data_gtp_ Weg</name><LineString><coordinates>7.4,46.9 7.5,47</coordinates></LineString></Placemark>
  </Folder>
  <Placemark><name>test_data_gtp_ Hotel Ohne Ordner</name><Point><coordinates>7.6,47.1</coordinates></Point></Placemark>
</Document></kml>`;

describe('GPX', () => {
  it('the waypoints, with a kind from the symbol or the name', () => {
    const r = F.placesFromFile('test_data_gtp_ rennen.gpx', GPX);
    expect(r).toMatchObject({ kind: 'gpx', error: null, skipped: 0, cut: false });
    expect(r.places).toEqual([
      { name: 'test_data_gtp_ Brunnen Dorf', lat: 46.95, lon: 7.45, kind: 'water', note: '' },
      { name: 'test_data_gtp_ Kontrolle & Verpflegung', lat: 46.96, lon: 7.46, kind: 'food', note: 'Stempel holen' },
      { name: 'test_data_gtp_ Punkt', lat: 46.97, lon: 7.47, kind: 'note', note: '' },
    ]);
  });
});

describe('KML', () => {
  it('Placemarks with a Point; the folder gives the kind or goes into the note', () => {
    const r = F.placesFromFile('test_data_gtp_ karte.kml', KML);
    expect(r).toMatchObject({ kind: 'kml', error: null, skipped: 1 });
    expect(r.places).toEqual([
      { name: 'test_data_gtp_ Quelle', lat: 46.95, lon: 7.45, kind: 'water', note: 'kalt gut' },
      { name: 'test_data_gtp_ CP1', lat: 47, lon: 7.5, kind: 'note', note: 'test_data_gtp_ Kontrollpunkte' },
      { name: 'test_data_gtp_ Hotel Ohne Ordner', lat: 47.1, lon: 7.6, kind: 'sleep', note: '' },
    ]);
  });
  it('a KMZ: the KML inside the zip (deflated or stored)', async () => {
    const zip = (name, data, method) => {
      const nm = Buffer.from(name);
      const body = method === 8 ? deflateRawSync(data) : data;
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50, 0);
      local.writeUInt16LE(method, 8);
      local.writeUInt32LE(body.length, 18);
      local.writeUInt32LE(data.length, 22);
      local.writeUInt16LE(nm.length, 26);
      const cd = Buffer.alloc(46);
      cd.writeUInt32LE(0x02014b50, 0);
      cd.writeUInt16LE(method, 10);
      cd.writeUInt32LE(body.length, 20);
      cd.writeUInt32LE(data.length, 24);
      cd.writeUInt16LE(nm.length, 28);
      cd.writeUInt32LE(0, 42);
      const head = Buffer.concat([local, nm, body]);
      const end = Buffer.alloc(22);
      end.writeUInt32LE(0x06054b50, 0);
      end.writeUInt16LE(1, 8);
      end.writeUInt16LE(1, 10);
      end.writeUInt32LE(46 + nm.length, 12);
      end.writeUInt32LE(head.length, 16);
      return Buffer.concat([head, cd, nm, end]);
    };
    for (const method of [0, 8]) {
      const buf = zip('doc.kml', Buffer.from(KML), method);
      const text = await F.kmzText(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
      expect(F.placesFromFile('x.kml', text).places, `method ${method}`).toHaveLength(3);
    }
    expect(await F.kmzText(new Uint8Array([1, 2, 3]).buffer)).toBe('');
    expect(F.fileKind('test_data_gtp_ karte.kmz')).toBe('kmz');
  });
});

describe('CSV', () => {
  it('columns found by their header, «;» with a decimal comma, quotes', () => {
    const csv = '﻿Name;Breite;Länge;Kategorie;Beschreibung\n"test_data_gtp_ Beck; am Platz";46,95;7,45;Bäckerei;früh offen\ntest_data_gtp_ Bank;46,96;7,46;Rastplatz;\nkaputt;x;7\n';
    const r = F.placesFromFile('test_data_gtp_ orte.csv', csv);
    expect(r).toMatchObject({ kind: 'csv', error: null, skipped: 1 });
    expect(r.places).toEqual([
      { name: 'test_data_gtp_ Beck; am Platz', lat: 46.95, lon: 7.45, kind: 'food', note: 'früh offen' },
      { name: 'test_data_gtp_ Bank', lat: 46.96, lon: 7.46, kind: 'note', note: 'Rastplatz' },
    ]);
  });
  it('«,» with lat/lng, a WKT column (Google My Maps), no position columns', () => {
    expect(F.placesFromFile('a.csv', 'title,lat,lng\ntest_data_gtp_ A,46.9,7.4\n').places).toEqual([{ name: 'test_data_gtp_ A', lat: 46.9, lon: 7.4, kind: 'note', note: '' }]);
    expect(F.placesFromFile('b.csv', 'WKT,name,description\n"POINT (7.41 46.91)",test_data_gtp_ B,Wasser hier\n').places).toEqual([{ name: 'test_data_gtp_ B', lat: 46.91, lon: 7.41, kind: 'note', note: 'Wasser hier' }]);
    expect(F.placesFromFile('c.csv', 'name,ort\nx,y\n').error).toBe('no-position');
    expect(F.placesFromFile('d.csv', 'lat,lon\n').error).toBe('empty');
    expect(F.csvColumns(['LAT', 'Longitude', 'Titel', 'Typ', 'Notiz'])).toEqual({ lat: 0, lon: 1, name: 2, cat: 3, note: 4, wkt: -1 });
  });
  it('unknown and broken files', () => {
    expect(F.placesFromFile('x.pdf', '%PDF').error).toBe('unknown');
    expect(F.placesFromFile('x.gpx', 'nothing').error).toBe('broken');
    expect(F.placesFromFile('x.kml', '<kml></kml>').error).toBe('empty');
  });
  it('at most MAX_FILE_PLACES', () => {
    const rows = Array.from({ length: F.MAX_FILE_PLACES + 5 }, (_, i) => `test_data_gtp_ ${i};46.${i};7.5`).join('\n');
    const r = F.placesFromFile('many.csv', `name;lat;lon\n${rows}`);
    expect(r.places).toHaveLength(F.MAX_FILE_PLACES);
    expect(r.cut).toBe(true);
  });
});

describe('own points from a file', () => {
  it('become own points of the source; a whole source is renamed or removed', () => {
    const now = new Date('2026-10-20T10:00:00Z');
    const pts = F.importPoints(F.placesFromFile('a.gpx', GPX).places, 'test_data_gtp_ rennen', now);
    expect(new Set(pts.map((p) => p.id)).size).toBe(3);
    expect(pts[0]).toMatchObject({ name: 'test_data_gtp_ Brunnen Dorf', kind: 'water', src: 'test_data_gtp_ rennen', createdAt: now.toISOString() });
    const mine = newPoint({ lat: 46, lon: 7, name: 'test_data_gtp_ von Hand' }, now);
    expect(mine.src).toBeUndefined();
    const list = listOf({ points: [mine, ...pts] });
    expect(list.filter((p) => p.src)).toHaveLength(3);
    expect(sourcesOf(list)).toEqual([{ src: 'test_data_gtp_ rennen', n: 3 }]);
    expect(sourcesOf(renameSource(list, 'test_data_gtp_ rennen', ' test_data_gtp_ Rennen 2026 '))).toEqual([{ src: 'test_data_gtp_ Rennen 2026', n: 3 }]);
    expect(renameSource(list, 'test_data_gtp_ rennen', '  ')).toBe(list);
    expect(removeSource(list, 'test_data_gtp_ rennen').map((p) => p.id)).toEqual([mine.id]);
  });
});
