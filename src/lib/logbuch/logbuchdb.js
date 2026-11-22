/**
 * «Verbesserungs-Logbuch»: the database side. One table `logbuch` (db.js version 20): it goes into every backup,
 * never into the automatic sync (db.js syncLocal) because the photos are big and the notes belong to this device.
 * Pure rules are in logbuch.js.
 */
import { db } from '../db.js';
import { makeEntry, changeEntry, reassignEntries } from './logbuch.js';
import { KINDS_KEY, DEFAULT_KINDS, STANDARD_ARTS, normalizeKinds, isStandard, removeArt, removeGroup, hasArt, setRoute } from './kinds.js';

/** The user's kinds and groups (L5): the first version when nothing is stored. */
export async function loadKinds(database = db) {
  const row = await database.settings.get(KINDS_KEY);
  return row ? normalizeKinds(row.value) : DEFAULT_KINDS;
}

/** Keep the user's kinds; the first version is kept as «nothing stored», so «Back to standard» leaves no trace. */
export async function saveKinds(cfg, database = db) {
  const value = normalizeKinds(cfg);
  if (isStandard(value)) await database.settings.delete(KINDS_KEY);
  else await database.settings.put({ key: KINDS_KEY, value });
  return value;
}

/** Make and keep an entry. Returns the entry, or null when kind or text are missing (nothing is stored). */
export async function addEntry(input, database = db) {
  const entry = makeEntry({ ...input, cfg: await loadKinds(database) });
  if (!entry) return null;
  await database.logbuch.put(entry);
  return entry;
}

/** Change an entry; returns the new entry (null when it does not exist any more). */
export async function updateEntry(id, patch, database = db) {
  const old = await database.logbuch.get(id);
  if (!old) return null;
  const next = changeEntry(old, patch, await loadKinds(database));
  await database.logbuch.put(next);
  return next;
}

/** Delete; returns the row for Undo. */
export async function removeEntry(id, database = db) {
  const old = await database.logbuch.get(id);
  await database.logbuch.delete(id);
  return old ?? null;
}

/** Undo of a delete. */
export async function restoreEntry(entry, database = db) {
  if (entry) await database.logbuch.put(entry);
}

/**
 * For the silent error reporter of the device (thread «Prüfungen», Noah 21.11.2026): a caught error becomes ONE entry of the kind
 * «Fehler» with source 'auto'. The same error on the same page only counts up (count, time of the last one), so the list never
 * floods; at most `max` automatic entries are kept (the oldest finished ones go first). Returns the entry.
 */
export async function addAutoError({ message, page = '', device, width, now = new Date(), max = 50 }, database = db) {
  const text = String(message ?? '').trim().slice(0, 300);
  if (!text) return null;
  const art = hasArt(await loadKinds(database), 'fehler') ? 'fehler' : ''; // the kind «Error» may be deleted (L5): then the entry has no kind
  const same = (await database.logbuch.where('art').anyOf(['fehler', '']).toArray()).find((e) => e.source === 'auto' && e.text === text && e.page === page && e.state !== 'done');
  if (same) {
    const next = { ...same, count: (same.count ?? 1) + 1, at: now.toISOString() };
    await database.logbuch.put(next);
    return next;
  }
  const entry = await addEntry({ art, urgent: 'later', text, page, device, width, now, source: 'auto' }, database);
  const autos = (await database.logbuch.where('art').anyOf(['fehler', '']).toArray()).filter((e) => e.source === 'auto').sort((a, b) => String(a.at).localeCompare(String(b.at)));
  const extra = autos.length - max;
  if (extra > 0) await database.logbuch.bulkDelete(autos.slice(0, extra).map((e) => e.id));
  return entry;
}

/**
 * Delete a kind (L5 step 2): its entries go to the kind `to` or stay without a kind ('', «Ohne Art»), then the kind leaves the list.
 * One transaction: either both happen or nothing. Returns what Undo needs: { cfg, rows: [{ id, art, route, state, urgent }] }
 * (only the fields that change; the photos stay where they are).
 */
export async function deleteKind(key, to = '', database = db) {
  return database.transaction('rw', database.logbuch, database.settings, async () => {
    const before = await loadKinds(database);
    if (!hasArt(before, key)) return { cfg: before, rows: [] };
    const target = to && to !== key && hasArt(before, to) ? to : '';
    const after = removeArt(before, key);
    const entries = await database.logbuch.where('art').equals(key).toArray();
    const moved = reassignEntries(entries, key, target, after);
    const rows = entries.map(({ id, art, route, state, urgent }) => ({ id, art, route, state, urgent }));
    if (moved.length) await database.logbuch.bulkPut(moved);
    await saveKinds(after, database);
    return { cfg: before, rows };
  });
}

/** Delete a group: its kinds go to the group `to` or to «No group»; no entry changes. Returns the list before, for Undo. */
export async function deleteGroup(key, to = null, database = db) {
  const before = await loadKinds(database);
  await saveKinds(removeGroup(before, key, to), database);
  return { cfg: before, rows: [] };
}

/** Undo of deleteKind / deleteGroup: the list and the changed fields of the entries come back. */
export async function restoreKinds(snap, database = db) {
  if (!snap) return;
  await database.transaction('rw', database.logbuch, database.settings, async () => {
    for (const r of snap.rows ?? []) await database.logbuch.update(r.id, { art: r.art, route: r.route, state: r.state, urgent: r.urgent });
    await saveKinds(snap.cfg, database);
  });
}

/**
 * A kind gets another way (small change, first a picture, only a note): its entries follow (the way, the state of a note, the urgency),
 * so «Copy the order» sorts them right. One transaction. Returns what Undo needs (restoreKinds).
 */
export async function changeKindRoute(key, route, database = db) {
  return database.transaction('rw', database.logbuch, database.settings, async () => {
    const before = await loadKinds(database);
    if (!hasArt(before, key)) return { cfg: before, rows: [] };
    const after = setRoute(before, key, route);
    const entries = await database.logbuch.where('art').equals(key).toArray();
    const moved = entries.map((e) => changeEntry(e, {}, after)).filter((e, i) => e.route !== entries[i].route || e.state !== entries[i].state || e.urgent !== entries[i].urgent);
    const rows = moved.map((m) => entries.find((e) => e.id === m.id)).map(({ id, art, route: r, state, urgent }) => ({ id, art, route: r, state, urgent }));
    if (moved.length) await database.logbuch.bulkPut(moved);
    await saveKinds(after, database);
    return { cfg: before, rows };
  });
}

/**
 * «Back to standard» (L5 2a): the first kinds and groups come back. Entries of kinds the user made (not in the first version) stay,
 * without a kind, never deleted. Returns what Undo needs (restoreKinds).
 */
export async function resetKinds(database = db) {
  return database.transaction('rw', database.logbuch, database.settings, async () => {
    const before = await loadKinds(database);
    const lost = await database.logbuch.filter((e) => e.art && !STANDARD_ARTS.includes(e.art)).toArray();
    const rows = lost.map(({ id, art, route, state, urgent }) => ({ id, art, route, state, urgent }));
    if (lost.length) await database.logbuch.bulkPut(lost.map((e) => ({ ...e, art: '' })));
    await saveKinds(DEFAULT_KINDS, database);
    return { cfg: before, rows };
  });
}
