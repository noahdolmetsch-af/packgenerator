/**
 * Garmin-Übersicht (Noah 20.10.2026 «Schau: genau so kann es aussehen … baue sie 1:1 nach»): the
 * numbers of Aktiv's overview in the shape of Garmin Connect, from the day table of messwerte.js.
 * - todayActs: the activities of today;
 * - focus: per sport the last 7 days (sum km and time, one bar per day) and the 28 days as dots;
 * - lastWeek: the list «Letzte 7 Tage» (activities per sport with km, mean resting pulse, mean calories);
 * - calories: today's calories, active and at rest;
 * - stats: the sport page (7 days / 4 weeks / 1 year; distance, time, climbing, calories);
 * - hrStats: the heart rate page (resting and highest pulse per day).
 * Pure functions; tests/uebersicht.test.js. Only to look at.
 */
import { addDays } from './health.js';
import { bedMin, cadOf, spdOf, zoneMinOf } from './koerper.js';

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const sum = (xs) => xs.reduce((s, v) => s + (v ?? 0), 0);
const mean = (xs) => {
  const v = xs.filter((x) => fin(x) != null);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null;
};

export const KIND_ORDER = ['bike', 'run', 'hike', 'other'];
/** The values of the sport page, in the order of its tabs. */
export const STAT_KEYS = ['km', 'time', 'hm', 'kcal'];
/** The ranges: 7 days, 4 weeks, 1 year (Garmin «7 Ta. / 4 Wo. / 1 J»). */
export const RANGES = { d7: 7, w4: 28, y1: 365 };

/** The days from..to (both included). */
export function daysOf(from, to) {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** One sport's value of one day: km, time (s), hm (m), kcal, n (activities). */
export function kindDay(row, kind) {
  const acts = (row?.acts ?? []).filter((a) => a.kind === kind);
  let km = sum(acts.map((a) => fin(a.km)));
  let hm = sum(acts.map((a) => fin(a.hm)));
  // the bike counts the rides of the app too (the day table's km and hm minus the other sports)
  if (kind === 'bike' && row) {
    const others = (row.acts ?? []).filter((a) => a.kind !== 'bike');
    km = Math.max(km, (row.km ?? 0) - sum(others.map((a) => fin(a.km))));
    hm = Math.max(hm, (row.hm ?? 0) - sum(others.map((a) => fin(a.hm))));
  }
  return {
    km: Math.round(km * 100) / 100,
    time: sum(acts.map((a) => fin(a.movingS))),
    hm: Math.round(hm),
    kcal: Math.round(sum(acts.map((a) => fin(a.kcal) ?? fin(a.kj)))),
    n: acts.length || (kind === 'bike' && km > 0 ? 1 : 0),
  };
}

/** The sports with an activity in the 28 days up to today, the most active first (ties: bike, run, hike, other). */
export function kindsOf(table, today, days = 28) {
  const n = new Map();
  for (const d of daysOf(addDays(today, -(days - 1)), today)) {
    for (const k of KIND_ORDER) {
      const v = kindDay(table.get(d), k);
      if (v.n) n.set(k, (n.get(k) ?? 0) + v.n);
    }
  }
  return [...n.keys()].sort((a, b) => n.get(b) - n.get(a) || KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b));
}

/**
 * «Im Fokus»: one sport over the last 7 days (today on the right) and the 28 days as dots.
 * → { kind, from, to, km, time, bars: [{ day, km }], dots: [{ day, size 0–3 }] }
 */
export function focus(table, today, kind) {
  const from = addDays(today, -6);
  const bars = daysOf(from, today).map((day) => ({ day, km: kindDay(table.get(day), kind).km, time: kindDay(table.get(day), kind).time }));
  const days28 = daysOf(addDays(today, -27), today).map((day) => ({ day, ...kindDay(table.get(day), kind) }));
  const top = Math.max(1, ...days28.map((d) => d.km || d.time / 1800));
  const dots = days28.map((d) => {
    const v = d.km || d.time / 1800;
    return { day: d.day, size: !d.n ? 0 : v >= top * 0.66 ? 3 : v >= top * 0.33 ? 2 : 1 };
  });
  return { kind, from, to: today, km: Math.round(sum(bars.map((b) => b.km)) * 100) / 100, time: sum(bars.map((b) => b.time)), bars, dots };
}

/** «Letzte 7 Tage»: per sport the count and km, the mean resting pulse and the mean calories of the days. */
export function lastWeek(table, today) {
  const days = daysOf(addDays(today, -6), today);
  const kinds = KIND_ORDER.map((kind) => {
    const v = days.map((d) => kindDay(table.get(d), kind));
    return { kind, n: sum(v.map((x) => x.n)), km: Math.round(sum(v.map((x) => x.km)) * 10) / 10, time: sum(v.map((x) => x.time)) };
  }).filter((k) => k.n);
  const rhr = mean(days.map((d) => table.get(d)?.rhr));
  const kcal = mean(days.map((d) => caloriesOf(table.get(d)).total));
  return { kinds, rhr: rhr == null ? null : Math.round(rhr), kcal: kcal == null ? null : Math.round(kcal) };
}

/**
 * The calories of a day: total and active from Fitbit; without Fitbit the active ones of the Strava
 * activities. rest = total − active. → { total, active, rest, src: 'fitbit' | 'strava' | null }
 */
export function caloriesOf(row) {
  const total = fin(row?.kcal);
  const active = fin(row?.kcalActive) ?? (fin(row?.kcalAct) || null);
  if (total != null) return { total, active, rest: active != null ? Math.max(0, total - active) : null, src: 'fitbit' };
  if (active != null) return { total: null, active, rest: null, src: 'strava' };
  return { total: null, active: null, rest: null, src: null };
}

/** The window of a range: 7 days or 4 weeks end today (minus `back` windows); a year is 12 months. */
export function windowOf(range, today, back = 0) {
  if (range === 'y1') {
    const end = monthStart(today, -12 * back);
    const months = Array.from({ length: 12 }, (_, i) => monthStart(end, i - 11));
    const to = back ? addDays(monthStart(end, 1), -1) : today;
    return { from: months[0], to, months };
  }
  const n = RANGES[range] ?? 7;
  const to = addDays(today, -n * back);
  return { from: addDays(to, -(n - 1)), to };
}
/** The first of the month of `day`, moved by n months. */
export function monthStart(day, n = 0) {
  const [y, m] = day.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
}

/**
 * The sport page: the bars of one value in a range (per day; per month for a year), the total, the
 * daily mean and the activities. → { from, to, bars: [{ key, v }], total, perDay, acts }
 */
export function stats(table, today, kind, key, range = 'd7', back = 0) {
  const w = windowOf(range, today, back);
  const days = daysOf(w.from, w.to);
  const val = (d) => kindDay(table.get(d), kind)[key] ?? 0;
  const bars = w.months
    ? w.months.map((m) => ({ key: m, v: sum(days.filter((d) => d.startsWith(m.slice(0, 7))).map(val)) }))
    : days.map((d) => ({ key: d, v: val(d) }));
  const total = sum(days.map(val));
  const acts = days
    .flatMap((d) => (table.get(d)?.acts ?? []).filter((a) => a.kind === kind))
    .sort((a, b) => `${b.day} ${b.time ?? ''}`.localeCompare(`${a.day} ${a.time ?? ''}`));
  return { from: w.from, to: w.to, bars, total, perDay: days.length ? total / days.length : 0, acts };
}

/**
 * The heart rate page: per day (per month for a year) the resting and the highest pulse, their means
 * and the days with a value, the newest first. → { from, to, points: [{ key, rest, high }], rest, high, days }
 */
export function hrStats(table, today, range = 'd7', back = 0) {
  const w = windowOf(range, today, back);
  const days = daysOf(w.from, w.to);
  const rowOf = (d) => ({ key: d, rest: fin(table.get(d)?.rhr), high: fin(table.get(d)?.hrMax) });
  const per = days.map(rowOf);
  const points = w.months
    ? w.months.map((m) => {
        const inM = per.filter((p) => p.key.startsWith(m.slice(0, 7)));
        const r = mean(inM.map((p) => p.rest));
        const h = mean(inM.map((p) => p.high));
        return { key: m, rest: r == null ? null : Math.round(r), high: h == null ? null : Math.round(h) };
      })
    : per;
  const r = mean(per.map((p) => p.rest));
  const h = mean(per.map((p) => p.high));
  return { from: w.from, to: w.to, points, rest: r == null ? null : Math.round(r), high: h == null ? null : Math.round(h), days: [...per].reverse() };
}

/** The resting pulse of the last days for the small curve of the tile (oldest first, n days). */
export function rhrLine(table, today, n = 14) {
  return daysOf(addDays(today, -(n - 1)), today).map((d) => fin(table.get(d)?.rhr));
}

/** The latest day (up to today, within 7 days) that has value k; → { day, v } or null. */
export function latestOf(table, today, k) {
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const v = fin(table.get(d)?.[k]);
    if (v != null) return { day: d, v };
  }
  return null;
}

/**
 * «Körperwerte» (Noah 20.10.2026 «gewicht, schlafminuten, aktivzonenminuten und weitere», «1-5 alle»,
 * «1a 2a 3a 4a 5a», «1-5a»): the values of the page behind the heart rate tile.
 * line: drawn as a line (else bars); src: where the value comes from; sum: counted values (a total);
 * parts: one line each (felt, blood pressure); stack: stacked bars (sleep phases, zones); entry: you
 * type it in on the page; view: a chart of its own (kilometres of the year, temperature and pulse).
 */
export const BODY_KEYS = [
  { key: 'hr', name: 'Heart rate', unit: 'bpm', line: true, src: 'fitbit' },
  { key: 'hrv', name: 'HRV', unit: 'ms', line: true, src: 'fitbit' },
  { key: 'spo2', name: 'Oxygen', unit: '%', line: true, src: 'fitbit' },
  { key: 'breath', name: 'Breathing rate', unit: '/min', line: true, src: 'fitbit' },
  { key: 'bp', name: 'Blood pressure', unit: 'mmHg', line: true, src: 'own', entry: true, parts: ['sys', 'dia'] },
  { key: 'sleep', name: 'Sleep|metric', unit: 'h', src: 'fitbit' },
  { key: 'stages', name: 'Sleep phases', unit: 'h', src: 'fitbit', stack: ['deep', 'rem', 'light', 'awake'] },
  { key: 'eff', name: 'Sleep efficiency', unit: '%', line: true, src: 'fitbit' },
  { key: 'bed', name: 'Bedtime', unit: '', line: true, src: 'fitbit' },
  { key: 'skin', name: 'Skin temperature', unit: '°C', line: true, src: 'fitbit' },
  { key: 'azm', name: 'Active zone minutes|metric', unit: 'min', src: 'fitbit', sum: true },
  { key: 'steps', name: 'Steps', unit: '', src: 'fitbit', sum: true },
  { key: 'kcal', name: 'Calories', unit: 'kcal', src: 'fitbit', sum: true },
  { key: 'zones', name: 'Pulse zones', unit: 'min', src: 'zones', sum: true, stack: ['z1', 'z2', 'z3', 'z4', 'z5'] },
  { key: 'load', name: 'Load|body', unit: '', src: 'strava', sum: true },
  { key: 'med', name: 'Meditation', unit: 'min', src: 'med', sum: true },
  { key: 'weight', name: 'Weight', unit: 'kg', line: true, src: 'own', entry: true },
  // «Neue Werte sichtbar» (Noah 28.10.2026): VO₂max from Fitbit (Google Health) or Apple Health, healthDays.vo2max
  { key: 'vo2max', name: 'VO2max', unit: 'ml/kg/min', line: true, src: 'health' },
  { key: 'water', name: 'Water|drink', unit: 'l', src: 'own', entry: true, sum: true },
  { key: 'felt', name: 'Felt|body', unit: '', line: true, src: 'check', fixed: [0, 10], parts: ['sleep', 'energy', 'mood'] },
  { key: 'ready', name: 'Readiness', unit: '', line: true, src: 'app', fixed: [0, 100] },
  { key: 'wkg', name: 'Watts per kg', unit: 'W/kg', line: true, src: 'strava' },
  { key: 'cad', name: 'Cadence', unit: 'rpm', line: true, src: 'strava' },
  { key: 'spd', name: 'Speed', unit: 'km/h', line: true, src: 'strava' },
  { key: 'year', name: 'Km this year', unit: 'km', src: 'strava', view: 'year' },
  { key: 'temp', name: 'Temperature and pulse', unit: 'bpm', src: 'temp', view: 'temp' },
];
export const BODY = Object.fromEntries(BODY_KEYS.map((b) => [b.key, b]));
/** The five groups of the page and their tabs, in this order. */
export const BODY_GROUPS = [
  { key: 'heart', name: 'Heart|group', tabs: ['hr', 'hrv', 'spo2', 'breath', 'bp'] },
  { key: 'sleep', name: 'Sleep|group', tabs: ['sleep', 'stages', 'eff', 'bed', 'skin'] },
  { key: 'act', name: 'Activity|group', tabs: ['azm', 'steps', 'kcal', 'zones', 'load', 'med'] },
  { key: 'body', name: 'Body|group', tabs: ['weight', 'vo2max', 'water', 'felt', 'ready'] },
  { key: 'bike', name: 'Bike|group', tabs: ['wkg', 'cad', 'spd', 'year', 'temp'] },
];
/** Every tab, in the order of the groups. */
export const BODY_TABS = BODY_GROUPS.flatMap((g) => g.tabs);
/** The group of a tab (an own value «ab:…» is in «Eigene»). */
export const groupOf = (key) => (isOwnBody(key) ? OWN_BODY_GROUP : (BODY_GROUPS.find((g) => g.tabs.includes(key))?.key ?? 'heart'));

/**
 * «Eigene Körperwerte» (Noah 21.10.2026 «3a»): every own question of «Deine Abfragen» (Ich › Abfragen)
 * that is answered with a number or on the scale 1–10 is an own body value of its own: key «ab:<id>»,
 * its name the typed question (never through t()), its unit the typed one. They form the sixth group
 * «Eigene», only when there is one. Creating, renaming and deleting stays in Ich › Abfragen.
 * own: the own questions (abfragen.js configOf(cfg).own) → [{ key, name, unit, line, src, own, qid, fixed? }].
 */
export const OWN_BODY_GROUP = 'mine';
export const isOwnBody = (key) => typeof key === 'string' && key.startsWith('ab:');
export const ownBodyKeys = (own = []) =>
  own
    .filter((q) => q && (q.form?.kind === 'number' || q.form?.kind === 'scale'))
    .map((q) => ({ key: `ab:${q.id}`, name: q.text, unit: q.form.kind === 'number' ? (q.form.unit ?? '') : '', line: true, src: 'ab', own: true, qid: q.id, ...(q.form.kind === 'scale' ? { fixed: [0, 10] } : {}) }));
/** The groups with «Eigene» at the end when there are own values. */
export const bodyGroupsWith = (ownKeys = []) => (ownKeys.length ? [...BODY_GROUPS, { key: OWN_BODY_GROUP, name: 'Own|body group', tabs: ownKeys.map((k) => k.key), own: true }] : BODY_GROUPS);
/**
 * The day values of the own questions: Map qid → Map day → the mean of that day's answers (numbers only).
 * answers: the rows of abAnswers ({ qid, day, value }).
 */
export function ownBodyDays(answers = [], ownKeys = []) {
  const ids = new Set(ownKeys.map((k) => k.qid));
  const acc = new Map();
  for (const a of answers) {
    if (!ids.has(a?.qid) || typeof a.value !== 'number' || !Number.isFinite(a.value) || typeof a.day !== 'string') continue;
    const m = acc.get(a.qid) ?? new Map();
    const d = m.get(a.day) ?? [0, 0];
    m.set(a.day, [d[0] + a.value, d[1] + 1]);
    acc.set(a.qid, m);
  }
  return new Map([...acc].map(([q, m]) => [q, new Map([...m].map(([d, [s, n]]) => [d, Math.round((s / n) * 100) / 100]))]));
}

/**
 * The sleep phases of a night (minutes) and when it began and ended: { deep, rem, light, awake, start, end }
 * or null without a night.
 */
export function stagesOf(row) {
  const n = row?.night;
  if (!n || fin(n.asleepMin) == null) return null;
  return { deep: fin(n.deepMin), rem: fin(n.remMin), light: fin(n.lightMin), awake: fin(n.awakeMin), start: n.start ?? null, end: n.end ?? null, asleep: n.asleepMin };
}

/**
 * Watts per kg of a day: the mean power of the rides with a power meter, weighted by time, divided by
 * the weight that applied that day (kgOn). null without both.
 */
export function wkgOf(row, kg) {
  if (!(kg > 0)) return null;
  const rides = (row?.acts ?? []).filter((a) => a.wDevice && fin(a.wAvg) > 0 && fin(a.movingS) > 0);
  if (!rides.length) return null;
  const w = sum(rides.map((a) => a.wAvg * a.movingS)) / sum(rides.map((a) => a.movingS));
  return Math.round((w / kg) * 100) / 100;
}

/**
 * One body value of one day: the table's value, the calories of caloriesOf, the weight of the entries.
 * ctx: { ready, load, med, water: Map day → value, checks: Map day → { sleep, energy, mood }, bp: Map
 * day → { sys, dia }, kgOn: (day) → kg, bounds: the pulse zones } for the values the app counts itself
 * or you enter; part: one of a value with parts (felt, bp).
 */
export function bodyOf(table, day, key, weights = new Map(), ctx = {}, part = null) {
  const row = table.get(day);
  if (isOwnBody(key)) return fin(ctx.ab?.get(key.slice(3))?.get(day));
  if (key === 'weight') return fin(weights.get(day));
  if (key === 'stages') return fin(row?.sleep);
  if (key === 'ready' || key === 'load' || key === 'med' || key === 'water') return fin(ctx[key]?.get(day));
  if (key === 'felt') return fin(ctx.checks?.get(day)?.[part ?? 'energy']);
  if (key === 'bp') return fin(ctx.bp?.get(day)?.[part ?? 'sys']);
  if (key === 'wkg') return wkgOf(row, ctx.kgOn?.(day));
  if (key === 'kcal') return caloriesOf(row).total;
  if (key === 'eff') return fin(row?.night?.efficiency);
  if (key === 'bed') return bedMin(row?.night?.start);
  if (key === 'skin') return fin(row?.skinTemp);
  if (key === 'cad') return cadOf(row);
  if (key === 'spd') return spdOf(row);
  if (key === 'zones') {
    const z = ctx.bounds ? zoneMinOf(row, ctx.bounds) : null;
    return z ? sum(z) : null;
  }
  return fin(row?.[key]);
}

/**
 * One body value over a range: per day (per month the mean of its days for a year), the mean of the
 * days with a value, the total for counted values (azm, steps, kcal), the lowest and highest, and the
 * days newest first. weights: Map day → kg (Ich › Gewicht). The heart rate uses hrStats.
 * → { from, to, points: [{ key, v }], mean, total, lo, hi, n, days: [{ key, v }] }
 */
export function bodyStats(table, today, key, range = 'd7', back = 0, weights = new Map(), ctx = {}, part = null) {
  const w = windowOf(range, today, back);
  const per = daysOf(w.from, w.to).map((d) => ({ key: d, v: bodyOf(table, d, key, weights, ctx, part) }));
  const points = w.months
    ? w.months.map((m) => {
        const v = mean(per.filter((p) => p.key.startsWith(m.slice(0, 7))).map((p) => p.v));
        return { key: m, v: v == null ? null : Math.round(v * 10) / 10 };
      })
    : per;
  const vals = per.map((p) => p.v).filter((v) => v != null);
  const m = mean(vals);
  return {
    from: w.from,
    to: w.to,
    points,
    mean: m == null ? null : Math.round(m * 10) / 10,
    total: BODY[key]?.sum && vals.length ? sum(vals) : null,
    lo: vals.length ? Math.min(...vals) : null,
    hi: vals.length ? Math.max(...vals) : null,
    n: vals.length,
    days: [...per].reverse(),
  };
}

/**
 * The stacked bars per day (per month the mean of its days for a year), oldest first: the sleep phases
 * (key 'stages') or the minutes per pulse zone (key 'zones', bounds needed).
 */
export function stackBars(table, today, range = 'd7', back = 0, key = 'stages', bounds = null) {
  const w = windowOf(range, today, back);
  const one = (d) => {
    if (key === 'stages') return stagesOf(table.get(d)) ?? {};
    const z = bounds ? zoneMinOf(table.get(d), bounds) : null;
    return z ? { z1: z[0], z2: z[1], z3: z[2], z4: z[3], z5: z[4], asleep: sum(z) } : {};
  };
  const per = daysOf(w.from, w.to).map((d) => ({ key: d, ...one(d) }));
  if (!w.months) return per;
  return w.months.map((m) => {
    const inM = per.filter((p) => p.key.startsWith(m.slice(0, 7)));
    const avg = (k) => {
      const v = mean(inM.map((p) => p[k]));
      return v == null ? null : Math.round(v);
    };
    return { key: m, ...Object.fromEntries([...BODY[key].stack, 'asleep'].map((k) => [k, avg(k)])) };
  });
}
