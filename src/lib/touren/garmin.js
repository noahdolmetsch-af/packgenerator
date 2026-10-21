/**
 * Analyse wie Garmin Connect (Noah 20.10.2026 «genau so kann es aussehen … baue sie 1:1 nach», 18 screenshots
 * of the Garmin Connect app): the tab «Statistiken» as groups of rows and the numbers of the tab «Diagramme».
 * Only what Strava sends; a row without a value is left out, a group without rows too.
 * Pure functions, tested in tests/garmin-analyse.test.js (not src/lib/garmin.js, the Garmin pages of the bike). Observation only.
 */
import { zoneSecs, powerLoad, pauseSecs } from '../training.js';
import { intensity } from '../training/act/power.js';
import { peakOf, statOf } from './stravaana.js';

const fin = (v) => Number.isFinite(v);
const pos = (v) => (Number.isFinite(v) && v > 0 ? v : null);

/** Down, lowest and highest point of the height series (null without one). */
export function heightOf(ser) {
  const alt = ser?.alt;
  if (!alt) return null;
  let down = 0;
  let lo = null;
  let hi = null;
  let prev = null;
  for (const h of alt) {
    if (!fin(h)) continue;
    if (prev != null && h < prev) down += prev - h;
    lo = lo == null || h < lo ? h : lo;
    hi = hi == null || h > hi ? h : hi;
    prev = h;
  }
  return lo == null ? null : { down: Math.round(down), lo: Math.round(lo), hi: Math.round(hi) };
}

/** Pedal turns: cadence (per minute) × time of each step, while moving. */
export function pedalTurnsOf(ser) {
  if (!ser?.cad) return null;
  let n = 0;
  for (let k = 0; k < ser.n - 1; k++) {
    const c = ser.cad[k];
    const dt = ser.t[k + 1] - ser.t[k];
    if (fin(c) && c > 0 && dt > 0 && dt < 600) n += (c * dt) / 60;
  }
  return n > 0 ? Math.round(n) : null;
}

/**
 * Intensity minutes from the heart rate zones, as Garmin counts them: «Mässig» = zones 2–3, «Hoch» = zones 4–5,
 * counted twice in the sum. Null without heart rate.
 */
export function intensityMinutesOf(a, bounds) {
  const secs = a?.hist && bounds ? zoneSecs(a.hist, bounds) : null;
  if (!secs) return null;
  const mid = Math.round((secs[1] + secs[2]) / 60);
  const high = Math.round((secs[3] + secs[4]) / 60);
  return { mid, high, total: mid + 2 * high };
}

/**
 * The groups of «Statistiken»: [{ key, name, rows: [{ key, label, v, unit, d, kind }] }].
 * kind 'clock' = a duration in seconds, 'dhms' = the same as dd:hh:mm:ss (elapsed time and pauses, Noah 21.10.2026), 'text' = v is already a text; otherwise a number with d decimals.
 * o: { ser (serOf), ftp, kg, bounds }.
 */
export function statsOf(a, { ser = null, ftp = null, kg = null, bounds = null } = {}) {
  if (!a) return [];
  const own = a.own ?? {};
  const km = pos(own.km ?? a.km);
  const moving = pos(own.movingS ?? a.movingS);
  const elapsed = pos(a.elapsedS);
  const np = pos(a.wNorm);
  const load = powerLoad(a, ftp);
  const ifac = intensity(np, ftp);
  const h = heightOf(ser);
  const im = intensityMinutesOf(a, bounds);
  const row = (key, label, v, unit = '', d = 0, kind = 'num') => ({ key, label, v, unit, d, kind });
  const groups = [
    {
      key: 'speed',
      name: 'Speed|gc',
      rows: [
        row('spd', 'Ø speed|gc', km && elapsed ? km / (elapsed / 3600) : null, 'km/h', 1),
        row('spdMoving', 'Ø moving speed', pos(a.spdAvg) ?? (km && moving ? km / (moving / 3600) : null), 'km/h', 1),
        row('spdMax', 'Max. speed|gc', pos(a.spdMax), 'km/h', 1),
      ],
    },
    {
      key: 'time',
      name: 'Timing',
      rows: [
        row('moving', 'Moving time|gc', moving, '', 0, 'clock'),
        row('elapsed', 'Elapsed time', elapsed, '', 0, 'dhms'),
        row('stops', 'Stops|gc', pos(pauseSecs(a)), '', 0, 'dhms'),
      ],
    },
    {
      key: 'hr',
      name: 'Heart rate|gc',
      rows: [row('hrAvg', 'Ø heart rate|gc', pos(a.hrAvg), 'bpm'), row('hrMax', 'Max. heart rate|gc', pos(a.hrMax), 'bpm')],
    },
    {
      key: 'power',
      name: 'Power|gc',
      rows: [
        row('wAvg', 'Ø power|gc', pos(a.wAvg), 'W'),
        row('wMax', 'Max. power|gc', pos(a.wMax), 'W'),
        row('w20', 'Max. Ø power (20 min)', peakOf(a, 1200), 'W'),
        row('np', 'Normalized Power (NP)', np, 'W'),
        row('if', 'Intensity Factor (IF)', ifac, '', 3),
        row('tss', 'Training Stress Score (TSS)', load?.load ?? null, '', 1),
        row('ftp', 'FTP (estimated)', pos(ftp), 'W'),
        row('wkg', 'NP per kg', np && kg ? np / kg : null, 'W/kg', 1),
        row('kj', 'Work', pos(a.kj), 'kJ'),
      ],
    },
    { key: 'food', name: 'Calories|gc', rows: [row('kcal', 'Total calories', pos(a.kcal), 'kcal')] },
    { key: 'cad', name: 'Cadence|gc', rows: [row('cad', 'Ø cadence|gc', pos(a.cad), 'rpm')] },
    {
      key: 'height',
      name: 'Height|gc',
      rows: [
        row('up', 'Total ascent', fin(own.hm ?? a.hm) ? (own.hm ?? a.hm) : null, 'm'),
        row('down', 'Total descent', h?.down ?? null, 'm'),
        row('lo', 'Lowest point|gc', h?.lo ?? null, 'm'),
        row('hi', 'Highest point|gc', h?.hi ?? null, 'm'),
      ],
    },
    {
      key: 'temp',
      name: 'Temperature|gc',
      rows: [row('tempAvg', 'Ø temperature', fin(a.tempAvg) ? a.tempAvg : null, '°C'), row('tempMin', 'Lowest temperature|gc', fin(a.tempMin) ? a.tempMin : null, '°C'), row('tempMax', 'Highest temperature|gc', fin(a.tempMax) ? a.tempMax : null, '°C')],
    },
    { key: 'turns', name: 'Pedal turns', rows: [row('turns', 'Pedal turns in total', pedalTurnsOf(ser), '')] },
    {
      key: 'im',
      name: 'Intensity minutes',
      rows: im ? [row('imMid', 'Moderate|im', im.mid, 'min'), row('imHigh', 'Vigorous|im', im.high, 'min'), row('imTotal', 'Total|im', im.total, 'min')] : [],
    },
  ];
  return groups.map((g) => ({ ...g, rows: g.rows.filter((r) => r.v != null && (r.kind === 'text' || fin(r.v))) })).filter((g) => g.rows.length);
}

/** The charts of «Diagramme», in Garmin's order: those with a series. */
export const CHARTS = [
  { key: 'alt', name: 'Height|gc', unit: 'm', d: 0, lo: 'Minimum', hi: 'Maximum' },
  { key: 'spd', name: 'Speed|gc', unit: 'km/h', d: 1, lo: 'Average', hi: 'Maximum' },
  { key: 'w', name: 'Power|gc', unit: 'W', d: 0, lo: 'Average', hi: 'Maximum' },
  { key: 'hr', name: 'Heart rate|gc', unit: 'bpm', d: 0, lo: 'Average', hi: 'Maximum' },
  { key: 'cad', name: 'Cadence|gc', unit: 'rpm', d: 0, lo: 'Average', hi: 'Maximum' },
  { key: 'temp', name: 'Temperature|gc', unit: '°C', d: 0, lo: 'Average', hi: 'Maximum' },
];

/** The two big numbers of a chart: height min and max, else the mean (by time) and max. */
export function chartHead(ser, key) {
  const v = ser?.[key];
  if (!v) return null;
  if (key === 'alt') {
    const h = heightOf(ser);
    return h ? { lo: h.lo, hi: h.hi } : null;
  }
  const s = statOf(ser, key);
  return s ? { lo: s.avg, hi: s.max } : null;
}

/** Nice axis ticks from lo to hi (about n of them). */
export function ticksOf(lo, hi, n = 5) {
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const a = Math.floor(lo / step) * step;
  const b = Math.ceil(hi / step) * step;
  const out = [];
  for (let x = a; x <= b + step / 1e6; x += step) out.push(Math.round(x * 1000) / 1000);
  return out;
}

/** The heart rate zone (1–5) of a heart rate. */
export const zoneAt = (bpm, bounds) => {
  if (!fin(bpm) || !bounds) return null;
  const i = bounds.findIndex((b) => bpm < b);
  return (i < 0 ? 4 : i) + 1;
};
