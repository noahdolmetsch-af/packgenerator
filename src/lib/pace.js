/**
 * Your own pace (v0.19.0, "App lernt"): the riding-time guess learns from your recorded rides.
 * A GPX ride from Garmin or Strava has a time on every point. From it: moving time (without
 * stops), km and climbing. The guess stays hours = km / speed + climbing / metres per hour,
 * with your speed and climbing rate instead of the standard.
 * Stored in settings key 'pace' = { kmh, climbMh, factor, stops, n, rides: [{ id, name, date, km, gainM, movingH, totalH, use }], updatedAt }.
 * Pure functions, files are read on the device.
 */
import { distKm, climb, SPEED_KMH, CLIMB_MH } from './route.js';

export const PACE_KEY = 'pace';
/** Slower than this counts as standing (km/h); gaps longer than this (s) are stops. */
const STILL_KMH = 3;
const GAP_S = 60;

/** Points with time, elevation and position from a GPX text (track points only). */
export function timedPoints(text) {
  const out = [];
  const re = /<trkpt\b([^>]*?)(?:\/>|>([\s\S]*?)<\/trkpt>)/gi;
  for (const m of text.matchAll(re)) {
    const lat = Number(m[1].match(/lat\s*=\s*["']([^"']+)["']/i)?.[1]);
    const lon = Number(m[1].match(/lon\s*=\s*["']([^"']+)["']/i)?.[1]);
    const body = m[2] ?? '';
    const ele = Number(body.match(/<ele>\s*([^<]+)<\/ele>/i)?.[1]);
    const t = Date.parse(body.match(/<time>\s*([^<]+)<\/time>/i)?.[1] ?? '');
    if (Number.isFinite(lat) && Number.isFinite(lon)) out.push({ lat, lon, ele: Number.isFinite(ele) ? ele : null, t: Number.isFinite(t) ? t : null });
  }
  return out;
}

/**
 * One recorded ride: km, climbing, moving and total hours. null when the file has no times.
 * The ride ends at the last point that moved, so a watch left running overnight does not count.
 */
export function rideTiming(text, file = '') {
  const pts = timedPoints(text).filter((p) => p.t != null);
  if (pts.length < 2) return null;
  let km = 0;
  let moving = 0;
  let lastMove = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = distKm(pts[i - 1], pts[i]);
    const dt = (pts[i].t - pts[i - 1].t) / 1000;
    km += d;
    if (dt > 0 && dt <= GAP_S && (d / dt) * 3600 >= STILL_KMH) {
      moving += dt;
      lastMove = i;
    }
  }
  const used = pts.slice(0, lastMove + 1);
  const name = text.match(/<name>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/name>/i)?.[1]?.trim() || file.replace(/\.gpx$/i, '');
  return {
    id: `${new Date(pts[0].t).toISOString().slice(0, 16)}-${Math.round(km)}`,
    name,
    date: new Date(pts[0].t).toISOString().slice(0, 10),
    km: Math.round(km * 10) / 10,
    gainM: climb(used).gain,
    movingH: Math.round((moving / 3600) * 100) / 100,
    totalH: Math.round(((used.at(-1).t - used[0].t) / 3600000) * 100) / 100,
  };
}

/**
 * Your pace from your rides. Fitting speed and climbing separately does not work on real rides
 * (fast descents hide the climbing), so the standard guess keeps its shape and gets your factor:
 * factor = your moving hours / the standard guess, over all rides that count (at least 20 km).
 * Speed = 16 km/h / factor, climbing = 600 m per hour / factor. stops: total time / moving time,
 * for "with your usual stops". Returns { kmh, climbMh, factor, stops, n } or null.
 */
export function learnPace(rides) {
  const rs = rides.filter((r) => r.use !== false && r.km >= 20 && r.movingH > 0.5);
  if (!rs.length) return null;
  const std = rs.reduce((t, r) => t + r.km / SPEED_KMH + (r.gainM ?? 0) / CLIMB_MH, 0);
  const moving = rs.reduce((t, r) => t + r.movingH, 0);
  const total = rs.reduce((t, r) => t + Math.max(r.totalH ?? r.movingH, r.movingH), 0);
  const factor = Math.min(2, Math.max(0.3, moving / std));
  return { kmh: round1(SPEED_KMH / factor), climbMh: Math.round(CLIMB_MH / factor / 10) * 10, factor: Math.round(factor * 100) / 100, stops: Math.round((total / moving) * 100) / 100, n: rs.length };
}
const round1 = (v) => Math.round(v * 10) / 10;

/**
 * v0.53.0 R2 «Dein Tempo» (Noah ★a): your own rule takes over the riding-time guess by itself from
 * PACE_MIN rides that count; below that the standard (16 km/h, 600 m per hour) stays. It is a visible
 * suggestion: «Zurück zur Standardregel» keeps the standard (setting.standard = true), «Meine Regel
 * nutzen» takes it back. The flag lives in the same setting and survives adding or removing rides.
 */
export const PACE_MIN = 5;

/**
 * The pace to guess with: { kmh, climbMh, stops, mine, n, need, learned, standard }.
 * mine: your rule is used now. n: rides that count. need: rides still missing for your rule.
 * learned: your rule ({ kmh, climbMh }) even while it is not used (below PACE_MIN, or standard chosen).
 */
export function paceOf(setting) {
  const n = setting?.kmh ? setting.n ?? 0 : (setting?.rides ?? []).filter((r) => r.use !== false && r.km >= 20 && r.movingH > 0.5).length;
  const learned = setting?.kmh ? { kmh: setting.kmh, climbMh: setting.climbMh || CLIMB_MH } : null;
  const standard = setting?.standard === true;
  const need = Math.max(0, PACE_MIN - n);
  if (learned && !need && !standard) return { ...learned, stops: setting.stops ?? null, mine: true, n, need, learned, standard };
  return { kmh: SPEED_KMH, climbMh: CLIMB_MH, stops: null, mine: false, n, need, learned, standard };
}

/** The setting with your rule switched off (standard = true) or on again. */
export const withStandard = (setting, standard) => ({ ...(setting ?? { kmh: null, climbMh: null, rides: [] }), standard: !!standard, updatedAt: new Date().toISOString() });

/** The rule in round numbers for the one sentence: km/h to 0.5, metres per hour to 50. */
export const ruleOf = (p) => (p ? { kmh: Math.round(p.kmh * 2) / 2, climbMh: Math.round(p.climbMh / 50) * 50 } : null);

/**
 * The rides of the small charts, oldest first: [{ id, date, name, kmh, hmPerKm, climbMh }] of the
 * rides that count, from `from` (an ISO day, null = all). kmh: moving speed; hmPerKm: climbing per km.
 */
export function paceSeries(rides = [], from = null) {
  return rides
    .filter((r) => r.use !== false && r.km >= 20 && r.movingH > 0.5 && (!from || (r.date ?? '') >= from))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .map((r) => ({ id: r.id, date: r.date, name: r.name, km: r.km, kmh: round1(r.km / r.movingH), hmPerKm: Math.round(((r.gainM ?? 0) / r.km) * 10) / 10 }));
}

/** How far off the guess is for one ride (riding hours guessed minus real), for the list. */
export const guessFor = (r, pace) => r.km / pace.kmh + (r.gainM ?? 0) / pace.climbMh;
