/**
 * «Wege-Gedächtnis» (Noah 07.11.2026 «4a 5a», Thread «Verbessern: Routing und Navigation»): after a ride you mark the
 * stretches as good (thumb up) or bad (thumb down). A bad stretch is avoided when the app plans a new way
 * (BRouter `nogos`), a good one only gets a sign on the live map. Everything lives in one settings row
 * (no new table); each remembered way can be renamed and deleted with Undo.
 * Pure functions: the ride gives the points, the caller reads and writes the row.
 */
import { distKm } from './live-lib.js';

export const WAYS_KEY = 'pg-way-memory';
/** About this long is one stretch to rate (km); a long ride gets longer stretches, at most MAX_SECTIONS. */
export const SECTION_KM = 3;
export const MAX_SECTIONS = 14;
/** A ride shorter than this has nothing to rate (km). */
export const MIN_RIDE_KM = 1.5;
/** Points of a kept stretch are at least this far apart (km). */
export const STEP_KM = 0.1;
/** A bad stretch is avoided within this radius (m) around its points; at most MAX_CIRCLES per request. */
export const AVOID_RADIUS_M = 50;
export const MAX_CIRCLES = 60;
/** Only bad stretches this close (km) to the planned way count. */
export const NEAR_KM = 2;
export const NAME_MAX = 60;

const r5 = (v) => Math.round(v * 1e5) / 1e5;
const fin = (v) => Number.isFinite(Number(v));

/** What is kept: { v: 1, ways: [...] } (also from an empty or broken row). */
export function cleanMemory(value) {
  const ways = Array.isArray(value?.ways) ? value.ways.filter((w) => w && typeof w.id === 'string' && Array.isArray(w.line) && w.line.length > 1 && (w.rating === 'up' || w.rating === 'down')) : [];
  return { v: 1, ways };
}

/**
 * The stretches of a ride to rate. fixes: [{ lat, lon }] in order. → [{ i, fromKm, toKm, line: [[lat, lon]] }]
 * (empty for a ride shorter than MIN_RIDE_KM).
 */
export function sectionsOf(fixes = [], { sectionKm = SECTION_KM, max = MAX_SECTIONS } = {}) {
  const f = fixes.filter((p) => fin(p?.lat) && fin(p?.lon));
  if (f.length < 2) return [];
  const km = [0];
  for (let i = 1; i < f.length; i++) km.push(km[i - 1] + distKm(f[i - 1], f[i]));
  const total = km.at(-1);
  if (total < MIN_RIDE_KM) return [];
  const n = Math.max(1, Math.min(max, Math.round(total / sectionKm)));
  const out = [];
  for (let s = 0; s < n; s++) {
    const a = (total * s) / n;
    const b = (total * (s + 1)) / n;
    const line = [];
    let last = -Infinity;
    for (let i = 0; i < f.length; i++) {
      if (km[i] < a - 1e-9 || km[i] > b + 1e-9) continue;
      if (!line.length || km[i] - last >= STEP_KM - 0.005) {
        line.push([r5(f[i].lat), r5(f[i].lon)]);
        last = km[i];
      }
    }
    // the stretch ends where the next begins: keep its last point
    const lastIdx = km.findLastIndex((x) => x <= b + 1e-9);
    const end = [r5(f[lastIdx].lat), r5(f[lastIdx].lon)];
    if (line.length && (line.at(-1)[0] !== end[0] || line.at(-1)[1] !== end[1])) line.push(end);
    if (line.length > 1) out.push({ i: s, fromKm: Math.round(a * 10) / 10, toKm: Math.round(b * 10) / 10, line });
  }
  return out;
}

/** The id of a stretch of a ride (rating it again replaces the old mark). */
export const wayId = (rideId, i) => `${rideId}:${i}`;

/** Mark (or unmark: the same rating again) a stretch. → the new { v, ways }. */
export function rate(memory, { rideId, day = '', section, rating, now = Date.now() }) {
  const m = cleanMemory(memory);
  const id = wayId(rideId, section.i);
  const old = m.ways.find((w) => w.id === id);
  const rest = m.ways.filter((w) => w.id !== id);
  if (!rating || old?.rating === rating) return { ...m, ways: rest };
  return { ...m, ways: [...rest, { id, rideId, day, fromKm: section.fromKm, toKm: section.toKm, line: section.line, rating, name: old?.name ?? '', at: now }] };
}

export function renameWay(memory, id, name) {
  const m = cleanMemory(memory);
  return { ...m, ways: m.ways.map((w) => (w.id === id ? { ...w, name: String(name ?? '').trim().slice(0, NAME_MAX) } : w)) };
}

export const removeWay = (memory, id) => {
  const m = cleanMemory(memory);
  return { ...m, ways: m.ways.filter((w) => w.id !== id) };
};

/** Put a removed way back (Undo), at its place by time. */
export const restoreWay = (memory, way) => {
  const m = cleanMemory(memory);
  return m.ways.some((w) => w.id === way.id) ? m : { ...m, ways: [...m.ways, way].sort((a, b) => (a.at ?? 0) - (b.at ?? 0)) };
};

export const changeRating = (memory, id, rating) => {
  const m = cleanMemory(memory);
  return { ...m, ways: m.ways.map((w) => (w.id === id && (rating === 'up' || rating === 'down') ? { ...w, rating } : w)) };
};

/** The name shown: the one you gave, else «km 3–6 · 07.11.». */
export function nameOf(w, { km = (a, b) => `km ${a}–${b}`, date = (d) => d } = {}) {
  if (w.name) return w.name;
  return [km(w.fromKm, w.toKm), w.day ? date(w.day) : ''].filter(Boolean).join(' · ');
}

/** The bad stretches that lie near a way [{ lat, lon }] (a box around it, NEAR_KM wider). */
export function nearBadWays(ways = [], way = [], { nearKm = NEAR_KM } = {}) {
  const pts = way.filter((p) => fin(p?.lat) && fin(p?.lon));
  const bad = ways.filter((w) => w.rating === 'down' && Array.isArray(w.line));
  if (!pts.length || !bad.length) return [];
  const m = nearKm / 111;
  const la0 = Math.min(...pts.map((p) => Number(p.lat))) - m;
  const la1 = Math.max(...pts.map((p) => Number(p.lat))) + m;
  const mk = m / Math.max(0.2, Math.cos((((la0 + la1) / 2) * Math.PI) / 180));
  const lo0 = Math.min(...pts.map((p) => Number(p.lon))) - mk;
  const lo1 = Math.max(...pts.map((p) => Number(p.lon))) + mk;
  return bad.filter((w) => w.line.some((p) => p[0] >= la0 && p[0] <= la1 && p[1] >= lo0 && p[1] <= lo1));
}

/** The circles BRouter must keep out of for these bad stretches: → [{ lat, lon, r }], at most `max`, evenly thinned. */
export function circlesOf(ways = [], { max = MAX_CIRCLES, r = AVOID_RADIUS_M } = {}) {
  const all = ways.flatMap((w) => w.line);
  if (all.length <= max) return all.map((p) => ({ lat: p[0], lon: p[1], r }));
  const step = all.length / max;
  return Array.from({ length: max }, (_, i) => all[Math.floor(i * step)]).map((p) => ({ lat: p[0], lon: p[1], r }));
}

/** The circles for a way: the near bad stretches as circles. */
export const avoidCircles = (ways, way, opts) => circlesOf(nearBadWays(ways, way, opts));

/** The BRouter parameter for the circles: lon,lat,radius separated by «|». */
export const nogosParam = (circles = []) => circles.map((c) => `${Number(c.lon).toFixed(5)},${Number(c.lat).toFixed(5)},${Math.round(c.r)}`).join('|');

/** The signs for the live map: one at the middle of each good stretch. */
export function goodSigns(ways = [], name = (w) => nameOf(w)) {
  return ways
    .filter((w) => w.rating === 'up')
    .map((w) => {
      const p = w.line[Math.floor(w.line.length / 2)];
      return { id: `way-${w.id}`, lat: p[0], lon: p[1], kind: 'view', name: name(w), minZoom: 0 };
    });
}
