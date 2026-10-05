/**
 * Favourites (Noah, 4.10.2026): his tested best gear, from one list, is the base from now on.
 * Every favourite carries a star (item.favorite) and the name of its list (item.lists). The rest
 * of the inventory stays as it is.
 *
 * The list comes as a private file (never in the repo), kind "favorites":
 *   { app: 'pack-generator', kind: 'favorites', list: { key, name }, rows: [row] }
 *   row = { de: the line in the list, ids: ['KL15', …] the matching items, find: 'words' to find an
 *           item added in the app since, item: { …fields } for a new item, brand, note, qty }
 * Applying it only changes these fields, so weights and everything typed in the app stay.
 * Pure functions; the Data panel writes the result.
 */
import { nextId } from './gear.js';

export const FAVORITES = 'favorites-tested-bikepacking-gear';

export const isFavoritesFile = (data) => data?.app === 'pack-generator' && data?.kind === 'favorites' && Array.isArray(data.rows);

export const isFavorite = (item) => !!item?.favorite;

const norm = (s) => String(s ?? '').toLowerCase();

/**
 * What applying the list changes. items: the inventory now.
 * Returns { updates: [{ id, changes }], adds: [item], rows: [{ de, ids, added }] }.
 */
export function planFavorites(data, items, now = new Date().toISOString()) {
  const listKey = data.list?.key ?? FAVORITES;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const all = [...items];
  const updates = {};
  const adds = [];
  const rows = [];
  const mark = (item, row) => {
    const cur = updates[item.id]?.changes ?? {};
    const lists = [...new Set([...(item.lists ?? []), listKey])];
    const changes = { ...cur, favorite: true, lists };
    if (row.brand && !item.brand) changes.brand = row.brand;
    if (row.note) changes.favNote = [cur.favNote, row.note].filter(Boolean).join(' · ');
    updates[item.id] = { id: item.id, changes };
  };
  for (const row of data.rows) {
    let found = (row.ids ?? []).map((id) => byId[id]).filter(Boolean);
    if (!found.length && row.find) {
      const words = norm(row.find).split(/\s+/);
      const hit = all.find((i) => words.every((w) => norm(`${i.name} ${i.nameDe ?? ''}`).includes(w)));
      if (hit) found = [hit];
    }
    // Applied a second time: the item added the first time is found by its name.
    if (!found.length && row.item) {
      const same = all.find((i) => norm(i.name) === norm(row.item.name));
      if (same) found = [same];
    }
    if (!found.length && row.item) {
      const item = {
        brand: '', model: '', weightG: null, qty: 1, weightStatus: 'missing', weightNote: '', carry: 'luggage', defaultBag: null, position: '',
        ownership: 'owned', rating: '', learning: '', note: '', role: null, sets: [], kits: [], volumeL: null, wishPriority: null, domains: ['bikepacking'],
        ...row.item,
        id: nextId(all, row.item.category),
        sources: `favourites list ${now.slice(0, 10)}`,
        updatedAt: now,
      };
      all.push(item);
      adds.push(item);
      found = [item];
    }
    for (const item of found) if (!adds.includes(item)) mark(item, row);
    for (const item of adds.filter((a) => found.includes(a))) Object.assign(item, { favorite: true, lists: [listKey], favNote: row.note ?? '' });
    rows.push({ de: row.de, ids: found.map((i) => i.id), added: found.some((i) => adds.includes(i)) });
  }
  return { updates: Object.values(updates), adds, rows };
}

/**
 * The favourites as a template, so a trip can start from them (Pack → template button).
 * Bags are not packed into bags, things on the bike stay mounted, worn things go on the body.
 */
export function favoritesTemplate(items, { id = FAVORITES, name = FAVORITES, now = new Date().toISOString() } = {}) {
  const entries = items
    .filter((i) => i.favorite && i.ownership !== 'wishlist' && i.ownership !== 'to-buy' && i.ownership !== 'gone' && i.category !== 'bags')
    .map((i) => ({ itemId: i.id, slot: i.role === 'worn' || i.defaultBag === 'body' ? 'body' : i.category === 'bike' ? 'mounted' : i.defaultBag || 'seat', qty: i.qty || 1 }));
  return { id, name, setup: {}, entries, ready: [], ride: null, hours: null, sets: {}, purpose: {}, fromTrip: null, updatedAt: now };
}
