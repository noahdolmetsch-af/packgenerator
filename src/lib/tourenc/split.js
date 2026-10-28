/**
 * Touren c 66 «Eine Datei, mehrere Erlebnisse» (Noah 26.10.2026 «1a 2a»): one recording you let run is cut into
 * parts. The app suggests cuts at long pauses (30 min or more) and around slow stretches (on foot?); you can
 * also cut anywhere on the profile. Each part becomes its own ride row (gpx.js analysePoints), as a stage of the
 * trip or as an own activity with its sport. The pause at a cut is no riding time of either part.
 * Points: [{ lat, lon, t (ms), ele? }] with times, oldest first (gpx.js timedPoints). Pure, tested in tests/touren-c.test.js.
 */
import { findPauses, analysePoints } from '../gpx.js';
import { distKm } from '../route.js';

export const LONG_PAUSE_MIN = 30;
export const SLOW_KMH = 6;
export const SLOW_MIN = 20;
/** The sports of an own activity (ride rows keep the key in `sport`). */
export const SPORTS = [
  { key: 'bike', name: 'Bike|sport' },
  { key: 'hike', name: 'Hiking|sport' },
  { key: 'run', name: 'Running|sport' },
  { key: 'other', name: 'Other|sport' },
];

/** km along the points (raw, the pauses included), one per point. */
export function kmAlong(pts = []) {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + distKm(pts[i - 1], pts[i]));
  return out;
}

const r1 = (v) => Math.round(v * 10) / 10;

/**
 * Where the app suggests to cut: [{ kind: 'pause' | 'slow', from (ms), to (ms), km, min }].
 * A pause: the cut leaves the pause out. A slow stretch: two cuts (from and to), so it becomes a part of its own.
 */
export function suggestCuts(pts = []) {
  if (pts.length < 3) return [];
  const km = kmAlong(pts);
  const out = findPauses(pts, LONG_PAUSE_MIN).map((p) => ({ kind: 'pause', from: pts[p.from].t, to: pts[p.to].t, km: r1(km[p.from]), min: Math.round(p.ms / 6e4) }));
  const inPause = (t) => out.some((c) => t >= c.from && t <= c.to);
  // slow stretches: moving between 1 and 6 km/h for 20 min or more, not inside a long pause
  let run = null;
  const close = () => {
    if (run && run.to - run.from >= SLOW_MIN * 6e4) out.push({ kind: 'slow', from: run.from, to: run.to, km: r1(run.km), min: Math.round((run.to - run.from) / 6e4) });
    run = null;
  };
  for (let i = 1; i < pts.length; i++) {
    const dt = pts[i].t - pts[i - 1].t;
    const v = dt > 0 ? (distKm(pts[i - 1], pts[i]) / dt) * 36e5 : 0;
    const slow = v >= 1 && v < SLOW_KMH && !inPause(pts[i].t) && dt < 10 * 6e4;
    if (slow) {
      run ??= { from: pts[i - 1].t, to: pts[i].t, km: km[i - 1] };
      run.to = pts[i].t;
    } else close();
  }
  close();
  return out.sort((a, b) => a.from - b.from);
}

/** The time at km (raw km along the points), for a cut you tap on the profile. */
export function timeAtKm(pts = [], at) {
  const km = kmAlong(pts);
  const i = km.findIndex((k) => k >= at);
  return pts[i < 0 ? pts.length - 1 : i]?.t ?? null;
}

/**
 * The parts between the cuts: cuts [{ from, to }] (ms; to = from for a plain cut). Each part keeps the points
 * strictly before the cut's from and starts at its to. → [{ pts }] with 2 points or more.
 */
export function partsOf(pts = [], cuts = []) {
  const cs = [...cuts].filter((c) => Number.isFinite(c?.from)).sort((a, b) => a.from - b.from);
  const out = [];
  let start = pts[0]?.t ?? 0;
  for (const c of [...cs, { from: Infinity, to: Infinity }]) {
    const seg = pts.filter((p) => p.t >= start && p.t <= c.from);
    if (seg.length >= 2 && seg.at(-1).t > seg[0].t) out.push({ pts: seg });
    start = Math.max(c.to ?? c.from, c.from);
  }
  return out;
}

/** The cuts that come from the chosen suggestions: a pause gives one cut, a slow stretch two. */
export function cutsOf(suggestions = [], chosen = new Set(), own = []) {
  const out = [];
  suggestions.forEach((s, i) => {
    if (!chosen.has(i)) return;
    if (s.kind === 'pause') out.push({ from: s.from, to: s.to });
    else out.push({ from: s.from, to: s.from }, { from: s.to, to: s.to });
  });
  for (const t of own) if (Number.isFinite(t)) out.push({ from: t, to: t });
  return out.sort((a, b) => a.from - b.from);
}

/** Each part analysed like an uploaded ride; the name gets «· 1», «· 2» … → ride rows (without trip and answers). */
export function splitRide(pts, cuts, name, file = '') {
  return partsOf(pts, cuts).map((p, i, all) => {
    const r = analysePoints(p.pts, all.length > 1 ? `${name} · ${i + 1}` : name, file);
    return { ...r, id: `${r.id}-p${i + 1}`, splitOf: file || name };
  });
}

/** A part looks like walking (Ø under 7 km/h) → hike, else bike: the first choice of its sport. */
export const sportGuess = (ride) => (ride?.movingH > 0 && ride.km / ride.movingH < 7 ? 'hike' : 'bike');
