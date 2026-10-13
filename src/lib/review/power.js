/**
 * SN2x «SN2 extra» (Noah 13.10.2026 «SN2j–SN2k freigegeben», answer 2 «a und b»): the power parts of a
 * trip's Rückblick. With a power meter: NP, Ø and max. power, the time in the power zones Z1–Z7 (Coggan,
 * from the estimated FTP), the power curve, the estimated FTP (best 20 min × 0.95), W/kg and the load
 * (NP ÷ FTP). Without a power meter: Strava's estimate, marked «geschätzt»; the rest is left out with
 * one quiet line. Relative Effort comes from Strava (its suffer score) and is only shown.
 * Observation only: no judgement, no good or bad.
 *
 * SN2x: wire to training.js when the Training PR lands. The helpers below are small stand-ins for the
 * Training PR's own (powerZoneSecs, powerLoad, ftpEstimate, wkg, powerBounds): the same names and shapes,
 * so they can be swapped for the real ones. Pure functions, tested in tests/sn2x.test.js.
 *
 * An activity here has the Training PR's fields: { day, movingS, wAvg, wMax, wDevice, w20, wNorm (NP),
 * effort (Relative Effort), kj } and after loadDetail { pHist (seconds per 10 W), pCurve [[s, W], …] }.
 */

const pos = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null);
const r1 = (v) => Math.round(v * 10) / 10;
const dayOf = (a) => a?.day ?? a?.date ?? null;
const secsOf = (a) => pos(a?.movingS) ?? (pos(a?.movingH) ? a.movingH * 3600 : null);

/** The upper bounds of Z1–Z6 in % of the FTP (Coggan); Z7 is above. */
export const POWER_PCT = [0.55, 0.75, 0.9, 1.05, 1.2, 1.5];
/** The durations of the power curve, in seconds (5 s, 1 min, 5 min, 20 min, 60 min). */
export const CURVE_S = [5, 60, 300, 1200, 3600];
/** How far back the best 20 min count for the estimated FTP (days before the trip's last day). */
export const FTP_DAYS = 90;

// SN2x: wire to training.js when the Training PR lands (powerBounds)
/** The upper watts of Z1–Z6 for an FTP, or null. */
export const powerBounds = (ftp) => (pos(ftp) ? POWER_PCT.map((p) => Math.round(ftp * p)) : null);

/**
 * The bins of a watt histogram: an array (index i = i·10 W … i·10+10 W) or an object { watts: seconds }.
 * → [[watts, seconds]] (the middle of each 10 W bin for an array).
 */
function bins(pHist) {
  if (Array.isArray(pHist)) return pHist.map((s, i) => [i * 10 + 5, Number(s)]);
  if (pHist && typeof pHist === 'object') return Object.entries(pHist).map(([w, s]) => [Number(w), Number(s)]);
  return [];
}

// SN2x: wire to training.js when the Training PR lands (powerZoneSecs)
/** Seconds in Z1–Z7 of a watt histogram, or null (no histogram or no FTP). */
export function powerZoneSecs(pHist, ftp) {
  const b = powerBounds(ftp);
  if (!b) return null;
  const out = [0, 0, 0, 0, 0, 0, 0];
  let any = false;
  for (const [w, s] of bins(pHist)) {
    if (!Number.isFinite(w) || !(s > 0)) continue;
    const z = b.findIndex((top) => w <= top);
    out[z < 0 ? 6 : z] += s;
    any = true;
  }
  return any ? out : null;
}

// SN2x: wire to training.js when the Training PR lands (powerLoad)
/** The load of one activity from NP and FTP (NP ÷ FTP over the moving time, 100 = one hour at FTP), or null. */
export function powerLoad(a, ftp) {
  const np = pos(a?.wNorm);
  const s = secsOf(a);
  if (!np || !s || !pos(ftp) || a?.wDevice !== true) return null;
  const f = np / ftp;
  return Math.round((s / 3600) * f * f * 100);
}

// SN2x: wire to training.js when the Training PR lands (ftpEstimate)
/** The estimated FTP on a day: the best 20 min with a power meter in the FTP_DAYS before it × 0.95, or null. */
export function ftpEstimate(acts = [], today) {
  const from = today ? new Date(Date.parse(`${today}T12:00:00Z`) - FTP_DAYS * 864e5).toISOString().slice(0, 10) : null;
  const w20s = acts.filter((a) => a?.wDevice === true && pos(a.w20) && (!today || (dayOf(a) && dayOf(a) <= today && dayOf(a) >= from))).map((a) => a.w20);
  return w20s.length ? Math.round(Math.max(...w20s) * 0.95) : null;
}

// SN2x: wire to training.js when the Training PR lands (wkg)
/** Watts per kg with one decimal, or null without a weight. */
export const wkg = (w, kg) => (pos(w) && pos(kg) ? r1(w / kg) : null);

/** The best watts per duration of the activities' curves ([[s, W], …]) → [{ s, w }] in CURVE_S order, or null. */
export function curveOf(acts = []) {
  const best = {};
  for (const a of acts) {
    for (const p of Array.isArray(a?.pCurve) ? a.pCurve : []) {
      const [s, w] = Array.isArray(p) ? p : [p?.s, p?.w];
      if (CURVE_S.includes(Number(s)) && pos(w)) best[s] = Math.max(best[s] ?? 0, w);
    }
  }
  const out = CURVE_S.filter((s) => best[s]).map((s) => ({ s, w: Math.round(best[s]) }));
  return out.length >= 2 ? out : null;
}

const weighted = (list, f) => {
  const xs = list.filter((a) => pos(f(a)));
  if (!xs.length) return null;
  const w = (a) => secsOf(a) ?? 1;
  const sum = xs.reduce((s, a) => s + w(a), 0);
  return Math.round(xs.reduce((s, a) => s + f(a) * w(a), 0) / sum);
};

/**
 * The power parts of a trip (or one day of it), or null when no activity has watts.
 * acts: the trip's activities (with detail when loaded); history: all activities (for the FTP);
 * kg: the body weight or null; end: the trip's last day (the FTP is the one of that day).
 * → measured: { measured: true, np, avg, max, w20, zones: [{ z, s, pct }] | null, zoneS, curve, ftp,
 *               load, wkgAvg, wkg20, kg }
 *   estimated: { measured: false, avg, max, wkgAvg, kg }
 */
export function tripPower({ acts = [], history = [], kg = null, end = null } = {}) {
  const ws = acts.filter((a) => pos(a?.wAvg));
  if (!ws.length) return null;
  const measured = ws.every((a) => a.wDevice === true);
  const avg = weighted(ws, (a) => a.wAvg);
  const max = Math.max(...ws.map((a) => Number(a.wMax) || 0)) || null;
  if (!measured) return { measured: false, avg, max, wkgAvg: wkg(avg, kg), kg: pos(kg) };
  const ftp = ftpEstimate(history.length ? history : ws, end ?? ws.map(dayOf).filter(Boolean).sort().at(-1) ?? null);
  let zs = null;
  for (const a of ws) {
    const z = powerZoneSecs(a.pHist, ftp);
    if (z) zs = zs ? zs.map((s, i) => s + z[i]) : z;
  }
  const zoneS = zs ? zs.reduce((s, v) => s + v, 0) : 0;
  const loads = ws.map((a) => powerLoad(a, ftp)).filter((v) => v != null);
  const w20s = ws.filter((a) => pos(a.w20)).map((a) => a.w20);
  const w20 = w20s.length ? Math.max(...w20s) : null;
  return {
    measured: true,
    np: weighted(ws, (a) => a.wNorm),
    avg,
    max,
    w20,
    zones: zs && zoneS ? zs.map((s, i) => ({ z: i + 1, s, pct: Math.round((s / zoneS) * 100) })) : null,
    zoneS,
    curve: curveOf(ws),
    ftp,
    load: loads.length ? loads.reduce((s, v) => s + v, 0) : null,
    wkgAvg: wkg(avg, kg),
    wkg20: wkg(w20, kg),
    kg: pos(kg),
  };
}

/** Relative Effort of activities (Strava's own number, summed over the days), or null. */
export function effortOf(acts = []) {
  const xs = acts.map((a) => pos(a?.effort)).filter((v) => v != null);
  return xs.length ? Math.round(xs.reduce((s, v) => s + v, 0)) : null;
}

/** The load of activities with the FTP of their last day (NP ÷ FTP, measured only), or null. */
export function loadOf(acts = [], history = [], end = null) {
  const ftp = ftpEstimate(history.length ? history : acts, end);
  const xs = acts.map((a) => powerLoad(a, ftp)).filter((v) => v != null);
  return xs.length ? xs.reduce((s, v) => s + v, 0) : null;
}
