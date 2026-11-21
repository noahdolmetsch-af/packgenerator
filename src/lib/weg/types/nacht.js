/**
 * «Weg zum Ziel» › Schrittart «Nachtplan» (typ `nacht`; Noah 05.11.2026 «b» in the thread «Planen: Nachtplan im Weg»; kinds of
 * steps 1 2 3 4 5 7 8, idea G): where you sleep on the nights of a big goal.
 *
 * - A race (or a tour marked as a race) with its own plan: the nights come from the race page (`races[tripId].nights`,
 *   Touren › Rennen › Plan, «Bivy / Hotel or room / Ride through»). The step «Decide where you sleep each night» ticks
 *   itself when every night has a choice of your own. The app never takes a tick back and never decides for you.
 * - Every other goal, a free one too: you write the nights by hand (`step.nights = [{ id, place, note }]`), add,
 *   rename, delete and order them. Nothing ticks by itself there; the tick is yours.
 *
 * `load(db)` gives what `auto` reads, the page puts it under `ctx.nacht`: `{ races, trips }` = the stored races
 * `{ [tripId]: Race }` and the trips (for the number of days). The page may add `nightCounts` = `{ [tripId]: number
 * of nights of the plan }` when it knows the plan (else the days of the trip minus one). `auto` and `nightsOf` read
 * `ctx.nacht` only. Pure functions, tested in tests/weg-nacht.test.js.
 * Titles and notes are English keys for t(); the German is in i18n/de/weg-nacht.js.
 */
import { isRaceTrip, NIGHT_KINDS, RACES_KEY, racesOf } from '../../race/race.js';
import { raceHref } from '../../race/parts.js';

export const TYPE = 'nacht';
/** The step that ticks itself is found by this key, not by its title (the user may rename it). */
export const DECIDE = 'decide';

const KINDS = NIGHT_KINDS.map((k) => k.key);
const text = (v) => String(v ?? '').trim();

/** The nights of a step written by hand, made safe: [{ id, place, note }]. */
export const handNights = (step) => (Array.isArray(step?.nights) ? step.nights.filter((n) => n?.id).map((n) => ({ id: n.id, place: text(n.place), note: text(n.note) })) : []);

const raceTripOf = (goal, data) => {
  if (!goal?.tripId) return null;
  const trip = data?.trips?.find((t) => t.id === goal.tripId) ?? null;
  const races = data?.races ?? {};
  return (trip ? isRaceTrip(trip, races) : !!races[goal.tripId]) ? { id: goal.tripId, trip } : null;
};

/**
 * The nights of a goal as one list, whatever their source:
 * { source: 'race' | 'hand', needed, decided, rows }. A race row is { n, kind, place, decided }, a night by hand
 * { id, place, note, decided } (decided = it has a place). `needed` is the number of nights of the race (0 when
 * unknown); for a hand list it is the length of the list.
 */
export function nightsOf(goal, step, data = {}) {
  const race = raceTripOf(goal, data);
  if (race) {
    const stored = Array.isArray(data.races?.[race.id]?.nights) ? data.races[race.id].nights : [];
    const count = Number(data.nightCounts?.[race.id]);
    const needed = Number.isFinite(count) && count >= 0 ? Math.round(count) : Math.max(0, (Number(race.trip?.days) || 1) - 1);
    const rows = Array.from({ length: needed }, (_, i) => {
      const own = stored.find((s) => Number(s?.n) === i + 1);
      const kind = KINDS.includes(own?.kind) ? own.kind : '';
      return { n: i + 1, kind, place: text(own?.place), decided: !!kind };
    });
    return { source: 'race', needed, decided: rows.filter((r) => r.decided).length, rows };
  }
  const rows = handNights(step).map((n) => ({ ...n, decided: !!n.place }));
  return { source: 'hand', needed: rows.length, decided: rows.filter((r) => r.decided).length, rows };
}

/* ---------- nights by hand (a free goal; every goal may use it) ---------- */

let seq = 0;
const nightId = () => `wn-${Date.now().toString(36)}-${(seq++).toString(36)}`;

const mapNights = (goal, stepId, fn) => ({ ...goal, steps: goal.steps.map((s) => (s.id === stepId ? { ...s, nights: fn(handNights(s)) } : s)) });

/** A night added at the end (an empty place is fine: you may fill it in later). */
export const addNight = (goal, stepId, { place = '', note = '' } = {}, { id = nightId() } = {}) => mapNights(goal, stepId, (l) => [...l, { id, place: text(place), note: text(note) }]);
/** Place and note of a night changed. */
export const editNight = (goal, stepId, id, patch) => mapNights(goal, stepId, (l) => l.map((n) => (n.id === id ? { ...n, ...(patch.place !== undefined && { place: text(patch.place) }), ...(patch.note !== undefined && { note: text(patch.note) }) } : n)));
export const removeNight = (goal, stepId, id) => mapNights(goal, stepId, (l) => l.filter((n) => n.id !== id));
/** Nights ordered with the arrows or by drag. */
export const moveNight = (goal, stepId, from, to) =>
  mapNights(goal, stepId, (l) => {
    if (from < 0 || from >= l.length || to < 0 || to >= l.length) return l;
    const out = [...l];
    out.splice(to, 0, out.splice(from, 1)[0]);
    return out;
  });

/* ---------- the kind of step ---------- */

const NIGHTS_NOTE = 'Bivy, hotel or ride through: choose it for every night. Only a suggestion, you can change it any time.';
const HAND_NOTE = 'Write down where you sleep each night, even a rough idea. Add, rename or delete nights as you like.';
const BOOK = { title: 'Book the beds you need', offset: 21, note: 'Hotels and huts fill up early. Nothing to book if you sleep outside.' };
const SPOTS = { key: 'spots', title: 'Look at the beds along the route', offset: 14, note: 'Hotels, huts and roofs ahead, and a drier or warmer place for a planned night.' };
const SHEET = { key: 'sheet', title: 'Play one night through', offset: 10, note: 'Hour by hour: shop, food, lights, where you sleep, breakfast.' };

const isRaceGoal = (goal) => goal?.kind === 'race' && !!goal.tripId;

export default {
  order: 30,
  type: TYPE,
  label: 'Night plan',
  icon: 'moon',
  /** A race with a trip gets the choice per night, the beds along the route and the night sheet; any other goal the list by hand. */
  defaults: (goal) =>
    isRaceGoal(goal)
      ? [{ title: 'Decide where you sleep each night', offset: 28, note: NIGHTS_NOTE, key: DECIDE }, BOOK, SPOTS, SHEET]
      : [{ title: 'Write down your nights', offset: 28, note: HAND_NOTE }, BOOK],
  /** What `auto` reads, put by the page under ctx.nacht: the stored races and the trips (days of the race). */
  load: async (db) => ({
    races: racesOf((await db.settings.get(RACES_KEY))?.value),
    trips: await db.trips.toArray(),
  }),
  /**
   * Only the step «decide each night» of a race with its own plan ticks itself: true when every night has a choice of
   * your own, false when some are open, null when the app cannot know (no race data, any other step).
   */
  auto: (goal, step, ctx = {}) => {
    if (step?.key !== DECIDE) return null;
    const n = nightsOf(goal, step, ctx.nacht);
    if (n.source !== 'race') return null;
    return n.needed > 0 && n.decided >= n.needed;
  },
  /** The place of the step: the race plan, the beds along the route, the night sheet of the race check. */
  link: (goal, step) => {
    if (!isRaceGoal(goal)) return '';
    if (step?.key === SPOTS.key) return raceHref(goal.tripId, 'route');
    if (step?.key === SHEET.key) return `#/racecheck/${encodeURIComponent(goal.tripId)}`;
    return raceHref(goal.tripId, 'plan');
  },
};
