/**
 * «Training»: the heart rate zones in use, live for every page (Strava's, or Noah's own when changed;
 * training.js zonesOf). Saving own bounds or going back to Strava's.
 */
import { liveQuery } from 'dexie';
import { db as appDb } from '../db.js';
import { zonesOf, ZONES_KEY, OWN_ZONES_KEY, validBounds } from '../training.js';

export const zones = $state({ loaded: false, ...zonesOf(null, null), strava: null });

if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
  liveQuery(async () => [(await appDb.settings.get(ZONES_KEY))?.value ?? null, (await appDb.settings.get(OWN_ZONES_KEY))?.value ?? null]).subscribe({
    next: ([s, own]) => {
      Object.assign(zones, zonesOf(s, own), { strava: s, loaded: true });
    },
    error: () => (zones.loaded = true),
  });
}

/** Own bounds (four rising numbers) or null: back to Strava's zones. */
export async function saveZones(bounds, db = appDb) {
  if (bounds == null) return db.settings.delete(OWN_ZONES_KEY);
  if (!validBounds(bounds)) return false;
  await db.settings.put({ key: OWN_ZONES_KEY, value: { own: bounds } });
  return true;
}
