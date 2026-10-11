/**
 * v0.73.0 «Ruhige Startseite» (Noah 10.10.2026, Heute ruhiger 1–5 a):
 * the pure rules of the calmer Today page.
 * - «Weitermachen» is hidden when it would show the trip the trip card already leads with (2a).
 * - With a trip today the suggestion of the day is one slim row under the trip card; without one it
 *   stays big beside the greeting (1a, 3a).
 * The photo band of 0.73 left Today again in 0.96.0 (Noah 11.10.2026).
 */
import { onTripDay } from '../ride.js';

/** Is a trip (not skipped, not finished) on one of its days today? */
export const tripToday = (trips = [], today) => trips.some((x) => !x.skipped && !x.finished && !!x.startDate && onTripDay(x, today));

/** «Weitermachen» for the same trip as the trip card is a double: hide it (Noah 2a). */
export const sameAsCard = (leadId, cardId) => !!leadId && leadId === cardId;

/**
 * A phone shows the 8 buttons right after the trip card (the rule of 0.46: greeting, trip card and the
 * buttons in the first screen): «Im Flow» directly before «What do you
 * want to do?» moves behind it. Any other order the user chose stays as it is.
 */
export function actionsFirst(order = []) {
  const f = order.indexOf('flow');
  if (f < 0 || order[f + 1] !== 'actions') return order;
  const out = [...order];
  [out[f], out[f + 1]] = [out[f + 1], out[f]];
  return out;
}
