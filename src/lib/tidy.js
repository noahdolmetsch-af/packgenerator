import { tidyBrands } from './brand.js';
import { ensureBikeSetup } from './bikes.js';
import { ensureTrips } from './trips.js';
import { applyUpdates } from './updates.js';
import { refreshSnapshots } from './templates.js';
import { ensureKmBook } from './kmbookdb.js';

/**
 * Small one-time fixes that run on every start and after an import.
 * Each step only changes records that still need it, so running it again does nothing.
 */
export async function tidyData(db) {
  await tidyBrands(db);
  await ensureBikeSetup(db);
  await ensureTrips(db); // needs the bikes to be set up first
  await applyUpdates(db); // changes Noah asked for in the chat
  // v0.68.0 «Q1 Jeder km zählt» (step 1): every km counter becomes the opening entry of the bike's
  // ride ledger; a counter changed outside the ledger gets a visible entry (after the updates, so
  // the km they set are in it). Idempotent.
  await ensureKmBook(db);
  await ensureTrips(db); // again, for bags and mounts the updates added
  await refreshSnapshots(db); // v0.39.0 (AP28): linked templates keep their entries snapshot current
}
