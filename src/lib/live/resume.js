// The live map picks a ride up again by itself after the app loaded anew in the middle of it (Noah
// 20.10.2026: «abgestürzt und zurück in die Live-Karte-Maske gefallen»). Every kept point is already
// stored (recorder.svelte.js); the open recording waits in the tracks table. When it belongs to this
// page's tour (or both have none) and its last point is recent, the ride goes on at once; the time
// between is a gap in the travel track.

/** How long after its last point an open ride is still picked up by itself.
 * 28.10.2026 (Noah's phone test): 20 minutes was too short. A stop with the screen off brings no new point,
 * so after a reload the ride waited behind «Fahrt von … weiterführen». Now 3 hours. */
export const RESUME_MIN = 180;

/** The open recording to pick up by itself, or null. */
export function resumeOf(open, tripId = null, now = Date.now()) {
  if (!open?.open || open.kind !== 'rec') return null;
  if ((open.tripId ?? null) !== (tripId || null)) return null;
  const last = Number(open.endAt) || Number(open.startAt) || 0;
  // a last point «after now» (the GPS clock runs ahead of the phone's) still counts as recent
  if (!last || now - last > RESUME_MIN * 60_000) return null;
  return open;
}
