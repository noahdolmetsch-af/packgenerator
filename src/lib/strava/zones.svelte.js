/**
 * «Training»: the heart rate zones in use, live for every page (Strava's, or Noah's own when changed;
 * training.js zonesOf). Saving own bounds or going back to Strava's.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { zonesOf, ownOf, ZONES_KEY, OWN_ZONES_KEY, LEGACY_ZONES_KEY, validBounds } from '../training.js';

export const zones = $state({ loaded: false, ...zonesOf(null, null), strava: null });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  // the same zones as Rückblick › Tempo (review/actdata.js zonesOf): own ones from either page count
  const get = async (k) => (await appDb.settings.get(k))?.value ?? null;
  liveQuery(() => Promise.all([get(ZONES_KEY), get(OWN_ZONES_KEY), get(LEGACY_ZONES_KEY)])).subscribe({
    next: ([s, own, legacy]) => {
      Object.assign(zones, zonesOf(s, ownOf(own, legacy)), { strava: s, loaded: true });
    },
    error: () => (zones.loaded = true),
  });
}

/** Own bounds (four rising numbers) or null: back to Strava's zones. */
export async function saveZones(bounds, db = appDb) {
  if (bounds == null) return Promise.all([db.settings.delete(OWN_ZONES_KEY), db.settings.delete(LEGACY_ZONES_KEY)]);
  if (!validBounds(bounds)) return false;
  await db.settings.put({ key: OWN_ZONES_KEY, value: { own: bounds } });
  await db.settings.delete(LEGACY_ZONES_KEY);
  return true;
}
