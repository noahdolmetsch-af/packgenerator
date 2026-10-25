/**
 * Eigene Listen (Noah 14.10.2026 «1a und b 2 b 3a», «4 ok 5 ok»): as many lists as you like, each with a
 * name and points, with boxes to tick or as plain notes (2b). All of them live in Kalender › Merken (3a);
 * each one can also be pinned to one place: a trip (it shows as an extra block when packing it, 5), Material,
 * Velos, Aktiv or Balance («Meine Ideen» of HN4c is such a list, pinned to Balance, 4). Pure functions;
 * listsdb.js writes.
 *   list = { id, name, check: boolean, pin: null | { place: PLACE, tripId? }, items: [item], created }
 *   item = { id, text, done: null | ISO, at: ISO, area?, date? }   (area and date: the «Meine Ideen» extras)
 */

export const LISTS_KEY = 'merken.lists';

/** The places a list can be pinned to, in this order (the trip one asks for the trip). */
export const PIN_PLACES = [
  { key: 'trips', label: 'A trip' },
  { key: 'gear', label: 'Gear|place' },
  { key: 'bikes', label: 'Bikes|place' },
  { key: 'active', label: 'Active|place' },
  { key: 'balance', label: 'Balance' },
];
const PLACE_KEYS = PIN_PLACES.map((p) => p.key);

/** A clean pin, or null («nur in Merken»); a trip pin needs its trip. */
export function cleanPin(pin) {
  if (!pin || !PLACE_KEYS.includes(pin.place)) return null;
  if (pin.place === 'trips') return pin.tripId ? { place: 'trips', tripId: pin.tripId } : null;
  return { place: pin.place };
}

/** A new list; an empty name gives null. */
export function newList({ name, check = true, pin = null } = {}, { id, now = new Date().toISOString() } = {}) {
  const n = String(name ?? '').trim();
  if (!n) return null;
  return { id, name: n, check: !!check, pin: cleanPin(pin), items: [], created: now };
}

/** The list with a new point at the end; an empty text changes nothing. */
export function addPoint(list, text, { id, now = new Date().toISOString(), area = null, date = null } = {}) {
  const tx = String(text ?? '').trim();
  if (!tx) return list;
  const item = { id, text: tx, done: null, at: now };
  if (area) item.area = area;
  if (date) item.date = date;
  return { ...list, items: [...list.items, item] };
}

export const togglePoint = (list, itemId, now = new Date().toISOString()) => ({ ...list, items: list.items.map((x) => (x.id === itemId ? { ...x, done: x.done ? null : now } : x)) });
export const editPoint = (list, itemId, changes) => ({ ...list, items: list.items.map((x) => (x.id === itemId ? { ...x, ...changes } : x)) });
export const removePoint = (list, itemId) => ({ ...list, items: list.items.filter((x) => x.id !== itemId) });
/** «Alle zurücksetzen»: every box empty again (a packing errand list is used again on the next trip). */
export const resetPoints = (list) => ({ ...list, items: list.items.map((x) => ({ ...x, done: null })) });

/** Open points first (in their order), ticked ones after; a list without boxes keeps its order. */
export const pointsOf = (list) => (list.check ? [...list.items.filter((x) => !x.done), ...list.items.filter((x) => x.done)] : list.items);
/** How many points are still open (a list without boxes: all of them). */
export const openCount = (list) => list.items.filter((x) => !list.check || !x.done).length;

/** The lists pinned to a place (and, for a trip, to that trip). */
export const pinnedTo = (lists, place, tripId = null) => lists.filter((l) => !l.ended && l.pin?.place === place && (place !== 'trips' || l.pin.tripId === tripId));

/* ---------- «Meine Ideen» (HN4c, Noah «4 ok»): one of the lists, pinned to Balance ---------- */

export const IDEAS_ID = 'ideas';
/** The ideas list as it is made the first time an idea is added. */
export const ideasList = (name, now = new Date().toISOString()) => ({ id: IDEAS_ID, name, check: true, pin: { place: 'balance' }, items: [], created: now });
/** «Nicht jetzt» on a tip hides that area's tip for 7 days. */
export const NOT_NOW_KEY = 'ideas.notNow';
/** «Bereiche wählen» (HN4c, Noah «8a»): the areas that get no tips. */
export const HIDDEN_AREAS_KEY = 'ideas.hiddenAreas';
export const tipHidden = (notNow, cat, today) => !!notNow?.[cat] && addDaysIso(notNow[cat], 7) > today;
const addDaysIso = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/**
 * The open own ideas for the Balance tile (HN4c «im Wechsel»): with a date first (soonest, a past date
 * too), then the newest. → [item]
 */
export function ideaRotation(list) {
  const open = (list?.items ?? []).filter((x) => !x.done);
  const dated = open.filter((x) => x.date).sort((a, b) => a.date.localeCompare(b.date));
  const rest = open.filter((x) => !x.date).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return [...dated, ...rest];
}

/** The areas with a value, weakest first (HN4c «Für deine Balance»: the 3 weakest on top). cats: balance().cats */
export const weakest = (cats) => cats.filter((c) => c.value != null).sort((a, b) => a.value - b.value);
