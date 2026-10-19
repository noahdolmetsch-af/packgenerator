/**
 * «Mehr Inhalt» T2 and T5 (Noah 15.10.2026 «1-5 a»): the pure maths of two analyses on one ride.
 * T2 «Harte Stücke dieser Fahrt»: hard pieces found in the power of the course (prof.pts), measured
 * against the estimated FTP. T5 «Deine Hausrunde über die Zeit»: the rides on the same route
 * (training.js sameRoute) with time, speed, power, heart rate and one efficiency number.
 * Observation only: numbers and one calm sentence, never a rating.
 */
import { sameRoute, speed, powerBounds } from '../../training.js';

/** A piece is hard from this share of the FTP on. */
export const HARD_SHARE = 0.9;
/** A piece lasts at least this long (minutes). */
export const MIN_PIECE = 3;
/** An easier stretch of up to this long (minutes) stays inside a piece; a longer one ends it. */
export const MAX_DIP = 1;

const EPS = 1e-6;
const r2 = (x) => Math.round(x * 100) / 100;

/** The power zone 1–7 of a value in watts (Coggan, from the FTP); null without FTP. */
export function powerZone(w, ftp) {
  const b = powerBounds(ftp);
  if (!b || !Number.isFinite(w)) return null;
  const i = b.findIndex((x) => w <= x);
  return i === -1 ? 7 : i + 1;
}

/**
 * The hard pieces of a ride: at least MIN_PIECE minutes in a row at HARD_SHARE of the FTP or more,
 * with easier stretches of up to MAX_DIP minute inside; a longer easier stretch or a break ends a
 * piece. prof: { pts: [[min, alt, bpm, W]], breaks: [[from, to]] }; the points can be one per
 * minute or closer (each point counts until the next, at most 1.5 steps). → [{ i, from, to, mins,
 * w, hr, zone }] on the course's minute axis (from/to), or [] without power or FTP.
 */
export function hardPieces(prof, ftp) {
  const pts = (prof?.pts ?? []).filter((p) => Array.isArray(p) && Number.isFinite(p[0])).sort((a, b) => a[0] - b[0]);
  if (pts.length < 2 || !(ftp > 0) || !pts.some((p) => p[3] > 0)) return [];
  const gaps = pts.slice(1).map((p, i) => p[0] - pts[i][0]).filter((d) => d > 0).sort((a, b) => a - b);
  if (!gaps.length) return [];
  const step = gaps[Math.floor(gaps.length / 2)];
  const breaks = (prof?.breaks ?? []).filter((b) => Array.isArray(b) && b[1] > b[0]);
  const inBreak = (m) => breaks.some(([a, b]) => m >= a && m < b);
  const next = (i) => (i < pts.length - 1 ? pts[i + 1][0] - pts[i][0] : step);
  const dur = (i) => Math.min(next(i), step * 1.5);
  const limit = HARD_SHARE * ftp;
  const out = [];
  let cur = null; // { i0, i1, dip }

  const close = () => {
    if (!cur) return;
    const { i0, i1 } = cur;
    cur = null;
    let mins = 0, sw = 0, sh = 0, nh = 0;
    for (let i = i0; i <= i1; i++) {
      const d = dur(i);
      mins += d;
      sw += (pts[i][3] > 0 ? pts[i][3] : 0) * d;
      if (pts[i][2] > 0) (sh += pts[i][2] * d), (nh += d);
    }
    if (mins + EPS < MIN_PIECE) return;
    const w = Math.round(sw / mins);
    out.push({ i: out.length, from: pts[i0][0], to: pts[i1][0] + dur(i1), mins: Math.round(mins * 10) / 10, w, hr: nh ? Math.round(sh / nh) : null, zone: powerZone(w, ftp) });
  };

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const brk = inBreak(p[0]);
    const hard = !brk && p[3] >= limit;
    if (hard) {
      if (cur && cur.dip > MAX_DIP + EPS) close();
      if (cur) (cur.i1 = i), (cur.dip = 0);
      else cur = { i0: i, i1: i, dip: 0 };
      // a gap in the points (a stop) ends the piece after this point
      if (next(i) > step * 1.5 + EPS) close();
    } else if (cur) {
      cur.dip += dur(i);
      if (brk || cur.dip > MAX_DIP + EPS || next(i) > step * 1.5 + EPS) close();
    }
  }
  close();
  return out;
}

/** Minutes of the breaks inside [a, b]. */
const breakMins = (breaks, a, b) => (breaks ?? []).reduce((s, [x, y]) => s + Math.max(0, Math.min(b, y) - Math.max(a, x)), 0);

/**
 * The summary of the pieces: the biggest group of about equal length (each at most 25 % plus a
 * quarter minute longer than the shortest of its group). With two or more: { same: true, n, mins,
 * w, zone, pause, ids } («4 × 5 Min in Z4, Ø 262 W, Pause Ø 3 Min»); pause: the mean easier time
 * between them without breaks, in minutes. Otherwise { same: false, n, mins (all together), w }.
 * null without pieces.
 */
export function piecesSummary(pieces, ftp, breaks = []) {
  if (!Array.isArray(pieces) || !pieces.length) return null;
  const byLen = [...pieces].sort((a, b) => a.mins - b.mins);
  let best = [];
  for (let k = 0; k < byLen.length; k++) {
    const g = byLen.slice(k).filter((p) => p.mins <= byLen[k].mins * 1.25 + 0.25 + EPS);
    const total = (x) => x.reduce((s, p) => s + p.mins, 0);
    if (g.length > best.length || (g.length === best.length && total(g) > total(best))) best = g;
  }
  const wMean = (list) => Math.round(list.reduce((s, p) => s + p.w * p.mins, 0) / list.reduce((s, p) => s + p.mins, 0));
  if (best.length < 2) {
    return { same: false, n: pieces.length, mins: Math.round(pieces.reduce((s, p) => s + p.mins, 0)), w: wMean(pieces) };
  }
  const g = [...best].sort((a, b) => a.from - b.from);
  const pauses = g.slice(1).map((p, k) => p.from - g[k].to - breakMins(breaks, g[k].to, p.from));
  const w = wMean(g);
  return {
    same: true,
    n: g.length,
    mins: Math.round(g.reduce((s, p) => s + p.mins, 0) / g.length),
    w,
    zone: powerZone(w, ftp),
    pause: Math.round(pauses.reduce((s, x) => s + x, 0) / pauses.length),
    ids: g.map((p) => p.i),
  };
}

/**
 * «Deine Hausrunde über die Zeit»: the rides on the same route (same name, km within 10 %), from
 * min rides on. eff: watts per heartbeat when this ride has power ('wpb'), else heart rate per km/h
 * ('bpk'). rows: at most max, oldest first, always with this ride (me). dS: this ride's moving time
 * against the mean of the others in seconds (negative = faster); dHr: its heart rate against theirs
 * in beats. → null with fewer than min rides.
 */
export function homeLoop(all, act, { min = 3, max = 8 } = {}) {
  if (!act || !act.name?.trim() || !(act.km > 0)) return null;
  let list = sameRoute(all ?? [], act).list;
  if (!list.some((a) => a.id === act.id)) list = [act, ...list];
  if (list.length < min) return null;
  const power = !!act.wDevice && act.wAvg > 0;
  const row = (a) => {
    const kmh = speed(a);
    const hr = a.hrAvg > 0 ? a.hrAvg : null;
    const w = a.wDevice && a.wAvg > 0 ? a.wAvg : null;
    const eff = power ? (w && hr ? r2(w / hr) : null) : hr && kmh ? r2(hr / kmh) : null;
    return { id: a.id, day: a.day, time: a.time ?? '', s: a.movingS > 0 ? a.movingS : null, kmh, w, hr, eff, me: a.id === act.id };
  };
  const rows = list.map(row).sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));
  let shown = rows.slice(-max);
  if (!shown.some((r) => r.me)) shown = [...shown.slice(1), rows.find((r) => r.me)].sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`));
  const me = rows.find((r) => r.me);
  const others = rows.filter((r) => !r.me);
  const mean = (v) => (v.length ? v.reduce((s, x) => s + x, 0) / v.length : null);
  const sMean = mean(others.map((r) => r.s).filter((x) => x > 0));
  const hrMean = mean(others.map((r) => r.hr).filter((x) => x > 0));
  return {
    power,
    eff: power ? 'wpb' : 'bpk',
    n: rows.length,
    rows: shown,
    dS: me.s && sMean ? Math.round(me.s - sMean) : null,
    dHr: me.hr && hrMean ? Math.round(me.hr - hrMean) : null,
  };
}
