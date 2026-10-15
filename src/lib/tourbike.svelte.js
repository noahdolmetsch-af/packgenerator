/**
 * Standard-Velo (mockups VS1–VS4, Noah 13.10.2026 «1a», 14.10.2026 «VS1–VS4 freigegeben», «1a 2b 3a»).
 *
 * The bikes have one order (bike.order, sortBikes in bikes.js). The first bike in that order is the
 * standard bike (★). «Als Standard» moves a bike to the top; the arrows move it up or down.
 * The setting «tourBike» says which bike a new tour brings: 'standard' or 'last' (the bike of the
 * last tour, dayride.js lastBikeId). The app asks it once, at the first new tour; until then the
 * standard bike comes. It stays changeable on the bike page.
 */
import { liveQuery } from 'dexie';
import { sortBikes } from './bikes.js';
import { lastBikeId } from './dayride.js';
import { localDay } from './localday.js';

/** Key in the settings table: 'standard' | 'last'; missing = not asked yet. */
export const TOUR_BIKE = 'tourBike';
export const MODES = ['standard', 'last'];

/** The setting as the screens read it (null: not asked yet). Kept up to date by watchTourBike. */
export const tourBike = $state({ mode: null });

let sub = null;
/** Follow the setting in the database (once per app start; an import or a second tab updates it). */
export function watchTourBike(db) {
  sub?.unsubscribe();
  sub = liveQuery(() => db.settings.get(TOUR_BIKE)).subscribe({
    next: (row) => (tourBike.mode = MODES.includes(row?.value) ? row.value : null),
    error: () => {},
  });
}

export async function setTourBike(db, mode) {
  if (!MODES.includes(mode)) return;
  await db.settings.put({ key: TOUR_BIKE, value: mode });
  tourBike.mode = mode;
}

/** The standard bike: the first one in the order, or null without bikes. */
export const standardBike = (bikes = []) => sortBikes(bikes)[0] ?? null;

/** The bike a new tour brings: the standard bike, or with 'last' the bike of the last tour. */
export function tourBikeId(trips = [], bikes = [], mode = tourBike.mode, today = localDay()) {
  if (!bikes.length) return null;
  if (mode === 'last') return lastBikeId(trips, sortBikes(bikes), today);
  return standardBike(bikes).id;
}

/** The order as patches [[id, { order }]], 1…n, for the bikes whose order changes. */
function patches(before, after) {
  return after.flatMap((b, i) => (before.find((x) => x.id === b.id)?.order === i + 1 ? [] : [[b.id, { order: i + 1 }]]));
}

/** Move a bike one place up (-1) or down (+1). → the bikes in their new order. */
export function moveBike(bikes, id, dir) {
  const list = sortBikes(bikes);
  const i = list.findIndex((b) => b.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  [list[i], list[j]] = [list[j], list[i]];
  return list;
}

/** Make a bike the standard: it goes to the top, the others keep their order. */
export function makeStandard(bikes, id) {
  const list = sortBikes(bikes);
  const b = list.find((x) => x.id === id);
  return b ? [b, ...list.filter((x) => x.id !== id)] : list;
}

/** A new bike goes after all others (the others get their numbers too, so nothing jumps). */
export const withNewBike = (bikes, bike) => [...sortBikes(bikes.filter((b) => b.id !== bike.id)), bike];

/** Save an order (the bikes as listed) into the bikes; only changed ones are written. */
export async function saveOrder(db, before, after) {
  const ch = patches(before, after);
  if (!ch.length) return 0;
  await db.transaction('rw', db.bikes, async () => {
    for (const [id, patch] of ch) await db.bikes.update(id, patch);
  });
  return ch.length;
}
