/**
 * TR5/TR5b «Leistung» on one activity (Noah 14.10.2026 «TR5–TR7 freigegeben»): the pure maths for the
 * power cards, the load, the power curve and the analyses «Mehr aus der Leistung», «Leistungsbereiche
 * als Balken» and «Trittfrequenz verteilt». Observation only: numbers and calm words, no rating.
 */
import { powerBounds, shiftDay, FTP_DAYS } from '../../training.js';

/** The seven power zones (Coggan); English sources for t(). */
export const POWER_ZONE_NAMES = ['Active recovery|pz', 'Endurance|pz', 'Tempo|pz', 'Threshold|pz', 'VO2max|pz', 'Anaerobic|pz', 'Sprint|pz'];

/** The spans of the power curve in seconds, with their axis labels: [span, n, unit]. */
export const CURVE_SPANS = [
  [5, 5, 's'],
  [60, 1, 'min'],
  [300, 5, 'min'],
  [1200, 20, 'min'],
  [3600, 60, 'min'],
];

const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d;

/** A number with a fixed count of decimals in the given locale (0.89, 1.10, 2.6). */
export const fixed = (v, d, loc) => (v == null ? '' : Number(v).toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d }));

/** Has this ride watts from a power meter? */
export const hasMeter = (a) => !!a?.wDevice && (a.wAvg > 0 || a.wNorm > 0 || a.w20 > 0 || !!a.pHist);

/** The watt range of zone i (0–6) from the FTP: { from, to } in watts, from null for Z1, to null for Z7. */
export function powerRange(i, ftp) {
  const b = powerBounds(ftp);
  if (!b) return null;
  return { from: i === 0 ? null : b[i - 1] + 1, to: i === 6 ? null : b[i] };
}

/** Intensity factor NP ÷ FTP, two decimals; null without one of them. */
export const intensity = (np, ftp) => (np > 0 && ftp > 0 ? round(np / ftp, 2) : null);

/** Variability index NP ÷ Ø, two decimals; null without one of them. */
export const variability = (np, avg) => (np > 0 && avg > 0 ? round(np / avg, 2) : null);

/** Base (Z1–Z2) and above threshold (Z5–Z7) in % of the time in the 7 zones; null without time. */
export function pzShares(secs) {
  const sum = secs ? secs.reduce((a, b) => a + b, 0) : 0;
  if (!(sum > 0)) return null;
  return { base: Math.round(((secs[0] + secs[1]) / sum) * 100), over: Math.round(((secs[4] + secs[5] + secs[6]) / sum) * 100) };
}

/**
 * Per curve span, the best watts of all activities (this one too) from 90 days before `day` up to `day`.
 * Returns [[span, W | null]] in CURVE_SPANS order.
 */
export function bestCurve(acts, day, days = FTP_DAYS) {
  const from = shiftDay(day, -days);
  const best = new Map();
  for (const a of acts) {
    if (!a?.day || a.day < from || a.day > day || !Array.isArray(a.pCurve)) continue;
    for (const [span, w] of a.pCurve) if (w > 0 && w > (best.get(span) ?? 0)) best.set(span, w);
  }
  return CURVE_SPANS.map(([span]) => [span, best.get(span) ?? null]);
}

/** The cadence bins (10 rpm) in order, with their share of the time in %: [{ bin, pct }]; null without time. */
export function cadenceShares(cHist) {
  const rows = Object.entries(cHist ?? {})
    .map(([b, s]) => [Number(b), Number(s) || 0])
    .filter(([b, s]) => Number.isFinite(b) && b > 0 && s > 0)
    .sort((x, y) => x[0] - y[0]);
  const sum = rows.reduce((a, [, s]) => a + s, 0);
  if (!(sum > 0)) return null;
  return rows.map(([bin, s]) => ({ bin, pct: Math.round((s / sum) * 100) }));
}

/** The mean cadence from the bins (middle of each bin), rounded; null without time. */
export function cadenceMean(cHist) {
  let s = 0;
  let n = 0;
  for (const [b, v] of Object.entries(cHist ?? {})) if (Number(b) > 0 && v > 0) (s += (Number(b) + 5) * v), (n += v);
  return n > 0 ? Math.round(s / n) : null;
}

/** «meist 80–90»: the two neighbouring bins with the most time together ({ from, to } as bin labels); one bin alone when there is one. */
export function cadenceMain(cHist) {
  const rows = cadenceShares(cHist);
  if (!rows) return null;
  if (rows.length === 1) return { from: rows[0].bin, to: rows[0].bin };
  const secs = new Map(Object.entries(cHist).map(([b, s]) => [Number(b), Number(s) || 0]));
  let best = null;
  for (const { bin } of rows) {
    const sum = (secs.get(bin) ?? 0) + (secs.get(bin + 10) ?? 0);
    if (secs.has(bin + 10) && (!best || sum > best.sum)) best = { from: bin, to: bin + 10, sum };
  }
  if (!best) {
    const top = rows.reduce((a, b) => (b.pct > a.pct ? b : a));
    return { from: top.bin, to: top.bin };
  }
  return { from: best.from, to: best.to };
}

/** The calm words for the intensity factor: English sources for t(), by range. */
export const IF_WORDS = ['well under your threshold', 'under your threshold', 'just under your threshold', 'around your threshold', 'over your threshold'];
export function ifBand(f) {
  if (!(f > 0)) return null;
  return f < 0.75 ? 0 : f < 0.85 ? 1 : f < 0.95 ? 2 : f <= 1.05 ? 3 : 4;
}

/** The calm words for the variability index, by range. */
export const VI_WORDS = ['an even pace', 'a changing pace', 'a strongly changing pace'];
export function viBand(v) {
  if (!(v > 0)) return null;
  return v <= 1.05 ? 0 : v <= 1.2 ? 1 : 2;
}
