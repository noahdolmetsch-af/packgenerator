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

/**
 * label: English key for t(); icon: a key of the icon map in ActionGrid.svelte;
 * go: { href } a page or { run } an action Home.svelte carries out;
 * pitch: one sentence for "Tried it yet?".
 */
export const FUNCTIONS = [
  { id: 'dayride', label: 'Day ride', icon: 'zap', go: { run: 'dayride' }, pitch: 'A day ride in one tap: the list of your last one, with the weather.' },
  { id: 'trip', label: 'Plan a trip', icon: 'bag', go: { run: 'trip' }, pitch: 'Plan a trip: name, date and bike, the packing list follows.' },
  { id: 'wear', label: 'What do I wear?', icon: 'shirt', go: { run: 'wear' }, pitch: 'What do I wear? Your clothes for the coldest hour of the ride.' },
  { id: 'weigh', label: 'Weigh|function', icon: 'scale', go: { href: '#/gear?tab=weigh' }, pitch: 'Weigh your items one after the other: then every total is exact.' },
  { id: 'care', label: 'Bike care', icon: 'wrench', go: { href: '#/bikes?tab=care' }, pitch: 'Bike care says when the chain, pads and tyres are due.' },
  { id: 'ride', label: 'Upload ride', icon: 'route', go: { href: '#/debrief/ride' }, pitch: 'Upload a ride (GPX): pauses, planned against real, learnings.' },
  { id: 'gear', label: 'Gear|place', icon: 'file', go: { href: '#/gear' }, pitch: 'All your gear with weight, bag and where it was used.' },
  { id: 'wardrobe', label: 'Wardrobe', icon: 'wardrobe', go: { href: '#/wardrobe' }, pitch: 'The wardrobe sorts your clothes from warm to cold, layer by layer.' },
  { id: 'templates', label: 'Templates', icon: 'layers', go: { href: '#/pack/templates' }, pitch: 'Save a good trip as a template and start the next one from it.' },
  { id: 'wish', label: 'Wishlist', icon: 'heart', go: { href: '#/gear?tab=wishlist' }, pitch: 'The wishlist shows which buy saves the most grams per franc.' },
  { id: 'review', label: 'Look back|function', icon: 'chart', go: { href: '#/review' }, pitch: 'Your last 12 months: trips, km, nights out and what you learned.' },
  { id: 'note', label: 'Note · Inbox', icon: 'note', go: { run: 'note' }, pitch: 'A quick note catches an idea or a photo in two taps; you sort it later.' },
  { id: 'km', label: 'Log km', icon: 'counter', go: { run: 'km' }, pitch: 'Type the km on the counter, and Bike care knows what is due.' },
  { id: 'blocks', label: 'Building blocks', icon: 'blocks', go: { href: '#/blocks' }, pitch: 'Building blocks such as sleep, cook or rain bring their items into a trip.' },
  { id: 'favorites', label: 'Favourites', icon: 'star', go: { href: '#/favorites' }, pitch: 'Mark your favourite things with ★ and find them all on one page.' },
  { id: 'debriefs', label: 'Debriefs', icon: 'book', go: { href: '#/debrief' }, pitch: 'A debrief takes a minute and tells the app what you really used.' },
];
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
