/**
 * v0.134.0 «Listen und Typen» (mockups LI1–LI4, Noah «LI1–LI4 freigegeben» 14.10.2026, «a»: the
 * categories first, every other list later as its own small release). A person's changes of a base
 * list (standard.js overrides, settings «listOverrides») and how they reach the app: rename, own
 * entries, hide, delete (answer 1b), order with arrows (2b), symbol. The editing functions are pure
 * (tests/lists.test.js); load and save touch the database and put the categories in place.
 */
import { liveQuery } from 'dexie';
import { OVERRIDES_KEY, overrideOf, listFor, resetList, isChanged } from './standard.js';
import { STD_CATEGORIES, setCategories } from './gear.js';
import { listsReady } from './listsready.svelte.js';
import { setTopics } from './notebook.js';
import { setValueGroups } from './valuefields.js';

/** Colours for own categories, in turn (quiet tones next to the Trail Journal ones). */
export const OWN_COLORS = ['#6B8F3A', '#A0522D', '#4F7C8A', '#9C6B98', '#7A7F3A', '#B0625A', '#3F6E5A', '#8A6F3E'];

/** The categories as the person has them: [{ key, name, color, icon?, own?, hidden?, areas? }]. */
export function categoriesFrom(all) {
  const color = Object.fromEntries(STD_CATEGORIES.map((c) => [c.key, c.color]));
  return listFor('categories', all).map((e) => ({
    key: e.id,
    name: e.name,
    color: e.color ?? color[e.id] ?? OWN_COLORS[0],
    ...(e.icon ? { icon: e.icon } : {}),
    ...(e.own ? { own: true } : {}),
    ...(e.hidden ? { hidden: true } : {}),
    ...(e.areas ? { areas: e.areas } : {}),
  }));
}

/**
 * Puts every changed list in place: the categories, the note topics, the groups of the bike values.
 * raw: a name the person typed; it never goes through t() (it could hit another text, «Travel» → «Federweg»).
 */
export function applyLists(all) {
  setCategories(categoriesFrom(all ?? {}));
  setTopics(listFor('noteTopics', all ?? {}).map((e) => ({ key: e.id, name: e.name, raw: e.own || e.renamed })));
  setValueGroups(listFor('valueGroups', all ?? {}).map((e) => ({ key: e.id, name: e.name, raw: e.own || e.renamed })));
}

/**
 * Reads the changes and puts them in place, without holding up the start: the app draws with the
 * Standard first; when there are changes, listsReady counts up and App.svelte draws the page again.
 */
export async function loadLists(db) {
  try {
    const value = (await db.settings.get(OVERRIDES_KEY))?.value;
    applyLists(value);
    if (value && Object.keys(value).length) listsReady.v++;
  } catch (err) {
    console.warn('loadLists', err);
  }
}

/** Keeps the lists in place when the data changes (a backup read in, another page, the demo). */
export function watchLists(db) {
  return liveQuery(() => db.settings.get(OVERRIDES_KEY)).subscribe({ next: (r) => applyLists(r?.value), error: (err) => console.warn('watchLists', err) });
}

/** Stores one list's override (or none, when it is the Standard again) and puts it in place. */
export async function saveList(db, key, value) {
  const all = (await db.settings.get(OVERRIDES_KEY))?.value ?? {};
  const next = isChanged(value) ? { ...all, [key]: value } : resetList(all, key);
  await db.settings.put({ key: OVERRIDES_KEY, value: next });
  applyLists(next);
  return next;
}

/** «Auf Standard zurücksetzen»: the list without the person's changes. */
export async function resetToStandard(db, key) {
  const all = (await db.settings.get(OVERRIDES_KEY))?.value ?? {};
  const next = resetList(all, key);
  await db.settings.put({ key: OVERRIDES_KEY, value: next });
  applyLists(next);
  return next;
}

// ——— Editing one override (pure: value in, new value out) ———

/** One step up (dir -1) or down (+1); the whole order is kept from then on. */
export function move(value, shown, id, dir) {
  const ids = shown.map((e) => e.id);
  const i = ids.indexOf(id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ids.length) return overrideOf(value);
  [ids[i], ids[j]] = [ids[j], ids[i]];
  return { ...overrideOf(value), order: ids };
}

/** Drag (v0.163.x «Pfeile und Ziehen»): the entry goes to place `to` of the list as shown; the whole order is kept from then on. */
export function moveTo(value, shown, id, to) {
  const ids = shown.map((e) => e.id);
  const i = ids.indexOf(id);
  if (i < 0 || to < 0 || to >= ids.length || to === i) return overrideOf(value);
  ids.splice(to, 0, ...ids.splice(i, 1));
  return { ...overrideOf(value), order: ids };
}

/** Hide or show again (the items keep their category). */
export function toggleHidden(value, id) {
  const o = overrideOf(value);
  return { ...o, hidden: o.hidden.includes(id) ? o.hidden.filter((x) => x !== id) : [...o.hidden, id] };
}

/** LI3 «Gilt für»: the trip areas of an entry; null (or none chosen) means all, nothing stored. */
function withAreas(o, id, areas) {
  if (areas === undefined) return o;
  const { [id]: _a, ...rest } = o.areas;
  return { ...o, areas: Array.isArray(areas) && areas.length ? { ...rest, [id]: [...areas] } : rest };
}

/**
 * Name, symbol and «Gilt für» of an entry. A Standard entry: a name equal to the Standard one is no
 * change; an own entry keeps name and symbol on itself.
 */
export function edit(value, entry, { name, icon, stdIcon = null, areas }) {
  const o = withAreas(overrideOf(value), entry.id, areas);
  const n = String(name ?? '').trim();
  if (entry.own) return { ...o, own: o.own.map((e) => (e.id === entry.id ? { ...e, name: n || e.name, ...(icon ? { icon } : {}) } : e)) };
  const names = { ...o.names };
  if (!n || n === entry.std) delete names[entry.id];
  else names[entry.id] = n;
  const icons = { ...o.icons };
  if (!icon || icon === stdIcon) delete icons[entry.id];
  else icons[entry.id] = icon;
  return { ...o, names, icons };
}

/** A new own entry with the next free colour; returns { value, id }. */
export function addOwn(value, { name, icon = null, areas }, id = `own-${Date.now().toString(36)}`) {
  const o = withAreas(overrideOf(value), id, areas);
  const color = OWN_COLORS[o.own.length % OWN_COLORS.length];
  return { value: { ...o, own: [...o.own, { id, name: String(name).trim(), color, ...(icon ? { icon } : {}) }] }, id };
}

/** Delete (answer 1b, also Standard entries): an own entry is gone, a Standard one until the reset. */
export function remove(value, entry) {
  const o = overrideOf(value);
  const rest = (list) => list.filter((x) => x !== entry.id);
  const { [entry.id]: _n, ...names } = o.names;
  const { [entry.id]: _i, ...icons } = o.icons;
  const { [entry.id]: _a, ...areas } = o.areas;
  const base = { ...o, names, icons, areas, hidden: rest(o.hidden), order: rest(o.order) };
  return entry.own ? { ...base, own: o.own.filter((e) => e.id !== entry.id) } : { ...base, deleted: [...o.deleted, entry.id] };
}
