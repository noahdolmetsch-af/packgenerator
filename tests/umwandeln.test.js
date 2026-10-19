import { describe, it, expect } from 'vitest';
import { toKml, toGpx, toFit, fitCrc, fileName, pointsOf } from '../src/lib/unterwegs/umwandeln.js';
import { parseGpx, distKm } from '../src/lib/route.js';

// Fictional route around Zurich
const N = 20;
const POINTS = Array.from({ length: N }, (_, i) => ({
  lat: 47.37 + (0.03 * i) / (N - 1),
  lon: 8.54 + (0.06 * i) / (N - 1),
  ele: 410 + i * 3,
}));

/** Small FIT reader: header, then definition/data messages (normal headers only). */
function readFit(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const hs = bytes[0];
  const end = hs + dv.getUint32(4, true);
  const defs = {};
  const msgs = [];
  let i = hs;
  while (i < end) {
    const h = bytes[i++];
    if (h & 0x80) throw new Error('compressed header not expected');
    const local = h & 0x0f;
    if (h & 0x40) {
      const le = bytes[i + 1] === 0;
      const global = dv.getUint16(i + 2, le);
      const n = bytes[i + 4];
      i += 5;
      const fields = [];
      for (let k = 0; k < n; k++, i += 3) fields.push({ num: bytes[i], size: bytes[i + 1], type: bytes[i + 2] });
      defs[local] = { global, fields, le };
    } else {
      const d = defs[local];
      const values = {};
      for (const f of d.fields) {
        let v;
        if (f.type === 0x85) v = dv.getInt32(i, d.le);
        else if (f.size === 4) v = dv.getUint32(i, d.le);
        else if (f.size === 2) v = dv.getUint16(i, d.le);
        else if (f.type === 0x07) v = new TextDecoder().decode(bytes.slice(i, i + f.size)).replace(/\0.*$/s, '');
        else v = bytes[i];
        values[f.num] = v;
        i += f.size;
      }
      msgs.push({ global: d.global, values });
    }
  }
  return msgs;
}

const deg = (s) => (s * 180) / 2 ** 31;

describe('umwandeln', () => {
  it('KML has lon,lat order and an escaped name', () => {
    const kml = toKml(POINTS, 'Ring <Zürich> & See');
    expect(kml).toContain('<kml xmlns="http://www.opengis.net/kml/2.2">');
    expect(kml).toContain('8.54,47.37,410');
    expect(kml).toContain('Ring &lt;Zürich&gt; &amp; See');
    expect(kml).not.toContain('<Zürich>');
  });

  it('GPX round-trips through parseGpx', () => {
    const gpx = toGpx(POINTS, 'Ring & See');
    expect(gpx).toContain('creator="Pack Generator"');
    const back = parseGpx(gpx);
    expect(back.name).toBe('Ring & See');
    expect(back.points).toHaveLength(N);
    back.points.forEach((p, i) => {
      expect(p.lat).toBeCloseTo(POINTS[i].lat, 6);
      expect(p.lon).toBeCloseTo(POINTS[i].lon, 6);
      expect(p.ele).toBeCloseTo(POINTS[i].ele, 1);
    });
  });

  it('GPX without heights has no ele', () => {
    const gpx = toGpx(POINTS.map(({ lat, lon }) => ({ lat, lon })), 'x');
    expect(gpx).not.toContain('<ele>');
    expect(parseGpx(gpx).points[0].ele).toBeNull();
  });

  it('FIT header, data size and CRCs are right', () => {
    const fit = toFit(POINTS, 'Ring');
    expect(fit).toBeInstanceOf(Uint8Array);
    const dv = new DataView(fit.buffer);
    expect(fit[0]).toBe(14);
    expect(String.fromCharCode(...fit.slice(8, 12))).toBe('.FIT');
    expect(dv.getUint32(4, true)).toBe(fit.length - 16);
    expect(dv.getUint16(12, true)).toBe(fitCrc(fit, 0, 12));
    expect(dv.getUint16(fit.length - 2, true)).toBe(fitCrc(fit, 0, fit.length - 2));
    // a whole file including its CRC checks to zero
    expect(fitCrc(fit, 0, fit.length)).toBe(0);
  });

  it('FIT decodes to a course with one record per point', () => {
    const fit = toFit(POINTS, 'Ein sehr langer Streckenname Zürich');
    const msgs = readFit(fit);
    const fileId = msgs.find((m) => m.global === 0);
    expect(fileId.values[0]).toBe(6);
    expect(fileId.values[1]).toBe(255);
    const course = msgs.find((m) => m.global === 31);
    expect(course.values[4]).toBe(2);
    expect(new TextEncoder().encode(course.values[5]).length).toBeLessThanOrEqual(15);
    expect(course.values[5]).toBe('Ein sehr langer');

    const recs = msgs.filter((m) => m.global === 20);
    expect(recs).toHaveLength(N);
    expect(Math.abs(deg(recs[0].values[0]) - POINTS[0].lat)).toBeLessThan(1e-5);
    expect(Math.abs(deg(recs[0].values[1]) - POINTS[0].lon)).toBeLessThan(1e-5);
    expect(recs[0].values[2] / 5 - 500).toBeCloseTo(410, 1);
    for (let i = 1; i < N; i++) {
      expect(recs[i].values[5]).toBeGreaterThan(recs[i - 1].values[5]);
      expect(recs[i].values[253]).toBeGreaterThanOrEqual(recs[i - 1].values[253]);
    }

    const events = msgs.filter((m) => m.global === 21);
    expect(events.map((e) => e.values[1])).toEqual([0, 4]);
    const lap = msgs.find((m) => m.global === 19);
    expect(lap.values[9]).toBe(recs[N - 1].values[5]);
    // 2026-01-01T08:00:00Z in FIT seconds
    expect(recs[0].values[253]).toBe(Date.UTC(2026, 0, 1, 8) / 1000 - Date.UTC(1989, 11, 31) / 1000);
  });

  it('FIT name cut never splits a letter', () => {
    const msgs = readFit(toFit(POINTS, 'Zürichsee-Rundeüü'));
    const name = msgs.find((m) => m.global === 31).values[5];
    expect(name).not.toContain('�');
    expect(new TextEncoder().encode(name).length).toBeLessThanOrEqual(15);
  });

  it('FIT without heights writes invalid altitude', () => {
    const recs = readFit(toFit(POINTS.map(({ lat, lon }) => ({ lat, lon })), 'x')).filter((m) => m.global === 20);
    expect(recs[0].values[2]).toBe(0xffff);
  });

  it('pointsOf takes heights from the stored profile', () => {
    const line = POINTS.map((p) => [p.lat, p.lon]);
    let km = 0;
    const kms = line.map((q, i) => (i ? (km += distKm({ lat: line[i - 1][0], lon: line[i - 1][1] }, { lat: q[0], lon: q[1] })) : 0));
    const profile = kms.map((k, i) => [Math.round(k * 100) / 100, 500 + i * 10]);
    const pts = pointsOf({ name: 'Ring', line, profile });
    expect(pts).toHaveLength(N);
    expect(pts[0]).toEqual({ lat: 47.37, lon: 8.54, ele: 500 });
    expect(pts[N - 1].ele).toBe(500 + (N - 1) * 10);
    expect(pointsOf({ name: 'Ring', line, profile: [] })[3].ele).toBeNull();
    expect(pointsOf(POINTS)[2].ele).toBe(POINTS[2].ele);
  });

  it('fileName makes safe names', () => {
    expect(fileName('Mein Ring', 'fit')).toBe('Mein-Ring.fit');
    expect(fileName('Zürich / Üetliberg!', '.gpx')).toBe('Zürich-Üetliberg.gpx');
    expect(fileName('  ', 'kml')).toBe('Strecke.kml');
    expect(fileName(null, 'kml')).toBe('Strecke.kml');
  });
});
