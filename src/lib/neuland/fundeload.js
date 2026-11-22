/**
 * «Eine Fundliste» (N10): reads the finds for a place that has no Neuland data of its own (the year review, Ich › Was mir
 * gut tut). The same calculation as the Neuland page (computeFrom), so every place shows the same list.
 */
import { readRaw, computeFrom } from './store.js';
import { findsOf } from './funde.js';
import { localDay } from '../localday.js';

/** The finds of `year` (null = all years) from Neuland and the summit book: [{ id, name, day, from, what }]. Empty on any error. */
export async function readFunde(db, year = null, today = localDay()) {
  try {
    const raw = await readRaw(db);
    const result = await computeFrom(raw, { today });
    return findsOf({ result, book: raw.book, year });
  } catch (err) {
    console.error(err);
    return [];
  }
}
