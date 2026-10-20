/**
 * «Heatmap» (Noah 20.10.2026 «1a+b 2b+a 3 alle Fahrten von Strava 4a 5a»): every ride on one map,
 * stronger where routes overlap. Pure rules, tested in tests/heatmap.test.js; the page is
 * pages/Heatmap.svelte, the map lib/heat/HeatMap.svelte.
 *
 * - Lines: every Strava activity with a line (all sports: rides, runs, hikes, ski tours …), plus GPX
 *   uploads and the app's own recordings on days without a Strava line (so one ride is not drawn twice).
 * - Filters: year, sport, bike (from the km book), tour or everyday.
 */
import { decodePolyline } from '../spur/polyline.js';
import { recParts } from '../spur/spur.js';
import { merc } from '../spur/mapmath.js';
import { cellsOf } from '../spur/neuland.js';

/** The sport groups of the filter, in this order. */
export const HEAT_KINDS = [
  { key: 'bike', name: 'Bike|kind' },
  { key: 'run', name: 'Run|kind' },
  { key: 'hike', name: 'Hike|kind' },
  { key: 'ski', name: 'Snow|heat' },
  { key: 'other', name: 'Other|kind' },
];
const KIND_RE = [
  ['bike', /(Ride|Velomobile|Handcycle)$/],
  ['run', /Run$/],
  ['hike', /^(Hike|Walk)$/],
  ['ski', /(Ski|Snowshoe|Snowboard)/],
];
/** Strava's sport type → bike, run, hike, ski or other. */
export const heatKind = (type) => KIND_RE.find(([, re]) => re.test(String(type ?? '')))?.[0] ?? 'other';

const okPt = (p) => Array.isArray(p) && Number.isFinite(+p[0]) && Number.isFinite(+p[1]) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180 && !(p[0] === 0 && p[1] === 0);
/** A line as [[lat, lon], …]: an encoded polyline or a list of pairs. */
export function ptsOf(line) {
  let pts = [];
  if (typeof line === 'string' && line) {
    try {
      pts = decodePolyline(line);
    } catch {
      pts = [];
    }
  } else if (Array.isArray(line)) pts = line.map((p) => (Array.isArray(p) ? [+p[0], +p[1]] : p && typeof p === 'object' ? [+p.lat, +p.lon] : null));
  return pts.filter(okPt);
}

/** Line length in km (a quick sum, for the numbers when a ride has no km). */
function kmOf(pts) {
  let km = 0;
  for (let i = 1; i < pts.length; i++) {
    const dy = (pts[i][0] - pts[i - 1][0]) * 111.32;
    const dx = (pts[i][1] - pts[i - 1][1]) * 111.32 * Math.cos((pts[i][0] * Math.PI) / 180);
    km += Math.hypot(dx, dy);
  }
  return km;
}

/**
 * All lines for the heatmap: [{ id, src, day, year, kind, type, name, km, bikeId, tour, actId, pts }],
 * newest first. activities: db.activities; rides: db.rides (GPX); tracks: db.tracks (kind «rec»);
 * entries: db.kmBook (the bike of a Strava ride). Lines after `today` are left out.
 */
export function heatLines({ activities = [], rides = [], tracks = [], entries = [], today = null } = {}) {
  const bikeOf = new Map();
  for (const e of entries ?? []) if (e?.stravaId && e.bikeId && e.state !== 'removed') bikeOf.set(String(e.stravaId), e.bikeId);
  const out = [];
  const stravaDays = new Set();
  const stravaIds = new Set();
  for (const a of activities ?? []) {
    if (!a?.day || (today && a.day > today) || a.trainer) continue;
    const pts = ptsOf(a.line);
    if (pts.length < 2) continue;
    stravaDays.add(a.day);
    stravaIds.add(String(a.id));
    out.push({ id: `a-${a.id}`, src: 'strava', day: a.day, year: a.day.slice(0, 4), kind: heatKind(a.type), type: a.type ?? '', name: a.name ?? '', km: Number(a.km) || kmOf(pts), bikeId: bikeOf.get(String(a.id)) ?? null, tour: !!a.tripId, tripId: a.tripId ?? null, actId: String(a.id), pts });
  }
  for (const r of rides ?? []) {
    if (!r?.date || (today && r.date > today) || stravaDays.has(r.date) || (r.stravaId && stravaIds.has(String(r.stravaId)))) continue;
    const pts = ptsOf(r.line);
    if (pts.length < 2) continue;
    out.push({ id: `r-${r.id}`, src: 'gpx', day: r.date, year: r.date.slice(0, 4), kind: 'bike', type: 'Ride', name: r.name ?? '', km: Number(r.km) || kmOf(pts), bikeId: r.bikeId ?? null, tour: !!r.tripId, tripId: r.tripId ?? null, actId: null, pts });
  }
  for (const x of tracks ?? []) {
    if (x?.kind !== 'rec' || !x.day || (today && x.day > today) || stravaDays.has(x.day)) continue;
    recParts(x).forEach((pts, i) => {
      const p = pts.filter(okPt);
      if (p.length < 2) return;
      out.push({ id: `t-${x.id}-${i}`, src: 'rec', day: x.day, year: x.day.slice(0, 4), kind: 'bike', type: 'Ride', name: '', km: kmOf(p), bikeId: null, tour: !!x.tripId, tripId: x.tripId ?? null, actId: null, pts: p });
    });
  }
  return out.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

/** The choices the data has: { years (newest first), kinds (HEAT_KINDS keys present), bikes (ids) }. */
export function heatChoices(lines = []) {
  const years = [...new Set(lines.map((l) => l.year))].sort().reverse();
  const have = new Set(lines.map((l) => l.kind));
  const kinds = HEAT_KINDS.map((k) => k.key).filter((k) => have.has(k));
  const bikes = [...new Set(lines.filter((l) => l.kind === 'bike' && l.bikeId).map((l) => l.bikeId))];
  return { years, kinds, bikes };
}

/** f: { year: 'all'|YYYY, kind: 'all'|key, bike: 'all'|id, where: 'all'|'tour'|'everyday' }. */
export function filterHeat(lines = [], f = {}) {
  const { year = 'all', kind = 'all', bike = 'all', where = 'all' } = f;
  return lines.filter(
    (l) =>
      (year === 'all' || l.year === year) &&
      (kind === 'all' || l.kind === kind) &&
      (bike === 'all' || l.bikeId === bike) &&
      (where === 'all' || (where === 'tour' ? l.tour : !l.tour)),
  );
}

/** The numbers under the filter: { n, km, days, cells } (cells: the ~2.4 km squares your lines touched). */
export function heatStats(lines = []) {
  const cells = new Set();
  for (const l of lines) cellsOf(l.pts, 14, cells);
  return { n: lines.length, km: Math.round(lines.reduce((s, l) => s + (Number(l.km) || 0), 0)), days: new Set(lines.map((l) => l.day)).size, cells: cells.size };
}

/** A line in Web Mercator 0…1 as one flat Float64Array [x0, y0, x1, y1, …] (for fast drawing). */
export function mercOf(pts) {
  const a = new Float64Array(pts.length * 2);
  pts.forEach((p, i) => {
    const m = merc(p);
    a[i * 2] = m.x;
    a[i * 2 + 1] = m.y;
  });
  return a;
}

/** Bounds in mercator { x0, y0, x1, y1 } of a flat array. */
export function boxOf(m) {
  let x0 = 1;
  let y0 = 1;
  let x1 = 0;
  let y1 = 0;
  for (let i = 0; i < m.length; i += 2) {
    if (m[i] < x0) x0 = m[i];
    if (m[i] > x1) x1 = m[i];
    if (m[i + 1] < y0) y0 = m[i + 1];
    if (m[i + 1] > y1) y1 = m[i + 1];
  }
  return { x0, y0, x1, y1 };
}

/** Squared distance from point p to segment a–b (all { x, y }). */
function seg2(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const l = dx * dx + dy * dy;
  let u = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0;
  u = Math.max(0, Math.min(1, u));
  const x = ax + u * dx - px;
  const y = ay + u * dy - py;
  return x * x + y * y;
}

/**
 * The lines that pass within r (mercator units) of the point { x, y }; prepared: [{ line, m, box }].
 * → the lines, newest first.
 */
export function linesNear(prepared = [], p, r) {
  const r2 = r * r;
  const out = [];
  for (const it of prepared) {
    const b = it.box;
    if (p.x < b.x0 - r || p.x > b.x1 + r || p.y < b.y0 - r || p.y > b.y1 + r) continue;
    const m = it.m;
    for (let i = 2; i < m.length; i += 2) {
      if (seg2(p.x, p.y, m[i - 2], m[i - 1], m[i], m[i + 1]) <= r2) {
        out.push(it.line);
        break;
      }
    }
  }
  return out.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

/** Strava activities that could still get a line (outdoors, no line yet). */
export const needLine = (activities = []) => activities.filter((a) => a && !a.line && !a.trainer && !/^Virtual/.test(String(a.type ?? '')) && !a.noLine);

/**
 * The colour scale: 256 entries [r, g, b, a] for a density 0…255. mode 'lines': a ridden line is
 * always clearly visible (light orange), many rides go to deep red; 'clouds': soft, from see-through
 * yellow to red.
 */
export function rampOf(mode = 'lines') {
  const stops =
    mode === 'clouds'
      ? [[0, [255, 237, 160, 0]], [0.08, [254, 217, 118, 0.35]], [0.3, [253, 141, 60, 0.6]], [0.6, [227, 26, 28, 0.78]], [1, [128, 0, 38, 0.9]]]
      : [[0, [253, 174, 97, 0]], [0.01, [253, 174, 97, 0.9]], [0.35, [244, 109, 67, 1]], [0.7, [215, 48, 39, 1]], [1, [120, 0, 30, 1]]];
  const lut = new Uint8ClampedArray(256 * 4);
  for (let v = 0; v < 256; v++) {
    const f = v / 255;
    let k = 1;
    while (k < stops.length - 1 && stops[k][0] < f) k++;
    const [fa, ca] = stops[k - 1];
    const [fb, cb] = stops[k];
    const u = fb > fa ? Math.max(0, Math.min(1, (f - fa) / (fb - fa))) : 1;
    for (let c = 0; c < 3; c++) lut[v * 4 + c] = Math.round(ca[c] + (cb[c] - ca[c]) * u);
    lut[v * 4 + 3] = Math.round((ca[3] + (cb[3] - ca[3]) * u) * 255);
  }
  return lut;
}

/**
 * Where most lines are, as bounds { s, w, n, e } for the first view: the 5th to 95th percentile of
 * the line boxes, so one ride abroad does not zoom the map out to half of Europe. null without lines.
 */
export function mainBounds(lines = []) {
  const boxes = lines.filter((l) => l.pts?.length).map((l) => {
    let s = 90, w = 180, n = -90, e = -180;
    for (const [la, lo] of l.pts) {
      if (la < s) s = la;
      if (la > n) n = la;
      if (lo < w) w = lo;
      if (lo > e) e = lo;
    }
    return { s, w, n, e };
  });
  if (!boxes.length) return null;
  const pick = (vals, q) => {
    const v = [...vals].sort((a, b) => a - b);
    return v[Math.min(v.length - 1, Math.max(0, Math.round(q * (v.length - 1))))];
  };
  const cut = boxes.length >= 10;
  return {
    s: pick(boxes.map((b) => b.s), cut ? 0.05 : 0),
    w: pick(boxes.map((b) => b.w), cut ? 0.05 : 0),
    n: pick(boxes.map((b) => b.n), cut ? 0.95 : 1),
    e: pick(boxes.map((b) => b.e), cut ? 0.95 : 1),
  };
}
