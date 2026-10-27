/**
 * Paket U2 «Karte» (Noah 19.10.2026 «eine Karte, wo die Strecke abgebildet ist, mit verschiedenen Quellen
 * und Layern … POI filter by zoom, Höhenprofil unter der Karte»): the pure helpers of MapView,
 * ProfileStrip and RaceMap. No maplibre here (it loads only inside MapView on mount), so all of this is
 * tested in tests/map-lib.test.js.
 *
 * Coordinates: the app keeps [lat, lon] and { lat, lon }; GeoJSON and maplibre want [lon, lat].
 */
import { pointAt, snap } from '../race/race.js';
import { symbolId } from './symbols.js';

/* ---------- colours from tokens ---------- */

/**
 * maplibre paints in WebGL and cannot read CSS variables, so the colours are read once from the app's
 * tokens (getComputedStyle on the map's root) and handed over as plain strings. FALLBACK is used when a
 * token is missing (no DOM): the same values as the light tokens in src/app.css.
 */
export const SECTOR_TOKENS = ['--l1', '--l2', '--l3', '--l4', '--hi', '--ok'];
const FALLBACK = {
  '--l1': '#2f8f7f',
  '--l2': '#c98a1e',
  '--l3': '#3f7fbf',
  '--l4': '#8c6bb8',
  '--hi': '#b83e08',
  '--ok': '#276a43',
  '--ink': '#0f2e27',
  '--ink-2': '#3b4f46',
  '--ink-3': '#566a5f',
  '--bad': '#b42318',
  '--warn': '#8a5a00',
  '--accent': '#276a43',
  '--brand': '#12372f',
  '--paper': '#fbfbf8',
  '--info-soft': '#e3eef8',
};
/** The colour of every kind of point (POI kinds of outside.js, the plan's beds, own points). */
export const KIND_TOKEN = {
  shop: '--l2',
  webcam: '--l3', // Paket Wetter: your webcams with a place
  food: '--hi',
  fuel: '--warn',
  water: '--l3',
  sleep: '--l4',
  bed: '--brand',
  bike: '--ok',
  station: '--ink-2',
  shelter: '--ink-3',
  laundry: '--ink-3',
  depot: '--bad',
  startfinish: '--ink',
  own: '--accent',
  friend: '--l3', // Gruppen-Live-Karte: the members of a group ride
  other: '--ink-3',
  // the kinds of the POI search (map/poisearch.js)
  repair: '--ok',
  camp: '--l4',
  toilet: '--ink-2',
  pharmacy: '--bad',
  hospital: '--bad',
  atm: '--ink-2',
  view: '--l1',
  // the MORE kinds of the POI search
  supermarket: '--l2',
  bakery: '--l2',
  icecream: '--hi',
  bench: '--ink-2',
  picnic: '--ok',
  charge: '--warn',
  bikepark: '--ok',
  rental: '--ok',
  roofbus: '--ink-3',
  hut: '--ink-3',
  bivouac: '--l4',
  waitroom: '--ink-3',
  night24: '--l4',
  bus: '--ink-2',
  transit: '--ink-2',
  info: '--l1',
  swim: '--l3',
  church: '--ink-2',
  pass: '--l1',
  doctor: '--bad',
  police: '--ink-2',
  post: '--ink-2',
  // Suchvorschläge (27.10.2026): the new kinds
  sauna: '--l3',
  indoorpool: '--l3',
  thermal: '--l3',
  selecta: '--l4',
  tubevend: '--ok',
  foodvend: '--l2',
  farmshop: '--l2',
  shower: '--l3',
  bikewash: '--ok',
  locker: '--ink-2',
  defib: '--bad',
  outdoor: '--ok',
  firepit: '--hi',
  phonecharge: '--warn',
};
/** The plain colour of a kind (for the symbol images). */
export const kindColour = (colours, kind) => colours[KIND_TOKEN[kind] ?? '--ink-3'] ?? FALLBACK[KIND_TOKEN[kind] ?? '--ink-3'] ?? FALLBACK['--ink-3'];
/** Read tokens: names → { name: colour }. style: a CSSStyleDeclaration (getComputedStyle) or null. */
export function tokenColours(style, names = Object.keys(FALLBACK)) {
  const out = {};
  for (const n of names) {
    let v = '';
    try {
      v = style?.getPropertyValue?.(n)?.trim() ?? '';
    } catch {
      v = '';
    }
    out[n] = v || FALLBACK[n] || FALLBACK['--ink'];
  }
  return out;
}
/** The sector colour i (repeats after six). */
export const sectorColour = (colours, i) => colours[SECTOR_TOKENS[((i % SECTOR_TOKENS.length) + SECTOR_TOKENS.length) % SECTOR_TOKENS.length]] ?? FALLBACK['--l1'];
/** A maplibre `match` expression: the point's kind → its colour. */
export function kindColourExpr(colours) {
  const pairs = Object.entries(KIND_TOKEN).flatMap(([k, tok]) => [k, colours[tok] ?? FALLBACK[tok]]);
  return ['match', ['get', 'kind'], ...pairs, colours['--ink-3'] ?? FALLBACK['--ink-3']];
}

/* ---------- which points at which zoom ---------- */

/** Always shown: the depot, start and finish, the beds of your plan, your own points and the group's members. */
export const ALWAYS = ['depot', 'startfinish', 'bed', 'own', 'friend'];
/** Shown from zoom 10: what you eat and drink. */
export const SUPPLY = ['shop', 'food', 'water', 'fuel'];
/** The zoom from which a kind is drawn (the rest from 12, so a whole race stays readable). */
export function minZoomOf(kind) {
  if (ALWAYS.includes(kind)) return 0;
  if (SUPPLY.includes(kind)) return 10;
  return 12;
}
/** From this zoom the names stand next to the points. */
export const LABEL_ZOOM = 13;

/* ---------- GeoJSON ---------- */

const ll = (p) => (Array.isArray(p) ? [Number(p[1]), Number(p[0])] : [Number(p.lon), Number(p.lat)]);
const ok = (p) => Array.isArray(p) ? Number.isFinite(Number(p[0])) && Number.isFinite(Number(p[1])) : Number.isFinite(Number(p?.lat)) && Number.isFinite(Number(p?.lon));
export const fc = (features = []) => ({ type: 'FeatureCollection', features });

/** A line ([[lat, lon]] or [{ lat, lon }]) as a GeoJSON Feature (null when shorter than 2 points). */
export function lineFeature(line, properties = {}) {
  const c = (line ?? []).filter(ok).map(ll);
  return c.length > 1 ? { type: 'Feature', properties, geometry: { type: 'LineString', coordinates: c } } : null;
}

/**
 * The route cut into its sectors: pts (lineKm), sectors [{ name, fromKm, toKm }] →
 * [{ i, name, fromKm, toKm, line: [[lat, lon]] }]. Without sectors: the whole route as one.
 */
export function sectorSegments(pts = [], sectors = []) {
  if (pts.length < 2) return [];
  const list = Array.isArray(sectors) && sectors.length ? sectors : [{ name: '', fromKm: 0, toKm: pts.at(-1).km }];
  return list
    .map((s, i) => ({ i, name: s.name ?? '', fromKm: Number(s.fromKm) || 0, toKm: Number(s.toKm) || 0, line: stretch(pts, Number(s.fromKm) || 0, Number(s.toKm) || 0) }))
    .filter((s) => s.line.length > 1);
}

/** The part of the line between two km ([[lat, lon]], the ends interpolated). */
export function stretch(pts = [], fromKm, toKm) {
  if (pts.length < 2 || !(toKm > fromKm)) return [];
  const a = pointAt(pts, fromKm);
  const b = pointAt(pts, toKm);
  const mid = pts.filter((p) => p.km > fromKm && p.km < toKm);
  return [a, ...mid, b].map((p) => [p.lat, p.lon]);
}

/** Segments ([{ line, i?, name?, tone? }]) or a ready FeatureCollection → a FeatureCollection. */
export function segmentsGeo(segments) {
  if (segments?.type === 'FeatureCollection') return segments;
  return fc((segments ?? []).map((s, k) => lineFeature(s.line, { i: s.i ?? k, name: s.name ?? '', tone: s.tone ?? '' })).filter(Boolean));
}

/**
 * The points as GeoJSON: [{ id, lat, lon, kind, name, minZoom? }] → Features with
 * { id, kind, name, minZoom, sym } (minZoom from the kind when not given; sym: the symbol image, symbols.js).
 */
export function pointsGeo(points = []) {
  return fc(
    points
      .filter(ok)
      .map((p) => ({
        type: 'Feature',
        properties: { id: String(p.id ?? ''), kind: p.kind ?? 'other', name: p.name ?? '', minZoom: Number.isFinite(p.minZoom) ? p.minZoom : minZoomOf(p.kind), sym: symbolId(p.kind ?? 'other') },
        geometry: { type: 'Point', coordinates: ll(p) },
      })),
  );
}
/** The zoom steps the points use (one maplibre layer each, so a layer's minzoom does the filtering). */
export const zoomSteps = (points = []) => [...new Set(points.map((p) => (Number.isFinite(p.minZoom) ? p.minZoom : minZoomOf(p.kind))))].sort((a, b) => a - b);

/** A point as GeoJSON (the cursor, your position). */
export const pointFeature = (p, properties = {}) => (p && ok(p) ? { type: 'Feature', properties, geometry: { type: 'Point', coordinates: ll(p) } } : null);

/** The bounds of lines and points: [[west, south], [east, north]] or null. */
export function boundsOf(...lists) {
  let w = Infinity;
  let s = Infinity;
  let e = -Infinity;
  let n = -Infinity;
  for (const list of lists)
    for (const p of list ?? []) {
      if (!ok(p)) continue;
      const [lon, lat] = ll(p);
      w = Math.min(w, lon);
      e = Math.max(e, lon);
      s = Math.min(s, lat);
      n = Math.max(n, lat);
    }
  if (!Number.isFinite(w)) return null;
  // a single point: a small box around it
  if (e - w < 1e-4 && n - s < 1e-4) return [[w - 0.01, s - 0.01], [e + 0.01, n + 0.01]];
  return [[w, s], [e, n]];
}
/** The middle of bounds as { lat, lon }. */
export const middleOf = (b) => (b ? { lat: (b[0][1] + b[1][1]) / 2, lon: (b[0][0] + b[1][0]) / 2 } : null);

/* ---------- km ↔ place ---------- */

/** km along the route → { lat, lon, km } (null without a route). */
export const placeAt = (pts, km) => (pts?.length ? pointAt(pts, Math.max(0, Math.min(Number(km) || 0, pts.at(-1).km))) : null);
/** A place → km along the route when it is within maxKm of it, else null (a tap beside the route). */
export function kmNear(pts, p, maxKm = 2) {
  if (!pts?.length || !ok(p)) return null;
  const s = snap(pts, { lat: Number(p.lat), lon: Number(p.lon) });
  return s.offKm <= maxKm ? s.km : null;
}
/** How far a tap may be from the route at a zoom (about 40 px on the screen, at least 50 m). */
export const tapKm = (zoom = 10, lat = 46.5) => Math.max(0.05, (40 * 78271.517 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom / 1000);

/* ---------- the profile ---------- */

/** The height at km (interpolated) and the gradient (%) of the profile step it lies in. */
export function profileAt(profile = [], km) {
  const p = (profile ?? []).filter((x) => Array.isArray(x) && Number.isFinite(x[0]) && Number.isFinite(x[1]));
  if (!p.length) return null;
  const k = Number(km) || 0;
  if (p.length === 1 || k <= p[0][0]) return { km: Math.max(k, p[0][0]), m: p[0][1], grade: p.length > 1 ? gradeOf(p[0], p[1]) : 0 };
  for (let i = 1; i < p.length; i++) {
    if (p[i][0] >= k) {
      const [a, b] = [p[i - 1], p[i]];
      const f = b[0] > a[0] ? (k - a[0]) / (b[0] - a[0]) : 0;
      return { km: k, m: Math.round(a[1] + (b[1] - a[1]) * f), grade: gradeOf(a, b) };
    }
  }
  const n = p.length;
  return { km: p[n - 1][0], m: p[n - 1][1], grade: gradeOf(p[n - 2], p[n - 1]) };
}
const gradeOf = (a, b) => (b[0] > a[0] ? Math.round(((b[1] - a[1]) / ((b[0] - a[0]) * 1000)) * 1000) / 10 : 0);

/**
 * The profile thinned to at most `max` points for the drawing, each with the gradient of the step that
 * ends there: [{ km, m, grade }]. Keeps the highest and lowest point of every bucket, so passes stay.
 */
export function sampleProfile(profile = [], max = 300) {
  const p = (profile ?? []).filter((x) => Array.isArray(x) && Number.isFinite(x[0]) && Number.isFinite(x[1]));
  if (p.length < 2) return p.map(([km, m]) => ({ km, m, grade: 0 }));
  let keep = p;
  if (p.length > max) {
    const per = Math.ceil(p.length / Math.max(2, Math.floor(max / 2)));
    keep = [p[0]];
    for (let i = 1; i < p.length - 1; i += per) {
      const chunk = p.slice(i, Math.min(p.length - 1, i + per));
      if (!chunk.length) continue;
      const hi = chunk.reduce((a, b) => (b[1] > a[1] ? b : a));
      const lo = chunk.reduce((a, b) => (b[1] < a[1] ? b : a));
      for (const x of hi[0] < lo[0] ? [hi, lo] : [lo, hi]) if (x !== keep.at(-1)) keep.push(x);
    }
    keep.push(p.at(-1));
  }
  return keep.map(([km, m], i) => ({ km, m, grade: i ? gradeOf(keep[i - 1], [km, m]) : 0 }));
}

/** The range of the profile: { km, lo, hi } (hi at least lo + 100, so a flat route is not a wall). */
export function profileRange(profile = []) {
  const ms = (profile ?? []).map((x) => x?.[1]).filter(Number.isFinite);
  if (!ms.length) return { km: 0, lo: 0, hi: 100 };
  const lo = Math.min(...ms);
  const hi = Math.max(...ms, lo + 100);
  return { km: Number(profile.at(-1)?.[0]) || 0, lo, hi };
}

/* ---------- the plan on the map ---------- */

/**
 * The places to sleep of the plan (the stage ends of the chosen way), as points:
 * [{ id, kind: 'bed', name, km, lat, lon, n, bed }]. plan.stages: [{ n, toKm, place, bed }].
 */
export function planBeds(plan, pts = []) {
  const st = Array.isArray(plan?.stages) ? plan.stages : [];
  return st
    .filter((d) => d.bed && d.bed !== 'finish')
    .map((d) => {
      const p = placeAt(pts, d.toKm);
      return p ? { id: `bed-${d.n}`, kind: 'bed', name: d.place || '', km: d.toKm, lat: p.lat, lon: p.lon, n: d.n, bed: d.bed } : null;
    })
    .filter(Boolean);
}

/**
 * The night stretches: where on the route you ride in the dark. dark: darkRiding() rows
 * [{ from, to }] (ms) → [{ fromKm, toKm }] through plan.kmAt.
 */
export function nightStretches(plan, dark = []) {
  if (!plan?.kmAt) return [];
  return (dark ?? [])
    .map((d) => ({ fromKm: Math.round(plan.kmAt(d.from) * 10) / 10, toKm: Math.round(plan.kmAt(d.to) * 10) / 10 }))
    .filter((d) => d.toKm - d.fromKm > 0.2);
}

/* ---------- choices kept on this device ---------- */

/** The map's choices (ground, layers) for a place: { ground, shown } (localStorage, may be empty). */
export function loadPrefs(key, defaults = {}) {
  try {
    const v = JSON.parse(localStorage.getItem(`map:${key}`) ?? 'null');
    return v && typeof v === 'object' ? { ...defaults, ...v, shown: { ...(defaults.shown ?? {}), ...(v.shown ?? {}) } } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}
export function savePrefs(key, value) {
  try {
    localStorage.setItem(`map:${key}`, JSON.stringify(value));
  } catch {
    /* private window or full: the choice holds until the page closes */
  }
}

/** Is WebGL there (maplibre needs it)? */
export function hasWebGL(doc = typeof document === 'undefined' ? null : document) {
  if (!doc) return false;
  try {
    const c = doc.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/* ---------- the maplibre style of a ground ---------- */

/** Free glyphs for the labels (OpenFreeMap, no key); the vector ground brings its own. */
export const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
export const FONT = ['Noto Sans Regular'];

/** A ground (sources.js) → a maplibre style: the vector map's style url, or one raster source. */
export function styleOf(g) {
  if (g?.kind === 'vector') return g.style;
  return {
    version: 8,
    glyphs: GLYPHS,
    sources: { ground: { type: 'raster', tiles: [g.url], tileSize: 256, maxzoom: g.maxZoom ?? 18, attribution: g.attribution ?? '' } },
    layers: [{ id: 'ground', type: 'raster', source: 'ground' }],
  };
}
