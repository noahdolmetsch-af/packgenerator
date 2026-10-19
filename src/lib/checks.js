/**
 * v0.106.0 «Bausteine bearbeiten» (Noah 1-5a, 12.10.2026; mockups A and B): two more checklists beside
 * the ready check, with its rules: one list per trip, changed only for this trip, saved as the standard
 * of its area by hand.
 *   trip.eve    [{ id, label, done }]  the evening before the start (page «Gepackt», Today from 18:00)
 *   trip.after  [{ id, label, done }]  back home (page «Tour beendet», before the debrief)
 * A trip without its own list shows the standard (settings eveStandard[.<area>] / afterStandard[.<area>])
 * or the suggestion below; the list is written to the trip on its first change.
 * Labels of the suggestions are English keys for t(); own rows keep the words typed.
 * v0.111.0 (mockups V1–V6, Noah «v1-v4 ok» 22:34 and «v5-6 ok» 22:39, 12.10.2026): each check is a row
 * on its page that opens a sheet (CheckSheet), the list is changed in its own sheet (CheckEdit) for
 * this trip or all trips of the type, and Ich › Checks pro Reiseart shows the lists of every type.
 */
import { BIKEPACKING, domainOf } from './domains.js';
import { START_CHECKS } from './ski.js';

// Data cleanup 14.10.2026 (Noah 2a–4a): every suggested check list lives here, in one place: the ready
// check (bike trips and per area), the evening before and back home. Keys of areas are written out
// ('bikepacking'), because domains.js reads this file too.

/**
 * The ready check suggested for every new trip (decision 7: editable per trip).
 * Cleaned up 4.10.2026 with Noah: one short list without groups; the "always with me" items
 * are now normal items marked "On every trip" (see alwaysEntries). Noah can save his own
 * list as the standard (setting "readyStandard"), which then replaces this one.
 */
// v0.45.2 (Noah 9.10.2026, "gilt primär"): the base check before every ride starts with his six
// things; from the old list stay what still makes sense (kit, charged, tyres, phone/wallet/keys).
// Dropped: food, "Backpack packed" (now the mini backpack), route on the Garmin, live tracking.
export const READY_DEFAULT = [
  { id: 'lock', label: 'Lock' },
  { id: 'minipack', label: 'Mini backpack' },
  { id: 'bottle', label: 'Bottle filled' },
  { id: 'glasses', label: 'Sunglasses' },
  { id: 'cap', label: 'Cap' },
  { id: 'wind', label: 'Wind jacket' },
  { id: 'kit', label: 'Helmet, shoes, gloves' },
  { id: 'charged', label: 'Devices charged' },
  { id: 'tyres', label: 'Tyre pressure checked' },
  { id: 'wallet', label: 'Phone, wallet, keys' },
];
/** The ids of the ready check before 0.45.2 (basicCheck2026 replaces them, own rows stay). */
export const READY_OLD_IDS = ['kit', 'charged', 'fuel', 'backpack', 'route', 'tyres', 'wallet', 'tracking'];

/** The ready check suggested for a trip without a bike (the bike one speaks of helmet and tyres). */
export const READY_BY_DOMAIN = {
  // «Skitouren» (mockup C): the five checks of the Start-Check (lib/ski.js START_CHECKS) for new ski
  // trips; a trip made before keeps its own list (the Start-Check adds what is missing).
  ski: START_CHECKS.map((c) => ({ id: c.id, label: c.label })),
  weekend: [
    { id: 'tickets', label: 'Tickets or route checked' },
    { id: 'charged', label: 'Devices charged' },
    { id: 'wallet', label: 'Phone, wallet, keys' },
  ],
  travel: [
    { id: 'passport', label: 'Passport, visa, insurance' },
    { id: 'cards', label: 'Cards and some cash' },
    { id: 'charged', label: 'Devices charged, adapter packed' },
    { id: 'wallet', label: 'Phone, wallet, keys' },
  ],
};


export const CHECK_KINDS = ['eve', 'after'];

const EVE_BASE = [
  { id: 'weather', label: 'Look at the weather again' },
  { id: 'route', label: 'Route offline on the phone' },
  { id: 'charge', label: 'Charge phone and power bank' },
];
const AFTER_BASE = [
  { id: 'dry', label: 'Dry wet things' },
  { id: 'refill', label: 'Refill first aid, snacks and sun cream' },
  { id: 'charge', label: 'Charge phone, power bank and lamp' },
  { id: 'broken', label: 'Note what broke' },
];

/** The suggested lists per area (Content doc «Skitour und Wandern», 11.10.2026). */
export const CHECKS_BY_DOMAIN = {
  // v0.111.0 (mockup V4 «Checks pro Reiseart», Noah «v1-v4 ok» 12.10.2026 22:34): each trip type its own list
  eve: {
    bikepacking: [
      { id: 'weather', label: 'Look at the weather again' },
      { id: 'gps', label: 'Route on the GPS' },
      { id: 'charge', label: 'Charge lights, GPS and phone' },
      { id: 'tyres', label: 'Check tyre pressure and chain' },
      { id: 'bottles', label: 'Fill the bottles' },
    ],
    ski: [
      { id: 'bulletin', label: 'Read the avalanche bulletin' },
      { id: 'weather', label: 'Look at the weather again' },
      { id: 'threes', label: 'Go through the 3×3' },
      { id: 'route', label: 'Route offline on the phone' },
      { id: 'charge', label: 'Charge transceiver, watch and phone' },
      { id: 'share', label: 'Share the tour plan' },
      { id: 'tea', label: 'Make tea, fill the thermos' },
      { id: 'alarm', label: 'Set the alarm' },
    ],
    hiking: [
      { id: 'hut', label: 'Hut confirmed, arrival announced' },
      { id: 'train', label: 'Look up the train or bus' },
      { id: 'route', label: 'Route offline on the phone' },
      { id: 'weather', label: 'Look at the weather again' },
      { id: 'food', label: 'Lay out the food' },
    ],
    weekend: [
      { id: 'tickets', label: 'Look up tickets and times' },
      { id: 'address', label: 'Address of the stay offline' },
      { id: 'charge', label: 'Charge phone and power bank' },
    ],
    travel: [
      { id: 'docs', label: 'Passport and bookings at hand' },
      { id: 'cash', label: 'Cash and card kept apart' },
      { id: 'adapter', label: 'Pack the plug adapter' },
      { id: 'charge', label: 'Charge phone and power bank' },
    ],
  },
  after: {
    bikepacking: [{ id: 'bike', label: 'Clean the bike and oil the chain' }, ...AFTER_BASE],
    // v0.111.0 (mockups V4 and V6, Noah «v5-6 ok» 12.10.2026 22:39)
    ski: [
      { id: 'skins', label: 'Skins on their foil, to dry' },
      { id: 'dry', label: 'Dry inner boots and gloves' },
      { id: 'lvs', label: 'Transceiver off, note the battery' },
      { id: 'refill', label: 'Refill first aid and snacks' },
      { id: 'charge', label: 'Charge phone, power bank and lamp' },
      { id: 'broken', label: 'Note what broke' },
      { id: 'back', label: 'Report back' },
    ],
    hiking: [{ id: 'boots', label: 'Dry and clean the boots' }, { id: 'bottle', label: 'Rinse and dry the bottle' }, ...AFTER_BASE.slice(1)],
    weekend: [{ id: 'wash', label: 'Wash the clothes' }, AFTER_BASE[2]],
    travel: [{ id: 'wash', label: 'Wash the clothes' }, AFTER_BASE[2], AFTER_BASE[3]],
  },
};

/** Where the own standard of a check of an area is stored (settings key), like readyKey. */
export const checkKey = (kind, domain) => (!domain || domain === BIKEPACKING ? `${kind}Standard` : `${kind}Standard.${domain}`);

/** The suggestion of an area (an area without its own list gets the bikepacking one's base). */
export const suggested = (kind, domain) => CHECKS_BY_DOMAIN[kind]?.[domain] ?? (kind === 'eve' ? EVE_BASE : AFTER_BASE);

/** A fresh list: the saved standard (if any) or the suggestion, nothing ticked. */
export const freshCheck = (kind, domain, standard = null) => (standard?.length ? standard : suggested(kind, domain)).map((r) => ({ id: r.id, label: r.label, done: false }));

/** The list a trip shows: its own (once changed) or a fresh one. */
export const checkOf = (trip, kind, standard = null) => (Array.isArray(trip?.[kind]) ? trip[kind] : freshCheck(kind, domainOf(trip), standard));

export const checkCount = (list) => ({ done: list.filter((r) => r.done).length, total: list.length });

export const toggleCheck = (list, id) => list.map((r) => (r.id === id ? { ...r, done: !r.done } : r));

export const removeCheck = (list, id) => list.filter((r) => r.id !== id);

/** Add an own row at the end; empty words add nothing. */
export function addCheck(list, label, now = Date.now()) {
  const words = String(label ?? '').trim();
  return words ? [...list, { id: `own-${now.toString(36)}`, label: words, done: false }] : list;
}

/** The trip's list as a standard: ids of own rows become stable, ticks are dropped. */
export const asStandard = (list, now = Date.now()) => list.map((r, n) => ({ id: r.id.startsWith('own-') ? `std-${n}-${now.toString(36)}` : r.id, label: r.label }));

/** Is the trip's list different from the standard it would start with? */
export const differs = (list, fresh) => list.map((r) => r.label).join('|') !== fresh.map((r) => r.label).join('|');

/* ---------- v0.111.0 Vorabend-Check (mockups V1–V4, Noah «v1-v4 ok» 12.10.2026 22:34) ---------- */

/** Rows that open a page: an outside page (the app only opens it, never reads it) or the charge list. */
export const CHECK_LINKS = {
  bulletin: { href: 'https://www.slf.ch/', label: 'SLF', out: true },
  weather: { href: 'https://www.meteoschweiz.admin.ch/', label: 'MeteoSwiss', out: true },
  charge: { href: '#/pack?charge', label: 'Charge list', out: false },
};

/** «Gilt für»: all trips of a type (V3), and the plural for the button. */
export const ALL_OF = { bikepacking: 'All bikepacking trips', ski: 'All ski tours', hiking: 'All hikes', weekend: 'All weekends', travel: 'All world trips' };

/** The first row not ticked yet, or null. */
export const nextOpen = (list) => list.find((r) => !r.done) ?? null;

/** Move a row from one place to another (sorting in the editor). */
export function moveCheck(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const out = [...list];
  const [row] = out.splice(from, 1);
  out.splice(to, 0, row);
  return out;
}

/** The edited rows as the trip's list: rows kept keep their tick, new ones start open. */
export const keepTicks = (draft, list) => draft.map((r) => ({ id: r.id, label: r.label, done: !!list.find((x) => x.id === r.id)?.done }));

/** Suggested rows of the type not in the list (by id), for «Vorschläge» in the editor. */
export const missingSuggestions = (kind, domain, list) => suggested(kind, domain).filter((r) => !list.some((x) => x.id === r.id));

const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * What was missing on earlier trips of this type, from their debriefs (missing: [{ id, name }]),
 * newest first: [{ name, at, n }]; at: the day of the newest debrief (YYYY-MM-DD), n: how often.
 * Not offered again when a row of the list already names it.
 */
export function missedBefore(trips, debriefs, domain, list = [], { except = null } = {}) {
  const byTrip = Object.fromEntries(trips.map((tr) => [tr.id, tr]));
  const found = new Map();
  const sorted = [...debriefs].filter((d) => d?.missing?.length).sort((a, b) => String(b.doneAt ?? b.updatedAt ?? '').localeCompare(String(a.doneAt ?? a.updatedAt ?? '')));
  for (const d of sorted) {
    const tr = byTrip[d.tripId];
    if (!tr || tr.id === except || domainOf(tr) !== domain) continue;
    for (const m of d.missing) {
      const name = String(m.name ?? '').trim();
      if (!name) continue;
      const key = norm(name);
      if (list.some((r) => norm(r.label).includes(key))) continue;
      const at = String(d.doneAt ?? d.updatedAt ?? tr.startDate ?? '').slice(0, 10);
      const was = found.get(key);
      if (was) was.n += 1;
      else found.set(key, { name, at, n: 1 });
    }
  }
  return [...found.values()];
}

/**
 * How often a row was ticked on earlier trips of this type with their own list (V4; before: only trips
 * started before that day, so a planned trip does not count yet):
 * { [id]: { done, n } } — n: trips whose list had the row, done: how many of them ticked it.
 */
export function checkStats(trips, kind, domain, { except = null, before = null } = {}) {
  const out = {};
  for (const tr of trips) {
    if (tr.id === except || domainOf(tr) !== domain || !Array.isArray(tr[kind])) continue;
    if (before && !(String(tr.startDate ?? '') < before)) continue; // only trips that have started
    for (const r of tr[kind]) {
      const s = (out[r.id] ??= { done: 0, n: 0 });
      s.n += 1;
      if (r.done) s.done += 1;
    }
  }
  return out;
}

/** The newest trip of this type with its own list of this kind (V4 «zuletzt …»), or null; before: only trips started before that day. */
export const lastWithOwn = (trips, kind, domain, before = null) =>
  [...trips].filter((tr) => domainOf(tr) === domain && Array.isArray(tr[kind]) && tr[kind].length && (!before || String(tr.startDate ?? '') < before)).sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')))[0] ?? null;
