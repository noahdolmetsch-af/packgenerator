/**
 * Paket U3 «Live-Karte» neu wie komoot / Google Maps (Noah 19.10.2026 «1a und b 2b 3b 4b 5a»):
 * the pure parts of the full-screen live map.
 * - The top band: big numbers. Three at the start (km done, km to go, arrival); the rider chooses up to
 *   six and their order (like the handlebar view, unterwegs/lenker.js). Setting 'live' → { …, tiles }.
 * - North stays up; you are an arrow in your direction (GPS heading, else from the last two fixes).
 * - The route: the ridden part faded, the part ahead strong and coloured where it climbs (fine profile).
 * - The start view: the next 20 km ahead.
 * Tested in tests/livemap.test.js.
 */
import { segments, STEEPNESS, decode } from '../map/fineprofile.js';
import { stretch } from '../map/maplib.js';

export const MAX_TILES = 6;
export const DEFAULT_TILES = ['done', 'left', 'arrive'];
/** Every number of the band (label: English key for t(); unit shown small). `route`: needs a route. */
export const LIVE_TILES = [
  { key: 'done', label: 'km done', unit: 'km' },
  { key: 'left', label: 'km to go', unit: 'km', route: true },
  { key: 'arrive', label: 'Arrival', unit: '', route: true },
  { key: 'clock', label: 'Time', unit: '' },
  { key: 'moving', label: 'Riding time', unit: 'h' },
  { key: 'speed', label: 'Speed (GPS)', unit: 'km/h' },
  { key: 'avg', label: 'Average while moving', unit: 'km/h' },
  { key: 'height', label: 'Height', unit: 'm', route: true },
  { key: 'grade', label: 'Gradient here', unit: '%', route: true },
  { key: 'top', label: 'To the next summit', unit: 'km', route: true },
  { key: 'stop', label: 'To the next stop', unit: 'km' },
  { key: 'light', label: 'Light left', unit: '' },
  { key: 'plan', label: 'Against the plan', unit: '', route: true },
  // Pausieren, Sensoren (Noah 20.10.2026): the whole time, the pulse, power and cadence, metres up, stops
  { key: 'total', label: 'Total time', unit: 'h' },
  { key: 'hr', label: 'Heart rate', unit: 'bpm' },
  { key: 'power', label: 'Power', unit: 'W' },
  { key: 'cadence', label: 'Cadence', unit: 'rpm' },
  { key: 'gain', label: 'Metres up', unit: 'm' },
  { key: 'max', label: 'Top speed', unit: 'km/h' },
  { key: 'stops', label: 'Stops', unit: '' },
];
const KEYS = new Set(LIVE_TILES.map((x) => x.key));
export const TILE = Object.fromEntries(LIVE_TILES.map((x) => [x.key, x]));

/** The stored choice made safe: known keys, no doubles, 1 to MAX_TILES, else the three of the start. */
export function tilesOf(v) {
  const list = Array.isArray(v) ? [...new Set(v.filter((k) => KEYS.has(k)))].slice(0, MAX_TILES) : [];
  return list.length ? list : [...DEFAULT_TILES];
}
/** Switch a number on or off (at least one, at most MAX_TILES). */
export function toggleTile(list, key) {
  if (list.includes(key)) return list.length > 1 ? list.filter((k) => k !== key) : list;
  return list.length < MAX_TILES && KEYS.has(key) ? [...list, key] : list;
}
/** Move a number from one place to another. */
export function moveTile(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}

const pad = (n) => String(n).padStart(2, '0');
const r1 = (v) => (v >= 100 ? String(Math.round(v)) : (Math.round(v * 10) / 10).toFixed(1));
/**
 * The value of each number now: ctx { now, km (on the route) | null, ridden (km recorded), left, eta (ms),
 * movingS, kmh (average while moving), speed (GPS m/s) | null, height, grade, top ({ distKm }) | null,
 * stop ({ distKm }) | null, lightMin | null, dark, delta (min ahead + / behind −) | null, clock(ms) → 'HH:MM' }.
 * → { key: { value, sub? } }; '–' when unknown.
 */
const hm = (sec) => `${Math.floor(sec / 3600)}:${pad(Math.floor((sec % 3600) / 60))}`;

/**
 * Metres up from the GPS height (Noah: «Höhenmeter»), without the jitter: a climb counts only once the
 * height rose 4 m above the lowest point since the last count. st: { base, gain } → new st.
 */
export function gainStep(st = { base: null, gain: 0 }, alt, step = 4) {
  if (!Number.isFinite(alt)) return st;
  if (st.base == null) return { base: alt, gain: st.gain ?? 0 };
  if (alt < st.base) return { base: alt, gain: st.gain };
  if (alt - st.base >= step) return { base: alt, gain: Math.round((st.gain + alt - st.base) * 10) / 10 };
  return st;
}

export function tileValues(c = {}) {
  const dash = { value: '–' };
  const v = (value, sub = '') => ({ value: String(value), sub });
  const clock = c.clock ?? ((ms) => `${pad(new Date(ms).getHours())}:${pad(new Date(ms).getMinutes())}`);
  const done = c.km ?? c.ridden;
  return {
    done: Number.isFinite(done) ? v(r1(done)) : dash,
    left: Number.isFinite(c.left) ? v(r1(Math.max(0, c.left))) : dash,
    arrive: Number.isFinite(c.eta) ? v(clock(c.eta)) : dash,
    clock: v(clock(c.now ?? Date.now())),
    moving: Number.isFinite(c.movingS) ? v(`${Math.floor(c.movingS / 3600)}:${pad(Math.floor((c.movingS % 3600) / 60))}`) : dash,
    speed: Number.isFinite(c.speed) && c.speed >= 0 ? v(Math.round(c.speed * 3.6)) : dash,
    avg: Number.isFinite(c.kmh) && c.kmh > 0 ? v(Math.round(c.kmh * 10) / 10) : dash,
    height: Number.isFinite(c.height) ? v(Math.round(c.height)) : dash,
    grade: Number.isFinite(c.grade) ? v(`${c.grade > 0 ? '+' : ''}${Math.round(c.grade)}`) : dash,
    top: c.top && Number.isFinite(c.top.distKm) ? v(r1(Math.max(0, c.top.distKm))) : dash,
    stop: c.stop && Number.isFinite(c.stop.distKm) ? v(r1(Math.max(0, c.stop.distKm))) : dash,
    light: c.dark ? v('0:00') : Number.isFinite(c.lightMin) ? v(`${Math.floor(c.lightMin / 60)}:${pad(Math.round(c.lightMin % 60))}`) : dash,
    total: Number.isFinite(c.totalS) ? v(hm(c.totalS)) : dash,
    hr: Number.isFinite(c.hr) ? v(Math.round(c.hr)) : dash,
    power: Number.isFinite(c.power) ? v(Math.round(c.power)) : dash,
    cadence: Number.isFinite(c.cadence) ? v(Math.round(c.cadence)) : dash,
    gain: Number.isFinite(c.gain) ? v(Math.round(c.gain)) : dash,
    max: Number.isFinite(c.maxKmh) && c.maxKmh > 0 ? v(Math.round(c.maxKmh * 10) / 10) : dash,
    stops: Number.isFinite(c.stops) ? v(c.stops) : dash,
    plan: Number.isFinite(c.delta) ? v(`${c.delta >= 0 ? '+' : '−'}${Math.floor(Math.abs(c.delta) / 60)}:${pad(Math.round(Math.abs(c.delta) % 60))}`) : dash,
  };
}

/* ---------- where you look ---------- */

/** The compass bearing from a to b in degrees (0 = north, 90 = east). */
export function bearing(a, b) {
  const rad = Math.PI / 180;
  const y = Math.sin((b.lon - a.lon) * rad) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lon - a.lon) * rad);
  return Math.round(((Math.atan2(y, x) / rad + 360) % 360) * 10) / 10;
}
const metres = (a, b) => {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};
/**
 * Your direction: the GPS heading when it has one and you move, else from the last fix you were at least
 * 8 m away from; null while you stand (keep the last arrow then).
 */
export function headingOf(fix, prev) {
  if (!fix) return null;
  if (Number.isFinite(fix.heading) && (fix.speed == null || fix.speed > 0.8)) return Math.round(fix.heading * 10) / 10;
  if (prev && Number.isFinite(prev.lat) && metres(prev, fix) >= 8) return bearing(prev, fix);
  return null;
}

/** The stretch of the start view: from km the next `ahead` km (a little behind too), as a line. */
export function aheadLine(pts = [], km = 0, ahead = 20) {
  if (!(pts?.length > 1)) return [];
  const end = pts.at(-1).km;
  return stretch(pts, Math.max(0, (km ?? 0) - 0.5), Math.min(end, (km ?? 0) + ahead));
}

/**
 * The part ahead coloured by gradient (only where it climbs 3 % or more; the rest stays the plain strong
 * line): [{ line, key, colour }], neighbours of the same class joined. pieceKm: the length of the pieces.
 */
export function gradeLines(pts = [], fine, fromKm = 0, toKm = Infinity, pieceKm = 0.5) {
  const f = decode(fine);
  if (!f || !(pts?.length > 1)) return [];
  const to = Math.min(toKm, f.km, pts.at(-1).km);
  if (!(to > fromKm)) return [];
  const out = [];
  let cur = null;
  for (const s of segments(f, fromKm, to, pieceKm)) {
    const up = s.key.startsWith('u') && s.key !== 'u0';
    if (cur && cur.key === s.key && up) {
      cur.toKm = s.toKm;
      continue;
    }
    if (cur) out.push(cur);
    cur = up ? { key: s.key, fromKm: s.fromKm, toKm: s.toKm } : null;
  }
  if (cur) out.push(cur);
  const colour = Object.fromEntries(STEEPNESS.map((c) => [c.key, c.colour]));
  return out.map((s) => ({ key: s.key, colour: colour[s.key], line: stretch(pts, s.fromKm, s.toKm) })).filter((s) => s.line.length > 1);
}

/** The bottom sheet: three heights (px) for a window of h px; the nearest one to a dragged height. */
export function sheetSnaps(h) {
  const peek = 148;
  return { peek, half: Math.max(peek + 80, Math.round(h * 0.5)), full: Math.max(peek + 160, Math.round(h * 0.88)) };
}
export function nearestSnap(px, snaps) {
  return Object.entries(snaps).reduce((a, b) => (Math.abs(b[1] - px) < Math.abs(a[1] - px) ? b : a))[0];
}
