/**
 * «Die App meldet sich von selbst» (UI-Prüfung 07.11.2026; Noah «alle Vorschläge», Rang 12–20): nine hints «Du könntest
 * jetzt …». Pure rules, no page, no database, no clock: the page passes what it knows (the context `c`) and the day
 * (`today`, YYYY-MM-DD). Every hint is only a suggestion, has a way to the place where it can be done, can be put
 * away («Heute nicht» / «Diese Woche nicht»), and is observation only where it touches the body: never a cause, never
 * medical advice. The card on Heute that shows them comes after the Heute PRs; this file is its rulebook.
 *
 * hinweis → { id, area, now, text, params, wege: [{ label, href }], later, health }
 *   text:   an English sentence with {placeholders}, German in src/lib/i18n/de/hinweise.js (shown through t(text, params))
 *   later:  'today' («Not today») or 'week' («Not this week»); how long it stays away is LATER_DAYS
 *   health: true = observation only, shown last and never as an order
 * `now` says how far the app has it already: 'new' | 'part' (there is something similar) | 'have' (exists as a function).
 * `params.day` is a calendar day (YYYY-MM-DD): the card writes the weekday in the language of the person.
 * Context keys (all optional; a missing key means «no hint»), see each rule.
 */
import { shiftDay } from '../training.js';

export const LATER_DAYS = { today: 1, week: 7 };
/** At most this many hints are shown at once (Noah: 2–3 hints). */
export const MAX_HINWEISE = 3;

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** Each rule: (c, today) → a hint without id/area/now/later/health (added below) or null. */
const RULES = [
  {
    id: 'h.rainpack', area: 'home', now: 'part', later: 'today',
    // c.nextTrip = { name, day, missing: ['Rain jacket', …] }, c.rain = { day, fromHour } (the forecast of that day)
    run: (c, today) => {
      const t = c.nextTrip, r = c.rain;
      if (!t?.day || !r?.day || !t.missing?.length) return null;
      const d = daysBetween(today, t.day);
      if (d < 1 || d > 3 || r.day < today || r.day > t.day) return null;
      return {
        text: 'You could adapt the packing list to the weather: {day} rain from {hour}:00, «{item}» is still missing.',
        params: { day: r.day, hour: r.fromHour ?? 0, item: t.missing[0] },
        wege: [{ label: 'Open the packing list', href: '#/pack' }, { label: 'Tick «{item}»', href: '#/pack', params: { item: t.missing[0] } }],
      };
    },
  },
  {
    id: 'h.restday', area: 'plan', now: 'part', later: 'week',
    // c.week = [{ day, hard: bool, free: bool }] of the shown week
    run: (c, today) => {
      const w = (c.week ?? []).filter((x) => x.day >= today);
      const hard = (c.week ?? []).filter((x) => x.hard).length;
      const free = w.find((x) => x.free && !x.hard);
      if (hard < 2 || !free) return null;
      return {
        text: 'You could make {day} a rest day: {n} hard days are planned and the evening is free.',
        params: { day: free.day, n: hard },
        wege: [{ label: 'Open the week', href: '#/week' }, { label: 'See the form', href: '#/flow/form' }],
      };
    },
  },
  {
    id: 'h.planride', area: 'plan', now: 'part', later: 'week',
    // c.goal = { missingKm }, c.window = { day, from, to } (a free, dry window)
    run: (c) => {
      const km = num(c.goal?.missingKm), w = c.window;
      if (!km || km <= 0 || !w?.day) return null;
      return {
        text: 'You could plan a ride: {day} {from} to {to} is free and dry, {km} km are missing to the weekly goal.',
        params: { day: w.day, from: w.from, to: w.to, km: Math.round(km) },
        wege: [{ label: 'Plan a ride', href: '#/week' }, { label: 'See the weekly goals', href: '#/week' }],
      };
    },
  },
  {
    id: 'h.assignride', area: 'trips', now: 'new', later: 'today',
    // c.loose = [{ id, day, km }] Strava rides without a trip; c.trips = [{ id, name, day }]
    run: (c) => {
      for (const r of c.loose ?? []) {
        const t = (c.trips ?? []).find((x) => x.day === r.day);
        if (!t) continue;
        return {
          text: 'You could assign the ride of {day} to the trip «{name}»: same day, {km} km.',
          params: { day: r.day, name: t.name, km: Math.round(num(r.km) ?? 0) },
          wege: [{ label: 'Assign', href: '#/debrief' }, { label: 'Start the look back', href: '#/debrief' }],
        };
      }
      return null;
    },
  },
  {
    id: 'h.longerbreaks', area: 'trips', now: 'new', later: 'week',
    // c.breaks = [{ planMin, rideMin }] of finished trips with a pause time from the ride (newest first)
    run: (c) => {
      const b = (c.breaks ?? []).filter((x) => num(x.planMin) != null && num(x.rideMin) != null).slice(0, 3);
      if (b.length < 3) return null;
      const extra = Math.round(b.reduce((a, x) => a + (x.rideMin - x.planMin), 0) / b.length);
      if (extra < 10) return null;
      return {
        text: 'You could plan {min} minutes more break next time: on the last three trips they were that much longer. An observation, not a cause.',
        params: { min: extra },
        wege: [{ label: 'Open the food plan', href: '#/pack' }, { label: 'Adjust the breaks', href: '#/pack' }],
      };
    },
  },
  {
    id: 'h.easyday', area: 'active', now: 'have', later: 'today', health: true,
    // c.hardRun = number of hard days in a row up to today (from Strava)
    run: (c) => {
      if ((num(c.hardRun) ?? 0) < 3) return null;
      return {
        text: 'You could ride easy today: three hard days in a row. Just a hint.',
        params: {},
        wege: [{ label: 'Easy today?', href: '#/flow' }, { label: 'Plan the week', href: '#/week' }],
      };
    },
  },
  {
    id: 'h.restingpulse', area: 'analyse', now: 'part', later: 'today', health: true,
    // c.rhr = { days: n days in a row above the own band, low, high } (own range in bpm)
    run: (c) => {
      const r = c.rhr;
      if (!r || (num(r.days) ?? 0) < 4) return null;
      return {
        text: 'You could look at your resting pulse: for {n} days it has been above your usual ({low} to {high}). An observation, not a cause.',
        params: { n: r.days, low: r.low, high: r.high },
        wege: [{ label: 'Open the value', href: '#/auswerten/analyse/rhr' }, { label: 'See the days with trips', href: '#/auswerten/analyse' }],
      };
    },
  },
  {
    id: 'h.chain', area: 'bikes', now: 'new', later: 'today',
    // c.wear = { part, kmLeft, bike } (the part that is due first), c.nextTrip = { km, day }
    run: (c, today) => {
      const w = c.wear, t = c.nextTrip;
      if (!w || num(w.kmLeft) == null || !t?.day || num(t.km) == null) return null;
      const d = daysBetween(today, t.day);
      if (d < 0 || d > 14 || w.kmLeft > t.km + 50) return null;
      return {
        text: 'You could change the {part} before {day}: it is due in {left} km, the trip has {km} km.',
        params: { part: w.part, day: t.day, left: Math.round(w.kmLeft), km: Math.round(t.km) },
        wege: [{ label: 'Open the care', href: '#/bikes?tab=care' }, { label: 'Put the spare part on the shopping list', href: '#/me/alltag/einkauf' }],
      };
    },
  },
  {
    id: 'h.connect', area: 'me', now: 'new', later: 'week',
    // c.waiting = [{ src, name, href, n }] from analyse/leerquelle.js (leerQuelle), the biggest first
    run: (c) => {
      const g = c.waiting?.[0];
      if (!g || !(g.n > 0)) return null;
      return {
        text: 'You could connect {source}: {n} tiles in Auswerten wait for values.',
        params: { source: g.name, n: g.n },
        wege: [{ label: 'Open {source}', href: g.href, params: { source: g.name } }, { label: 'Back to Auswerten', href: '#/auswerten' }],
      };
    },
  },
];

/** Days from a to b (calendar days, YYYY-MM-DD, no clock). */
function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
}

/** The ids of the nine hints, in the order they are looked at. */
export const HINWEIS_IDS = RULES.map((r) => r.id);

/** Is a hint put away today? state = { until: { id: 'YYYY-MM-DD' }, off: { id: true } } (the «Not …» choices). */
export function isAway(state = {}, id, today) {
  if (state.off?.[id]) return true;
  const until = state.until?.[id];
  return !!until && today < until;
}

/** «Not today» / «Not this week»: the hint stays away until this day (or longer: off). Returns a new state. */
export function putAway(state = {}, id, today, how = 'today') {
  const days = LATER_DAYS[how] ?? LATER_DAYS.today;
  return { ...state, until: { ...(state.until ?? {}), [id]: shiftDay(today, days) } };
}

/** Switch a kind of hint off for good (settings), or on again. Returns a new state. */
export function switchOff(state = {}, id, off = true) {
  const o = { ...(state.off ?? {}) };
  if (off) o[id] = true;
  else delete o[id];
  return { ...state, off: o };
}

/**
 * The hints to show: the rules that fire, minus the ones put away and the ones «Not for me», the ones that touch the
 * body last, at most MAX_HINWEISE. `notForMe`: ids of hints the person switched off in Me › Calmer.
 */
export function hinweise(c = {}, today, state = {}, notForMe = {}, max = MAX_HINWEISE) {
  const out = [];
  for (const r of RULES) {
    if (notForMe[r.id] || isAway(state, r.id, today)) continue;
    const h = r.run(c ?? {}, today);
    if (!h) continue;
    out.push({ id: r.id, area: r.area, now: r.now, later: r.later, health: !!r.health, ...h });
  }
  out.sort((a, b) => Number(a.health) - Number(b.health));
  return out.slice(0, Math.max(0, max));
}
