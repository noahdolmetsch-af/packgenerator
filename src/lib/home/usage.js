/**
 * v0.46.0 «Startseite neu» (Noah 13a, 16a, 17a): count a tap on one of the 16 functions (the
 * buttons on Today, "All 16 functions", "Tried it yet?" and the search commands). The count orders
 * the buttons and tells "Tried it yet?" what was never used. Stored in the settings record
 * "homeUsage" (goes into every backup), changed in one transaction so no tap gets lost.
 */
import { db } from '../db.js';
import { USAGE_KEY, bumpUsage } from './functions.js';

export async function countUse(id) {
  try {
    await db.transaction('rw', db.settings, async () => {
      const cur = (await db.settings.get(USAGE_KEY))?.value ?? null;
      await db.settings.put({ key: USAGE_KEY, value: bumpUsage(cur, id) });
    });
  } catch {
    /* counting must never stop the action itself */
  }
}
