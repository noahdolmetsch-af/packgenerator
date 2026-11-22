/**
 * «Nebel auf der Tour-Route» (Noah 05.11.2026 «4b 5b»): where a planned route lies against the fog line of its start
 * time. From the profile of the route ([[km, m], …]) and the fog top (m above sea level, nebelgrenze.js):
 * - routeFog: the start in or above the fog, the km where the route first climbs above it, the km that lie in the fog;
 * - tripFog: the fog of a trip for the strip of its start time (the profile line «Nebel bis …») and the line in
 *   «Weather for this tour»; it reads the shared air layers (profil.js) and only knows the next 3 days.
 * A suggestion, never a rating of danger. Pure apart from tripFog; tested in tests/nebelgrenze.test.js.
 */
import { atLocal, localDate } from './kern.js';
import { loadProfil } from './profil.js';
import { fogAtTime, clearing } from './nebelgrenze.js';

const fin = (v) => typeof v === 'number' && Number.isFinite(v);
const pts = (profile) => (profile ?? []).map((p) => (Array.isArray(p) ? [Number(p[0]), Number(p[1])] : [Number(p?.km), Number(p?.m)])).filter((p) => fin(p[0]) && fin(p[1])).sort((a, b) => a[0] - b[0]);
const r1 = (v) => Math.round(v * 10) / 10;

/**
 * The route against a fog top → { startM, startIn, aboveKm, kmIn, km, topM } or null without a profile.
 * aboveKm: where the route first goes above the top (null: never, or it starts above); kmIn: km in the fog.
 */
export function routeFog(profile, top) {
  const p = pts(profile);
  if (p.length < 2 || !fin(top)) return null;
  let kmIn = 0;
  let aboveKm = null;
  for (let i = 0; i + 1 < p.length; i++) {
    const [k0, m0] = p[i];
    const [k1, m1] = p[i + 1];
    const len = k1 - k0;
    if (len <= 0) continue;
    if (m0 <= top && m1 <= top) kmIn += len;
    else if (m0 > top && m1 > top) {
      /* above the whole piece */
    } else {
      const cross = k0 + (len * (top - m0)) / (m1 - m0);
      kmIn += m0 <= top ? cross - k0 : k1 - cross;
      if (m0 <= top && aboveKm == null && p[0][1] <= top) aboveKm = cross;
    }
  }
  if (p[0][1] <= top && aboveKm == null) {
    const first = p.find((q) => q[1] > top);
    if (first) aboveKm = first[0];
  }
  return { startM: Math.round(p[0][1]), startIn: p[0][1] <= top, aboveKm: aboveKm == null ? null : r1(aboveKm), kmIn: r1(kmIn), km: r1(p.at(-1)[0] - p[0][0]), topM: Math.round(Math.max(...p.map((q) => q[1]))) };
}

/** The start of the trip's day at `hour` (local to the place), ms. */
export const startOf = (date, hour, offset = 0) => atLocal(date, hour, offset);

/**
 * The fog of a trip at a start time (default 9 h of its first day): { at (ms), top, ground, clears (hour | null), old }
 * or null (no start date, no place, outside the 3 days, or no value). `top` null: no fog deck.
 */
export async function tripFog(db, trip, { startMs = null, loader = loadProfil, now = Date.now() } = {}) {
  const p = trip?.place ?? trip?.route?.start ?? null;
  if (!trip?.startDate || !p || !fin(Number(p.lat)) || !fin(Number(p.lon))) return null;
  const fog = await loader(db, { lat: Number(p.lat), lon: Number(p.lon) }, { now }).catch(() => null);
  if (!fog) return null;
  const at = startMs ?? startOf(trip.startDate, 9, fog.offset ?? 0);
  const f = fogAtTime(fog, at);
  if (!f) return null;
  const c = clearing(fog, at);
  return { at, top: f.top, ground: !!f.ground, clears: c?.kind === 'clears' ? c.hour : null, old: !!fog.old, date: localDate(at, fog.offset ?? 0) };
}
