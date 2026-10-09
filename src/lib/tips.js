/**
 * v0.30.0 (Noah 1a, 2a, 3a, 8.10.2026): Good to know on Today is always 6 tiles. First what
 * matters now from your data (at most 3: backup due, care due now, a late task, the weather of a
 * trip in the next 3 days), then at most 1 further data card, the rest are tips "Did you know?"
 * (at least 3) about what the app can do. Every tip has ONE button that starts the thing.
 *
 * Pure functions (no database, no screen) except the small read/write helpers at the end:
 * GoodToKnow.svelte and Features.svelte gather the records and write the words.
 *
 * Which tips: never used first (used = seen in the data, or its button tapped), fitting ones first
 * (a trip coming up: packing and GPX; bikes with km: care), else random but the same all day
 * (seeded by the local date). "I know it" hides a tip forever (Noah 2a; the overview still lists
 * it). A tip shown on 3 days without a tap rests for 30 days.
 *
 * The state lives in the settings record "tips" (exported with every backup):
 * { known: { id: date }, tapped: { id: date }, seen: { id: { days, last } }, paused: { id: until },
 *   day: { date, ids } } — day keeps today's choice, so the tiles do not jump around within a day.
 */
import { isDayRide } from './dayride.js';
import { isEvent } from './care.js';
import { toDebrief, nextTrip } from './debrief.js';
import { isInventory } from './gear.js';

export const TIPS_KEY = 'tips';
/** Tiles on Today, important data cards at most, tips at least. */
export const TILES = 6;
export const MAX_IMPORTANT = 3;
export const MIN_TIPS = 3;
/** Shown on this many days without a tap: the tip rests for PAUSE_DAYS. */
export const SHOWN_DAYS = 3;
export const PAUSE_DAYS = 30;

const DAY = 864e5;
const addDays = (iso, n) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** The areas of the overview, in order (labels are English keys for t()). */
export const GROUPS = [
  { key: 'plan', label: 'Plan|tips' },
  { key: 'pack', label: 'Packing & on the way' },
  { key: 'back', label: 'Looking back' },
  { key: 'gear', label: 'Gear|tips' },
  { key: 'bikes', label: 'Bikes|tips' },
  { key: 'data', label: 'Your data|tips' },
];

/**
 * The tips (English keys for t()). icon: a name in the icon map of the screens.
 * go: what the button does: { href } opens a page, { run } names an action the screen carries out
 * (dayRide, newTrip, note, receipt, km, backup, data, homePlace, install, lang).
 * needs (v0.30.2, L9): the data the tip's sentence and button need, one or a list of 'trip' (any
 * trip), 'pastTrip' (one that started already), 'items', 'bikes', 'any' (anything at all); none: always.
 */
export const TIPS = [
  // Plan
  { id: 'dayride', group: 'plan', icon: 'zap', title: 'Day ride in 1 tap', text: 'One tap plans a short ride like your last one, with the weather.', button: 'Plan a day ride', go: { run: 'dayRide' }, needs: 'pastTrip' },
  { id: 'blocks', group: 'plan', icon: 'blocks', title: 'New trip with building blocks', text: 'Building blocks such as sleep, cook or rain bring their items into a new trip.', button: 'Show building blocks', go: { href: '#/blocks' }, needs: 'items' },
  { id: 'templates', group: 'plan', icon: 'copy', title: 'Templates', text: 'Save a good trip as a template and start the next one from it.', button: 'Open templates', go: { href: '#/pack/templates' }, needs: 'trip' },
  { id: 'gpx', group: 'plan', icon: 'route', title: 'Load a route (GPX)', text: 'Load a GPX route into a trip: km, climbing and riding time come from it.', button: 'Open the trip', go: { href: '#/pack' }, needs: 'trip' },
  { id: 'homeweather', group: 'plan', icon: 'home', title: 'Weather at your home place', text: 'Set your home place and see here what the weekend brings for a ride.', button: 'Set home place', go: { run: 'homePlace' } },
  { id: 'wxsuggest', group: 'plan', icon: 'cloud', title: 'Weather suggestions', text: 'The weather suggestions of a trip add the layers that fit the forecast.', button: 'Open the trip', go: { href: '#/pack' }, needs: 'trip' },
  // Packing & on the way
  { id: 'bags', group: 'pack', icon: 'backpack', title: 'Pack bag by bag', text: 'Pack bag by bag and tick each item as it goes in.', button: 'Start packing|tips', go: { href: '#/pack?day' }, needs: 'trip' },
  { id: 'share', group: 'pack', icon: 'printer', title: 'Share or print a list (PDF)', text: 'Share a packing list as a link, or print it or save it as PDF.', button: 'Print / PDF', go: { href: '#/pack?print' }, needs: 'trip' },
  { id: 'ride', group: 'pack', icon: 'navigation', title: 'The Now card on the way', text: 'On the way, the Now card shows the next stage, the weather and where each thing is.', button: 'Open Ride day', go: { href: '#/ride' }, needs: 'trip' },
  { id: 'note', group: 'pack', icon: 'note', title: 'Quick note|tips', text: 'A quick note catches an idea or a photo in two taps; you sort it later.', button: 'Write a note', go: { run: 'note' } },
  { id: 'event', group: 'pack', icon: 'flag', title: 'Event preparation', text: 'For an event, preparation tasks count down to the start with their lead times.', button: 'Open Bike care', go: { href: '#/bikes?tab=care' }, needs: 'trip' },
  // Looking back
  { id: 'debrief', group: 'back', icon: 'message', title: 'Debrief in 1 minute', text: 'A debrief takes a minute and tells the app what you really used.', button: 'Open debriefs', go: { href: '#/debrief' }, needs: 'trip' },
  { id: 'learn', group: 'back', icon: 'sparkles', title: 'Templates that learn (after 3 debriefs)', text: 'After 3 debriefs your templates suggest what to take out or add.', button: 'Open templates', go: { href: '#/pack/templates' }, needs: 'trip' },
  { id: 'pace', group: 'back', icon: 'gauge', title: 'Your pace', text: 'Load a few GPX rides and riding times use your own pace.', button: 'Show your pace', go: { href: '#/debrief/pace' } },
  { id: 'trend', group: 'back', icon: 'trend', title: 'Weight trend', text: 'Compare trips and see how your base weight changes trip by trip.', button: 'Compare trips', go: { href: '#/debrief' }, needs: 'trip' },
  // Gear
  { id: 'weigh', group: 'gear', icon: 'scale', title: 'Weigh items', text: 'Weigh your items one after the other: then every total is exact.', button: 'Start weighing', go: { href: '#/gear?tab=weigh' }, needs: 'items' },
  { id: 'fav', group: 'gear', icon: 'star', title: 'Favourites ★', text: 'Mark your favourite things with ★ and find them all on one page.', button: 'Show favourites', go: { href: '#/favorites' }, needs: 'items' },
  { id: 'wish', group: 'gear', icon: 'gift', title: 'Wishlist & best upgrade', text: 'The wishlist shows which buy saves the most grams per franc.', button: 'Open wishlist', go: { href: '#/gear?tab=wishlist' }, needs: 'items' },
  { id: 'unused', group: 'gear', icon: 'archive', title: 'Long not used', text: 'See which items were on no trip for 12 months.', button: 'Look through', go: { href: '#/gear?unused=1' }, needs: ['items', 'trip'] },
  // Bikes
  { id: 'setup', group: 'bikes', icon: 'bike', title: 'Bike setup', text: 'The bike setup shows which bag sits where, with its weight.', button: 'Open setup', go: { href: '#/bikes' }, needs: 'bikes' },
  { id: 'care', group: 'bikes', icon: 'wrench', title: 'Bike care', text: 'Bike care tells you when the chain, pads and tyres are due.', button: 'Open Bike care', go: { href: '#/bikes?tab=care' }, needs: 'bikes' },
  { id: 'order', group: 'bikes', icon: 'clipboard', title: 'Workshop order', text: 'A workshop order lists what the shop should do, ready to print.', button: 'Open Bike care', go: { href: '#/bikes?tab=care' }, needs: 'bikes' },
  { id: 'receipt', group: 'bikes', icon: 'camera', title: 'Photograph a receipt', text: 'Take a photo of the workshop receipt; it waits in the Inbox.', button: 'Photo of a receipt', go: { run: 'receipt' }, needs: 'bikes' },
  { id: 'km', group: 'bikes', icon: 'counter', title: 'Log km', text: 'Type the km on the counter, and Bike care knows what is due.', button: 'Log km', go: { run: 'km' }, needs: 'bikes' },
  // Your data
  { id: 'backup', group: 'data', icon: 'save', title: 'Backup', text: 'A backup file keeps your data safe and moves it to another device.', button: 'Download backup', go: { run: 'backup' }, needs: 'any' },
  { id: 'install', group: 'data', icon: 'phone', title: 'Use it offline (home screen)', text: 'Add the app to your home screen: it opens like an app and works offline.', button: 'Add to home screen', go: { run: 'install' } },
  { id: 'lang', group: 'data', icon: 'languages', title: 'Deutsch / English', text: 'The app speaks German and English; switch whenever you like.', button: 'Switch language', go: { run: 'lang' } },
  { id: 'demo', group: 'data', icon: 'play', title: 'Try a demo', text: 'Try a demo file: your own data waits aside until you end it.', button: 'Open your data', go: { run: 'data' } },
];
export const TIP = Object.fromEntries(TIPS.map((x) => [x.id, x]));

/* ---------- possible: the data a tip needs is there (v0.30.2, L9) ---------- */

/**
 * Can the tip show with this data? A new user with an empty app sees no "a ride like your last one"
 * and no "items not on any trip for 12 months". Demo trips count: they are data on the screen too.
 */
export function tipPossible(tip, { trips = [], items = [], bikes = [] } = {}, today) {
  const real = trips.filter((t) => !t.skipped);
  const have = {
    trip: real.length > 0,
    pastTrip: real.some((t) => t.startDate && t.startDate <= today),
    items: items.some(isInventory),
    bikes: bikes.length > 0,
    any: trips.length > 0 || items.length > 0 || bikes.length > 0,
  };
  return [tip?.needs ?? []].flat().every((k) => have[k]);
}

/* ---------- used: seen in the data ---------- */

/**
 * The tips the data shows as used: Set of ids. Every input is optional.
 * homePlace: the setting; pace: paceOf(); lastBackup: the newest backup date (or null);
 * sets: the settings record "sets" (own building blocks); notesN: all notes, sorted or not;
 * demo: the running demo; langSet: the language was chosen once; standalone: opened from the home screen.
 */
export function usedTips({ trips = [], items = [], bikes = [], visits = [], debriefs = [], templates = [], sets = [], notesN = 0, homePlace = null, pace = null, lastBackup = null, demo = null, langSet = false, standalone = false } = {}) {
  const used = new Set();
  const on = (id, yes) => yes && used.add(id);
  on('dayride', trips.some(isDayRide));
  on('blocks', (Array.isArray(sets) ? sets : []).some((s) => s?.key?.startsWith('u-')));
  on('templates', templates.length > 0);
  on('gpx', trips.some((t) => !!t.route));
  on('homeweather', !!homePlace);
  on('wxsuggest', trips.some((t) => !!t.wxFrom && t.wxFrom !== 'last')); // v0.47.1: 'last' = copied from the last day ride
  on('bags', trips.some((t) => t.entries?.some((e) => e.packed)));
  on('note', notesN > 0);
  on('event', trips.some((t) => isEvent(t)));
  on('debrief', debriefs.some((d) => d.status === 'done'));
  on('learn', templates.some((tp) => tp.hintLog?.length));
  on('pace', !!pace?.mine || !!pace?.standard);
  on('weigh', items.some((i) => i.weightStatus === 'measured'));
  on('fav', items.some((i) => i.favorite));
  on('wish', items.some((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy'));
  on('setup', bikes.some((b) => Object.values(b.setup ?? {}).some(Boolean)));
  on('care', bikes.some((b) => (b.parts ?? []).some((p) => p.history?.length)));
  on('receipt', visits.some((v) => v.photos?.length));
  on('km', bikes.some((b) => !!b.kmDate));
  on('backup', !!lastBackup);
  on('install', standalone);
  on('lang', langSet);
  on('demo', !!demo);
  return used;
}

/**
 * The tips that fit right now: Set of ids. A trip in the next 14 days: packing, sharing, GPX and the
 * weather suggestions (an event: its preparation); bikes with km: care, km, the workshop order;
 * a trip waiting for its debrief; 3 debriefs: the templates learn and the trend; unweighed items;
 * a wishlist.
 */
export function fittingTips({ trips = [], items = [], bikes = [], debriefs = [] } = {}, today) {
  const fit = new Set();
  const next = nextTrip(trips, today);
  if (next?.startDate && next.startDate <= addDays(today, 14)) {
    ['bags', 'share', 'wxsuggest'].forEach((id) => fit.add(id));
    if (!next.route) fit.add('gpx');
    if (isEvent(next)) fit.add('event');
    if (next.startDate <= today) fit.add('ride');
  }
  if (bikes.some((b) => typeof b.km === 'number' && b.km > 0)) ['care', 'km', 'order'].forEach((id) => fit.add(id));
  if (toDebrief(trips, debriefs, today).length) fit.add('debrief');
  if (debriefs.filter((d) => d.status === 'done').length >= 3) ['learn', 'trend'].forEach((id) => fit.add(id));
  if (items.filter((i) => isInventory(i) && i.weightG == null).length >= 5) fit.add('weigh');
  if (items.some((i) => i.ownership === 'wishlist' || i.ownership === 'to-buy')) fit.add('wish');
  return fit;
}

/* ---------- the state ---------- */

/** A state with every part present (a missing or broken record starts empty). */
export function tipState(value) {
  const v = value && typeof value === 'object' ? value : {};
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  return { known: obj(v.known), tapped: obj(v.tapped), seen: obj(v.seen), paused: obj(v.paused), day: v.day && typeof v.day.date === 'string' && Array.isArray(v.day.ids) ? v.day : null };
}

/** Is a tip resting today? Paused, or shown on 3 earlier days without a tap (rests the 30 days after). */
export function isPaused(state, id, today) {
  const s = tipState(state);
  if (s.paused[id] && today < s.paused[id]) return true;
  const seen = s.seen[id];
  return !!seen && seen.days >= SHOWN_DAYS && seen.last < today && today < addDays(seen.last, PAUSE_DAYS + 1);
}

/** Used: seen in the data, tapped, or "I know it". */
export const isUsed = (state, id, used = new Set()) => used.has(id) || !!tipState(state).tapped[id] || !!tipState(state).known[id];

/** A small stable hash (FNV-1a) of a text: the day's random order. */
export function seed(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * The n tips for today: ids. Today's choice stays (state.day) as long as its tips may still show;
 * free places fill with: never used before used, fitting before the rest, then the day's random order.
 * "I know it" and resting tips never show.
 */
export function pickTips({ state = null, used = new Set(), fit = new Set(), today, n = MIN_TIPS, pool = TIPS } = {}) {
  const s = tipState(state);
  const ok = (id) => !!TIP[id] && pool.some((x) => x.id === id) && !s.known[id] && !isPaused(s, id, today);
  const keep = s.day?.date === today ? s.day.ids.filter(ok) : [];
  if (keep.length >= n) return keep.slice(0, n);
  const fresh = pool
    .map((x) => x.id)
    .filter((id) => ok(id) && !keep.includes(id))
    .map((id) => ({ id, u: isUsed(s, id, used) ? 1 : 0, f: fit.has(id) ? 0 : 1, r: seed(`${today}:${id}`) }))
    .sort((a, b) => a.u - b.u || a.f - b.f || a.r - b.r || a.id.localeCompare(b.id))
    .map((x) => x.id);
  return [...keep, ...fresh].slice(0, n);
}

/**
 * After showing: today's choice and one more day for each shown tip (once a day). A tip with 3 days
 * whose day passed gets its rest written down. Returns { state, changed }.
 */
export function markShown(state, ids, today) {
  const s = structuredClone(tipState(state));
  let changed = false;
  for (const [id, seen] of Object.entries(s.seen)) {
    if (seen.days >= SHOWN_DAYS && seen.last < today) {
      s.paused[id] = addDays(seen.last, PAUSE_DAYS + 1);
      delete s.seen[id];
      changed = true;
    }
  }
  for (const id of ids) {
    const seen = s.seen[id] ?? { days: 0, last: null };
    if (seen.last === today) continue;
    s.seen[id] = { days: seen.days + 1, last: today };
    changed = true;
  }
  if (s.day?.date !== today || s.day.ids.join() !== ids.join()) {
    s.day = { date: today, ids: [...ids] };
    changed = true;
  }
  return { state: s, changed };
}

/** The button of a tip was tapped: used, and its count of days without a tap starts again. */
export function tapTip(state, id, today) {
  const s = structuredClone(tipState(state));
  s.tapped[id] = s.tapped[id] ?? today;
  delete s.seen[id];
  delete s.paused[id];
  return s;
}

/** "I know it" (Noah 2a): the tip never shows again on Today; the overview still lists it. */
export function knowTip(state, id, today) {
  const s = structuredClone(tipState(state));
  s.known[id] = s.known[id] ?? today;
  if (s.day) s.day.ids = s.day.ids.filter((x) => x !== id);
  return s;
}

/* ---------- the 6 tiles ---------- */

/** Important now (Noah 1a): a due backup, care due now, a late task, the weather of a trip in 3 days. */
export const isImportant = (c) => c.key === 'backup' || (c.key === 'wear' && c.prio === 1) || (c.key === 'todo' && c.prio === 1) || (c.key === 'weather' && c.prio <= 2);

/**
 * The tiles of Today from the know.js cards (sorted, most urgent first) and the tips:
 * [{ kind: 'card', card } | { kind: 'tip', id }], at most TILES.
 * Important cards (at most 3), at most 1 further card (only while 3 tips still fit; the "set your
 * home place" card is the weather tip now), then the tips. Too few tips: more data cards fill up.
 * tipsFor(n): the tip ids for n places (pickTips).
 */
export function todayTiles(cards = [], tipsFor, today) {
  const rest = cards.filter((c) => c.key !== 'home');
  const important = rest.filter(isImportant).slice(0, MAX_IMPORTANT);
  const others = rest.filter((c) => !important.includes(c));
  // the further card: the most urgent one (Inbox, template suggestions, a demo, the weekend from
  // Thursday); else the day's pick among the insights. "Still open" without a late row takes turns
  // with the insights: its set-up rows can stay for weeks and would take the place every day.
  const turns = (c) => c.prio >= 5 || c.key === 'todo';
  const urgent = others.filter((c) => !turns(c));
  const calm = others.filter(turns).sort((a, b) => seed(`${today}:${a.key}`) - seed(`${today}:${b.key}`));
  const order = [...urgent, ...calm];
  const further = important.length + 1 + MIN_TIPS <= TILES ? order.slice(0, 1) : [];
  const want = TILES - important.length - further.length;
  const tips = tipsFor(want);
  const fill = order.filter((c) => !further.includes(c)).slice(0, Math.max(0, want - tips.length));
  return [...important, ...further, ...fill].map((card) => ({ kind: 'card', card })).concat(tips.map((id) => ({ kind: 'tip', id })));
}

/**
 * On a phone (Noah: discover what the app can do, but not a long page): the important cards, then
 * tips until 3 tiles show, always at least one tip; the further card and the other tips wait behind
 * "more". Returns { shown, more } in the order of the tiles.
 */
export function phoneSplit(tiles = []) {
  const tips = tiles.filter((x) => x.kind === 'tip');
  if (!tips.length) return { shown: tiles.slice(0, 3), more: tiles.slice(3) };
  const imp = tiles.filter((x) => x.kind === 'card' && isImportant(x.card));
  const pick = new Set([...imp, ...tips.slice(0, Math.max(1, 3 - imp.length))]);
  return { shown: tiles.filter((x) => pick.has(x)), more: tiles.filter((x) => !pick.has(x)) };
}

/* ---------- the overview (#/features) ---------- */

/** All tips by area with ✓: [{ key, label, tips: [{ ...tip, used, known }] }] and { used, total }. */
export function overview(state, used = new Set()) {
  const s = tipState(state);
  const groups = GROUPS.map((g) => ({ ...g, tips: TIPS.filter((x) => x.group === g.key).map((x) => ({ ...x, used: isUsed(s, x.id, used), known: !!s.known[x.id] })) }));
  const n = groups.reduce((a, g) => a + g.tips.filter((x) => x.used).length, 0);
  return { groups, used: n, total: TIPS.length };
}

/* ---------- read and write (the settings record "tips") ---------- */

/** Change the state in one step (read, change, write in a transaction: no tap gets lost). */
export async function updateTips(db, fn) {
  await db.transaction('rw', db.settings, async () => {
    const cur = (await db.settings.get(TIPS_KEY))?.value ?? null;
    const next = fn(tipState(cur));
    if (next) await db.settings.put({ key: TIPS_KEY, value: next });
  });
}
