/**
 * Start-Karten (Noah 14.10.2026, App-Start 2b/3b and ST1–ST2 «1a 2a 3b»): Today no longer jumps by itself
 * to On the way (on a trip day) or to «Tour beendet» (on the last evening). A card on Today says it instead,
 * together with the trip card (HN4: it travels with the trip card).
 * - ride: on a trip day with a bike, until On the way was opened once that day (3b)
 * - evening: on the last evening, while the trip is not reviewed (the same rule as before, phase.js lastEvening)
 * Pure; Home.svelte asks, Ride.svelte notes «opened today».
 */
import { dayIndex } from '../ride.js';

export const RIDE_SEEN_KEY = 'ride.seen';

/** The note that On the way showed this trip today (3b: the card goes away after that). */
export const rideSeen = (tripId, today) => `${tripId}:${today}`;

/**
 * The card to show, or null. ride: the trip of today with a bike (Today's `riding`), evening: the trip on
 * its last evening (Today's `lastEve`), seen: the stored RIDE_SEEN_KEY value.
 * → { kind: 'ride' | 'evening', trip, day, days }
 */
export function startCard({ ride = null, evening = null, seen = null, today } = {}) {
  if (evening) return { kind: 'evening', trip: evening, day: null, days: null };
  if (!ride || seen === rideSeen(ride.id, today)) return null;
  const days = Math.max(1, Number(ride.days) || 1);
  return { kind: 'ride', trip: ride, day: dayIndex(ride, today) + 1, days };
}
