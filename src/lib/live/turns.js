/**
 * Abbiege-Hinweise (Noah «Eine Stimme und ein Pfeil vor jeder Abzweigung der Route, zum Beispiel ‹In 200 m
 * links›»). The route is a GPX line only (no road graph, no street names), so the turns come from the
 * geometry, computed once per route:
 *
 * 1. The line is resampled every STEP_M metres along its km and smoothed (±SMOOTH samples), which removes GPS
 *    jitter and duplicate points.
 * 2. Unwrapped segment headings with prefix sums give the mean heading of any stretch in O(1).
 * 3. At each sample the turn is the heading 20–60 m ahead minus the heading 20–60 m behind; a turn is a
 *    local peak of at least MIN_DEG.
 * 4. A gentle bend of a continuous curve turns the same way further out too: when the heading 60–140 m
 *    ahead/behind turns more than CURVE_EXTRA_DEG beyond the near turn, it is a curve, not a turn.
 * 5. Series: a run of at least SERIES_MIN turns close together (each within DENSE_M of the previous one,
 *    or hairpins ≥ HAIRPIN_DEG within HAIRPIN_GAP_M) becomes one 'bends' entry («5 Kurven auf 1,2 km»),
 *    so a pass road does not talk at every hairpin.
 *
 * Pure, tested in tests/turns.test.js (also 50k points).
 */
export const STEP_M = 10;
export const SMOOTH = 3;
export const MIN_DEG = 35;
export const CURVE_EXTRA_DEG = 25;
export const DENSE_M = 120;
export const HAIRPIN_DEG = 120;
export const HAIRPIN_GAP_M = 300;
export const SERIES_MIN = 3;
/** The two moments of a hint: «In 200 m …» from FAR_M down to SOON_M, «Jetzt …» from NOW_M. */
export const FAR_M = 250;
export const SOON_M = 80;
export const NOW_M = 40;

const RAD = Math.PI / 180;

/** The direction of a turn by its signed angle (positive = right) and whether the line comes back on itself. */
function dirOf(deg, back) {
  const a = Math.abs(deg);
  const side = deg > 0 ? 'right' : 'left';
  if (a >= 160 && back) return 'u-turn';
  if (a > 135) return `sharp-${side}`;
  if (a >= 60) return side;
  return `slight-${side}`;
}

/**
 * The turns of a route line [{ lat, lon, km }] (as lineKm builds it), in km order:
 * [{ km, dir, deg, lat, lon }], dir one of slight-left, left, sharp-left, slight-right, right, sharp-right,
 * u-turn, or 'bends' for a series (then also toKm and n).
 */
export function turnsOf(pts = []) {
  if (!(pts?.length > 1)) return [];
  const endKm = pts.at(-1).km;
  const n = Math.floor((endKm * 1000) / STEP_M) + 1;
  if (n < 30) return [];
  // 1. resample every STEP_M (walking the line once)
  const lat = new Float64Array(n);
  const lon = new Float64Array(n);
  let j = 1;
  for (let i = 0; i < n; i++) {
    const km = (i * STEP_M) / 1000;
    while (j < pts.length - 1 && pts[j].km < km) j++;
    const a = pts[j - 1];
    const b = pts[j];
    const f = b.km > a.km ? Math.min(1, Math.max(0, (km - a.km) / (b.km - a.km))) : 0;
    lat[i] = a.lat + (b.lat - a.lat) * f;
    lon[i] = a.lon + (b.lon - a.lon) * f;
  }
  // smoothing ±SMOOTH samples
  const sl = new Float64Array(n);
  const so = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s1 = 0;
    let s2 = 0;
    let c = 0;
    for (let k = Math.max(0, i - SMOOTH); k <= Math.min(n - 1, i + SMOOTH); k++) {
      s1 += lat[k];
      s2 += lon[k];
      c++;
    }
    sl[i] = s1 / c;
    so[i] = s2 / c;
  }
  // 2. unwrapped heading of segment i (sample i → i+1), prefix sums
  const m = n - 1;
  const pre = new Float64Array(m + 1);
  let prevH = null;
  let unwrap = 0;
  for (let i = 0; i < m; i++) {
    const dx = (so[i + 1] - so[i]) * Math.cos(sl[i] * RAD);
    const dy = sl[i + 1] - sl[i];
    let h = Math.atan2(dx, dy) / RAD;
    if (prevH != null) {
      let d = h - prevH;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      unwrap += d;
    } else unwrap = h;
    prevH = h;
    pre[i + 1] = pre[i] + unwrap;
  }
  /** Mean unwrapped heading of segments [a, b). */
  const mean = (a, b) => {
    a = Math.max(0, Math.min(m - 1, a));
    b = Math.max(a + 1, Math.min(m, b));
    return (pre[b] - pre[a]) / (b - a);
  };
  // 3. near turn per sample
  const near = new Float64Array(n);
  for (let i = 6; i < n - 6; i++) near[i] = mean(i + 2, i + 6) - mean(i - 6, i - 2);
  const metres = (a, b) => {
    const dy = (sl[b] - sl[a]) * RAD * 6371000;
    const dx = (so[b] - so[a]) * RAD * 6371000 * Math.cos(sl[a] * RAD);
    return Math.hypot(dx, dy);
  };
  const raw = [];
  for (let i = 6; i < n - 6; i++) {
    const v = near[i];
    const a = Math.abs(v);
    if (a < MIN_DEG) continue;
    // local peak within ±4 samples (the first of equal ones)
    let peak = true;
    for (let k = Math.max(6, i - 4); k <= Math.min(n - 7, i + 4) && peak; k++) {
      if (k === i) continue;
      const b = Math.abs(near[k]);
      if (b > a || (b === a && k < i)) peak = false;
    }
    if (!peak) continue;
    // 4. continuous curve: the far legs turn clearly more than the near ones
    const far = mean(i + 6, i + 14) - mean(i - 14, i - 6);
    if (Math.sign(far) === Math.sign(v) && Math.abs(far) - a > CURVE_EXTRA_DEG) continue;
    // the middle of a flat peak (a sharp corner keeps the same value for a few samples)
    let e = i;
    while (e + 1 < n - 6 && Math.abs(near[e + 1]) >= a - 1) e++;
    const c = Math.round((i + e) / 2);
    // U-turn: 60 m after the turn the line runs next to where it came from
    let back = false;
    const after = Math.min(n - 1, c + 6);
    for (let k = Math.max(0, c - 12); k < c - 2 && !back; k++) back = metres(k, after) < 12;
    // the angle: the legs 30–80 m away are out of the smoothing (unless another turn is that close)
    const mid = mean(c + 3, c + 8) - mean(c - 8, c - 3);
    const deg = Math.sign(mid) === Math.sign(v) && Math.abs(mid) > a ? mid : v;
    raw.push({ km: Math.round(c * STEP_M) / 1000, deg: Math.round(deg), back, i: c });
  }
  // merge peaks closer than 40 m (keep the bigger one)
  const merged = [];
  for (const r of raw) {
    const last = merged.at(-1);
    if (last && (r.km - last.km) * 1000 < 40 && Math.sign(r.deg) === Math.sign(last.deg)) {
      if (Math.abs(r.deg) > Math.abs(last.deg)) merged[merged.length - 1] = r;
    } else merged.push(r);
  }
  const turns = merged.map((r) => ({
    km: r.km,
    dir: dirOf(r.deg, r.back),
    deg: Math.abs(r.deg),
    lat: Math.round(lat[r.i] * 1e6) / 1e6,
    lon: Math.round(lon[r.i] * 1e6) / 1e6,
  }));
  // 5. series → one 'bends' entry
  const linked = (a, b) => {
    const gap = (b.km - a.km) * 1000;
    return gap <= DENSE_M || (gap <= HAIRPIN_GAP_M && a.deg >= HAIRPIN_DEG && b.deg >= HAIRPIN_DEG);
  };
  const out = [];
  for (let i = 0; i < turns.length; ) {
    let e = i;
    while (e + 1 < turns.length && linked(turns[e], turns[e + 1])) e++;
    if (e - i + 1 >= SERIES_MIN) {
      const first = turns[i];
      out.push({ km: first.km, dir: 'bends', deg: first.deg, lat: first.lat, lon: first.lon, toKm: turns[e].km, n: e - i + 1, first: first.dir });
    } else for (let k = i; k <= e; k++) out.push(turns[k]);
    i = e + 1;
  }
  return out;
}

/** Turns we passed by more than this many metres are behind us. */
const PASSED_M = 15;

/** The next turn ahead of km: { ...turn, distM } or null. turns sorted by km (binary search). */
export function nextTurn(turns = [], km) {
  if (!turns?.length || !Number.isFinite(km)) return null;
  const from = km - PASSED_M / 1000;
  let lo = 0;
  let hi = turns.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (turns[mid].km < from) lo = mid + 1;
    else hi = mid;
  }
  const tn = turns[lo];
  if (!tn) return null;
  return { ...tn, distM: Math.max(0, Math.round((tn.km - km) * 1000)) };
}

/** A distance for speaking: 50 m steps under 300 m, 100 m steps above (at least 50 m). */
export function roundM(m) {
  if (!Number.isFinite(m)) return null;
  if (m < 300) return Math.max(50, Math.round(m / 50) * 50);
  return Math.round(m / 100) * 100;
}

const FAR_KEY = {
  left: 'In {m} m turn left',
  right: 'In {m} m turn right',
  'slight-left': 'In {m} m bear left',
  'slight-right': 'In {m} m bear right',
  'sharp-left': 'In {m} m turn sharp left',
  'sharp-right': 'In {m} m turn sharp right',
  'u-turn': 'In {m} m make a U-turn',
  bends: 'In {m} m: {n} bends over {km} km',
};
const NOW_KEY = {
  left: 'Turn left now',
  right: 'Turn right now',
  'slight-left': 'Bear left now',
  'slight-right': 'Bear right now',
  'sharp-left': 'Turn sharp left now',
  'sharp-right': 'Turn sharp right now',
  'u-turn': 'Make a U-turn now',
  bends: '{n} bends over {km} km',
};
/** Every text key of the hints (for the tests and the German check). */
export const TURN_KEYS = [...Object.values(FAR_KEY), ...Object.values(NOW_KEY)];

const bendKm = (tn) => Math.max(0.1, Math.round((tn.toKm - tn.km) * 10) / 10);

/** The text for the arrow: { key, vars } («In 200 m links abbiegen» or «Jetzt links»). */
export function turnText(turn, distM) {
  if (!turn || !FAR_KEY[turn.dir]) return null;
  const extra = turn.dir === 'bends' ? { n: turn.n, km: bendKm(turn) } : {};
  if (distM <= NOW_M) return { key: NOW_KEY[turn.dir], vars: extra };
  return { key: FAR_KEY[turn.dir], vars: { m: roundM(distM), ...extra } };
}

/**
 * What to say now, or null (like nextSay in live-lib.js): «In 200 m …» once between FAR_M and SOON_M,
 * «Jetzt …» once within NOW_M. said: the ids already spoken. Returns { id, key, vars }.
 */
export function turnSay(turn, distM, said = new Set()) {
  if (!turn || !Number.isFinite(distM) || !FAR_KEY[turn.dir]) return null;
  const base = `turn:${turn.km}`;
  if (distM <= NOW_M) {
    const id = `${base}:now`;
    return said.has(id) ? null : { id, ...turnText(turn, distM) };
  }
  if (distM <= FAR_M && distM > SOON_M) {
    const id = `${base}:far`;
    return said.has(id) ? null : { id, ...turnText(turn, distM) };
  }
  return null;
}
