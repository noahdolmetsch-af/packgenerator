/**
 * TR7a/TR7b/TR7f (Noah 14.10.2026 «TR5–TR7 freigegeben»): the pure maths of the analyses on one
 * activity: sections per 5 km with the climb flag and their place in the course, the course scaled to
 * a chart, the grid «Puls mal Leistung», the two halves in one calm sentence, the similar rides and
 * the best values. Observation only: numbers, never a rating.
 */
import { shiftDay, zoneOf } from '../../training.js';

/** Seconds as m:ss (h:mm:ss from one hour). */
export function mss(s) {
  const n = Math.max(0, Math.round(Number(s) || 0));
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const ss = String(n % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

const r1 = (x) => Math.round(x * 10) / 10;

/** A section climbs: more than 3 % on average (hm over its length). */
export const isClimb = (sec) => {
  const km = (sec?.to ?? 0) - (sec?.from ?? 0);
  return km > 0 && Number.isFinite(sec?.hm) && sec.hm / (km * 1000) > 0.03;
};

/** The sections with km/h, the climb flag and their moving minutes [m0, m1]; [] without sections. */
export function sectionRows(secs5) {
  if (!Array.isArray(secs5)) return [];
  let at = 0;
  return secs5
    .filter((x) => x && Number.isFinite(x.from) && Number.isFinite(x.to) && x.to > x.from)
    .map((x) => {
      const s = Number(x.s) || 0;
      const row = { ...x, kmh: s > 0 ? r1((x.to - x.from) / (s / 3600)) : null, climb: isClimb(x), m0: at / 60, m1: (at + s) / 60 };
      at += s;
      return row;
    });
}

/**
 * Moving minutes on the course's minute axis: the breaks [[from, to]] before that point are added, so a
 * section tapped lands on the same stretch of the course.
 */
export function movingToCourse(min, breaks = []) {
  let out = min;
  for (const [a, b] of [...(breaks ?? [])].sort((x, y) => x[0] - y[0])) {
    if (a <= out) out += Math.max(0, b - a);
  }
  return out;
}

/** The course minutes [from, to] of section i, or null. */
export function focusRange(secs5, i, breaks = []) {
  const row = sectionRows(secs5)[i];
  if (!row) return null;
  return [movingToCourse(row.m0, breaks), movingToCourse(row.m1, breaks)];
}

const span = (vals) => {
  const v = vals.filter(Number.isFinite);
  return v.length ? [Math.min(...v), Math.max(...v)] : null;
};

/**
 * The course in pixels for a chart w × h (pad: room left/right/top/bottom). pts: [[min, alt, bpm, W]].
 * Each line on its own range (no y axis): elevation as a filled area in the lower part, heart rate and
 * power over the full height. W = 0 in a break is no line. → null without points.
 */
export function courseChart(prof, w, h, pad = { l: 8, r: 8, t: 14, b: 22 }) {
  const pts = (prof?.pts ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0]));
  if (pts.length < 2 || !(w > 0)) return null;
  const m0 = pts[0][0];
  const m1 = pts.at(-1)[0];
  if (!(m1 > m0)) return null;
  const iw = Math.max(1, w - pad.l - pad.r);
  const ih = Math.max(1, h - pad.t - pad.b);
  const x = (m) => pad.l + ((m - m0) / (m1 - m0)) * iw;
  const yOf = (rng, top, bottom) => (v) => (rng[1] === rng[0] ? (top + bottom) / 2 : bottom - ((v - rng[0]) / (rng[1] - rng[0])) * (bottom - top));
  const base = pad.t + ih;
  const alt = span(pts.map((p) => p[1]));
  const hr = span(pts.map((p) => p[2]));
  const pw = span(pts.map((p) => p[3]).filter((v) => v > 0));
  const f = (v) => Math.round(v * 10) / 10;
  const line = (i, rng, top) => {
    if (!rng) return '';
    const y = yOf(rng, top, base - ih * 0.08);
    let d = '';
    let up = true;
    for (const p of pts) {
      const v = p[i];
      if (!Number.isFinite(v) || (i === 3 && v <= 0)) {
        up = true;
        continue;
      }
      d += `${up ? 'M' : 'L'}${f(x(p[0]))} ${f(y(v))}`;
      up = false;
    }
    return d;
  };
  let area = '';
  if (alt) {
    const y = yOf(alt, pad.t + ih * 0.35, base - 2);
    const a = pts.filter((p) => Number.isFinite(p[1]));
    area = `M${f(x(a[0][0]))} ${base}` + a.map((p) => `L${f(x(p[0]))} ${f(y(p[1]))}`).join('') + `L${f(x(a.at(-1)[0]))} ${base}Z`;
  }
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((q) => {
    const m = Math.round(m0 + q * (m1 - m0));
    return { m, x: f(x(m)) };
  });
  const breaks = (prof?.breaks ?? []).filter((b) => Array.isArray(b) && b[1] > b[0]).map(([a, b]) => ({ x0: f(x(Math.max(a, m0))), x1: f(x(Math.min(b, m1))) }));
  return { m0, m1, x, top: pad.t, base, area, hr: line(2, hr, pad.t), w: line(3, pw, pad.t), ticks, breaks, alt, hrRange: hr, wRange: pw };
}

/** The point nearest a minute. */
export function nearest(pts, min) {
  let best = null;
  for (const p of pts ?? []) if (!best || Math.abs(p[0] - min) < Math.abs(best[0] - min)) best = p;
  return best;
}

/**
 * «Puls mal Leistung»: minutes per heart rate zone (rows Z1–Z5) and power zone (columns Z1–Z7) from hw
 * {'bpm5|W20': s}; the middle of each bin (bpm + 2.5, W + 10) decides. null without hw or bounds.
 */
export function gridCells(hw, hrBounds, pBounds) {
  if (!hw || typeof hw !== 'object' || !Array.isArray(hrBounds) || !Array.isArray(pBounds)) return null;
  const secs = Array.from({ length: 5 }, () => Array(7).fill(0));
  let any = false;
  for (const [k, s] of Object.entries(hw)) {
    const [b, w] = k.split('|').map(Number);
    if (!Number.isFinite(b) || !Number.isFinite(w) || !(s > 0)) continue;
    const pi = pBounds.findIndex((x) => w + 10 <= x);
    secs[zoneOf(b + 2.5, hrBounds)][pi === -1 ? 6 : pi] += s;
    any = true;
  }
  return any ? secs.map((row) => row.map((s) => Math.round(s / 60))) : null;
}

const change = (a, b, same) => {
  if (!(a > 0) || !Number.isFinite(b)) return null;
  const pct = ((b - a) / a) * 100;
  const p = Math.round(Math.abs(pct));
  return Math.abs(pct) < same || p === 0 ? { dir: 'same', p: 0 } : { dir: pct > 0 ? 'more' : 'less', p };
};

/**
 * The two halves: average power, heart rate and watts per beat, and what changed in the second half
 * (hr: below 1 % «the same», power: below 3 % «almost the same»). withPower false (no power meter):
 * heart rate only. null without both halves' heart rate.
 */
export function halvesOf(halves, withPower = true) {
  if (!Array.isArray(halves) || halves.length !== 2 || !halves.every((h) => h && h.hr > 0)) return null;
  const power = withPower && halves.every((h) => h.w > 0);
  const rows = halves.map((h) => ({ s: h.s, hr: h.hr, w: power ? h.w : null, wpb: power ? Math.round((h.w / h.hr) * 100) / 100 : null }));
  return { power, rows, hr: change(rows[0].hr, rows[1].hr, 1), w: power ? change(rows[0].w, rows[1].w, 3) : null };
}

/**
 * «Ähnliche Fahrten»: the other bike rides of the same gear with km and Hm within ±20 %. x: average
 * power (only rides with a power meter) when this ride has power, else km/h; y: average heart rate.
 * null with fewer than min rides.
 */
export function similarRides(all, act, min = 3) {
  if (!act || act.kind !== 'bike' || !(act.km > 0) || !(act.hrAvg > 0)) return null;
  const power = !!act.wDevice && act.wAvg > 0;
  const kmh = (a) => (a.km > 0 && a.movingS > 0 ? r1(a.km / (a.movingS / 3600)) : null);
  const xOf = (a) => (power ? (a.wDevice && a.wAvg > 0 ? a.wAvg : null) : kmh(a));
  const within = (v, ref) => Number.isFinite(v) && Math.abs(v - ref) <= ref * 0.2;
  const useHm = act.hm > 0;
  const pts = (all ?? [])
    .filter((a) => a && a.id !== act.id && a.kind === 'bike' && (a.gearId ?? null) === (act.gearId ?? null) && within(a.km, act.km) && (!useHm || within(a.hm, act.hm)) && a.hrAvg > 0)
    .map((a) => ({ id: a.id, day: a.day, x: xOf(a), y: a.hrAvg }))
    .filter((p) => Number.isFinite(p.x));
  const me = { id: act.id, day: act.day, x: xOf(act), y: act.hrAvg };
  if (pts.length < min || !Number.isFinite(me.x)) return null;
  return {
    power,
    pts,
    me,
    km: [Math.round(act.km * 0.8), Math.round(act.km * 1.2)],
    hm: useHm ? [Math.round(act.hm * 0.8), Math.round(act.hm * 1.2)] : null,
  };
}

/** Round, even steps for an axis from lo to hi (about n of them). */
export function niceTicks(lo, hi, n = 4) {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  if (hi === lo) return [lo];
  const raw = (hi - lo) / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).reduce((a, s) => (Math.abs((hi - lo) / s - n) < Math.abs((hi - lo) / a - n) ? s : a));
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

export const BEST_SPANS = [5, 60, 300, 1200, 3600];
const curveAt = (a, span) => {
  const hit = Array.isArray(a?.pCurve) ? a.pCurve.find((p) => Array.isArray(p) && p[0] === span) : null;
  return hit && hit[1] > 0 ? hit[1] : null;
};

/**
 * «Bestwerte»: per span this ride's best average power, the best of the other rides in the 90 days
 * before its day and in its calendar year up to its day. star: this ride at least as good as the 90 days.
 * null without this ride's curve.
 */
export function bestTable(act, all) {
  if (!act || !Array.isArray(act.pCurve) || !act.pCurve.length) return null;
  const from90 = shiftDay(act.day, -90);
  const fromYear = `${act.day.slice(0, 4)}-01-01`;
  const others = (all ?? []).filter((a) => a && a.id !== act.id && a.day <= act.day && Array.isArray(a.pCurve));
  const best = (from) => (span) => {
    const v = others.filter((a) => a.day >= from).map((a) => curveAt(a, span)).filter((x) => x != null);
    return v.length ? Math.max(...v) : null;
  };
  const b90 = best(from90);
  const by = best(fromYear);
  const rows = BEST_SPANS.map((span) => {
    const me = curveAt(act, span);
    const d90 = b90(span);
    return { span, me, d90, year: by(span), star: me != null && (d90 == null || me >= d90) };
  });
  return rows.some((r) => r.me != null) ? { year: act.day.slice(0, 4), rows } : null;
}
