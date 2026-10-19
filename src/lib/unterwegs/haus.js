/**
 * Paket 4 «Haus-Check vor der Abfahrt» (Noah 19.10.2026 «1a»): your own checklist for the flat before
 * you leave (stove off, windows closed, rubbish out …). It starts with suggestions; every line can be
 * renamed, deleted, added and moved (arrows and drag). Ticks belong to one trip, so the next trip starts
 * fresh. Stored in db.settings 'hausCheck' = { items: [{ id, key? , text? }], done: { [tripId]: [id] } }.
 * key: a suggestion's English text (shown through t()); text: what you typed (never through t()).
 */
export const HOUSE_KEY = 'hausCheck';

/** The suggestions a new list starts with (English keys for t()). */
export const HOUSE_START = ['Stove and oven off', 'Windows closed', 'Rubbish out', 'Fridge: nothing that goes off', 'Plugs out (coffee machine, TV)', 'Heating turned down', 'Water tap closed', 'Door locked, key with you'];

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);

/** The stored value as a list and the ticks; the suggestions when nothing is stored yet. */
export function houseOf(v) {
  const items = Array.isArray(v?.items)
    ? v.items.filter((x) => x && x.id && (clean(x.text) || clean(x.key))).map((x) => (clean(x.text) ? { id: String(x.id), text: clean(x.text) } : { id: String(x.id), key: clean(x.key) }))
    : HOUSE_START.map((key, i) => ({ id: `hs-${i}`, key }));
  const done = v?.done && typeof v.done === 'object' ? v.done : {};
  return { items, done };
}

/** The line as shown: your text as typed, a suggestion through tr (t). */
export const houseLabel = (x, tr = (s) => s) => (x.text ? x.text : tr(x.key));

export function addHouse(state, text, id = `hc-${Date.now().toString(36)}`) {
  const t = clean(text);
  if (!t) return null;
  return { ...state, items: [...state.items, { id, text: t }] };
}
export function renameHouse(state, id, text) {
  const t = clean(text);
  if (!t) return state;
  return { ...state, items: state.items.map((x) => (x.id === id ? { id: x.id, text: t } : x)) };
}
export function dropHouse(state, id) {
  const done = Object.fromEntries(Object.entries(state.done).map(([k, ids]) => [k, (ids ?? []).filter((x) => x !== id)]));
  return { items: state.items.filter((x) => x.id !== id), done };
}
export function moveHouse(state, from, to) {
  if (from === to || from < 0 || to < 0 || from >= state.items.length || to >= state.items.length) return state;
  const items = [...state.items];
  const [x] = items.splice(from, 1);
  items.splice(to, 0, x);
  return { ...state, items };
}

const tripKey = (tripId) => String(tripId ?? 'any');
export const doneOf = (state, tripId) => new Set(state.done[tripKey(tripId)] ?? []);
export function toggleHouse(state, tripId, id) {
  const set = doneOf(state, tripId);
  set.has(id) ? set.delete(id) : set.add(id);
  return { ...state, done: { ...state.done, [tripKey(tripId)]: [...set] } };
}
export const resetHouse = (state, tripId) => ({ ...state, done: { ...state.done, [tripKey(tripId)]: [] } });
/** { done, all } of the current list for one trip. */
export function houseCount(state, tripId) {
  const set = doneOf(state, tripId);
  return { done: state.items.filter((x) => set.has(x.id)).length, all: state.items.length };
}
/** What goes into storage: only ids, keys and texts. */
export const houseValue = (state) => ({ items: state.items.map((x) => (x.text ? { id: x.id, text: x.text } : { id: x.id, key: x.key })), done: state.done });
