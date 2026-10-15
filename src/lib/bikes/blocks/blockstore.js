/**
 * «Bausteine»: writing the order, the switches and the own blocks (sheetblocks.js has the rules).
 * Every change returns an undo (the stored standard and the bike's blocks as they were before).
 */
import { db } from '../../db.js';
import { t } from '../../i18n.svelte.js';
import { BLOCKS_KEY, globalOf, fullLayout, saveLayout, resetBike, putOwn, goneOnBike, goneEverywhere, setOwnContent, setBlockData, bikeBlocks } from '../../sheetblocks.js';

const plain = (x) => (x == null ? x : JSON.parse(JSON.stringify(x)));

/** The stored standard, cleaned (with the starting own blocks in the language of the app). */
export async function readGlob() {
  return globalOf((await db.settings.get(BLOCKS_KEY))?.value, t);
}

/** What is stored now, to undo a change: the standard and the blocks of the given bikes. */
async function snapshot(bikeIds) {
  const row = await db.settings.get(BLOCKS_KEY);
  const bikes = await Promise.all(bikeIds.map((id) => db.bikes.get(id)));
  return { settings: row ? plain(row.value) : null, bikes: bikes.filter(Boolean).map((b) => ({ id: b.id, sheetBlocks: plain(b.sheetBlocks ?? null) })) };
}

/** Undo: puts back what snapshot() kept. */
export async function restore(snap) {
  if (!snap) return;
  await db.transaction('rw', db.settings, db.bikes, async () => {
    if (snap.settings == null) await db.settings.delete(BLOCKS_KEY);
    else await db.settings.put({ key: BLOCKS_KEY, value: snap.settings });
    for (const b of snap.bikes) await db.bikes.update(b.id, { sheetBlocks: b.sheetBlocks ?? undefined });
  });
}

/** Writes the result of saveLayout() / a new standard and the fields of bikes. */
async function write({ settings = null, bikes = [] }) {
  await db.transaction('rw', db.settings, db.bikes, async () => {
    if (settings) await db.settings.put({ key: BLOCKS_KEY, value: plain(settings) });
    for (const { id, changes } of bikes) await db.bikes.update(id, plain(changes));
  });
}

/**
 * A change of the layout of one sheet: fn(list) → the new list (the whole layout, with «More
 * building blocks»). scope: 'all' (the standard) or 'bike' (this bike's own order). Returns the undo.
 */
export async function changeLayout(bikeId, sheet, fn, scope) {
  const glob = await readGlob();
  const bike = await db.bikes.get(bikeId);
  if (!bike) return null;
  const snap = await snapshot([bikeId]);
  const res = saveLayout(glob, bike, sheet, fn(fullLayout(bike, sheet, glob)), scope);
  await write({ settings: res.settings ?? null, bikes: res.bike ? [{ id: bikeId, changes: res.bike }] : [] });
  return snap;
}

/** «Only for this bike» / «For all bikes» on the page «Bausteine»: own order (a copy) or the standard again. */
export async function setScope(bikeId, sheet, scope) {
  const glob = await readGlob();
  const bike = await db.bikes.get(bikeId);
  if (!bike) return null;
  const snap = await snapshot([bikeId]);
  if (scope === 'bike') {
    const res = saveLayout(glob, bike, sheet, fullLayout(bike, sheet, glob), 'bike');
    await write({ bikes: [{ id: bikeId, changes: { sheetBlocks: { ...res.bike.sheetBlocks, scope: 'bike' } } }] });
  } else {
    const r = resetBike(bike, sheet);
    await write({ bikes: [{ id: bikeId, changes: { sheetBlocks: { ...r.sheetBlocks, scope: 'all' } } }] });
  }
  return snap;
}

/** «Back to the standard» for all bikes: the stored standard goes (own blocks stay). */
export async function resetAll(sheet) {
  const glob = await readGlob();
  const snap = await snapshot([]);
  const fresh = globalOf({ own: glob.own }, t);
  await write({ settings: { layout: { ...glob.layout, [sheet]: fresh.layout[sheet] }, own: glob.own } });
  return snap;
}

/**
 * A new or changed own block. only: the id of the bike it is for («Only for this bike»: the other
 * bikes have it deleted), or null for all bikes.
 */
export async function saveOwn(def, { only = null } = {}) {
  const glob = await readGlob();
  const bikes = only ? await db.bikes.toArray() : [];
  const snap = await snapshot(bikes.map((b) => b.id));
  await write({ settings: putOwn(glob, def), bikes: bikes.filter((b) => b.id !== only).map((b) => ({ id: b.id, changes: goneOnBike(b, def.id) })) });
  return snap;
}

/** BS5 b: an own block deleted on this bike, and on the others too when asked (everywhere: true). */
export async function deleteOwn(bikeId, id, { everywhere = false } = {}) {
  const glob = await readGlob();
  const all = await db.bikes.toArray();
  const snap = await snapshot(all.map((b) => b.id));
  if (everywhere) await write({ settings: goneEverywhere(glob, id), bikes: all.filter((b) => bikeBlocks(b).own[id]).map((b) => ({ id: b.id, changes: goneOnBike(b, id) })) });
  else {
    const bike = all.find((b) => b.id === bikeId);
    if (bike) await write({ bikes: [{ id: bikeId, changes: goneOnBike(bike, id) }] });
  }
  return snap;
}

/** The text, the ticks or the values of an own block on one bike. */
export async function saveOwnContent(bikeId, id, patch) {
  const bike = await db.bikes.get(bikeId);
  if (bike) await db.bikes.update(bikeId, plain(setOwnContent(bike, id, patch)));
}

/** A value of a built block that takes input (budget, pickupWish, partsBrought). */
export async function saveBlockData(bikeId, id, value) {
  const bike = await db.bikes.get(bikeId);
  if (bike) await db.bikes.update(bikeId, plain(setBlockData(bike, id, value)));
}

/** The sheet the page «Bausteine» shows first: the one it was opened from. */
export const lastSheet = { v: 'pass' };
