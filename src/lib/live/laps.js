/**
 * Runden und «Gegen dich selbst» (Noah 20.10.2026 «2-3 ja»), pure; tested in tests/live-laps.test.js.
 *
 * Laps: a tap on «Lap» starts a new lap, like the lap button of a Garmin. A lap is kept with the recording
 * as row.laps = [{ at (ms), km (ridden), movingS }] (where it started); the first lap starts at the start.
 *
 * Against yourself: on a route you rode before, how far ahead or behind your last ride you are at the
 * same km of the route, in riding time (pauses and stops left out on both sides).
 */
import { snap } from '../race/race.js';
import { pausedS } from './live-lib.js';

/** The laps of a recording with their numbers so far: [{ n, km, movingS, at }] (the running one last). */
export function lapsOf(laps = [], { km = 0, movingS = 0, now = Date.now(), startAt = 0 } = {}) {
  const starts = [{ at: startAt, km: 0, movingS: 0 }, ...(laps ?? [])];
  return starts.map((s, i) => {
    const next = starts[i + 1] ?? { at: now, km, movingS };
    return { n: i + 1, at: s.at, km: Math.max(0, Math.round((next.km - s.km) * 100) / 100), movingS: Math.max(0, Math.round(next.movingS - s.movingS)) };
  });
}

/** The running lap: { n, km, movingS }. */
export const lapNow = (laps, c) => lapsOf(laps, c).at(-1);

const R = 6371;
const rad = Math.PI / 180;
const dist = (a, b) => 2 * R * Math.asin(Math.sqrt(Math.sin(((b[0] - a[0]) * rad) / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(((b[1] - a[1]) * rad) / 2) ** 2));

/**
 * The riding time of a recording along a route: [[routeKm, movingS]], rising in km, from its points
 * [[lat, lon, sec]] (at most `max` points looked at). A point more than `offKm` beside the route is
 * left out; the riding time leaves out the pauses (row.breaks) and stops (2 min or more within 40 m).
 */
export function ghostOf(row, routePts = [], { max = 1500, offKm = 0.3 } = {}) {
  const p = Array.isArray(row?.pts) ? row.pts : [];
  if (p.length < 10 || routePts.length < 2) return [];
  const step = Math.max(1, Math.ceil(p.length / max));
  const breaks = row.breaks ?? [];
  const out = [];
  let moving = 0;
  let lastKm = -Infinity;
  for (let i = 0; i < p.length; i++) {
    if (i > 0) {
      const dt = (p[i][2] ?? 0) - (p[i - 1][2] ?? 0);
      const ms = (row.startAt ?? 0) + p[i][2] * 1000;
      const stood = dt >= 120 && dist(p[i - 1], p[i]) < 0.04;
      // the part of this step inside a pause does not count
      if (dt > 0 && !stood) moving += Math.max(0, dt - pausedS(ms - dt * 1000, ms, breaks));
    }
    if (i % step && i !== p.length - 1) continue;
    const s = snap(routePts, { lat: p[i][0], lon: p[i][1] });
    if (s.offKm > offKm) continue;
    const k = s.kmx ?? s.km;
    // only forward along the route (a loop back or a detour does not count twice)
    if (k <= lastKm) continue;
    lastKm = k;
    out.push([Math.round(k * 1000) / 1000, moving]);
  }
  return out.length >= 2 ? out : [];
}

/** The riding time of the ghost at a route km (linear between its points), or null outside it. */
export function ghostAt(ghost = [], km) {
  if (ghost.length < 2 || !Number.isFinite(km) || km < ghost[0][0] || km > ghost.at(-1)[0]) return null;
  let lo = 0;
  let hi = ghost.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ghost[mid][0] <= km) lo = mid;
    else hi = mid;
  }
  const [k0, s0] = ghost[lo];
  const [k1, s1] = ghost[hi];
  return k1 > k0 ? s0 + ((s1 - s0) * (km - k0)) / (k1 - k0) : s0;
}

/**
 * The difference to the ghost in seconds: + you are behind (slower), − you are ahead. null when the
 * ghost has no time at this km. startKm: where on the route your ride began (both are counted from there).
 */
export function ghostDelta(ghost, { km, movingS, startKm = null }) {
  const g = ghostAt(ghost, km);
  if (g == null) return null;
  const g0 = startKm != null ? ghostAt(ghost, startKm) : 0;
  if (g0 == null) return null;
  return Math.round(movingS - (g - g0));
}

/** The last closed recording of the same tour that has a time along the route (newest first). */
export function lastRideOf(rows = [], { tripId = null, notId = null } = {}) {
  return (rows ?? [])
    .filter((r) => r?.kind === 'rec' && !r.open && r.id !== notId && (r.tripId ?? null) === (tripId ?? null) && (r.pts?.length ?? 0) >= 10)
    .sort((a, b) => (b.startAt ?? 0) - (a.startAt ?? 0));
}

/** «+1:05» behind, «−0:42» ahead, «±0:00». */
export function deltaText(s) {
  if (!Number.isFinite(s)) return '–';
  const a = Math.abs(Math.round(s));
  const txt = `${Math.floor(a / 60)}:${String(a % 60).padStart(2, '0')}`;
  return s > 0 ? `+${txt}` : s < 0 ? `−${txt}` : `±${txt}`;
}
