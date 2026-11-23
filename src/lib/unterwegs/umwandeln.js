/**
 * Package K: turn a route into other files for bike computers and maps.
 *   KML (Google Earth, many map apps), GPX 1.1 (almost everything) and a FIT course (Garmin Edge).
 * Pure functions, no DOM: the caller turns the result into a download.
 * Points: [{ lat, lon, ele? }], ele in metres or null.
 */
import { distKm } from '../route.js';

// ---------- input ----------

/**
 * Points from either a points array or a stored trip route
 * { name, line: [[lat, lon], …], profile: [[km, ele], …] }.
 * A stored line has no heights; each point takes the height of the nearest profile km.
 */
export function pointsOf(input) {
  if (Array.isArray(input)) return input.map((p) => ({ lat: Number(p.lat), lon: Number(p.lon), ele: okEle(p.ele) }));
  const line = Array.isArray(input?.line) ? input.line : [];
  const profile = (Array.isArray(input?.profile) ? input.profile : []).filter((x) => Array.isArray(x) && okEle(x[1]) != null);
  let km = 0;
  let j = 0; // profile pointer: line km only grows, so we walk forward
  return line.map(([lat, lon], i) => {
    if (i) km += distKm({ lat: line[i - 1][0], lon: line[i - 1][1] }, { lat, lon });
    let ele = null;
    if (profile.length) {
      while (j + 1 < profile.length && Math.abs(profile[j + 1][0] - km) <= Math.abs(profile[j][0] - km)) j++;
      ele = Number(profile[j][1]);
    }
    return { lat, lon, ele };
  });
}

const okEle = (e) => (e == null || e === '' || !Number.isFinite(Number(e)) ? null : Number(e));
const hasEle = (p) => okEle(p.ele) != null;

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

const num = (x, d) => String(Number(Number(x).toFixed(d)));

// ---------- KML ----------

/** KML 2.2 with one line. Coordinates are written lon,lat[,ele]. */
export function toKml(points, name = '') {
  const coords = points
    .map((p) => `${num(p.lon, 6)},${num(p.lat, 6)}${hasEle(p) ? ',' + num(p.ele, 1) : ''}`)
    .join(' ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${esc(name)}</name>
    <Placemark>
      <name>${esc(name)}</name>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${coords}</coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>
`;
}

// ---------- GPX ----------

/** GPX 1.1 with one track and one segment. */
export function toGpx(points, name = '') {
  const pts = points
    .map(
      (p) =>
        `      <trkpt lat="${num(p.lat, 6)}" lon="${num(p.lon, 6)}">${hasEle(p) ? `<ele>${num(p.ele, 1)}</ele>` : ''}</trkpt>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pack Generator" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${esc(name)}</name>
    <trkseg>
${pts}
    </trkseg>
  </trk>
</gpx>
`;
}

// ---------- FIT ----------

const CRC_TABLE = [
  0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401,
  0xa001, 0x6c00, 0x7800, 0xb401, 0x5000, 0x9c01, 0x8801, 0x4400,
];

/** Standard FIT CRC-16 over bytes[start..end). */
export function fitCrc(bytes, start = 0, end = bytes.length) {
  let crc = 0;
  for (let i = start; i < end; i++) {
    const b = bytes[i];
    let tmp = CRC_TABLE[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[b & 0xf];
    tmp = CRC_TABLE[crc & 0xf];
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[(b >> 4) & 0xf];
  }
  return crc;
}

const FIT_EPOCH = Date.UTC(1989, 11, 31, 0, 0, 0) / 1000; // seconds, unix
const fitTime = (date) => Math.round(date.getTime() / 1000 - FIT_EPOCH) >>> 0;
const semi = (deg) => Math.max(-0x7fffffff, Math.min(0x7fffffff, Math.round((deg * 2 ** 31) / 180)));

// FIT base types
const ENUM = 0x00, UINT8 = 0x02, UINT16 = 0x84, SINT32 = 0x85, UINT32 = 0x86, STRING = 0x07, UINT32Z = 0x8c;
const SIZE = { [ENUM]: 1, [UINT8]: 1, [UINT16]: 2, [SINT32]: 4, [UINT32]: 4, [UINT32Z]: 4 };

/** Name as fixed 16-byte string: at most 15 bytes UTF-8, never cut inside a letter, then zeros. */
function nameBytes(name) {
  const out = new Uint8Array(16);
  const enc = new TextEncoder();
  let used = 0;
  for (const ch of String(name || 'Strecke')) {
    const b = enc.encode(ch);
    if (used + b.length > 15) break;
    out.set(b, used);
    used += b.length;
  }
  return out;
}

/** Tiny little-endian byte writer. */
function writer() {
  const bytes = [];
  const w = {
    bytes,
    u8: (v) => bytes.push(v & 0xff),
    u16: (v) => { w.u8(v); w.u8(v >> 8); },
    u32: (v) => { w.u16(v & 0xffff); w.u16((v >>> 16) & 0xffff); },
    raw: (arr) => { for (const b of arr) bytes.push(b); },
    put(type, v) {
      if (type === STRING) return w.raw(v);
      if (SIZE[type] === 1) return w.u8(v);
      if (SIZE[type] === 2) return w.u16(v);
      return w.u32(v >>> 0);
    },
  };
  return w;
}

/**
 * A Garmin FIT course file (Edge 850/1040 and others import it as a course).
 * Times advance with the distance at `kmh`; they only matter for the virtual partner.
 * coursePoints (Noah 23.11.2026 «P1»): named places [{ lat, lon, name, kind }] that the Edge shows on the
 * way («Wasser in 12 km»); each sits at the nearest point of the line (see coursePointsOf). A place has `kind`
 * (a key of COURSE_TYPE: water, shop, food, fuel, summit, left, right …) or its own FIT `type` number, and a `name`.
 * coursePointsMax and farM change the limits (100 points, 1500 m from the line).
 */
export function toFit(points, name = '', { start = new Date('2026-01-01T08:00:00Z'), kmh = 16, coursePoints = [], coursePointsMax = COURSE_POINTS_MAX, farM = 1500 } = {}) {
  const pts = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
  // cumulative distance (m) and time (s) per point
  let m = 0;
  const dist = pts.map((p, i) => (i ? (m += distKm(pts[i - 1], p) * 1000) : 0));
  const t0 = fitTime(start);
  const speed = Math.max(0.1, Number(kmh) || 16) / 3.6; // m/s
  const time = dist.map((d) => t0 + Math.round(d / speed));
  const tEnd = time.length ? time[time.length - 1] : t0;
  const total = dist.length ? dist[dist.length - 1] : 0;
  const first = pts[0] || { lat: 0, lon: 0 };
  const last = pts[pts.length - 1] || first;

  const w = writer();
  // Each message type: a definition once (local number), then data rows.
  const defs = {};
  let nextLocal = 0;
  const define = (key, global, fields) => {
    const local = nextLocal++;
    defs[key] = { local, fields };
    w.u8(0x40 | local); // definition header
    w.u8(0); // reserved
    w.u8(0); // architecture: little-endian
    w.u16(global);
    w.u8(fields.length);
    for (const [fnum, type, size] of fields) {
      w.u8(fnum);
      w.u8(size ?? SIZE[type]);
      w.u8(type);
    }
  };
  const data = (key, values) => {
    const { local, fields } = defs[key];
    w.u8(local); // data header
    fields.forEach(([, type], i) => w.put(type, values[i]));
  };

  // file_id: this is a course
  define('file', 0, [[0, ENUM], [1, UINT16], [2, UINT16], [3, UINT32Z], [4, UINT32]]);
  data('file', [6, 255, 0, (t0 % 0xfffffffe) + 1, t0]);

  // course: name and sport (2 = cycling)
  define('course', 31, [[5, STRING, 16], [4, ENUM]]);
  data('course', [nameBytes(name), 2]);

  // lap: the whole course as one lap
  define('lap', 19, [
    [253, UINT32], [2, UINT32], [3, SINT32], [4, SINT32], [5, SINT32], [6, SINT32],
    [7, UINT32], [8, UINT32], [9, UINT32],
  ]);
  const ms = (tEnd - t0) * 1000;
  data('lap', [
    tEnd, t0, semi(first.lat), semi(first.lon), semi(last.lat), semi(last.lon),
    ms, ms, Math.round(total * 100),
  ]);

  // event: timer start
  define('event', 21, [[253, UINT32], [0, ENUM], [1, ENUM]]);
  data('event', [t0, 0, 0]);

  // one record per point; altitude only when a point has a height
  define('rec', 20, [[253, UINT32], [0, SINT32], [1, SINT32], [5, UINT32], [2, UINT16]]);
  pts.forEach((p, i) => {
    const alt = hasEle(p) ? Math.max(0, Math.min(0xfffe, Math.round((Number(p.ele) + 500) * 5))) : 0xffff;
    data('rec', [time[i], semi(p.lat), semi(p.lon), Math.round(dist[i] * 100), alt]);
  });

  // course points: the places the Edge announces, in the order of the course
  const cps = coursePointsOf(pts, coursePoints, { max: coursePointsMax, farM });
  if (cps.length) {
    define('cp', 32, [[1, UINT32], [2, SINT32], [3, SINT32], [4, UINT32], [5, ENUM], [6, STRING, 16]]);
    for (const c of cps) data('cp', [time[c.i], semi(pts[c.i].lat), semi(pts[c.i].lon), Math.round(dist[c.i] * 100), c.type, nameBytes(c.name)]);
  }

  // event: timer stop_all
  data('event', [tEnd, 0, 4]);

  // 14-byte header + records + file CRC
  const body = w.bytes;
  const out = new Uint8Array(14 + body.length + 2);
  const dv = new DataView(out.buffer);
  out[0] = 14; // header size
  out[1] = 0x10; // protocol 1.0
  dv.setUint16(2, 2132, true); // profile version 21.32
  dv.setUint32(4, body.length, true); // data size
  out.set([0x2e, 0x46, 0x49, 0x54], 8); // ".FIT"
  dv.setUint16(12, fitCrc(out, 0, 12), true); // header CRC
  out.set(body, 14);
  dv.setUint16(out.length - 2, fitCrc(out, 0, out.length - 2), true);
  return out;
}

/** The Edge shows at most this many course points of one course (more are cut, by km). */
export const COURSE_POINTS_MAX = 100;
/** FIT course_point types: generic 0, summit 1, water 3, food 4. The kinds of the app's places map to them. */
export const COURSE_TYPE = {
  water: 3, shop: 4, food: 4, fuel: 4, pass: 1, summit: 1,
  // turns (for «Live-Navigation»): the Edge shows an arrow; a place can also give `type` (the FIT number) itself
  left: 6, right: 7, straight: 8, slight_left: 19, sharp_left: 20, slight_right: 21, sharp_right: 22, u_turn: 23,
};

/**
 * The course points to write: each place goes to the nearest point of the line, a place more than `farM` from the line is left out (it is not on the way), twins of the same
 * type at the same point once, sorted along the course, at most COURSE_POINTS_MAX.
 * Returns [{ i, type, name }].
 */
export function coursePointsOf(pts, places = [], { farM = 1500, max = COURSE_POINTS_MAX } = {}) {
  if (!pts.length || !places?.length) return [];
  const out = [];
  for (const p of places) {
    const lat = Number(p?.lat);
    const lon = Number(p?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || p?.lat === null || p?.lon === null) continue;
    let best = -1;
    let bd = Infinity;
    pts.forEach((q, i) => {
      const d = distKm({ lat, lon }, q) * 1000;
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0 || bd > farM) continue;
    const type = Number.isInteger(p.type) && p.type >= 0 && p.type < 256 ? p.type : (COURSE_TYPE[p.kind] ?? 0);
    const label = String(p.name ?? '').trim() || String(p.kind ?? '');
    if (out.some((o) => o.i === best && o.type === type && o.name === label)) continue;
    out.push({ i: best, type, name: label });
  }
  out.sort((a, b) => a.i - b.i);
  return out.slice(0, max);
}

// ---------- file name ----------

/** Safe file name like "Mein-Ring.fit": letters (incl. umlauts), digits and dashes. */
export function fileName(name, ext) {
  const base = String(name ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
    .replace(/-$/, '');
  return `${base || 'Strecke'}.${String(ext || '').replace(/^\./, '')}`;
}
