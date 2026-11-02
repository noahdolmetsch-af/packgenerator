/**
 * «Erfüllte Träume» (Träume und Neuland N17, Noah 27.10.2026 «1-5 a»): a dream that became a trip counts as
 * fulfilled once the trip has its debrief (Rückblick done). It shows with its day on Touren › Träume and in the
 * year card of Rückblick. Nothing is stored: it follows the dream's trip (dream.tripId) and its debrief.
 * Pure functions, tested in tests/erfuellt.test.js.
 */
import { tripStateInfo, tripEnd } from '../tripstate.js';

/**
 * The fulfilled dreams, newest first. → [{ dream, trip, day }] (day: the last day of the trip).
 * A trip that was deleted, skipped or not yet debriefed does not count.
 */
export function fulfilledDreams(dreams = [], trips = [], debriefs = [], today) {
  const tBy = new Map((trips ?? []).map((x) => [x.id, x]));
  const dBy = new Map((debriefs ?? []).map((d) => [d.tripId, d]));
  const out = [];
  for (const dream of dreams ?? []) {
    const trip = dream?.tripId ? tBy.get(dream.tripId) : null;
    if (!trip) continue;
    if (tripStateInfo(trip, { debrief: dBy.get(trip.id) ?? null, today }).state !== 'rated') continue;
    out.push({ dream, trip, day: tripEnd(trip) ?? today });
  }
  return out.sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
}

/** The fulfilled dreams of one year. */
export const fulfilledIn = (list, year) => list.filter((x) => x.day?.startsWith(String(year)));
