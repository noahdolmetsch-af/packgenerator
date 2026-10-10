/**
 * v0.68.0 «Q1 Jeder km zählt»: the ride ledger in the database (table kmBook, db.js version 7).
 * Every write goes through here, so bike.km and bike.kmDate always are the ledger's sum and every
 * change has its own entry with a date and a source. Each write returns what Undo needs.
 */
import { localDay } from './localday.js';
import { bikeKm, openingEntry, syncEntry, readingEntry, makeEntry } from './kmbook.js';

/** settings key: the rules for assigning rides (exported with the backup, changeable at any time). */
export const RULES_KEY = 'kmRules';
/** meta key (this device only): the last import, for «Undo» on the bike page. */
export const LAST_KM_IMPORT = 'kmLastImport';
/** meta key (this device only): the weekly card «Compare km» was put off or done in this week. */
export const KM_WEEK = 'kmWeek';
/** meta key (this device only): the monthly report line was read for this month. */
export const KM_MONTH = 'kmMonth';

const plain = (x) => JSON.parse(JSON.stringify(x));

/** Write bike.km and bike.kmDate from the ledger (bikes with entries only). */
export async function syncBikes(db, bikeIds) {
  for (const id of new Set(bikeIds.filter(Boolean))) {
    const bike = await db.bikes.get(id);
    if (!bike) continue;
    const entries = await db.kmBook.where('bikeId').equals(id).toArray();
    if (!entries.length) continue;
    const { km, kmDate } = bikeKm(entries, id);
    if (km == null) continue;
    if (bike.km !== km || bike.kmDate !== kmDate) await db.bikes.update(id, { km, kmDate });
  }
}

/** Add entries; returns their ids (Undo deletes them). */
export async function addEntries(db, entries) {
  const list = plain(entries);
  await db.transaction('rw', db.kmBook, db.bikes, async () => {
    await db.kmBook.bulkPut(list);
    await syncBikes(db, list.map((e) => e.bikeId));
  });
  return list.map((e) => e.id);
}

/** Change one entry; returns the entry as it was (Undo puts it back). */
export async function updateEntry(db, id, changes) {
  let prev = null;
  await db.transaction('rw', db.kmBook, db.bikes, async () => {
    prev = await db.kmBook.get(id);
    if (!prev) return;
    await db.kmBook.update(id, plain(changes));
    await syncBikes(db, [prev.bikeId, changes.bikeId]);
  });
  return prev;
}

/** Put entries back as they were (Undo of a change), or delete the ones that were new. */
export async function restoreEntries(db, { put = [], del = [] }) {
  await db.transaction('rw', db.kmBook, db.bikes, async () => {
    const gone = await db.kmBook.bulkGet(del);
    if (del.length) await db.kmBook.bulkDelete(del);
    if (put.length) await db.kmBook.bulkPut(plain(put));
    await syncBikes(db, [...put.map((e) => e.bikeId), ...gone.filter(Boolean).map((e) => e.bikeId)]);
  });
}

/** Delete entries for good (only what you removed yourself). Returns them for Undo. */
export async function deleteEntries(db, ids) {
  let gone = [];
  await db.transaction('rw', db.kmBook, db.bikes, async () => {
    gone = (await db.kmBook.bulkGet(ids)).filter(Boolean);
    await db.kmBook.bulkDelete(ids);
    await syncBikes(db, gone.map((e) => e.bikeId));
  });
  return gone;
}

/**
 * A new reading («the bike has N km now», Neu › km, the debrief, the start values): an entry with
 * the difference. Returns the new entry id or null (nothing changed).
 */
export async function setReading(db, bikeId, total, opts = {}) {
  let id = null;
  await db.transaction('rw', db.kmBook, db.bikes, async () => {
    const entries = await db.kmBook.where('bikeId').equals(bikeId).toArray();
    const e = readingEntry(entries, bikeId, total, { date: opts.date ?? localDay(), source: opts.source ?? 'hand', note: opts.note ?? '' });
    if (!e) return;
    await db.kmBook.put(e);
    id = e.id;
    await syncBikes(db, [bikeId]);
  });
  return id;
}

/** One ride or correction by hand. */
export const addHand = (db, fields) => addEntries(db, [makeEntry({ source: 'hand', by: 'user', sure: 'user', ...fields })]);

/**
 * On every start and after an import (tidy.js → updates.js): a bike with a counter and no ledger
 * gets the counter as its opening entry; a counter changed outside the ledger (an older app or
 * backup) gets a visible entry with the difference. Nothing is deleted. Returns true when it wrote.
 */
export async function ensureKmBook(db, today = localDay()) {
  let wrote = false;
  await db.transaction('rw', db.kmBook, db.bikes, async () => {
    const bikes = await db.bikes.toArray();
    const entries = await db.kmBook.toArray();
    for (const bike of bikes) {
      const e = openingEntry(bike, entries, today) ?? syncEntry(bike, entries, today);
      if (!e) continue;
      await db.kmBook.put(e);
      entries.push(e);
      wrote = true;
    }
    if (wrote) await syncBikes(db, bikes.map((b) => b.id));
  });
  return wrote;
}

/** The rules for assigning rides. */
export async function loadRules(db) {
  return (await db.settings.get(RULES_KEY))?.value ?? [];
}
export const saveRules = (db, rules) => db.settings.put({ key: RULES_KEY, value: plain(rules) });

/**
 * Take over an import: the new entries, Strava's totals per bike (bike.strava), and a note for
 * «Undo» on the bike page. Returns { importId, ids }.
 */
export async function applyImport(db, { entries, strava = {}, importId, files = [], text = '' }) {
  const list = plain(entries);
  const prevStrava = {};
  const prevKm = {};
  await db.transaction('rw', db.kmBook, db.bikes, db.meta, async () => {
    for (const id of new Set(list.map((e) => e.bikeId).filter(Boolean))) {
      const bike = await db.bikes.get(id);
      if (bike) prevKm[id] = { km: bike.km ?? null, kmDate: bike.kmDate ?? null };
    }
    if (list.length) await db.kmBook.bulkPut(list);
    for (const [id, s] of Object.entries(strava)) {
      const bike = await db.bikes.get(id);
      if (!bike) continue;
      prevStrava[id] = bike.strava ?? null;
      await db.bikes.update(id, { strava: { km: s.km, date: s.date, at: localDay() } });
    }
    await syncBikes(db, list.map((e) => e.bikeId));
    await db.meta.put({ key: LAST_KM_IMPORT, id: importId, at: new Date().toISOString(), n: list.length, files, text, prevStrava, prevKm });
  });
  return { importId, ids: list.map((e) => e.id) };
}

/** Undo the last import: its entries go, Strava's totals are as before. */
export async function undoImport(db, importId) {
  await db.transaction('rw', db.kmBook, db.bikes, db.meta, async () => {
    const last = await db.meta.get(LAST_KM_IMPORT);
    const gone = await db.kmBook.where('importId').equals(importId).toArray();
    await db.kmBook.bulkDelete(gone.map((e) => e.id));
    if (last?.id === importId) {
      for (const [id, s] of Object.entries(last.prevStrava ?? {})) if (await db.bikes.get(id)) await db.bikes.update(id, { strava: s });
      // a bike whose ledger is empty again gets back the km it had before the import
      for (const [id, k] of Object.entries(last.prevKm ?? {})) if (await db.bikes.get(id)) await db.bikes.update(id, k);
      await db.meta.delete(LAST_KM_IMPORT);
    }
    await syncBikes(db, gone.map((e) => e.bikeId));
  });
}
