/**
 * v0.46.0 «Startseite neu» (Noah 12a, 13a, 15a, 16a, 17a): the 16 things the app can do, as the
 * buttons of "What do you want to do?" on Today (12 on a computer, 8 on a phone, the last one
 * "All 16 functions"), the card "Tried it yet?" and "You use 9 of 16 functions · Level 2".
 *
 * The first four stay where they are (Day ride, Plan a trip, What do I wear?, Weigh); the others
 * follow Noah's own use: every tap counts in the settings record "homeUsage" ({ id: taps }).
 * A function counts as used when it was tapped here or the data shows it (a day ride exists …).
 * Pure functions; Home.svelte does what a button says (go: href or run).
 */
import { isDayRide } from '../dayride.js';
import { isInventory } from '../gear.js';

export const USAGE_KEY = 'homeUsage';

// v0.94.0: the list itself lives in fnlist.js (pure data, read by tiles.js and the browser tests)
import { FUNCTIONS } from './fnlist.js';
export { FUNCTIONS };
export const FUNCTION = Object.fromEntries(FUNCTIONS.map((f) => [f.id, f]));
/** Noah 13a: these four stay in front. */
export const FIXED = ['dayride', 'trip', 'wear', 'weigh'];
/** Buttons on Today including "All 16 functions": 12 on a computer, 8 on a phone. */
export const SHOWN = { desktop: 12, phone: 8 };

/** A stored usage record made safe: { id: taps } with whole numbers. */
export function usageOf(value) {
  const out = {};
  if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) if (FUNCTION[k] && Number(v) > 0) out[k] = Math.floor(Number(v));
  return out;
}
/** One more tap on a function. */
export const bumpUsage = (value, id) => (FUNCTION[id] ? { ...usageOf(value), [id]: (usageOf(value)[id] ?? 0) + 1 } : usageOf(value));

/** All 16 in their order: the four fixed ones, then by taps (most first), then as listed. */
export function orderFunctions(usage = {}) {
  const u = usageOf(usage);
  const rest = FUNCTIONS.filter((f) => !FIXED.includes(f.id))
    .map((f, i) => ({ f, i, n: u[f.id] ?? 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.f);
  return [...FIXED.map((id) => FUNCTION[id]), ...rest];
}

/** The buttons on Today: the first n − 1 functions (the last place is "All 16 functions"). */
export const shownFunctions = (usage, n) => orderFunctions(usage).slice(0, Math.max(0, n - 1));

/**
 * The functions the data shows as used: Set of ids. Every input is optional.
 * notesN: all notes; rides: uploaded rides; sets: the settings record "sets" (own blocks).
 */
export function dataUsed({ trips = [], items = [], bikes = [], debriefs = [], templates = [], rides = [], notesN = 0, sets = [] } = {}) {
  const used = new Set();
  const on = (id, yes) => yes && used.add(id);
  on('dayride', trips.some(isDayRide));
  on('trip', trips.some((x) => !isDayRide(x)));
  on('weigh', items.some((i) => i.weightStatus === 'measured'));
  on('care', bikes.some((b) => (b.parts ?? []).some((p) => p.history?.length)));
  on('ride', rides.length > 0);
  on('gear', items.some(isInventory));
  on('templates', templates.length > 0);
  on('wish', items.some((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy'));
  on('note', notesN > 0);
  on('km', bikes.some((b) => !!b.kmDate));
  on('blocks', (Array.isArray(sets) ? sets : []).some((s) => s?.key?.startsWith('u-')));
  on('favorites', items.some((i) => i.favorite));
  on('debriefs', debriefs.some((d) => d.status === 'done'));
  return used;
}

/** Used: tapped on Today or seen in the data. */
export const usedFunctions = (usage, data = new Set()) => new Set(FUNCTIONS.map((f) => f.id).filter((id) => data.has(id) || (usageOf(usage)[id] ?? 0) > 0));

/** The levels of "You use 9 of 16 functions · Level 2": from this many used functions on. */
export const LEVELS = [0, 6, 11, 16];
export const levelOf = (n) => LEVELS.filter((x) => n >= x).length;

/**
 * "Tried it yet?" (Noah 16a): the functions never used, in the order of the list; the card shows one
 * and "Next ›" goes round. turn: how often "Next" was tapped.
 */
export const untried = (used = new Set()) => FUNCTIONS.filter((f) => !used.has(f.id));
export const tryPick = (list = [], turn = 0) => (list.length ? list[((turn % list.length) + list.length) % list.length] : null);
