/**
 * «Unterwegs-Modus» (Plan «ganze App», Schritt 7a, Noah 08.11.2026 «9 b»): Noah switches it on himself with a button on the
 * card «Meine Tour» on Today; it never starts by itself. While it is on, the card shows what is needed on the way (the live
 * map, a note with a photo, a breakdown note, the day overview) instead of the packing rows. It is one setting
 * (key `unterwegsMode` = { tripId, since }), so it lives in the backup like every setting and needs no new table.
 * It belongs to ONE tour: when another tour is shown (or the tour is over, the card is away) the mode is simply not on.
 */
import { db } from '../db.js';

export const KEY = 'unterwegsMode';

/** Is the mode on for this tour? value: the stored setting value (or undefined). */
export const modeOn = (value, tripId) => !!tripId && value?.tripId === tripId;

/** Switch it on for a tour (only by a tap of the user). */
export function switchOn(tripId, now = new Date()) {
  return db.settings.put({ key: KEY, value: { tripId, since: now.toISOString() } });
}

/** Switch it off (the user taps «Switch off»). */
export function switchOff() {
  return db.settings.delete(KEY);
}
