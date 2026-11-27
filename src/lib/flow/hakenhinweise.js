/**
 * «Was auffällt» (Noah 27.11.2026 «4a», thread «Abhaken auf einen Blick verbessern», Schritt 3): what the ticks of the last 60 days show
 * across the activities: a series, a gap, what you often tick together, a week without recovery, a weekday. Pure rules, no page,
 * no database; the texts are flow/hakenhinweise-text.js, the card is flow/HakenHinweise.svelte (Auswerten › Woche) and the one line
 * on Heute is home/HakenHinweis.svelte. Observation only: nothing is graded, nothing is advised as a duty, health is never named.
 * Days are YYYY-MM-DD; the window ends today (60 days, less than the 70 days Heute reads).
 */
import { addDays, daysBetween, entriesFor, normAct } from '../flow.js';

export const WINDOW = 60;
/** The order the hints come in (most useful for today first). */
export const KINDS = ['balance', 'gap', 'streak', 'together', 'rhythm'];
const MIN_RUN = 3; // a series from this many days in a row
const MIN_GAP = 6; // a gap from this many days without a tick (but not longer than MAX_GAP: after that it has stopped, not paused) …
const MAX_GAP = 28;
const MIN_TICKS = 4; // … of an activity you tick at least this often
const MIN_COMMON = 5; // two activities on at least this many common days
const LIFT = 1.8; // … and at least this much more often together than by chance
const MIN_WEEKDAY = 6; // a weekday needs at least this many ticks …
const SHARE_WEEKDAY = 0.45; // … and this share of them on one day

const dow = (day) => (new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
const median = (list) => {
  const s = [...list].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The ticks as days per activity: [{ act, days: Set }] for the activities (not paused) with at least one tick in the window. */
export function daySets({ acts = [], log = [], tripDayList = [], today }) {
  const from = addDays(today, -(WINDOW - 1));
  const out = [];
  for (const a of acts.map(normAct).filter((x) => !x.paused)) {
    const days = new Set(entriesFor(a, log, tripDayList).filter((e) => e.day >= from && e.day <= today).map((e) => e.day));
    if (days.size) out.push({ act: a, days });
  }
  return out;
}

/** The run of days in a row that ends today, or yesterday while today has no tick yet. */
function runOf(days, today) {
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/**
 * The hints, most useful first: [{ kind, actId?, other?, n, … }].
 * balance: n days in a row with something of «Move» and nothing of «Recovery» (only where a recovery activity exists);
 * gap: since days without a tick of an activity you tick every `every` days (every 1 = almost daily);
 * streak: n days in a row; together: B on `part` of the `of` days of A; rhythm: the weekday (0 = Monday) with `part` of `of` ticks.
 */
export function hintsOf({ acts = [], log = [], tripDayList = [], today }) {
  const sets = daySets({ acts, log, tripDayList, today });
  const hints = [];
  const hasRest = acts.map(normAct).some((a) => a.ring === 'rest' && !a.paused);

  // balance: days in a row with a move tick and no recovery tick, counted back from today (or yesterday)
  if (hasRest) {
    const move = new Set();
    const rest = new Set();
    for (const s of sets) for (const d of s.days) (s.act.ring === 'move' ? move : s.act.ring === 'rest' ? rest : new Set()).add(d);
    let d = move.has(today) ? today : addDays(today, -1);
    let n = 0;
    while (move.has(d) && !rest.has(d)) {
      n++;
      d = addDays(d, -1);
    }
    if (n >= MIN_RUN && !rest.has(today)) hints.push({ kind: 'balance', n });
  }

  // gap: an activity you tick regularly has been quiet for much longer than usual
  for (const s of sets) {
    const days = [...s.days].sort();
    if (days.length < MIN_TICKS) continue;
    const gaps = days.slice(1).map((d, i) => daysBetween(days[i], d));
    const every = Math.max(1, Math.round(median(gaps)));
    const since = daysBetween(days.at(-1), today);
    if (since >= MIN_GAP && since <= MAX_GAP && since >= 2 * every) hints.push({ kind: 'gap', actId: s.act.id, n: since, every });
  }

  // streak: the longest runs that are still going
  for (const s of sets) {
    const n = runOf(s.days, today);
    if (n >= MIN_RUN) hints.push({ kind: 'streak', actId: s.act.id, n });
  }

  // together: B is ticked far more often on the days of A than on any day
  let best = null;
  for (const a of sets) {
    for (const b of sets) {
      if (a === b || a.act.counts.includes(b.act.id) || b.act.counts.includes(a.act.id)) continue;
      const common = [...a.days].filter((d) => b.days.has(d)).length;
      if (common < MIN_COMMON) continue;
      const part = common / a.days.size;
      const lift = part / (b.days.size / WINDOW);
      if (part < 0.5 || lift < LIFT) continue;
      const score = lift * common;
      if (!best || score > best.score) best = { kind: 'together', actId: a.act.id, other: b.act.id, part: common, of: a.days.size, score };
    }
  }
  if (best) hints.push(best);

  // rhythm: most ticks of an activity fall on one weekday
  for (const s of sets) {
    if (s.days.size < MIN_WEEKDAY) continue;
    const per = Array(7).fill(0);
    for (const d of s.days) per[dow(d)]++;
    const top = per.indexOf(Math.max(...per));
    if (per[top] / s.days.size >= SHARE_WEEKDAY) hints.push({ kind: 'rhythm', actId: s.act.id, weekday: top, part: per[top], of: s.days.size });
  }

  return hints.sort((x, y) => KINDS.indexOf(x.kind) - KINDS.indexOf(y.kind) || (y.n ?? 0) - (x.n ?? 0) || (y.part ?? 0) - (x.part ?? 0));
}

/** At most `max` hints for the card, no more than two of one kind. */
export function cardHints(hints = [], max = 5) {
  const count = {};
  return hints.filter((h) => (count[h.kind] = (count[h.kind] ?? 0) + 1) <= 2).slice(0, max);
}

/** The one hint for Heute: a week without recovery, a gap or a series (together and rhythm are for the card only). */
export const lineHint = (hints = []) => hints.find((h) => h.kind === 'balance') ?? hints.find((h) => h.kind === 'gap') ?? hints.find((h) => h.kind === 'streak') ?? null;
