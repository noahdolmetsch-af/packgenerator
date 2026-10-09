import { tidyBrands } from './brand.js';
import { ensureBikeSetup } from './bikes.js';
import { ensureTrips } from './trips.js';
import { applyUpdates } from './updates.js';
import { refreshSnapshots } from './templates.js';

/**
 * Small one-time fixes that run on every start and after an import.
 * Each step only changes records that still need it, so running it again does nothing.
 */
export async function tidyData(db) {
  await tidyBrands(db);
  await ensureBikeSetup(db);
  await ensureTrips(db); // needs the bikes to be set up first
  await applyUpdates(db); // changes Noah asked for in the chat
  await ensureTrips(db); // again, for bags and mounts the updates added
  await refreshSnapshots(db); // v0.39.0 (AP28): linked templates keep their entries snapshot current
}
