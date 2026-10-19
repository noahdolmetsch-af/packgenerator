/**
 * Paket O «Verlauf und Fortschritt» (Noah 19.10.2026 12:32 «1b … 2b, wenn nichts eingetragen a»): progress
 * per exercise or activity, in every sport, as part of the block «Verlauf und Fortschritt».
 *
 * - Own measures per sport (Noah sets them up himself, 2b): a name and a unit (kg, reps, sets, minutes, km,
 *   pace, grade, level, count, metres climbed). With none set up, the app suggests some for the sport (2a).
 * - Quick entry: the last values come pre-filled, with + and −.
 * - Per measure: a curve, the best value with a star, a sentence like «Beinpresse +10 kg in 6 Wochen» and
 *   a comparison with the month before.
 * - Strava values come in by themselves (km, minutes, metres climbed of the matching activities).
 *
 * Records (table sportItems, sportsdb.js):
 *   measure { id, sport, kind: 'measure', name, unit, order }
 *   value   { id, sport, kind: 'value', mid, day, v, reps?, sets?, note?, at }
 * Pure functions, tested in tests/sportsprogress.test.js.
 */

/** The units a measure can have (English keys for t(); short is the sign after the number). */
export const UNITS = {
  kg: { name: 'Weight (kg)', short: 'kg', step: 2.5 },
  reps: { name: 'Repetitions', short: 'reps|short', step: 1 },
  sets: { name: 'Sets', short: 'sets|short', step: 1 },
  min: { name: 'Minutes', short: 'min', step: 5 },
  km: { name: 'Kilometres', short: 'km', step: 1 },
  pace: { name: 'Pace (min/km)', short: 'min/km', step: 5, lower: true },
  grade: { name: 'Grade (climbing)', short: '', step: 1 },
  level: { name: 'Level', short: 'level|short', step: 1 },
  count: { name: 'Count', short: '×', step: 1 },
  m: { name: 'Metres climbed', short: 'm', step: 50 },
};
export const UNIT_KEYS = Object.keys(UNITS);

/** The French climbing grades, in order (a grade is stored as its place in this list). */
export const GRADES = ['3', '4a', '4b', '4c', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a', '8a+', '8b', '8b+', '8c', '8c+', '9a'];

/** Is less better (pace: fewer seconds per km)? */
export const lowerBetter = (unit) => !!UNITS[unit]?.lower;

/** The measures the app suggests for a sport (2a: only while none are set up). name: English key for t(). */
const SUGGEST = {
  'act:gym': [
    { name: 'Leg press', unit: 'kg' },
    { name: 'Bench press', unit: 'kg' },
    { name: 'eGym strength level', unit: 'level' },
    { name: 'Sauna rounds after the gym', unit: 'count' },
  ],
  'act:sauna': [{ name: 'Sauna rounds', unit: 'count' }, { name: 'Minutes in the sauna', unit: 'min' }],
  'act:pushups': [{ name: 'Push-ups in one go', unit: 'reps' }],
  'act:run': [{ name: 'Distance', unit: 'km' }, { name: 'Pace', unit: 'pace' }],
  'act:climb': [{ name: 'Hardest route', unit: 'grade' }],
  'act:tennis': [{ name: 'Time on court', unit: 'min' }],
  'act:hockey': [{ name: 'Time on ice', unit: 'min' }],
  'act:yoga': [{ name: 'Minutes', unit: 'min' }],
  'act:stretch': [{ name: 'Minutes', unit: 'min' }],
  'act:meditation': [{ name: 'Minutes', unit: 'min' }],
  'act:spin': [{ name: 'Minutes', unit: 'min' }, { name: 'Distance', unit: 'km' }],
  'trip:downhill': [{ name: 'Runs per bike park day', unit: 'count' }],
  'trip:ski': [{ name: 'Metres climbed', unit: 'm' }],
  'trip:hiking': [{ name: 'Distance', unit: 'km' }, { name: 'Metres climbed', unit: 'm' }],
};
const BIKE = [{ name: 'Distance', unit: 'km' }, { name: 'Metres climbed', unit: 'm' }];
export function suggestMeasures(sportId, measures = []) {
  if (measures.some((m) => m.sport === sportId)) return [];
  if (SUGGEST[sportId]) return SUGGEST[sportId];
  if (/^trip:(cycling|gravel|xc|bikepacking)$/.test(sportId)) return BIKE;
  return [{ name: 'Minutes', unit: 'min' }];
}

/* ---------- reading and writing a value ---------- */

const r2 = (n) => Math.round(n * 100) / 100;
/** «5:30» → 330 seconds per km; a plain number is minutes («5.5» → 330). */
export function parsePace(text) {
  const s = String(text ?? '').trim();
  const m = s.match(/^(\d{1,2})[:.'’](\d{2})$/);
  if (m && Number(m[2]) < 60) return Number(m[1]) * 60 + Number(m[2]);
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n < 60 ? Math.round(n * 60) : null;
}
/** A typed value in its unit → the stored number, or null. */
export function parseValue(text, unit) {
  if (unit === 'pace') return parsePace(text);
  if (unit === 'grade') {
    const i = GRADES.indexOf(String(text ?? '').trim().toLowerCase());
    return i >= 0 ? i : null;
  }
  const s = String(text ?? '').trim().replace(/[\s'’]/g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? r2(n) : null;
}
/** The stored number as text (without the unit): pace «5:30», grade «6a+», else the number. */
export function valueText(v, unit, fmt = (n) => String(n)) {
  if (v == null || !Number.isFinite(v)) return '';
  if (unit === 'pace') return `${Math.floor(v / 60)}:${String(Math.round(v % 60)).padStart(2, '0')}`;
  if (unit === 'grade') return GRADES[Math.max(0, Math.min(GRADES.length - 1, Math.round(v)))];
  return fmt(r2(v));
}
/** + or − one step (dir 1 / −1); never below 0, grades stay in the list. */
export function stepValue(v, unit, dir) {
  const step = UNITS[unit]?.step ?? 1;
  const next = r2((Number(v) || 0) + dir * step);
  if (unit === 'grade') return Math.max(0, Math.min(GRADES.length - 1, next));
  return Math.max(0, next);
}

/* ---------- the history of one measure ---------- */

/** The values of a measure, oldest first (by day, then when they were written). */
export const valuesOf = (entries = [], mid) =>
  entries.filter((e) => e.kind === 'value' && e.mid === mid && Number.isFinite(e.v)).sort((a, b) => a.day.localeCompare(b.day) || String(a.at ?? '').localeCompare(String(b.at ?? '')));

/** The last value (for the pre-filled quick entry), or null. */
export const lastOf = (values) => values.at(-1) ?? null;

/** The best value (the highest, for a pace the lowest), or null. */
export function bestOf(values, unit) {
  let best = null;
  for (const e of values) if (!best || (lowerBetter(unit) ? e.v < best.v : e.v > best.v)) best = e;
  return best;
}

const MS = 864e5;
const dayMs = (d) => Date.parse(`${d}T00:00:00Z`);
export const daysBetween = (a, b) => Math.round((dayMs(b) - dayMs(a)) / MS);
const addDays = (d, n) => new Date(dayMs(d) + n * MS).toISOString().slice(0, 10);

/**
 * The change over the last weeks: the newest value against the first one at most `weeks` weeks before it
 * (else the first ever). → { diff, weeks, better } or null with fewer than two values or no change of day.
 * «Beinpresse +10 kg in 6 Wochen».
 */
export function changeOf(values, unit, weeks = 6) {
  if (values.length < 2) return null;
  const last = values.at(-1);
  const from = addDays(last.day, -weeks * 7);
  const first = values.find((e) => e.day >= from && e.day < last.day) ?? values.find((e) => e.day < last.day);
  if (!first) return null;
  const diff = r2(last.v - first.v);
  const w = Math.max(1, Math.round(daysBetween(first.day, last.day) / 7));
  return { diff, weeks: w, better: diff === 0 ? null : lowerBetter(unit) ? diff < 0 : diff > 0 };
}

/**
 * This month against the month before: the best value of the last 30 days against the 30 days before.
 * → { now, before, diff, better } (now/before null when there is no value in that time).
 */
export function monthCompare(values, unit, today) {
  const pick = (from, to) => bestOf(values.filter((e) => e.day > from && e.day <= to), unit)?.v ?? null;
  const now = pick(addDays(today, -30), today);
  const before = pick(addDays(today, -60), addDays(today, -30));
  const diff = now != null && before != null ? r2(now - before) : null;
  return { now, before, diff, better: diff == null || diff === 0 ? null : lowerBetter(unit) ? diff < 0 : diff > 0 };
}

/**
 * The curve as an SVG path in a w × h box, oldest left. A pace curve is drawn upside down, so up is
 * always better. → { d, dots: [{ x, y, best }] } or null with fewer than two values.
 */
export function curve(values, unit, w = 280, h = 64, pad = 6) {
  if (values.length < 2) return null;
  const vs = values.map((e) => e.v);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const span = hi - lo || 1;
  const first = dayMs(values[0].day);
  const width = dayMs(values.at(-1).day) - first || 1;
  const best = bestOf(values, unit);
  const dots = values.map((e, i) => {
    const x = values.length === 1 ? w / 2 : pad + ((dayMs(e.day) - first) / width) * (w - 2 * pad);
    const share = (e.v - lo) / span;
    const y = pad + (lowerBetter(unit) ? share : 1 - share) * (h - 2 * pad);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, best: e === best, i };
  });
  return { d: dots.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '), dots };
}

/** A new value record (the caller adds id and at). */
export function newValue(measure, { day, v, reps = null, sets = null, note = '' }) {
  const e = { sport: measure.sport, kind: 'value', mid: measure.id, day, v };
  if (Number.isFinite(reps) && reps > 0) e.reps = Math.round(reps);
  if (Number.isFinite(sets) && sets > 0) e.sets = Math.round(sets);
  if (String(note ?? '').trim()) e.note = String(note).trim();
  return e;
}

/* ---------- Strava: values that come by themselves ---------- */

/** The Strava sport types of each sport (training.js keeps every activity with its type). */
export const STRAVA_TYPES = {
  'trip:cycling': ['Ride', 'EBikeRide'],
  'trip:gravel': ['GravelRide'],
  'trip:xc': ['MountainBikeRide', 'EMountainBikeRide'],
  'trip:ski': ['BackcountrySki'],
  'trip:hiking': ['Hike', 'Walk'],
  'act:run': ['Run', 'TrailRun', 'VirtualRun'],
  'act:tennis': ['Tennis'],
  'act:gym': ['WeightTraining', 'Workout'],
  'act:climb': ['RockClimbing'],
  'act:yoga': ['Yoga'],
  'act:spin': ['VirtualRide'],
  'act:hockey': ['IceSkate', 'Hockey'],
};
/** The Strava activities of a sport, oldest first. */
export const stravaOf = (activities = [], sportId) => {
  const types = STRAVA_TYPES[sportId];
  if (!types) return [];
  return activities.filter((a) => types.includes(a.type) && a.day).sort((a, b) => `${a.day} ${a.time ?? ''}`.localeCompare(`${b.day} ${b.time ?? ''}`));
};
/**
 * The automatic measures of a sport from Strava: km, minutes, metres climbed, each with its values like
 * an own measure (id 'strava:km' …), only those with a value. → [{ measure, values }]
 */
export function stravaMeasures(activities, sportId) {
  const list = stravaOf(activities, sportId);
  if (!list.length) return [];
  const rows = [
    { id: 'strava:km', name: 'Distance', unit: 'km', get: (a) => (a.km > 0 ? r2(a.km) : null) },
    { id: 'strava:min', name: 'Minutes', unit: 'min', get: (a) => (a.movingS > 0 ? Math.round(a.movingS / 60) : null) },
    { id: 'strava:m', name: 'Metres climbed', unit: 'm', get: (a) => (a.hm > 0 ? Math.round(a.hm) : null) },
  ];
  return rows
    .map((r) => ({ measure: { id: r.id, sport: sportId, kind: 'measure', name: r.name, unit: r.unit, auto: true }, values: list.map((a) => ({ id: `${r.id}:${a.id}`, kind: 'value', mid: r.id, day: a.day, v: r.get(a), at: a.time ?? '' })).filter((e) => e.v != null) }))
    .filter((r) => r.values.length);
}
