/**
 * Paket V «Alltag»: the writes. Everything lives in db.settings (no new table, so no Dexie version):
 * alltag.prefs { together, peopleOn }, alltag.contracts [contract], alltag.people [person], alltag.sos
 * { [country]: [{ label, no }] }; the shopping list is the own list SHOP_ID in merken.lists. All of it
 * travels in every backup. Every write returns what Undo needs. After a change of contracts or people
 * the to-dos in Kalender › Merken are brought in line (syncReminders).
 */
import { liveQuery } from 'dexie';
import { db as appDb } from './db.js';
import { PREFS_KEY, CONTRACTS_KEY, PEOPLE_KEY, SOS_KEY, wantedTodos, syncTodos } from './alltag.js';
import { MERKEN_KEY, loadTodos } from './merkendb.js';
import { LISTS_KEY } from './ownlists.js';
import { SHOP_ID } from './frei/shoplist.js';
import { loadLists } from './listsdb.js';
import { localDay } from './localday.js';
import { t, locale } from './i18n.svelte.js';

const plain = (x) => JSON.parse(JSON.stringify(x ?? null));
const get = async (db, key, fallback) => (await db.settings.get(key))?.value ?? fallback;

/** Everything of Ich › Alltag, live. */
export const alltagQuery = (db = appDb) =>
  liveQuery(async () => {
    const [prefs, contracts, people, sos, lists] = await Promise.all([get(db, PREFS_KEY, {}), get(db, CONTRACTS_KEY, []), get(db, PEOPLE_KEY, []), get(db, SOS_KEY, {}), loadLists(db)]);
    return { prefs: { together: prefs.together !== false, peopleOn: prefs.peopleOn !== false }, contracts, people, sos, shop: lists.find((l) => l.id === SHOP_ID) ?? null };
  });

/** Change one record with fn(value) → value; returns the old value (Undo). */
export async function change(key, fallback, fn, db = appDb) {
  const before = await db.transaction('rw', db.settings, async () => {
    const old = await get(db, key, fallback);
    await db.settings.put({ key, value: plain(fn(plain(old))) });
    return old;
  });
  if (key === CONTRACTS_KEY || key === PEOPLE_KEY || key === PREFS_KEY) await syncReminders(db);
  return before;
}
export async function restore(key, value, db = appDb) {
  await db.settings.put({ key, value: plain(value) });
  if (key === CONTRACTS_KEY || key === PEOPLE_KEY || key === PREFS_KEY) await syncReminders(db);
}

export const KEYS = { prefs: PREFS_KEY, contracts: CONTRACTS_KEY, people: PEOPLE_KEY, sos: SOS_KEY };

/** The words of the to-dos, in the person's language. */
export const TODO_TEXTS = {
  contract: (c, deadline) => t('Cancel or keep «{name}»? Last day: {day}', { name: c.name, day: new Date(`${deadline}T12:00:00Z`).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) }),
  person: (p) => t('Get in touch with {name}', { name: p.name }),
};

/** Brings the to-dos in Kalender › Merken in line with the contracts and people. */
export async function syncReminders(db = appDb, today = localDay()) {
  await db.transaction('rw', db.settings, async () => {
    const [prefs, contracts, people, todos] = await Promise.all([get(db, PREFS_KEY, {}), get(db, CONTRACTS_KEY, []), get(db, PEOPLE_KEY, []), loadTodos(db)]);
    const wanted = wantedTodos({ contracts, people, peopleOn: prefs.peopleOn !== false, today, texts: TODO_TEXTS });
    const r = syncTodos(todos, wanted);
    if (r.changed) await db.settings.put({ key: MERKEN_KEY, value: plain(r.todos) });
  });
}

/* ---------- the shopping list (merken.lists, SHOP_ID) ---------- */

/** Changes the shopping list with fn(list) → list (made first when it is missing); returns the old lists (Undo). */
export async function changeShop(fn, name, db = appDb) {
  return db.transaction('rw', db.settings, async () => {
    const all = await loadLists(db);
    const cur = all.find((l) => l.id === SHOP_ID) ?? { id: SHOP_ID, name, check: true, pin: null, items: [], created: new Date().toISOString() };
    const next = fn(plain(cur));
    const lists = all.some((l) => l.id === SHOP_ID) ? all.map((l) => (l.id === SHOP_ID ? next : l)) : [...all, next];
    await db.settings.put({ key: LISTS_KEY, value: plain(lists) });
    return all;
  });
}
export const restoreShop = (before, db = appDb) => db.settings.put({ key: LISTS_KEY, value: plain(before) });
