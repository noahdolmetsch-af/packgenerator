/**
 * «Erkenntnisse» (Noah 19.10.2026 «4b» + «zusätzlich eine eigene Seite»): what goes together in your own
 * data, said in one plain sentence. The answers of «Wi gaht's?» (sleep felt, battery, mood, satisfaction),
 * the Fitbit days (sleep, resting pulse, active zone minutes, steps), the Strava rides and the meditation.
 *
 * How: for fixed pairs (x → y, the same day or the day after) the days with both values are taken (the last
 * 90 days). From MIN_DAYS on, the rank correlation (Spearman) says whether they go together; from MIN_RHO on
 * it is shown, as «on days with more x, y was … on average, otherwise …» (the days above the median of x
 * against the others). Observation only: going together is not a cause, nothing is a diagnosis.
 * Pure rules: no database, no clock (days 'YYYY-MM-DD').
 *
 * Noah 19.10.2026 «2a 3a 4a und b möglich»: also the weather and daylight of the day (daydata.js, Open-Meteo),
 * the appointments per day (the Google calendar) and every own number question (scale or number) — each own
 * question on by itself and switchable off one by one (setting OWN_OFF_KEY).
 *
 * Noah 23.11.2026 «ja» (Thread «Zusammenhänge nützlicher machen»): every activity of Aktiv (training, sauna, cold water, friends,
 * meditation, habits) is compared with sleep, resting pulse, HRV, battery and mood, the same day and the day after (act:<id>,
 * 1 on a ticked day, 0 on the other known days); cuts are rounded to what a person would say (niceCut); the strongest levers
 * with a tip (leversOf) and what comes soon with a first trend (soonOf) are picked here, the words are in erkenntnisse/words.js.
 */
import { numberOf } from './abfragen.js';

/** The own questions switched off for the insights: a list of ids (settings). */
export const OWN_OFF_KEY = 'insightsOwnOff';

export const WINDOW_DAYS = 90;
export const MIN_DAYS = 14;
export const MIN_RHO = 0.3;
export const CLEAR_RHO = 0.5;
/** An activity of Aktiv needs this many ticked days (and not more than ACT_MAX_SHARE of the known days) to be compared, at most ACT_MAX of them. */
export const ACT_MIN_DAYS = 6;
export const ACT_MAX = 8;
export const ACT_MAX_SHARE = 0.85;
/** Activities are many pairs, so they need more: |rho| from here and at least this many days on each side. */
export const ACT_MIN_RHO = 0.35;
export const ACT_MIN_SIDE = 5;
/** A first trend (not sure yet) needs at least this many days. */
export const EARLY_DAYS = 8;
export const EARLY_RHO = 0.4;
/** The levers shown at the top. */
export const LEVERS = 3;
/** The resting pulse: this many days in a row above the normal (median of 30 days) plus RHR_ABOVE. */
export const RHR_DAYS = 3;
export const RHR_ABOVE = 5;

const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The days from `today - n + 1` to `today`. */
export const lastDays = (today, n) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null);
const round1 = (x) => Math.round(x * 10) / 10;

/** The value of a question per day (the mean when answered more than once). */
function perDay(rows, qid) {
  const acc = {};
  for (const r of rows) {
    if (r?.qid !== qid || !r.day) continue;
    const v = num(typeof r.value === 'string' ? Number(r.value) : r.value);
    if (v == null) continue;
    (acc[r.day] ??= []).push(v);
  }
  return Object.fromEntries(Object.entries(acc).map(([d, l]) => [d, mean(l)]));
}

/**
 * All series, each { day: value }.
 * rows: the history (abdb.js historyQuery: answers, old daily checks, Strava rides as kind 'ride');
 * health: the Fitbit days (healthDays); log: the Aktiv ticks (flowLog). `days`: the days where a missing
 * ride or meditation counts as 0 (only days where the app was used at all).
 * acts: { acts, log } as Analyse counts them (Aktiv ticks plus the Strava sports without a tick), optional.
 */
export function seriesOf({ rows = [], health = [], log = [], days = [], weather = {}, events = {}, own = [], acts = null } = {}) {
  const used = new Set(days);
  const km = {};
  for (const r of rows) if (r?.kind === 'ride' && r.day && num(r.value) != null) km[r.day] = (km[r.day] ?? 0) + r.value;
  const med = {};
  for (const l of log) if (l?.actId === 'meditation' && l.day && num(l.min) != null) med[l.day] = (med[l.day] ?? 0) + l.min;
  const answered = new Set(rows.filter((r) => r?.day && r.kind !== 'ride').map((r) => r.day));
  const zero = (map) => {
    const out = { ...map };
    for (const d of used) if (answered.has(d) && out[d] == null) out[d] = 0;
    return out;
  };
  const h = (k) => Object.fromEntries(health.filter((r) => r?.date).map((r) => [r.date, k === 'sleep' ? num(r.sleep?.asleepMin) != null ? round1(r.sleep.asleepMin / 60) : null : num(r[k])]).filter(([, v]) => v != null));
  return {
    sleepFelt: perDay(rows, 'erholung.schlaf'),
    battery: perDay(rows, 'erholung.akku'),
    mood: perDay(rows, 'spass.stimmung'),
    sat: perDay(rows, 'erreicht.zufrieden'),
    km: zero(km),
    med: zero(med),
    sleepH: h('sleep'),
    rhr: h('restingHr'),
    azm: h('azm'),
    hrv: h('hrvMs'),
    steps: h('steps'),
    ...weatherSeries(weather),
    evts: events && typeof events === 'object' ? Object.fromEntries(Object.entries(events).filter(([, v]) => num(v) != null)) : {},
    ...ownSeries(rows, own),
    ...actSeries(acts, days, new Set([...answered, ...health.filter((r) => r?.date).map((r) => r.date)])),
  };
}

/**
 * One series per activity of Aktiv: 1 on a day with a tick, 0 on the other known days (a day with an answer or a Fitbit row).
 * Only the activities with enough ticked days and not ticked nearly every day (nothing to compare then), the most ticked first.
 * Key `act:<id>`; the name of an activity is the user's text (never through t()).
 */
export function actSeries(acts, days = [], known = new Set()) {
  if (!acts?.log?.length) return {};
  const span = new Set(days);
  const ticked = new Map();
  for (const e of acts.log) if (e?.actId && e.day && span.has(e.day)) (ticked.get(e.actId) ?? ticked.set(e.actId, new Set()).get(e.actId)).add(e.day);
  const knownDays = [...known].filter((d) => span.has(d));
  const paused = new Set((acts.acts ?? []).filter((a) => a?.paused).map((a) => a.id));
  const out = {};
  const picked = [...ticked].filter(([id, set]) => !paused.has(id) && set.size >= ACT_MIN_DAYS && set.size <= Math.max(ACT_MIN_DAYS, ACT_MAX_SHARE * knownDays.length))
    .sort((a, b) => b[1].size - a[1].size || String(a[0]).localeCompare(String(b[0])))
    .slice(0, ACT_MAX);
  for (const [id, set] of picked) {
    const m = {};
    for (const d of knownDays) m[d] = 0;
    for (const d of set) m[d] = 1;
    out[`act:${id}`] = m;
  }
  return out;
}

/** The weather days { day: { tmax, rainMm, sunH, lightH } } as four series. */
function weatherSeries(weather) {
  const out = { sunH: {}, lightH: {}, rainMm: {}, tmax: {} };
  for (const [day, w] of Object.entries(weather ?? {})) for (const k of Object.keys(out)) if (num(w?.[k]) != null) out[k][day] = w[k];
  return out;
}

/** The own questions that count as numbers (scale or number) and are not switched off. */
export function ownNumberQuestions(own = [], off = []) {
  const no = new Set(Array.isArray(off) ? off : []);
  return (own ?? []).filter((q) => q?.id && (q.form?.kind === 'scale' || q.form?.kind === 'number') && !no.has(q.id));
}

/** One series per own question, key `own:<id>` (the mean when answered more than once a day). */
export function ownSeries(rows = [], own = []) {
  const out = {};
  for (const q of own ?? []) {
    if (!q?.id) continue;
    const acc = {};
    for (const r of rows) {
      if (r?.qid !== q.id || !r.day) continue;
      const v = numberOf(q.form, r.value);
      if (num(v) != null) (acc[r.day] ??= []).push(v);
    }
    out[`own:${q.id}`] = Object.fromEntries(Object.entries(acc).map(([d, l]) => [d, mean(l)]));
  }
  return out;
}

/** The pairs of the own questions: each with mood and battery the same day. name: the user's text (never t()). */
export const ownPairs = (own = []) =>
  (own ?? []).flatMap((q) => [
    { id: `own-${q.id}-mood`, x: `own:${q.id}`, y: 'mood', lag: 0, own: q.id, name: q.text ?? q.name ?? '' },
    { id: `own-${q.id}-battery`, x: `own:${q.id}`, y: 'battery', lag: 0, own: q.id, name: q.text ?? q.name ?? '' },
  ]);

/** Cuts a person would say for active zone minutes: the highest one with enough days on both sides is used instead of the median. */
export const AZM_CUTS = [200, 150, 100, 60, 30];
/** At least this many days on each side for a fixed cut. */
export const CUT_SIDE = 5;

/** What an activity is compared with: [y, lag]. The Fitbit night, the felt sleep and the resting pulse of a date come after the day before it. */
const ACT_OUT = [['sleepH', 1], ['sleepFelt', 1], ['rhr', 1], ['hrv', 1], ['battery', 0], ['battery', 1], ['mood', 0], ['mood', 1]];
/** The pairs of the activities in `series` (keys `act:<id>`): against sleep, resting pulse, HRV, battery and mood, the day itself and the day after. */
export const actPairs = (series = {}) =>
  Object.keys(series)
    .filter((k) => k.startsWith('act:'))
    .flatMap((k) =>
      ACT_OUT.filter(([y, lag]) => !(k === 'act:meditation' && y === 'mood' && !lag)) // meditation → mood is a pair of its own (med-mood)
        .map(([y, lag]) => ({ id: `${k.replace(/[^\w]/g, '-')}-${y}-${lag}`, x: k, y, lag, act: true, minRho: ACT_MIN_RHO, minSide: ACT_MIN_SIDE })),
    );

/**
 * The pairs looked at: x on a day, y on the same day (lag 0) or the day after (lag 1).
 * The Fitbit sleep of a date is the night before it, so «active minutes → sleep» looks at the next date.
 */
export const PAIRS = [
  { id: 'sleep-battery', x: 'sleepH', y: 'battery', lag: 0 },
  { id: 'sleepfelt-battery', x: 'sleepFelt', y: 'battery', lag: 0 },
  { id: 'sleep-mood', x: 'sleepH', y: 'mood', lag: 0 },
  { id: 'km-mood', x: 'km', y: 'mood', lag: 0 },
  { id: 'km-sat', x: 'km', y: 'sat', lag: 0 },
  { id: 'med-mood', x: 'med', y: 'mood', lag: 0 },
  { id: 'steps-sat', x: 'steps', y: 'sat', lag: 0 },
  { id: 'rhr-battery', x: 'rhr', y: 'battery', lag: 0 },
  { id: 'azm-rhr', x: 'azm', y: 'rhr', lag: 1, fixedCuts: AZM_CUTS },
  { id: 'azm-sleep', x: 'azm', y: 'sleepH', lag: 1, fixedCuts: AZM_CUTS },
  { id: 'km-rhr', x: 'km', y: 'rhr', lag: 1 },
  // weather and daylight (2a): the day's sun, daylight, rain
  { id: 'sun-mood', x: 'sunH', y: 'mood', lag: 0 },
  { id: 'sun-battery', x: 'sunH', y: 'battery', lag: 0 },
  { id: 'light-mood', x: 'lightH', y: 'mood', lag: 0 },
  { id: 'rain-mood', x: 'rainMm', y: 'mood', lag: 0 },
  // appointments (3a): the day itself, and the night after it (felt sleep and Fitbit sleep are of the next date)
  { id: 'evts-battery', x: 'evts', y: 'battery', lag: 0 },
  { id: 'evts-mood', x: 'evts', y: 'mood', lag: 0 },
  { id: 'evts-sleepfelt', x: 'evts', y: 'sleepFelt', lag: 1 },
  { id: 'evts-sleep', x: 'evts', y: 'sleepH', lag: 1 },
  // patterns after a short night and after a hard day (Noah 23.11.2026): what the night does to the pulse, HRV and moving, what a day full of
  // active zone minutes does to the night after, the next morning and the mood (fixedCuts: «over 200 active zone minutes», not a median)
  { id: 'sleep-rhr', x: 'sleepH', y: 'rhr', lag: 0 },
  { id: 'sleep-hrv', x: 'sleepH', y: 'hrv', lag: 0 },
  { id: 'sleep-azm', x: 'sleepH', y: 'azm', lag: 0 },
  { id: 'sleep-steps', x: 'sleepH', y: 'steps', lag: 0 },
  { id: 'azm-hrv', x: 'azm', y: 'hrv', lag: 1, fixedCuts: AZM_CUTS },
  { id: 'azm-battery', x: 'azm', y: 'battery', lag: 1, fixedCuts: AZM_CUTS },
  { id: 'azm-mood', x: 'azm', y: 'mood', lag: 1, fixedCuts: AZM_CUTS },
  { id: 'azm-sleepfelt', x: 'azm', y: 'sleepFelt', lag: 1, fixedCuts: AZM_CUTS },
];

/** The step a cut is rounded to, so that «more than 9.6 km» says «more than 10 km» and «5.46 h» says «5.5 h». */
const stepOf = (key, v) => {
  if (key === 'sleepH' || key === 'sunH' || key === 'lightH') return 0.5;
  if (key === 'km') return v >= 20 ? 5 : 1;
  if (key === 'steps') return 500;
  if (key === 'med' || key === 'azm') return 5;
  if (key === 'rhr' || key === 'evts' || key === 'rainMm') return 1;
  if (key === 'sleepFelt' || key.startsWith('own:')) return v >= 10 ? 1 : 0.5;
  return 0;
};
/** A cut rounded to its step (the cut itself when the key has none, as for an activity that is only on or off). */
export function niceCut(key, v) {
  const step = stepOf(key, v);
  return step ? Math.round(Math.round(v / step) * step * 100) / 100 : v;
}

/** Ranks with ties shared (1-based). */
function ranks(vals) {
  const idx = vals.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const out = new Array(vals.length);
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const r = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k][1]] = r;
    i = j + 1;
  }
  return out;
}

/** Spearman's rank correlation of two equally long lists, null when one does not vary. */
export function spearman(xs, ys) {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mx = mean(rx);
  const my = mean(ry);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < rx.length; i++) {
    sxy += (rx[i] - mx) * (ry[i] - my);
    sxx += (rx[i] - mx) ** 2;
    syy += (ry[i] - my) ** 2;
  }
  if (!sxx || !syy) return null;
  return sxy / Math.sqrt(sxx * syy);
}

const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * One pair over the given days: { id, x, y, lag, n, rho, ready, shown, clear, cut, hi: { mean, n }, lo: { mean, n } }.
 * ready: enough days; shown: ready and |rho| ≥ MIN_RHO and both groups have days.
 */
export function look(pair, series, days, { minDays = MIN_DAYS, minRho = MIN_RHO } = {}) {
  const X = series[pair.x] ?? {};
  const Y = series[pair.y] ?? {};
  const xs = [];
  const ys = [];
  for (const d of days) {
    const x = X[d];
    const y = Y[pair.lag ? addDays(d, pair.lag) : d];
    if (x == null || y == null) continue;
    xs.push(x);
    ys.push(y);
  }
  const n = xs.length;
  const base = { ...pair, n, rho: null, ready: n >= minDays, shown: false, clear: false, cut: null, hi: null, lo: null, hiVals: [], loVals: [] };
  if (!base.ready) return base;
  const rho = spearman(xs, ys);
  if (rho == null) return base;
  // the split at the median; when no day lies above it (few distinct values, e.g. 1 or 6 appointments),
  // the next lower value splits instead, so «more than» stays true and both groups have days
  let cut = median(xs);
  if (!xs.some((x) => x > cut)) {
    const lower = xs.filter((x) => x < cut);
    if (lower.length) cut = Math.max(...lower);
  }
  // a fixed cut a person would say (over 200 active zone minutes) when enough days lie on both sides
  const fixed = (pair.fixedCuts ?? []).find((c) => xs.filter((x) => x > c).length >= CUT_SIDE && xs.filter((x) => x <= c).length >= CUT_SIDE);
  if (fixed != null) cut = fixed;
  // say what a person would say: round the cut, unless that leaves a side nearly empty
  const rounded = niceCut(pair.x, cut);
  if (rounded !== cut && xs.filter((x) => x > rounded).length >= 3 && xs.filter((x) => x <= rounded).length >= 3) cut = rounded;
  const hiY = ys.filter((_, i) => xs[i] > cut);
  const loY = ys.filter((_, i) => xs[i] <= cut);
  const hi = hiY.length ? { mean: round1(mean(hiY)), n: hiY.length } : null;
  const lo = loY.length ? { mean: round1(mean(loY)), n: loY.length } : null;
  const side = pair.minSide ?? 1;
  const shown = Math.abs(rho) >= (pair.minRho ?? minRho) && !!hi && !!lo && hi.n >= side && lo.n >= side && hi.mean !== lo.mean;
  // hiVals / loVals: the values of y on the days above / not above the cut, for the little picture
  return { ...base, rho: Math.round(rho * 100) / 100, shown, clear: Math.abs(rho) >= CLEAR_RHO, cut: round1(cut), hi, lo, hiVals: hiY.map(round1), loVals: loY.map(round1) };
}

/** All pairs for «today», the strongest first; `shown` ones are the insights, the others wait or show nothing. */
export function insights(series, today, { days = WINDOW_DAYS, own = [], ...opt } = {}) {
  const span = lastDays(today, days);
  const all = [...PAIRS, ...ownPairs(own), ...actPairs(series)].map((p) => look(p, series, span, opt));
  return all.sort((a, b) => Number(b.shown) - Number(a.shown) || Math.abs(b.rho ?? 0) - Math.abs(a.rho ?? 0) || b.n - a.n);
}

/**
 * The resting pulse above the own normal: the last RHR_DAYS days (up to today) each over the median of the 30
 * days before them plus RHR_ABOVE. { normal, last: [values] } or null. Observation only, never a diagnosis.
 */
export function rhrHigh(health = [], today) {
  const by = Object.fromEntries(health.filter((r) => r?.date && num(r.restingHr) != null).map((r) => [r.date, r.restingHr]));
  const recent = lastDays(today, RHR_DAYS);
  if (recent.some((d) => by[d] == null)) return null;
  const before = lastDays(addDays(recent[0], -1), 30).map((d) => by[d]).filter((v) => v != null);
  if (before.length < 7) return null;
  const normal = median(before);
  const last = recent.map((d) => by[d]);
  return last.every((v) => v > normal + RHR_ABOVE) ? { normal: round1(normal), last } : null;
}

/** Higher is better for these (the resting pulse is better lower). */
const BETTER_UP = new Set(['battery', 'mood', 'sat', 'sleepH', 'sleepFelt', 'hrv']);
/** What a person can do today: sleep, bike, meditation, steps, active zone minutes and every activity of Aktiv (weather, appointments and the body's own values are not levers). */
export const isLever = (key) => ['sleepH', 'km', 'med', 'steps', 'azm'].includes(key) || String(key).startsWith('act:');
/** Is the group «more of x» the better one for y? */
const goodWay = (row) => (row.y === 'rhr' ? row.hi.mean < row.lo.mean : BETTER_UP.has(row.y) && row.hi.mean > row.lo.mean);

/**
 * The strongest levers (Noah 23.11.2026 «ja»): the shown insights where more of something you can do goes with a better value
 * (more battery, mood, sleep or HRV, a lower resting pulse), the strongest first and every thing once. gain: the difference of the means.
 */
export function leversOf(rows = [], top = LEVERS) {
  const seen = new Set();
  const out = [];
  const good = rows.filter((r) => r.shown && r.hi && r.lo && isLever(r.x) && goodWay(r)).sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho) || b.n - a.n);
  for (const r of good) {
    if (seen.has(r.x)) continue;
    seen.add(r.x);
    out.push({ ...r, gain: round1(Math.abs(r.hi.mean - r.lo.mean)) });
    if (out.length >= top) break;
  }
  return out;
}

/** From this many days a waiting pair counts as «soon visible». */
export const SOON_FROM = 7;
/**
 * What is still collecting days: `waiting` (all, those with data for the first value, the most days first), `soon` (from SOON_FROM days)
 * and `first`, a first trend of the strongest one that already shows from EARLY_DAYS days on (not sure yet), or null.
 */
export function soonOf(all = [], series = {}, today, days = WINDOW_DAYS) {
  const waiting = all.filter((x) => !x.ready && Object.keys(series[x.x] ?? {}).length).sort((a, b) => b.n - a.n);
  const soon = waiting.filter((x) => x.n >= SOON_FROM);
  const span = lastDays(today, days);
  let first = null;
  for (const w of soon) {
    const r = look({ id: w.id, x: w.x, y: w.y, lag: w.lag }, series, span, { minDays: EARLY_DAYS, minRho: EARLY_RHO });
    if (r.shown && (!first || Math.abs(r.rho) > Math.abs(first.rho))) first = r;
  }
  return { waiting, soon, first };
}

/** The value of the Analyse catalogue a try can measure for y (the keys of ruhig/versuch-wert.js EXP_METRICS), or ''. */
export const expMetricOf = (y) => ({ sleepH: 'sleep', rhr: 'rhr', hrv: 'hrv', battery: 'felt:energy', mood: 'felt:mood', sleepFelt: 'felt:sleep' })[y] ?? '';

/** The feelings you answer yourself: a guess is about one of them, and the other side is something measured. */
const FEELINGS = new Set(['mood', 'battery', 'sat', 'sleepFelt']);
/**
 * A guess to test (Noah 04.11.2026 «Vermutungen testen»): the strongest shown insight of the same day (not the day after)
 * between something measured (x) and one of your feelings (y) whose x today lies above the cut of the sentence («On days with more …»), so that
 * today is a day that fits. series: seriesOf(...), own: the own number questions that count. → the insight row plus `today` (x today) or null.
 */
export function testHint(series, today, { own = [], minRho = MIN_RHO } = {}) {
  for (const row of insights(series, today, { own })) {
    if (!row.shown || row.lag !== 0 || !FEELINGS.has(row.y) || FEELINGS.has(row.x)) continue;
    if (Math.abs(row.rho) < minRho) continue;
    const x = series[row.x]?.[today];
    if (x == null || row.cut == null || !(x > row.cut)) continue;
    return { ...row, today: x };
  }
  return null;
}
