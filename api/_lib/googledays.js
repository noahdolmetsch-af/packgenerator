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
 * - spo2, breath, skinTemp («Körperwerte» 20.10.2026 «1a 2a»): the daily summaries of oxygen saturation
 *   (%), breathing rate (per minute) and the nightly skin temperature (difference to your normal, °C).
 *   Read tolerantly as well (dailyOf + pick).
 * - «Alle Werte» (Noah 27.10.2026 «alle holen, zumindest optional anzeigen»): VO₂max (daily-vo2-max), the
 *   watch's distance (km), floors, climbed metres, weight and body fat (scale or Fitbit app), the lowest and
 *   mean pulse of the day, minutes per pulse zone (light, moderate, vigorous, peak), minutes per activity
 *   level (sitting, light, moderate, very active), the Fitbit workouts of the day, and per hour the steps
 *   and the mean pulse (24 values, local time). Field names from the v4 discovery document.
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

const ZONE = 'Europe/Zurich';
/** Seconds from Google's offset «7200s» (or a number), else null. */
const offsetSec = (o) => {
  const n = typeof o === 'string' ? Number(o.replace(/s$/, '')) : Number(o);
  return o === undefined || o === null || o === '' || !Number.isFinite(n) ? null : n;
};

/**
 * Start or end of a sleep as local day and time: { date: «2026-10-21», time: { hours, minutes } } or null.
 * Google sends either civil times ({ date, time } or «2026-10-21T07:05:00») or only the moment with its
 * offset (Noah 22.10.2026: since 12 Oct the nights came without a civil day, so none was kept).
 */
export function civilOf(interval, side) {
  const i = interval ?? {};
  const c = i[side === 'start' ? 'civilStartTime' : 'civilEndTime'];
  if (c && typeof c === 'object' && isoOf(c.date)) return { date: isoOf(c.date), time: c.time ?? null };
  if (typeof c === 'string' && /^\d{4}-\d{2}-\d{2}/.test(c)) {
    const [h, m] = (c.slice(11, 16) || '00:00').split(':').map(Number);
    return { date: c.slice(0, 10), time: { hours: h || 0, minutes: m || 0 } };
  }
  const at = i[side === 'start' ? 'startTime' : 'endTime'];
  const ms = Date.parse(at ?? '');
  if (!Number.isFinite(ms)) return null;
  const off = offsetSec(i[side === 'start' ? 'startUtcOffset' : 'endUtcOffset']);
  if (off !== null) {
    const d = new Date(ms + off * 1000);
    return { date: d.toISOString().slice(0, 10), time: { hours: d.getUTCHours(), minutes: d.getUTCMinutes() } };
  }
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: { hours: Number(parts.hour), minutes: Number(parts.minute) } };
}
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

/** The roll-up request body for the days from..to (inclusive). all: every source (a scale, the Fitbit app). */
export function rollUpBody(from, to, { all = false } = {}) {
  return {
    range: { start: { date: dateParts(from) }, end: { date: dateParts(nextDay(to)) } },
    windowSizeDays: 1,
    pageSize: MAX_DAYS + 1,
    ...(all ? {} : { dataSourceFamily: 'users/me/dataSourceFamilies/google-wearables' }),
  };
}

/**
 * The hourly roll-up body for the days from..to: windows of one hour on the clock (UTC hours are local
 * hours too, Zurich is a whole hour ahead). It starts two hours early, so local midnight is in; hours
 * outside the days are dropped later.
 */
export function hourBody(from, to) {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCHours(-2);
  return {
    range: { startTime: d.toISOString().replace('.000', ''), endTime: `${nextDay(to)}T00:00:00Z` },
    windowSize: '3600s',
    pageSize: 10000,
    dataSourceFamily: 'users/me/dataSourceFamilies/google-wearables',
  };
}

/** Minutes from Google's duration «5400s» (or a number of seconds), else null. */
export function minutesOf(v) {
  const n = typeof v === 'string' ? Number(v.replace(/s$/, '')) : Number(v);
  return v === undefined || v === null || v === '' || !Number.isFinite(n) ? null : Math.round(n / 60);
}

/** Local day and hour of a moment in Zurich: { date, hour } or null. */
export function localHour(at) {
  const ms = Date.parse(at ?? '');
  if (!Number.isFinite(ms)) return null;
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(ms))
      .map((x) => [x.type, x.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) };
}

/** One Fitbit workout as the app keeps it, or null. */
export function exerciseOf(e) {
  if (!e?.interval) return null;
  const m = e.metricsSummary ?? {};
  const start = civilOf(e.interval, 'start');
  const end = civilOf(e.interval, 'end');
  let min = minutesOf(e.activeDuration);
  if (min === null) {
    const a = Date.parse(e.interval.startTime ?? '');
    const b = Date.parse(e.interval.endTime ?? '');
    if (Number.isFinite(a) && Number.isFinite(b) && b > a) min = Math.round((b - a) / 60000);
  }
  if (!start?.date || min === null) return null;
  const out = { date: start.date, type: String(e.exerciseType ?? 'OTHER').slice(0, 40), name: String(e.displayName ?? '').slice(0, 60), start: hhmm(start.time), end: hhmm(end?.time), min };
  const kcal = num(m.caloriesKcal);
  const mm = num(m.distanceMillimeters);
  const hr = num(m.averageHeartRateBeatsPerMinute);
  const azm = num(m.activeZoneMinutes);
  const steps = num(m.steps);
  const up = num(m.elevationGainMillimeters);
  if (kcal !== null) out.kcal = Math.round(kcal);
  if (mm !== null && mm > 0) out.km = Math.round(mm / 1e4) / 100;
  if (hr !== null && hr > 0) out.hr = Math.round(hr);
  if (azm !== null) out.azm = azm;
  if (steps !== null) out.steps = steps;
  if (up !== null && up > 0) out.hm = Math.round(up / 1000);
  return out;
}

/** The list filters for the daily summaries and the nights that ended in from..to. */
export function listFilter(type, from, to, { clock = false } = {}) {
  const end = nextDay(to);
  const at = clock ? 'T00:00:00' : '';
  if (type === 'sleep') return `sleep.interval.civil_end_time >= "${from}${at}" AND sleep.interval.civil_end_time < "${end}${at}"`;
  if (type === 'exercise') return `exercise.interval.civil_start_time >= "${from}T00:00:00" AND exercise.interval.civil_start_time < "${end}T00:00:00"`;
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
    start: hhmm(civilOf(s.interval, 'start')?.time),
    end: hhmm(civilOf(s.interval, 'end')?.time),
    deepMin: stage('DEEP'),
    remMin: stage('REM'),
    lightMin: stage('LIGHT'),
    efficiency: inBed ? Math.round((asleep / inBed) * 100) : null,
  };
}

/**
 * A daily summary point of any type: its date and the object that holds the values ({ date, v }), or
 * null. Google wraps each type in a field of its own name (dailyOxygenSaturation, …), so the first
 * object with a date counts.
 */
export function dailyOf(p) {
  for (const v of Object.values(p ?? {})) {
    if (v && typeof v === 'object' && v.date) {
      const date = isoOf(v.date);
      if (date) return { date, v };
    }
  }
  return null;
}

/**
 * Builds the day rows from Google's answers.
 * @param {{ steps?: any[], azm?: any[], sleep?: any[], rhr?: any[], hrv?: any[], kcal?: any[], kcalActive?: any[], hr?: any[], spo2?: any[], breath?: any[], skin?: any[], vo2?: any[], dist?: any[], floors?: any[], alt?: any[], kg?: any[], fat?: any[], levels?: any[], zones?: any[], exercise?: any[], stepHours?: any[], hrHours?: any[] }} src
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
    const hr = p?.heartRate ?? p?.heart_rate;
    const v = pick(hr, /max/i);
    if (r && v !== null && v > 0) r.hrMax = Math.round(v);
    const lo = num(hr?.beatsPerMinuteMin);
    const avg = num(hr?.beatsPerMinuteAvg);
    if (r && lo !== null && lo > 0) r.hrMin = Math.round(lo);
    if (r && avg !== null && avg > 0) r.hrAvg = Math.round(avg);
  }
  // «Alle Werte» 27.10.2026: one number per day from the daily roll-ups
  const rolled = (list, k, get) => {
    for (const p of list ?? []) {
      const v = get(p);
      if (v === null || v === undefined) continue;
      const r = row(isoOf(p?.civilStartTime?.date));
      if (r) r[k] = v;
    }
  };
  rolled(src.dist, 'distKm', (p) => {
    const mm = num(p?.distance?.millimetersSum);
    return mm === null ? null : Math.round(mm / 1e4) / 100;
  });
  rolled(src.floors, 'floors', (p) => num(p?.floors?.countSum));
  rolled(src.alt, 'climbM', (p) => {
    const mm = num(p?.altitude?.gainMillimetersSum);
    return mm === null ? null : Math.round(mm / 1000);
  });
  rolled(src.kg, 'fitKg', (p) => {
    const g = num(p?.weight?.weightGramsAvg);
    return g === null || g < 20000 || g > 300000 ? null : Math.round(g / 100) / 10;
  });
  rolled(src.fat, 'bodyFat', (p) => {
    const v = num(p?.bodyFat?.bodyFatPercentageAvg);
    return v === null || v <= 0 || v >= 80 ? null : Math.round(v * 10) / 10;
  });
  const LEVELS = { SEDENTARY: 'sed', LIGHTLY_ACTIVE: 'light', MODERATELY_ACTIVE: 'mod', VERY_ACTIVE: 'very' };
  rolled(src.levels, 'levels', (p) => {
    const out = {};
    for (const x of p?.activityLevel?.activityLevelRollupsByActivityLevelType ?? []) {
      const k = LEVELS[x?.activityLevelType];
      const m = minutesOf(x?.totalDuration);
      if (k && m !== null) out[k] = m;
    }
    return Object.keys(out).length ? out : null;
  });
  const ZONES = { LIGHT: 'light', MODERATE: 'mod', VIGOROUS: 'vig', PEAK: 'peak' };
  rolled(src.zones, 'hrZones', (p) => {
    const out = {};
    for (const x of p?.timeInHeartRateZone?.timeInHeartRateZones ?? []) {
      const k = ZONES[x?.heartRateZone];
      const m = minutesOf(x?.duration);
      if (k && m !== null) out[k] = m;
    }
    return Object.keys(out).length ? out : null;
  });
  // VO₂max: the daily value Fitbit estimates (ml/kg/min) and its level («Cardio-Fitness»)
  for (const p of src.vo2 ?? []) {
    const d = p?.dailyVo2Max;
    const v = num(d?.vo2Max);
    if (v === null || v <= 0 || v > 100) continue;
    const r = row(isoOf(d?.date));
    if (!r) continue;
    r.vo2max = Math.round(v * 10) / 10;
    if (typeof d.cardioFitnessLevel === 'string' && d.cardioFitnessLevel) r.vo2level = d.cardioFitnessLevel.slice(0, 30);
    if (d.estimated) r.vo2est = true;
  }
  // the Fitbit workouts of the day, at most 20, by start
  for (const p of src.exercise ?? []) {
    const e = exerciseOf(p?.exercise);
    const r = e ? row(e.date) : null;
    if (!r) continue;
    const { date: _d, ...one } = e;
    r.exercises = [...(r.exercises ?? []), one].sort((a, b) => String(a.start).localeCompare(String(b.start))).slice(0, 20);
  }
  // per hour: steps and the mean pulse, 24 places per day (null: no value in that hour)
  const hourly = (list, k, get) => {
    for (const p of list ?? []) {
      const at = localHour(p?.startTime);
      const v = get(p);
      if (!at || v === null) continue;
      const r = row(at.date);
      if (!r) continue;
      if (!r[k]) r[k] = Array(24).fill(null);
      r[k][at.hour] = v;
    }
  };
  hourly(src.stepHours, 'stepH', (p) => num(p?.steps?.countSum));
  hourly(src.hrHours, 'hrH', (p) => {
    const v = num(p?.heartRate?.beatsPerMinuteAvg);
    return v === null || v <= 0 ? null : Math.round(v);
  });
  // the field Google documents (health.googleapis.com discovery, v4), else a tolerant pick
  const daily = (list, k, field, re, ok) => {
    for (const p of list ?? []) {
      const d = dailyOf(p);
      const v = d ? (num(d.v[field]) ?? pick(d.v, re)) : null;
      if (v === null || !ok(v)) continue;
      const r = row(d.date);
      if (r) r[k] = Math.round(v * 10) / 10;
    }
  };
  daily(src.spo2, 'spo2', 'averagePercentage', /^average/i, (v) => v >= 70 && v <= 100);
  daily(src.breath, 'breath', 'breathsPerMinute', /breath/i, (v) => v >= 4 && v <= 40);
  // skin temperature: the night against your baseline (nightlyTemperatureCelsius − baselineTemperatureCelsius)
  for (const p of src.skin ?? []) {
    const d = dailyOf(p);
    const night = num(d?.v?.nightlyTemperatureCelsius);
    const base = num(d?.v?.baselineTemperatureCelsius);
    if (night === null || base === null || Math.abs(night - base) > 5) continue;
    const r = row(d.date);
    if (r) r.skinTemp = Math.round((night - base) * 100) / 100;
  }
  // Per wake-up day the main sleep wins; without one, the longest night (naps never count).
  const best = new Map();
  for (const p of src.sleep ?? []) {
    const s = p?.sleep;
    if (!s || s.metadata?.nap) continue;
    const date = civilOf(s.interval, 'end')?.date ?? null;
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
