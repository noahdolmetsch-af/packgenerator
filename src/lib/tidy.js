import { tidyBrands } from './brand.js';
import { ensureBikeSetup } from './bikes.js';
import { ensureTrips } from './trips.js';

/**
 * Small one-time fixes that run on every start and after an import.
 * Each step only changes records that still need it, so running it again does nothing.
 */
export async function tidyData(db) {
  await tidyBrands(db);
  await ensureBikeSetup(db);
  await ensureTrips(db); // needs the bikes to be set up first
}
