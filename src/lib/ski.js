/**
 * v0.97.0 «Skitouren» (Noah 11.10.2026, mockups A–E approved): the ski touring page under Touren.
 * Pure functions only (no database, no screen), tested in tests/ski.test.js.
 *
 *   groups     the five groups of the backpack check, in Noah's order; an item's group is its own
 *              optional field `skiGroup` (item dialog, area ski), else its name (LVS, Schaufel, Sonde →
 *              safety), else its category.
 *   next trip  the next ski trip (domain ski, not finished or skipped, from today on), else the last one.
 *   season     1 November – 31 May (Europe/Zurich, localDay()). The season id is «2026/27»; October
 *              already counts to the coming season (preparation), June–September to the one just over.
 *   trip.ski   { peak, place, hm, skiItemId, activeMin, elapsedMin, with, alone, good, change,
 *              changeTags, learning, turnAt, batteryPct, savedAt, strava }: what «Nach der Tour» and
 *              the start check keep on the trip. The season sums come from it.
 *   care       the season care tasks in three phases; done entries live in the settings record
 *              'ski.care' = [{ id, task, day, hm, season }], like a bike's care history.
 * No imports: domains.js takes START_CHECKS from here (gear.js → blocks2026.js → domains.js would be a circle).
 */
export const SKI = 'ski';

/** The five groups of the backpack check (Noah's list order). name: English key for t(). */
export const SKI_GROUPS = [
  { key: 'hardware', name: 'Hardware & ascent' },
  { key: 'safety', name: 'Safety gear' },
  { key: 'clothing', name: 'Clothing|ski' },
  { key: 'protect', name: 'Navigation & protection' },
  { key: 'food', name: 'Food & drink|ski' },
];
export const SKI_GROUP = Object.fromEntries(SKI_GROUPS.map((g) => [g.key, g]));

/** The group of a category (fallback when an item has no own group). */
export const GROUP_BY_CATEGORY = {
  tools: 'hardware',
  shoes: 'hardware',
  bags: 'hardware',
  bike: 'hardware',
  rain: 'clothing',
  onbike: 'clothing',
  offbike: 'clothing',
  elec: 'protect',
  hyg: 'protect',
  sleep: 'protect',
  nav: 'protect',
  light: 'protect',
  docs: 'protect',
  lux: 'protect',
  food: 'food',
  cook: 'food',
};
/** Avalanche safety by name: LVS, Schaufel, Sonde (also inside German compounds) and the English words. */
const SAFETY = /lvs|schaufel|sonde|avalanche|transceiver|shovel|\bprobe\b/i;

/** The ski group of an item: its own field, else its name (safety), else its category, else protect. */
export function skiGroupOf(item) {
  if (item?.skiGroup && SKI_GROUP[item.skiGroup]) return item.skiGroup;
  if (SAFETY.test(`${item?.name ?? ''} ${item?.nameDe ?? ''}`)) return 'safety';
  return GROUP_BY_CATEGORY[item?.category] ?? 'protect';
}

/** Is this a ski trip? */
export const isSki = (trip) => trip?.domain === SKI;
/** A trip that is over or will not happen. */
const closed = (trip) => !!trip?.skipped || !!trip?.finished || trip?.status === 'done';

/** All ski trips, newest first. */
export const skiTrips = (trips) => (trips ?? []).filter(isSki).sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? ''));

/**
 * The ski trip the page is about: the next one (not finished or skipped, start today or later,
 * soonest first), else the last one. → { trip, upcoming } or null.
 */
export function nextSkiTrip(trips, today) {
  const all = skiTrips(trips);
  const next = all.filter((t) => !closed(t) && t.startDate && t.startDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (next) return { trip: next, upcoming: true };
  return all[0] ? { trip: all[0], upcoming: false } : null;
}

/** A ski trip that is over (finished, or its day has passed), not skipped. */
export const isPastSki = (trip, today) => isSki(trip) && !trip.skipped && (!!trip.finished || trip.status === 'done' || (!!trip.startDate && trip.startDate < today));
/** «Nach der Tour» saved? */
export const hasNotes = (trip) => !!trip?.ski?.savedAt;

/** The last ski trip that is over and has no notes yet, else null. */
export function lastWithoutNotes(trips, today) {
  return skiTrips(trips).find((t) => isPastSki(t, today) && !hasNotes(t)) ?? null;
}
/** The last ski trip that is over (with or without notes), else null. */
export const lastPastSki = (trips, today) => skiTrips(trips).find((t) => isPastSki(t, today)) ?? null;

/* ---------- the season ---------- */

const ym = (day) => [Number(String(day).slice(0, 4)), Number(String(day).slice(5, 7))];
/** In season: 1 November – 31 May. */
export function inSeason(day) {
  const [, m] = ym(day);
  return m >= 11 || m <= 5;
}
/** The season a day belongs to: «2026/27». October counts to the coming season. */
export function seasonId(day) {
  const [y, m] = ym(day);
  const start = m >= 10 ? y : y - 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}
/** The first day of a season (1 November). */
export const seasonStart = (id) => `${String(id).slice(0, 4)}-11-01`;

/** The ski trips of a season (not skipped), newest first. */
export const seasonTrips = (trips, id) => skiTrips(trips).filter((t) => !t.skipped && t.startDate && seasonId(t.startDate) === id);

/** Metres climbed of a trip (from «Nach der Tour»), or 0. */
export const hmOf = (trip) => Math.max(0, Math.round(Number(trip?.ski?.hm) || 0));

/**
 * The season in numbers: tours that are over (or have notes), metres climbed, peaks (newest first).
 * → { id, tours, hm, peaks: [{ name, hm, day, tripId }] }
 */
export function seasonStats(trips, today) {
  const id = seasonId(today);
  const done = seasonTrips(trips, id).filter((t) => hasNotes(t) || isPastSki(t, today));
  return {
    id,
    tours: done.length,
    hm: done.reduce((s, t) => s + hmOf(t), 0),
    peaks: done.filter((t) => t.ski?.peak?.trim()).map((t) => ({ name: t.ski.peak.trim(), hm: hmOf(t), day: t.startDate, tripId: t.id })),
  };
}

/* ---------- the backpack check ---------- */

/**
 * A trip's entries by ski group, in the order of SKI_GROUPS (empty groups left out).
 * → [{ key, name, rows: [{ entry, item }], packed, total }]
 */
export function checkGroups(trip, items) {
  const byId = new Map((items ?? []).map((i) => [i.id, i]));
  const out = SKI_GROUPS.map((g) => ({ ...g, rows: [] }));
  const at = Object.fromEntries(out.map((g, n) => [g.key, n]));
  for (const entry of trip?.entries ?? []) {
    const item = byId.get(entry.itemId);
    if (!item) continue;
    out[at[skiGroupOf(item)]].rows.push({ entry, item });
  }
  return out.filter((g) => g.rows.length).map((g) => ({ ...g, packed: g.rows.filter((r) => r.entry.packed).length, total: g.rows.length }));
}

/** n of m packed over all groups. */
export function checkCount(groups) {
  return { packed: groups.reduce((s, g) => s + g.packed, 0), total: groups.reduce((s, g) => s + g.total, 0) };
}

/** A trip's entries with one entry packed or unpacked (the same field Pack uses). */
export const togglePacked = (entries, itemId, slot) => (entries ?? []).map((e) => (e.itemId === itemId && e.slot === slot ? { ...e, packed: !e.packed } : e));

/* ---------- the start check ---------- */

/** The five checks at the car park (trip.ready ids). label: English key for t(). */
export const START_CHECKS = [
  { id: 'lvs', label: 'Avalanche transceiver on, set to send' },
  { id: 'battery', label: 'Transceiver battery' },
  { id: 'group', label: 'Group check done' },
  { id: 'bulletin', label: 'Avalanche bulletin read' },
  { id: 'turn', label: 'Turnaround time set' },
];
export const TURN_TIMES = ['12:30', '13:00', '13:30'];

/** trip.ready with the missing start checks added (never one taken away); null when nothing is missing. */
export function withStartChecks(ready) {
  const list = Array.isArray(ready) ? ready : [];
  const have = new Set(list.map((r) => r.id));
  const add = START_CHECKS.filter((c) => !have.has(c.id)).map((c) => ({ id: c.id, label: c.label, done: false }));
  return add.length ? [...list, ...add] : null;
}

/** A turnaround time «HH:MM», or '' when the text is none. */
export function turnTime(s) {
  const m = String(s ?? '').trim().match(/^(\d{1,2})[:.h ]?(\d{2})$/);
  if (!m) return '';
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? `${String(h).padStart(2, '0')}:${m[2]}` : '';
}

/** Is it time to turn around? A ski trip today with a turnaround time that has come. now: a Date. */
export function turnDue(trip, today, now) {
  const at = turnTime(trip?.ski?.turnAt);
  if (!isSki(trip) || trip.skipped || trip.finished || trip.startDate !== today || !at) return false;
  const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return hm >= at;
}

/* ---------- after the tour ---------- */

/** «3:40», «3 h 40», «3h», «220» (minutes) → minutes, or null. */
export function parseDuration(s) {
  const v = String(s ?? '').trim().toLowerCase();
  if (!v) return null;
  let m = v.match(/^(\d{1,2})\s*(?::|h|\.)\s*(\d{1,2})?\s*(?:min)?$/);
  if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0);
  m = v.match(/^(\d{1,4})\s*(?:min)?$/);
  return m ? Number(m[1]) : null;
}
/** minutes → «3:40» (or '' for none). */
export const durationText = (min) => (Number.isFinite(min) && min > 0 ? `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}` : '');

/** The names of everyone who came along on a ski trip before, most often first. */
export function companions(trips) {
  const n = new Map();
  for (const t of skiTrips(trips)) for (const name of t.ski?.with ?? []) if (name?.trim()) n.set(name.trim(), (n.get(name.trim()) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
}

/** The ready chips of «Was mache ich nächstes Mal anders?» (English keys for t()). */
export const CHANGE_TAGS = ['too warm on the way up', 'cold hands on the way down'];

/** Words that say which group a free learning belongs to (else it is a general one). */
const GROUP_WORDS = [
  ['safety', /lvs|lawine|avalanche|schaufel|shovel|sonde|probe|bulletin/i],
  ['hardware', /harscheisen|crampon|fell|skin|bindung|binding|schuh|boot|stock|stöcke|pole|ski\b|wachs|wax/i],
  ['clothing', /jacke|jacket|handschuh|glove|mütze|hat|kleid|cloth|warm|kalt|cold|schicht|layer|shirt|hose|trousers/i],
  ['food', /essen|food|tee|tea|trink|drink|riegel|bar\b|thermos|snack/i],
  ['protect', /brille|goggle|sonne|sun|karte|map|akku|battery|handy|phone|erste hilfe|first aid|biwak|bivy/i],
];
/** The group a free text points to, or null. */
export const groupOfText = (text) => GROUP_WORDS.find(([, re]) => re.test(String(text ?? '')))?.[0] ?? null;

/**
 * The learnings «Nach der Tour» makes (area ski): each ticked clothing chip and the clothing text
 * (group clothing), and «Learning und Bemerkenswertes» (its group by its words, else general).
 * Saving again replaces the learnings this trip made before (same tripId), so none is doubled.
 * → { add: [learning], drop: [ids] }
 */
export function afterLearnings(trip, ski, learnings, { now = new Date().toISOString(), tr = (s) => s } = {}) {
  const mine = (learnings ?? []).filter((l) => l.from === 'ski-after' && l.tripId === trip.id);
  const others = (learnings ?? []).filter((l) => !mine.includes(l));
  let next = Math.max(0, ...others.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
  const add = [];
  const learn = (rule, skiGroup) =>
    add.push({ id: next++, topic: 'Ski tour', rule, action: '', itemIds: [], source: trip.title ?? '', appliesTo: [SKI], area: SKI, skiGroup, priority: 'medium', confirmed: 0, createdAt: now, tripId: trip.id, from: 'ski-after' });
  for (const tag of ski.changeTags ?? []) if (String(tag).trim()) learn(CHANGE_TAGS.includes(tag) ? tr(tag) : String(tag).trim(), 'clothing');
  if (ski.change?.trim()) learn(ski.change.trim(), 'clothing');
  if (ski.learning?.trim()) learn(ski.learning.trim(), groupOfText(ski.learning));
  return { add, drop: mine.map((l) => l.id) };
}

/** The ski learnings by group for the backpack check, newest first: { general: [], hardware: [], … }. */
export function learningsByGroup(learnings, n = 3) {
  const out = { general: [], ...Object.fromEntries(SKI_GROUPS.map((g) => [g.key, []])) };
  const ski = (learnings ?? []).filter((l) => l.area === SKI).sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  for (const l of ski) {
    const k = l.skiGroup && out[l.skiGroup] ? l.skiGroup : 'general';
    if (out[k].length < n) out[k].push(l);
  }
  return out;
}

/* ---------- Strava ---------- */

/** Strava's ski activity types (activities.csv «Activity Type»). */
export const SKI_TYPES = /backcountry\s*ski|nordic\s*ski/i;

/** The Strava ski activity of a trip's day (from 'ski.strava'), the longest climb first, or null. */
export function stravaFor(trip, activities) {
  if (!trip?.startDate) return null;
  return (activities ?? []).filter((a) => a.date === trip.startDate && SKI_TYPES.test(a.type ?? '')).sort((a, b) => (b.hm ?? 0) - (a.hm ?? 0))[0] ?? null;
}

/** The ski activities kept, merged with new ones (same Strava id or same day and name: replaced). */
export function mergeStrava(kept, fresh) {
  const key = (a) => a.stravaId || `${a.date}|${a.name}`;
  const map = new Map((kept ?? []).map((a) => [key(a), a]));
  for (const a of fresh ?? []) map.set(key(a), a);
  return [...map.values()].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

/* ---------- the season care ---------- */

export const CARE_KEY = 'ski.care';
export const CARE_TASKS_KEY = 'ski.careTasks';
export const WAX_EVERY = 5000;
export const WAX_SOON = 1000;

/** The three phases. sub: English key for t(). */
export const CARE_PHASES = [
  { key: 'start', name: 'Season start', sub: 'November' },
  { key: 'during', name: 'During the season', sub: 'by metres climbed' },
  { key: 'end', name: 'Season end', sub: 'May' },
];

/** The built-in tasks (English keys for t()). */
export const CARE_TASKS = [
  { id: 'lvs', phase: 'start', task: 'Transceiver: new batteries + function test', hint: 'Send, receive, range' },
  { id: 'skins', phase: 'start', task: 'Check the skin glue', hint: 'Does it still stick everywhere? Otherwise re-glue' },
  { id: 'service', phase: 'start', task: 'Ski service: base and edges', hint: 'Workshop or yourself' },
  { id: 'binding', phase: 'start', task: 'Check the binding', hint: 'Pins, heel piece, setting fits the boot' },
  { id: 'boots', phase: 'start', task: 'Boots: buckles and soles', hint: 'The walk mode moves freely' },
  { id: 'crampons', phase: 'start', task: 'Ski crampons fit the binding', hint: 'Put them in once' },
  { id: 'wax', phase: 'during', task: 'Wax the skis', hint: 'About every 5,000 m climbed' },
  { id: 'dry', phase: 'during', task: 'Dry the skins', hint: 'After every tour, not on the heater' },
  { id: 'edges', phase: 'during', task: 'Sharpen the edges', hint: 'After rocky descents' },
  { id: 'store-skins', phase: 'end', task: 'Store the skins with protective foil', hint: 'Cool and dark' },
  { id: 'store-skis', phase: 'end', task: 'Store the skis with a layer of wax', hint: 'Summer wax, do not scrape it off' },
  { id: 'lvs-out', phase: 'end', task: 'Transceiver: batteries out', hint: 'Otherwise they leak' },
  { id: 'dry-boots', phase: 'end', task: 'Dry the boots open', hint: 'Liners out' },
];

/** The task list: the built-in ones and your own ({ id, phase, task, own: true }), hidden ones left out. */
export function careTasks(custom = null) {
  const own = (custom?.own ?? []).filter((x) => x?.id && x.task?.trim() && CARE_PHASES.some((p) => p.key === x.phase)).map((x) => ({ ...x, own: true }));
  const hidden = new Set(custom?.hidden ?? []);
  return [...CARE_TASKS, ...own].filter((x) => !hidden.has(x.id));
}

/** The metres climbed in a season up to today. */
export const seasonHm = (trips, id, today) => seasonTrips(trips, id).filter((t) => hasNotes(t) || isPastSki(t, today)).reduce((s, t) => s + hmOf(t), 0);

/**
 * The state of one task today. entries: 'ski.care'; hm: the metres climbed this season so far.
 * → { state: 'ok' | 'due' | 'soon' | '', done: entry | null, left: metres to the next wax (wax only) }
 *   start tasks: due from 1 November until done this season (October: soon);
 *   wax: due when the metres since the last wax this season reach 5,000 (soon from 4,000);
 *   end tasks: due from 1 May until done (April: soon); the others have no due date.
 */
export function careState(task, entries, today, hm) {
  const id = seasonId(today);
  const [, m] = ym(today);
  const mine = (entries ?? []).filter((e) => e.task === task.id && e.season === id).sort((a, b) => (b.day ?? '').localeCompare(a.day ?? ''));
  const done = mine[0] ?? null;
  if (task.id === 'wax') {
    const since = Math.max(0, hm - (done ? Number(done.hm) || 0 : 0));
    const left = Math.max(0, WAX_EVERY - since);
    const state = left === 0 ? 'due' : left <= WAX_SOON ? 'soon' : done ? 'ok' : '';
    return { state, done, left };
  }
  if (done) return { state: 'ok', done, left: null };
  if (task.phase === 'start') return { state: m >= 11 || m <= 5 ? 'due' : m === 10 ? 'soon' : '', done: null, left: null };
  if (task.phase === 'end') return { state: m >= 5 && m <= 9 ? 'due' : m === 4 ? 'soon' : '', done: null, left: null };
  return { state: '', done: null, left: null };
}

/** How many tasks are due today. */
export const careDue = (tasks, entries, today, hm) => tasks.filter((x) => careState(x, entries, today, hm).state === 'due').length;

/** A done entry for the care history. */
export const careEntry = (task, today, hm, now = Date.now()) => ({ id: `ski-care-${now.toString(36)}-${task.id}`, task: task.id, day: today, hm, season: seasonId(today) });
