/**
 * v0.67.0 «Übergänge 1» (U004, U005, U22, U25): ending a trip and taking it back.
 * endTrip: the trip ends today (finished), an optional reason is kept (endReason), and the
 * interstitial «Tour beendet» opens with «Rückgängig» for a few seconds (the mark below).
 * reopenTrip: «Doch noch unterwegs? Tour wieder öffnen»: the end is taken back, On the way opens.
 */
import { db } from '../db.js';
import { touched } from '../trips.js';
import { localDay } from '../localday.js';
import { openTrip } from '../nav.js';
import { hasBike } from '../domains.js';
import { betweenHref } from '../phase.js';

/** The trip that was just ended here (read once by the interstitial for its Undo). */
export const UNDO_KEY = 'between.undo';

export async function endTrip(trip, { reason = null } = {}) {
  const id = trip.id;
  const cur = await db.trips.get(id);
  if (!cur) return;
  const before = { finished: cur.finished ?? null, endReason: cur.endReason ?? null };
  await db.trips.update(id, touched({ finished: localDay(), ...(reason ? { endReason: reason } : {}) }));
  try {
    sessionStorage.setItem(UNDO_KEY, JSON.stringify({ id, before }));
  } catch {
    /* private mode: no Undo line, «Tour wieder öffnen» still works */
  }
  openTrip(id);
  location.hash = betweenHref(cur, 'ended');
}

/** Read (and forget) the Undo mark of a trip: { before } or null. */
export function takeUndo(id) {
  try {
    const v = JSON.parse(sessionStorage.getItem(UNDO_KEY) ?? 'null');
    if (v?.id !== id) return null;
    sessionStorage.removeItem(UNDO_KEY);
    return v;
  } catch {
    return null;
  }
}

export async function reopenTrip(trip, before = { finished: null, endReason: null }) {
  await db.trips.update(trip.id, touched({ finished: before.finished ?? null, endReason: before.endReason ?? null }));
  openTrip(trip.id);
  location.hash = hasBike(trip) ? '#/ride' : '#/pack?day';
}
