/**
 * Paket U2 «Anstiege» (Noah 19.10.2026 «eine eigene Seite, wo jeder der 30 Anstiege einzeln detailliert mit
 * seiner Neigung angeschaut und analysiert werden kann», «2a»): every climb of the route on its own.
 * The climbs follow the rule of climbsOf in race.js (at least minGain up, no more than 40 m down on the
 * way, a new low starts again) but keep the exact km, so a fine profile gives exact numbers.
 * Pure functions, tested in tests/race-climbs.test.js. Labels are English keys for t().
 */
import { climbWhen, rideHoursBetween } from './race.js';

/** Steepness classes of the chart (0–3 / 3–6 / 6–9 / 9–12 / over 12 %). */
export const STEEP = [
  { key: 0, max: 3, name: '0–3 %' },
  { key: 1, max: 6, name: '3–6 %' },
  { key: 2, max: 9, name: '6–9 %' },
  { key: 3, max: 12, name: '9–12 %' },
  { key: 4, max: Infinity, name: 'over 12 %' },
];
export const steepClass = (pct) => STEEP.find((s) => pct < s.max)?.key ?? 4;

/** How hard a climb is (score from climbScore). */
export const LEVELS = [
  { key: 'easy', max: 2, name: 'Easy' },
  { key: 'moderate', max: 4, name: 'Moderate' },
  { key: 'hard', max: 7, name: 'Hard' },
  { key: 'very', max: 11, name: 'Very hard' },
  { key: 'extreme', max: Infinity, name: 'Extreme' },
];
export const levelOf = (score) => LEVELS.find((l) => score < l.max) ?? LEVELS.at(-1);

/** Sorting of the list. */
export const SORTS = [
  { key: 'order', name: 'Along the route|sort' },
  { key: 'gain', name: 'Most metres up' },
  { key: 'steep', name: 'Steepest' },
  { key: 'score', name: 'Hardest' },
];
/** Minimum gain chips (m). */
export const MIN_GAINS = [50, 100, 200, 300, 500];
export const DEFAULT_MIN = 100;

const r1 = (x) => Math.round(x * 10) / 10;
const clean = (profile) => (Array.isArray(profile) ? profile.filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])) : []);

/** The height at km (linear between the profile points; outside: the first or last point). */
export function heightAt(profile, km) {
  const p = clean(profile);
  if (!p.length) return null;
  if (km <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    if (p[i][0] >= km) {
      const [a, ha] = p[i - 1];
      const [b, hb] = p[i];
      return b > a ? ha + ((hb - ha) * (km - a)) / (b - a) : hb;
    }
  }
  return p.at(-1)[1];
}

/** The usual distance between two profile points in km (the median). */
export function stepOf(profile) {
  const p = clean(profile);
  const d = [];
  for (let i = 1; i < p.length; i++) if (p[i][0] > p[i - 1][0]) d.push(p[i][0] - p[i - 1][0]);
  if (!d.length) return null;
  d.sort((a, b) => a - b);
  return d[Math.floor(d.length / 2)];
}
/** Coarser than 200 m between the points: the gradient per 100 m is estimated (interpolated). */
export const COARSE_KM = 0.2;

/** The climbs as raw stretches: [{ fromKm, toKm, low, top }] (exact km, the rule of climbsOf). */
export function climbStretches(profile, minGain = DEFAULT_MIN) {
  const out = [];
  let low = null;
  let high = null;
  const push = () => {
    if (low && high && high.m - low.m >= minGain && high.km > low.km) out.push({ fromKm: low.km, toKm: high.km, low: low.m, top: high.m });
  };
  for (const [km, m] of clean(profile)) {
    if (!low) {
      low = high = { km, m };
      continue;
    }
    if (m > high.m) high = { km, m };
    if (high.m - m > 40 || m < low.m) {
      push();
      low = high = { km, m };
    }
  }
  push();
  return out;
}

/** The gradient per 100 m from a to b km: [{ fromKm, toKm, pct }] (the last piece may be shorter). */
export function gradients(profile, fromKm, toKm, stepKm = 0.1) {
  const out = [];
  const n = Math.max(1, Math.ceil((toKm - fromKm) / stepKm - 1e-9));
  for (let i = 0; i < n; i++) {
    const a = fromKm + i * stepKm;
    const b = Math.min(toKm, a + stepKm);
    if (!(b > a)) break;
    const pct = ((heightAt(profile, b) - heightAt(profile, a)) / ((b - a) * 1000)) * 100;
    out.push({ fromKm: Math.round(a * 1000) / 1000, toKm: Math.round(b * 1000) / 1000, pct: r1(pct) });
  }
  return out;
}

/**
 * How hard a climb is, like the FIETS index of the Dutch cycling magazine: gain² / (length in m × 10),
 * plus (top − 1000) / 1000 when the top is above 1000 m (thinner air, colder). Under 2 is a hill,
 * 4–7 a real pass, 11 and more the hardest Alpine climbs.
 */
export function climbScore(gain, lengthKm, top) {
  if (!(lengthKm > 0) || !(gain > 0)) return 0;
  const s = (gain * gain) / (lengthKm * 1000 * 10) + (top > 1000 ? (top - 1000) / 1000 : 0);
  return Math.round(s * 10) / 10;
}

/** The climbing rate the plan uses (m/h): your «climbMh» times the luggage share, else 650. */
export function climbRateOf(as = {}) {
  const v = (k) => (as?.[k] && typeof as[k] === 'object' && 'value' in as[k] ? as[k].value : as?.[k]);
  const rate = Number(v('climbMh')) || 650;
  const load = Number(v('loadClimbPct')) || 100;
  return Math.round((rate * load) / 100);
}

/** The sector a km lies in (by name), or null. */
export const sectorOf = (sectors = [], km) => (sectors ?? []).find((s) => km >= s.fromKm && km < s.toKm) ?? (sectors ?? []).find((s) => km === s.toKm) ?? null;

/** Water and shops within ±near km of km: { water: [poi], shop: [poi] } sorted by distance (at most 2 each). */
export const NEAR_KM = 3;
export function suppliesNear(pois = [], km, near = NEAR_KM) {
  const close = (pois ?? []).filter((p) => Number.isFinite(Number(p.km)) && Math.abs(Number(p.km) - km) <= near).sort((a, b) => Math.abs(a.km - km) - Math.abs(b.km - km));
  return {
    water: close.filter((p) => p.kind === 'water').slice(0, 2),
    shop: close.filter((p) => p.kind === 'shop' || p.kind === 'food').slice(0, 2),
  };
}

/**
 * All climbs with everything the page shows.
 * In: { route, minGain, plan (etaOf, blocks) | null, as (assumptions), pois, isDark(km, ms) → bool, tempAt(km, ms) → °C | null }.
 * → [{ n, key, fromKm, toKm, lengthKm, gain, low, top, avg, max, maxAt, bars, estimated, score, level,
 *      sector, foot, summit, eta, etaTop, planH, climbH, dark, when }]
 */
export function climbsDetail({ route, minGain = DEFAULT_MIN, plan = null, as = {}, pois = [], isDark = () => false, tempAt = () => null } = {}) {
  const profile = clean(route?.profile);
  const step = stepOf(profile);
  const estimated = step != null && step > COARSE_KM;
  const rate = climbRateOf(as);
  return climbStretches(profile, minGain).map((s, i) => {
    const lengthKm = s.toKm - s.fromKm;
    const gain = Math.round(s.top - s.low);
    const bars = gradients(profile, s.fromKm, s.toKm);
    let max = -Infinity;
    let maxAt = s.fromKm;
    for (const b of bars) if (b.pct > max) (max = b.pct), (maxAt = b.fromKm);
    const score = climbScore(gain, lengthKm, s.top);
    const eta = plan ? plan.etaOf(s.fromKm) : null;
    const etaTop = plan ? plan.etaOf(s.toKm) : null;
    const dark = eta != null ? { foot: !!isDark(s.fromKm, eta), top: !!isDark(s.toKm, etaTop) } : null;
    const temp = eta != null ? tempAt(s.fromKm, eta) : null;
    return {
      n: i + 1,
      key: String(r1(s.fromKm)),
      fromKm: r1(s.fromKm),
      toKm: r1(s.toKm),
      lengthKm: r1(lengthKm),
      gain,
      low: Math.round(s.low),
      top: Math.round(s.top),
      avg: r1((gain / (lengthKm * 1000)) * 100),
      max: r1(max),
      maxAt: r1(maxAt),
      bars,
      estimated,
      score,
      level: levelOf(score).key,
      sector: sectorOf(route?.sectors, s.fromKm)?.name ?? null,
      foot: suppliesNear(pois, s.fromKm),
      summit: suppliesNear(pois, s.toKm),
      eta,
      etaTop,
      planH: plan && eta != null ? Math.round(rideHoursBetween(plan.blocks ?? [], eta, etaTop) * 100) / 100 : null,
      climbH: Math.round((gain / rate) * 100) / 100,
      dark,
      temp,
      when: eta != null ? climbWhen(new Date(eta).getHours(), temp, !!(dark?.foot || dark?.top)) : null,
    };
  });
}

/** The list sorted: 'order' (along the route), 'gain', 'steep' (max per 100 m), 'score'. */
export function sortClimbs(list, by = 'order') {
  const k = { gain: (c) => c.gain, steep: (c) => c.max, score: (c) => c.score }[by];
  return k ? [...list].sort((a, b) => k(b) - k(a) || a.fromKm - b.fromKm) : [...list].sort((a, b) => a.fromKm - b.fromKm);
}

/** The totals: { n, gain, share (of the route's gain, %), steepest, longest, hardest } (climbs or null). */
export function climbTotals(list, routeGain = 0) {
  if (!list.length) return { n: 0, gain: 0, share: null, steepest: null, longest: null, hardest: null };
  const gain = list.reduce((s, c) => s + c.gain, 0);
  const best = (f) => list.reduce((a, c) => (f(c) > f(a) ? c : a), list[0]);
  return {
    n: list.length,
    gain,
    share: routeGain > 0 ? Math.round((gain / routeGain) * 100) : null,
    steepest: best((c) => c.max),
    longest: best((c) => c.lengthKm),
    hardest: best((c) => c.score),
  };
}

/** The mini profile of a climb as an SVG path in a w × h box (0.5 km before and after). */
export function miniPath(profile, fromKm, toKm, w = 300, h = 80, padKm = 0.5) {
  const a = Math.max(0, fromKm - padKm);
  const b = toKm + padKm;
  const n = 60;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const km = a + ((b - a) * i) / n;
    pts.push([km, heightAt(profile, km)]);
  }
  const hs = pts.map((p) => p[1]).filter((x) => x != null);
  if (!hs.length) return { line: '', area: '', lo: 0, hi: 0 };
  const lo = Math.min(...hs);
  const hi = Math.max(...hs);
  const y = (m) => h - 4 - ((m - lo) / Math.max(1, hi - lo)) * (h - 8);
  const x = (km) => ((km - a) / (b - a)) * w;
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)} ${y(p[1]).toFixed(1)}`).join(' ');
  return { line, area: `${line} L${w} ${h} L0 ${h} Z`, lo: Math.round(lo), hi: Math.round(hi), x0: x(fromKm), x1: x(toKm) };
}

/** Parse ?climb=<n> (or ?climb=km<fromKm>) out of a hash. */
export function climbParam(hash = '') {
  const q = String(hash).split('?')[1] ?? '';
  const v = new URLSearchParams(q).get('climb');
  return v == null || v === '' ? null : v;
}
