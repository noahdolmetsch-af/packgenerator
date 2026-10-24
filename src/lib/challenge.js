/**
 * v0.102.0 «Vorschlag und Challenge» (Noah 12.10.2026 «d1-d5 freigeben», mockups D1b and D5, rule for
 * all areas): a suggestion tile shows alternatives to choose from, and any of them can become a
 * challenge: what, how often, until when. It counts by itself from the ticks of the tile and, once
 * reached, becomes a milestone. Never mandatory: a challenge can be changed or stopped any time.
 *
 * The record (settings, travels in every backup):
 *   suggest.<area> = { options: [names], pick: name | null, ticks: { name: [YYYY-MM-DD] } }
 *   challenges     = [{ id, area, what, times, from, until, doneOn: YYYY-MM-DD | null, stopped: bool }]
 * Pure functions, tested in tests/challenge.test.js.
 */
export const CHALLENGES_KEY = 'challenges';
export const suggestKey = (area) => `suggest.${area}`;
/** Today's suggestion on Heute (D1b): «Heute baden oder Sauna?», always with its alternatives. */
export const TODAY_OPTIONS = ['Swim', 'Sauna', 'Walk by the lake'];

const isDay = (x) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);
const clean = (s) => String(s ?? '').trim().slice(0, 40);

/** A stored suggestion record made safe; without one the given options. */
export function suggestOf(value, options = TODAY_OPTIONS) {
  const v = value && typeof value === 'object' ? value : {};
  const opts = [...new Set((Array.isArray(v.options) && v.options.length ? v.options : options).map(clean).filter(Boolean))].slice(0, 8);
  const ticks = {};
  for (const [k, days] of Object.entries(v.ticks && typeof v.ticks === 'object' ? v.ticks : {})) if (Array.isArray(days)) ticks[k] = [...new Set(days.filter(isDay))].sort();
  return { options: opts, pick: opts.includes(v.pick) ? v.pick : opts[0] ?? null, ticks };
}
/** Choose another alternative. */
export const pickOption = (s, name) => ({ ...s, pick: s.options.includes(name) ? name : s.pick });
/** Add an own alternative (and choose it). */
export function addOption(s, name) {
  const n = clean(name);
  if (!n) return s;
  return { ...s, options: s.options.includes(n) ? s.options : [...s.options, n].slice(0, 8), pick: n };
}
/** Done today or not (a second tap takes it back). */
export function toggleTick(s, name, today) {
  const days = s.ticks[name] ?? [];
  const next = days.includes(today) ? days.filter((d) => d !== today) : [...days, today].sort();
  return { ...s, ticks: { ...s.ticks, [name]: next } };
}
export const tickedToday = (s, name, today) => (s.ticks[name] ?? []).includes(today);

/** The last day of the month of a day: the default «until when». */
export function monthEnd(today) {
  const [y, m] = today.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** The stored challenges made safe. */
export function challengesOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((c) => c && c.id && clean(c.what) && isDay(c.from) && isDay(c.until))
    .map((c) => ({ id: String(c.id), area: c.area ?? 'today', what: clean(c.what), times: Math.max(1, Math.min(1000, Math.round(Number(c.times) || 1))), from: c.from, until: c.until, doneOn: isDay(c.doneOn) ? c.doneOn : null, stopped: !!c.stopped, ...(typeof c.actId === 'string' && c.actId ? { actId: c.actId } : {}) }));
}
/** A new challenge: what, how often, until when (from today). */
export const newChallenge = ({ area = 'today', what, times = 10, until, today, id = `ch-${today}-${Math.random().toString(36).slice(2, 7)}` }) => ({ id, area, what: clean(what), times: Math.max(1, Math.round(Number(times) || 1)), from: today, until: until && until >= today ? until : monthEnd(today), doneOn: null, stopped: false });

/** How many times it was done in the window: the ticks of the suggestion of its area. */
export const countOf = (c, s) => (s?.ticks?.[c.what] ?? []).filter((d) => d >= c.from && d <= c.until).length;

/** The running challenge for a name (not stopped, not over, newest first), or null. */
export function activeFor(list, what, today, area = 'today') {
  return list.filter((c) => c.area === area && c.what === what && !c.stopped && c.until >= today).at(-1) ?? null;
}

/**
 * Mark reached challenges (count ≥ times) with today's date: they become milestones. → { list, reached }
 * where reached are the ones marked now.
 */
export function stepChallenges(list, suggests, today) {
  const reached = [];
  const out = list.map((c) => {
    if (c.doneOn || c.stopped) return c;
    if (countOf(c, suggests[c.area]) >= c.times) {
      const d = { ...c, doneOn: today };
      reached.push(d);
      return d;
    }
    return c;
  });
  return { list: out, reached };
}
/** The challenges to celebrate today on Heute (reached in the last two days). */
export const freshDone = (list, today, days = 2) => list.filter((c) => c.doneOn && Date.parse(`${today}T00:00:00Z`) - Date.parse(`${c.doneOn}T00:00:00Z`) < days * 864e5);

/* ---------- challenges per activity (Noah 22.10.2026 «3a»: three ready ones per sport, plus own ones) ---------- */
/**
 * A challenge of an activity: area `act:<id>`, actId set. It counts every tick of the activity from its
 * first to its last day (flowms.js challengeMilestones); reached, it is a star that stays.
 */
export const actArea = (actId) => `act:${actId}`;
const addDaysIso = (day, n) => {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The last day of the year of a day. */
export const yearEnd = (today) => `${today.slice(0, 4)}-12-31`;
/**
 * The three ready challenges of an activity (suggestions, every number changeable): this month, the next
 * 6 weeks, until the end of the year. The counts follow the goal (days a week), at least a few.
 * → [{ key, times, until }]
 */
export function presetsFor(act, today) {
  const q = (act?.goals ?? []).find((x) => x.count > 0);
  const perWeek = q ? Math.max(1, Math.min(7, Math.round((q.count * 7) / q.days))) : 2;
  const month = monthEnd(today);
  const weeksLeft = Math.max(1, Math.round((Date.parse(`${month}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / (7 * 864e5)) + 1);
  const yearDays = (Date.parse(`${yearEnd(today)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 864e5 + 1;
  const round = (n, to) => Math.max(to, Math.round(n / to) * to);
  return [
    { key: 'month', times: Math.max(3, Math.min(31, perWeek * weeksLeft)), until: month },
    { key: 'weeks6', times: round(perWeek * 6, 2), until: addDaysIso(today, 41) },
    { key: 'year', times: round((perWeek * yearDays) / 7, 5), until: yearEnd(today) },
  ];
}
/** A new challenge of an activity. */
export const newActChallenge = ({ act, times, until, today, id }) => ({ ...newChallenge({ area: actArea(act.id), what: (act.name || act.id).slice(0, 40), times, until, today, id }), actId: act.id });
/** The running and the finished challenges of an activity (newest first), stopped ones left out unless asked. */
export const challengesFor = (list, actId, { stopped = false } = {}) => list.filter((c) => c.actId === actId && (stopped || !c.stopped)).reverse();
/** How many ticks of the activity count for the challenge. */
export const actCount = (c, log) => log.filter((e) => e.actId === c.actId && e.day >= c.from && e.day <= c.until).length;
