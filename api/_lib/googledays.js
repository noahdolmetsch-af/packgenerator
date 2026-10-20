/**
 * Google Health → one row per day, in the same shape as the one-time Fitbit file (Noah 14.10.2026
 * «ich möchte fitbit anbindung sofort»): { date, restingHr, hrvMs, sleep, steps, azm }.
 * Observation only. Pure functions, no fetch: api/_lib/google.js calls Google and passes the answers here.
 *
 * - steps and azm come from the daily roll-up of the Fitbit devices only (google-wearables), so the
 *   phone's step counter is not counted twice. AZM already counts cardio and peak minutes double.
 * - sleep: the main sleep of a night counts to the day you woke up (its civil end date).
 * - restingHr and hrvMs: the daily summary values.
 * - kcal, kcalActive, hrMax («Form und Erholung», Garmin-Übersicht 20.10.2026): the daily roll-ups of
 *   total-calories, active-energy-burned and heart-rate. Read tolerantly (the first number of the
 *   value whose name fits), because Google names the fields per type.
 * A value Google did not send stays out of the row (nothing is invented).
 */

/** At most this many days per request (Google allows 90 per roll-up). */
export const MAX_DAYS = 90;
/** Calories and heart rate roll up at most 14 days per request. */
export const SHORT_DAYS = 14;

/** from..to cut into pieces of at most n days: [[from, to], …]. */
export function chunks(from, to, n = SHORT_DAYS) {
  const out = [];
  for (let a = from; a <= to; ) {
    let b = a;
    for (let i = 1; i < n && b < to; i++) b = nextDay(b);
    out.push([a, b]);
    a = nextDay(b);
  }
  return out;
}

/**
 * The first number in a roll-up value whose field name matches «re» (e.g. /kcal|sum/i), searched one
 * level deep; null when none. Tolerant on purpose: the field names differ per data type.
 */
export function pick(obj, re) {
  if (!obj || typeof obj !== 'object') return null;
  for (const [k, v] of Object.entries(obj)) {
    if (re.test(k) && num(v) !== null) return num(v);
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      for (const [k, w] of Object.entries(v)) if (re.test(k) && num(w) !== null) return num(w);
    }
  }
  return null;
}

const pad = (n) => String(n).padStart(2, '0');
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/** «2026-10-14» from a Google Date { year, month, day }. */
export function isoOf(d) {
  if (!d?.year || !d?.month || !d?.day) return null;
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}
/** «07:05» from a Google TimeOfDay. */
const hhmm = (t) => (t ? `${pad(t.hours ?? 0)}:${pad(t.minutes ?? 0)}` : null);
const num = (v) => (v === undefined || v === null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
const dateParts = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
};

/** The day after «iso» (calendar arithmetic in UTC, no time zone involved). */
export function nextDay(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Checks «from» and «to» (both inclusive, YYYY-MM-DD) and returns how many days they span, or null. */
export function spanDays(from, to) {
  if (!DAY.test(from ?? '') || !DAY.test(to ?? '')) return null;
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
  return Math.round((b - a) / 864e5) + 1;
}

/** The roll-up request body for the days from..to (inclusive). */
export function rollUpBody(from, to) {
  return {
    range: { start: { date: dateParts(from) }, end: { date: dateParts(nextDay(to)) } },
    windowSizeDays: 1,
    pageSize: MAX_DAYS + 1,
    dataSourceFamily: 'users/me/dataSourceFamilies/google-wearables',
  };
}

/** The list filters for the daily summaries and the nights that ended in from..to. */
export function listFilter(type, from, to) {
  const end = nextDay(to);
  if (type === 'sleep') return `sleep.interval.civil_end_time >= "${from}" AND sleep.interval.civil_end_time < "${end}"`;
  const field = type.replaceAll('-', '_');
  return `${field}.date >= "${from}" AND ${field}.date < "${end}"`;
}

/** One night as the app keeps it. */
export function sleepOf(s) {
  const sum = s?.summary ?? {};
  const asleep = num(sum.minutesAsleep);
  if (asleep === null) return null;
  const stage = (type) => num((sum.stagesSummary ?? []).find((x) => x?.type === type)?.minutes);
  const inBed = num(sum.minutesInSleepPeriod);
  return {
    asleepMin: asleep,
    awakeMin: num(sum.minutesAwake),
    start: hhmm(s.interval?.civilStartTime?.time),
    end: hhmm(s.interval?.civilEndTime?.time),
    deepMin: stage('DEEP'),
    remMin: stage('REM'),
    lightMin: stage('LIGHT'),
    efficiency: inBed ? Math.round((asleep / inBed) * 100) : null,
  };
}

/**
 * Builds the day rows from Google's answers.
 * @param {{ steps?: any[], azm?: any[], sleep?: any[], rhr?: any[], hrv?: any[] }} src
 *   steps/azm: rollupDataPoints; sleep/rhr/hrv: dataPoints of the list call
 * @param {string} from first day (inclusive)
 * @param {string} to last day (inclusive)
 */
export function daysFrom(src, from, to) {
  const rows = new Map();
  const row = (date) => {
    if (!date || date < from || date > to) return null;
    if (!rows.has(date)) rows.set(date, { date });
    return rows.get(date);
  };
  for (const p of src.steps ?? []) {
    const r = row(isoOf(p?.civilStartTime?.date));
    const v = num(p?.steps?.countSum);
    if (r && v !== null) r.steps = v;
  }
  for (const p of src.azm ?? []) {
    const r = row(isoOf(p?.civilStartTime?.date));
    const z = p?.activeZoneMinutes;
    if (!r || !z) continue;
    r.azm = (num(z.sumInFatBurnHeartZone) ?? 0) + (num(z.sumInCardioHeartZone) ?? 0) + (num(z.sumInPeakHeartZone) ?? 0);
  }
  for (const p of src.rhr ?? []) {
    const r = row(isoOf(p?.dailyRestingHeartRate?.date));
    const v = num(p?.dailyRestingHeartRate?.beatsPerMinute);
    if (r && v !== null) r.restingHr = v;
  }
  for (const p of src.hrv ?? []) {
    const r = row(isoOf(p?.dailyHeartRateVariability?.date));
    const v = num(p?.dailyHeartRateVariability?.averageHeartRateVariabilityMilliseconds);
    if (r && v !== null) r.hrvMs = Math.round(v * 10) / 10;
  }
  const kcalOf = (p, ...names) => {
    const v = names.map((n) => p?.[n]).find(Boolean);
    return pick(v, /kcal|calor|energy|sum/i);
  };
  for (const p of src.kcal ?? []) {
    const r = row(isoOf(p?.civilStartTime?.date));
    const v = kcalOf(p, 'totalCalories', 'total_calories');
    if (r && v !== null) r.kcal = Math.round(v);
  }
  for (const p of src.kcalActive ?? []) {
    const r = row(isoOf(p?.civilStartTime?.date));
    const v = kcalOf(p, 'activeEnergyBurned', 'active_energy_burned', 'activeCalories');
    if (r && v !== null) r.kcalActive = Math.round(v);
  }
  for (const p of src.hr ?? []) {
    const r = row(isoOf(p?.civilStartTime?.date));
    const v = pick(p?.heartRate ?? p?.heart_rate, /max/i);
    if (r && v !== null && v > 0) r.hrMax = Math.round(v);
  }
  // Per wake-up day the main sleep wins; without one, the longest night (naps never count).
  const best = new Map();
  for (const p of src.sleep ?? []) {
    const s = p?.sleep;
    if (!s || s.metadata?.nap) continue;
    const date = isoOf(s.interval?.civilEndTime?.date);
    const night = sleepOf(s);
    if (!date || !night) continue;
    const old = best.get(date);
    const main = !!s.metadata?.mainSleep;
    if (!old || (main && !old.main) || (main === old.main && night.asleepMin > old.night.asleepMin)) best.set(date, { main, night });
  }
  for (const [date, { night }] of best) {
    const r = row(date);
    if (r) r.sleep = night;
  }
  return [...rows.values()].sort((a, b) => a.date.localeCompare(b.date));
}
