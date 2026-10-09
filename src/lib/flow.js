/**
 * v0.51.0 «Im Flow – kleiner Start» (Noah, 9.10.2026): activities with rolling goals, three rings
 * (Bewegen, Achtsam, Erholung), seasons per sport and the grid «Ziele × Tage». Pure functions; the
 * records live in the tables flowActs and flowLog (db.js), the page is src/pages/Flow.svelte.
 *
 * Noah's answers: every goal is a rolling window («pro Monat» = the last 30 days, 1a); a season is a
 * set of fixed months per sport, editable (2a); one tap counts the amount of the goal (Liegestütze:
 * 10), the amount can also be typed (3); Yoga is one activity with two sub-goals (4a); each «Pendeln»
 * tap counts as one ride (5a); Sauna is Erholung, fixed (6b).
 *
 * An activity:
 *   { id, name, nameDe?, icon, ring: 'move'|'mind'|'rest', order, perTap, minMin, paused,
 *     goals: [{ id, label?, labelDe?, count, days }],         all year, or the summer goals with a season
 *     season: null | { summer: [months 1-12], winter: [goals] }, the winter goals ([] = rests)
 *     counts: ['commute' | 'trip' | <another activity id>] }   «zählt auch»
 * A log entry: { id, actId, day 'YYYY-MM-DD', at ISO, n (amount), sub? (goal id), min? (minutes), via? 'commute'|'timer' }
 */

export const RINGS = ['move', 'mind', 'rest'];
/** The ring colours are tokens of app.css (no new colours). */
export const RING_COLOUR = { move: 'var(--hi)', mind: 'var(--accent)', rest: 'var(--l3)' };
export const RING_SOFT = { move: 'var(--hi-soft)', mind: 'var(--accent-soft)', rest: 'var(--l3-soft)' };
/** The windows offered in the editor (days). */
export const WINDOWS = [1, 7, 10, 30];
export const SEED_KEY = 'flowSeeded';
export const SUMMER = [4, 5, 6, 7, 8, 9, 10];

/* ---------- days ---------- */
const MS = 864e5;
const toMs = (day) => Date.parse(`${day}T00:00:00Z`);
export const addDays = (day, n) => new Date(toMs(day) + n * MS).toISOString().slice(0, 10);
export const daysBetween = (a, b) => Math.round((toMs(b) - toMs(a)) / MS);
/** The last n days ending with today, oldest first. */
export const lastDays = (today, n) => Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
const monthOf = (day) => Number(day.slice(5, 7));

/* ---------- seeds (Noah's small start) ---------- */
const g = (count, days, extra = {}) => ({ id: 'g', count, days, ...extra });
/** The twelve activities of the small start, all editable on the page. */
export function seedActs() {
  const acts = [
    { id: 'meditation', name: 'Meditation', icon: 'lotus', ring: 'mind', goals: [g(1, 1)], minMin: 10 },
    { id: 'pushups', name: 'Push-ups', nameDe: 'Liegestütze', icon: 'pushup', ring: 'move', perTap: 10, goals: [g(10, 1)] },
    {
      id: 'yoga', name: 'Yoga', icon: 'yoga', ring: 'move', minMin: 30,
      goals: [{ id: 'studio', label: 'Yoga studio', labelDe: 'Yoga Studio', count: 1, days: 7 }, { id: 'home', label: 'At home', labelDe: 'Zuhause', count: 1, days: 7 }],
    },
    { id: 'stretch', name: 'Stretching + mini workout', nameDe: 'Stretching + Mini-Workout', icon: 'stretch', ring: 'move', goals: [g(3, 7)], minMin: 15 },
    { id: 'run', name: 'Running', nameDe: 'Laufen', icon: 'run', ring: 'move', goals: [g(1, 10)] },
    { id: 'tennis', name: 'Tennis', nameDe: 'Tennis spielen', icon: 'tennis', ring: 'move', goals: [g(1, 7)] },
    { id: 'bike', name: 'Cycling outdoors', nameDe: 'Velo draussen', icon: 'bike', ring: 'move', goals: [g(3, 7)], season: { summer: [...SUMMER], winter: [g(1, 7)] }, counts: ['commute', 'trip'] },
    { id: 'hockey', name: 'Ice hockey', nameDe: 'Eishockey', icon: 'hockey', ring: 'move', goals: [], season: { summer: [4, 5, 6, 7, 8, 9], winter: [g(2, 30)] } },
    { id: 'climb', name: 'Climbing', nameDe: 'Klettern', icon: 'climb', ring: 'move', goals: [g(1, 30)] },
    { id: 'gym', name: 'Gym', icon: 'gym', ring: 'move', goals: [], season: { summer: [...SUMMER], winter: [g(1, 7)] } },
    { id: 'spin', name: 'Indoor cycling', nameDe: 'Indoor-Velo', icon: 'spin', ring: 'move', goals: [], season: { summer: [...SUMMER], winter: [g(1, 7)] } },
    { id: 'sauna', name: 'Sauna', icon: 'sauna', ring: 'rest', goals: [g(2, 7)] },
  ];
  return acts.map((a, order) => normAct({ ...a, order }));
}

/** A stored activity made whole (missing fields get their defaults). */
export function normAct(a = {}) {
  const goals = (x) => (Array.isArray(x) ? x : []).map((q, i) => ({ ...q, id: q?.id ?? `g${i}`, count: Math.max(0, Math.round(Number(q?.count) || 0)), days: Math.max(1, Math.round(Number(q?.days) || 7)) }));
  return {
    ...a,
    id: a.id,
    name: String(a.name ?? ''),
    icon: a.icon || 'heart',
    ring: RINGS.includes(a.ring) ? a.ring : 'move',
    order: Number.isFinite(a.order) ? a.order : 0,
    perTap: Math.max(1, Math.round(Number(a.perTap) || 1)),
    minMin: Math.max(0, Math.round(Number(a.minMin) || 0)),
    paused: !!a.paused,
    goals: goals(a.goals),
    season: a.season && Array.isArray(a.season.summer) ? { summer: [...new Set(a.season.summer.map(Number).filter((m) => m >= 1 && m <= 12))].sort((x, y) => x - y), winter: goals(a.season.winter) } : null,
    counts: Array.isArray(a.counts) ? [...new Set(a.counts)] : [],
  };
}

/* ---------- seasons ---------- */
/** 'summer' or 'winter' for an activity with a season, else null. */
export const halfOf = (act, day) => (act?.season ? (act.season.summer.includes(monthOf(day)) ? 'summer' : 'winter') : null);
const goalsOfHalf = (act, half) => (half === 'winter' ? act.season.winter : act.goals);
const live = (goals) => goals.filter((q) => q.count > 0);
/** The goals that count on this day: the season's (summer = act.goals), [] when the activity rests. */
export function activeGoals(act, day) {
  if (!act) return [];
  if (!act.season) return live(act.goals);
  return live(goalsOfHalf(act, halfOf(act, day)));
}
/** First day of the month m after the day's month (YYYY-MM-01), k months on. */
const monthStart = (day, k) => {
  const y = Number(day.slice(0, 4));
  const m = monthOf(day) - 1 + k;
  return `${y + Math.floor(m / 12)}-${String((m % 12) + 1).padStart(2, '0')}-01`;
};
/** The day the activity counts again (first day of the next month with goals), null if never. */
export function restsUntil(act, day) {
  if (activeGoals(act, day).length || !act?.season) return null;
  for (let k = 1; k <= 12; k++) {
    const d = monthStart(day, k);
    if (activeGoals(act, d).length) return d;
  }
  return null;
}
/** The last day of the current half (e.g. «Sommer bis 31. Okt.»), null without a season. */
export function halfEnds(act, day) {
  if (!act?.season) return null;
  const half = halfOf(act, day);
  for (let k = 1; k <= 12; k++) {
    const d = monthStart(day, k);
    if (halfOf(act, d) !== half) return addDays(d, -1);
  }
  return null;
}
/** Since when the current half runs (first day of its first month), null without a season. */
export function halfSince(act, day) {
  if (!act?.season) return null;
  const half = halfOf(act, day);
  let d = monthStart(day, 0);
  for (let k = 0; k < 12; k++) {
    const prev = monthStart(d, -1);
    if (halfOf(act, prev) !== half) return d;
    d = prev;
  }
  return d;
}

/* ---------- entries that count for an activity ---------- */
/** Trip days (YYYY-MM-DD) of trips that are not skipped, up to today. */
export function tripDays(trips = [], today) {
  const out = [];
  for (const tr of trips) {
    if (!tr?.startDate || tr.skipped) continue;
    const n = Math.max(1, Number(tr.days) || 1);
    for (let i = 0; i < n; i++) {
      const d = addDays(tr.startDate.slice(0, 10), i);
      if (d <= today) out.push(d);
    }
  }
  return out;
}
/**
 * The entries that count for an activity: its own, those of the activities in «zählt auch», and one
 * per trip day when 'trip' is in counts (a commute is the activity's own entry with via 'commute').
 */
export function entriesFor(act, log = [], tripDayList = []) {
  const ids = new Set([act.id, ...act.counts.filter((c) => c !== 'commute' && c !== 'trip')]);
  const own = log.filter((e) => ids.has(e.actId)).map((e) => (e.actId === act.id ? e : { ...e, n: 1, sub: undefined }));
  if (act.counts.includes('trip')) for (const d of new Set(tripDayList)) own.push({ id: `trip:${d}`, actId: act.id, day: d, n: 1, via: 'trip' });
  return own;
}
const inWindow = (e, today, days) => e.day <= today && e.day > addDays(today, -days);
const sumN = (list) => list.reduce((s, e) => s + (Number(e.n) || 1), 0);

/** Which goal an entry belongs to: its sub when that goal exists, else the first goal. */
const goalOf = (e, goals) => (goals.some((q) => q.id === e.sub) ? e.sub : goals[0]?.id);

/** How much of one goal is done in the window ending on `today`. */
export function goalDone(goal, goals, entries, today) {
  return sumN(entries.filter((e) => goalOf(e, goals) === goal.id && inWindow(e, today, goal.days)));
}

/**
 * The state of an activity on a day: {
 *   resting, restUntil, goals: [{ goal, done, met, dueIn }], met (all goals met), todayN (amount today),
 *   todayDone, daily (all goals are daily), open (a daily goal not reached today), commuteToday,
 *   openSub (the first sub-goal still open, for a tap without a choice), stand { n, of }
 * }
 * dueIn: when met, in how many days it stops being met without a new entry.
 */
export function actState(act, log = [], today, tripDayList = []) {
  const goals = activeGoals(act, today);
  const entries = entriesFor(act, log, tripDayList);
  const todayList = entries.filter((e) => e.day === today);
  const base = { act, goals: [], resting: !goals.length, restUntil: restsUntil(act, today), todayN: sumN(todayList), todayDone: todayList.length > 0, commuteToday: todayList.filter((e) => e.via === 'commute').length };
  if (!goals.length) return { ...base, met: false, daily: false, open: false, openSub: null, stand: { n: 0, of: 0 } };
  const rows = goals.map((goal) => {
    const done = goalDone(goal, goals, entries, today);
    const met = done >= goal.count;
    let dueIn = null;
    if (met) {
      for (let k = 1; k <= goal.days; k++) {
        if (goalDone(goal, goals, entries, addDays(today, k)) < goal.count) {
          dueIn = k;
          break;
        }
      }
    }
    return { goal, done, met, dueIn };
  });
  const daily = goals.every((q) => q.days === 1);
  const open = rows.some((r) => r.goal.days === 1 && !r.met);
  // the stand: daily goals count the days reached in the last 7 days, others the amount
  let stand;
  if (daily) {
    const week = lastDays(today, 7);
    stand = { n: week.filter((d) => goals.every((q) => goalDone(q, goals, entries, d) >= q.count)).length, of: 7 };
  } else stand = { n: rows.reduce((s, r) => s + (goals.length > 1 ? Math.min(r.done, r.goal.count) : r.done), 0), of: goals.reduce((s, q) => s + q.count, 0) };
  return { ...base, goals: rows, met: rows.every((r) => r.met), daily, open, openSub: rows.find((r) => !r.met)?.goal.id ?? goals[0].id, stand };
}

/** All visible activities (not paused) in their order, with their state. */
export function flowStates(acts = [], log = [], today, tripDayList = []) {
  return [...acts]
    .map(normAct)
    .filter((a) => !a.paused)
    .sort((a, b) => a.order - b.order)
    .map((a) => actState(a, log, today, tripDayList));
}

/* ---------- the three rings (the last 7 days, rolling) ---------- */
/**
 * move: goals in soll (activities of the ring, not resting) / their number;
 * mind: days of the last 7 with an entry of the ring / 7;
 * rest: units done (each goal capped at its count) / units wanted.
 */
export function rings(states = [], log = [], today) {
  const of = (ring) => states.filter((s) => s.act.ring === ring && !s.resting);
  const move = of('move');
  const mindIds = new Set(states.filter((s) => s.act.ring === 'mind').map((s) => s.act.id));
  const week = lastDays(today, 7);
  const mindDays = week.filter((d) => log.some((e) => e.day === d && mindIds.has(e.actId))).length;
  const rest = of('rest');
  return {
    move: { n: move.filter((s) => s.met).length, of: move.length },
    mind: { n: mindDays, of: mindIds.size ? 7 : 0 },
    rest: { n: rest.reduce((s, x) => s + x.goals.reduce((a, r) => a + Math.min(r.done, r.goal.count), 0), 0), of: rest.reduce((s, x) => s + x.goals.reduce((a, r) => a + r.goal.count, 0), 0) },
  };
}
/** A ring's fill 0…1. */
export const ringFill = (r) => (r?.of ? Math.min(1, r.n / r.of) : 0);

/**
 * The words of the summary under the rings: { met: [names], missing: [{ name, sub?, n? }] } for the
 * activities of Bewegen and Erholung that are not daily (daily ones stand in «Heute abhaken»).
 * nameOf gives an activity's or a goal's name in the current language.
 */
export function summary(states = []) {
  const list = states.filter((s) => !s.resting && s.act.ring !== 'mind' && !s.daily);
  const met = list.filter((s) => s.met).map((s) => s.act);
  const missing = [];
  for (const s of list.filter((x) => !x.met)) {
    if (s.goals.length > 1) for (const r of s.goals.filter((x) => !x.met)) missing.push({ act: s.act, goal: r.goal, n: r.goal.count - r.done });
    else missing.push({ act: s.act, n: s.goals[0].goal.count - s.goals[0].done });
  }
  return { met, missing };
}

/* ---------- the grid «Ziele × Tage» ---------- */
/** One row's cells for the days: 'done' (an entry), 'open' (today, a daily goal not reached), 'none'. */
export function gridRow(state, log = [], days = [], today, tripDayList = []) {
  const entries = entriesFor(state.act, log, tripDayList);
  const on = new Set(entries.map((e) => e.day));
  return days.map((d) => (on.has(d) ? 'done' : d === today && state.open ? 'open' : 'none'));
}

/* ---------- ticking ---------- */
/** The sub-goal a tap without a choice goes to: the first one still open (Noah 4a). */
export const tapSub = (state) => (state.goals.length > 1 ? state.openSub : undefined);

/** A new log entry. */
export function newEntry(act, { day, at = new Date().toISOString(), n = null, sub, min, via } = {}) {
  const e = { id: `fl-${Date.parse(at).toString(36)}-${Math.random().toString(36).slice(2, 7)}`, actId: act.id, day, at, n: Math.max(1, Math.round(Number(n ?? act.perTap) || 1)) };
  if (sub) e.sub = sub;
  if (min) e.min = Math.max(1, Math.round(Number(min)));
  if (via) e.via = via;
  return e;
}

/** The last entry of an activity on a day (a second tap takes it back). */
export const lastEntryOn = (log = [], actId, day) => log.filter((e) => e.actId === actId && e.day === day).sort((a, b) => (a.at ?? '').localeCompare(b.at ?? '')).at(-1) ?? null;

/* ---------- the editor ---------- */
/** A new, empty activity (the same form as editing, empty). */
export const blankAct = (order = 0) => normAct({ id: `act-${Date.now().toString(36)}`, name: '', icon: 'heart', ring: 'move', goals: [g(1, 7)], order });

/** Move an activity in the order (dir −1 up, +1 down): the list with fresh order numbers. */
export function moveAct(acts = [], id, to) {
  const list = [...acts].sort((a, b) => a.order - b.order);
  const i = list.findIndex((a) => a.id === id);
  if (i < 0) return list;
  const j = Math.max(0, Math.min(list.length - 1, to));
  const [x] = list.splice(i, 1);
  list.splice(j, 0, x);
  return list.map((a, order) => ({ ...a, order }));
}

/** Tap a month in the season row: it moves between summer and winter. */
export const toggleMonth = (summer = [], m) => (summer.includes(m) ? summer.filter((x) => x !== m) : [...summer, m].sort((a, b) => a - b));

/**
 * A goal as words: { key, vars } for t(). 'daily' («täglich»), 'n daily' («10 täglich»),
 * '{n}× in {d} days'.
 */
export function goalWords(goal) {
  if (!goal || !goal.count) return { key: 'rests', vars: {} };
  if (goal.days === 1) return goal.count === 1 ? { key: 'daily', vars: {} } : { key: '{n} daily', vars: { n: goal.count } };
  return { key: '{n}× in {d} days', vars: { n: goal.count, d: goal.days } };
}
