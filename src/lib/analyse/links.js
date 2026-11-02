/**
 * «Was hängt zusammen?» (D5, Noah 27.10.2026 «4a»: mit Versatz und als Liste): one value against another,
 * each point a day, the second value on the same day, the day after (e.g. the night after) or two days
 * later. Pure: days are 'YYYY-MM-DD'. Only an observation: it never says what causes what.
 */
import { addDays } from '../analyse.js';

export const OFFSETS = [0, 1, 2];
/** At least this many days with both values before the app says anything. */
export const MIN_PAIRS = 10;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The days with both values: x on the day, y `offset` days later; keep(day) drops days (the diagram filter). */
export function pairsOf(days, getX, getY, offset = 0, keep = null) {
  const out = [];
  for (const d of days) {
    if (keep && !keep(d)) continue;
    const x = fin(getX(d));
    const y = fin(getY(addDays(d, offset)));
    if (x != null && y != null) out.push({ d, x, y });
  }
  return out;
}

/** Pearson r, the straight line y = a + b·x and the spread of x; null under MIN_PAIRS or without spread. */
export function fitOf(pairs) {
  const n = pairs.length;
  if (n < MIN_PAIRS) return null;
  const mx = pairs.reduce((s, p) => s + p.x, 0) / n;
  const my = pairs.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of pairs) {
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
    sxy += (p.x - mx) * (p.y - my);
  }
  if (!sxx || !syy) return null;
  const b = sxy / sxx;
  return { n, r: sxy / Math.sqrt(sxx * syy), b, a: my - b * mx, sdx: Math.sqrt(sxx / n), mx, my };
}

/** The word for how strong: none, weak, medium, strong (by |r|). */
export function strengthOf(r) {
  const a = Math.abs(r ?? 0);
  return a < 0.1 ? 'none' : a < 0.3 ? 'weak' : a < 0.5 ? 'medium' : 'strong';
}

/** A round step of x near its spread (1, 2, 5, 10, 20, 50 …), for «+18 min sleep per 30 minutes». */
export function niceStep(sd) {
  if (!(sd > 0)) return 1;
  const p = 10 ** Math.floor(Math.log10(sd));
  const m = sd / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

/**
 * The strongest links among the items (each { key, get, group, tick? }), every offset; at most `top`, the
 * strongest first. Left out: a value with itself, and two values of the same group on the same day (sleep
 * and sleep efficiency say the same). An activity (tick) is only ever the first value.
 */
export function strongest(items, days, { keep = null, offsets = OFFSETS, top = 5 } = {}) {
  const out = [];
  // every value read once per day (the reading can be slow), the days after the last one too
  const all = [...days, ...Array.from({ length: Math.max(...offsets, 0) }, (_, i) => addDays(days.at(-1) ?? '', i + 1))];
  const usable = items
    .filter((it) => it.get)
    .map((it) => {
      const m = new Map();
      for (const d of all) {
        const v = fin(it.get(d));
        if (v != null) m.set(d, v);
      }
      return { ...it, get: (d) => m.get(d) ?? null, count: days.filter((d) => m.has(d)).length };
    })
    .filter((it) => it.count >= MIN_PAIRS);
  for (const x of usable) {
    for (const y of usable) {
      if (x.key === y.key || y.tick) continue;
      for (const offset of offsets) {
        if (!offset && x.group && x.group === y.group) continue;
        const fit = fitOf(pairsOf(days, x.get, y.get, offset, keep));
        if (fit && strengthOf(fit.r) !== 'none') out.push({ x: x.key, y: y.key, offset, r: fit.r, n: fit.n });
      }
    }
  }
  out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  // one line per pair of values: its strongest offset
  const seen = new Set();
  return out.filter((l) => {
    const k = [l.x, l.y].sort().join('|');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, top);
}

/**
 * After the days of an activity: the mean of y `offset` days later on days with it and on days without it
 * (D1 «Was auffällt»: «after sauna days your sleep is 24 min longer»). null when either side has under 5 days.
 */
export function afterTicks(days, ticked, getY, offset = 1, keep = null) {
  const on = [];
  const off = [];
  for (const d of days) {
    if (keep && !keep(d)) continue;
    const y = fin(getY(addDays(d, offset)));
    if (y == null) continue;
    (ticked.has(d) ? on : off).push(y);
  }
  if (on.length < 5 || off.length < 5) return null;
  const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const mOff = mean(off);
  return { with: mean(on), without: mOff, diff: mean(on) - mOff, n: on.length, above: on.filter((v) => v > mOff).length };
}
