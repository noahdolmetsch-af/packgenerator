/**
 * Paket T «Freie Zeit» › Rezepte (Noah «4a»): the ingredients go on the own list «Shopping list» of
 * Kalender › Merken (Eigene Listen, settings 'merken.lists'). The list is made once with this id and
 * then belongs to the person: rename it, add to it, delete it; a deleted one is made again on the next tap.
 */
import { db } from '../db.js';
import { LISTS_KEY, newList, addPoint } from '../ownlists.js';
import { loadLists as load } from '../listsdb.js';

export const SHOP_ID = 'frei-shopping';
export const loadLists = () => load(db);
export const restoreLists = (before) => db.settings.put({ key: LISTS_KEY, value: JSON.parse(JSON.stringify(before)) });

/** Adds the ingredients (the ones not open on the list yet); returns the list. */
export async function changeList(items, name) {
  return db.transaction('rw', db.settings, async () => {
    const all = await load(db);
    let list = all.find((l) => l.id === SHOP_ID) ?? newList({ name }, { id: SHOP_ID });
    const open = new Set(list.items.filter((x) => !x.done).map((x) => x.text.toLowerCase()));
    let n = 0;
    for (const text of items) if (!open.has(String(text).toLowerCase())) list = addPoint(list, text, { id: `${SHOP_ID}-${Date.now().toString(36)}-${n++}` });
    const next = all.some((l) => l.id === SHOP_ID) ? all.map((l) => (l.id === SHOP_ID ? list : l)) : [...all, list];
    await db.settings.put({ key: LISTS_KEY, value: JSON.parse(JSON.stringify(next)) });
    return list;
  });
}
