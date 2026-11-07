/**
 * «Bereit für unterwegs?» (Noah 02.11.2026, Schritt 6 «Offline»): before the start the live page lists what makes a
 * long ride calm: the map along the route on the phone, and the voice on. Pure: the page gives what it knows.
 *   → { mapOk, voiceOk, missing: ['map' | 'voice'], ready }
 * A strip counts for this ride when it belongs to the tour and its tiles are on this phone (present ids).
 */
export function mapKept(strips = [], present = new Set(), tripId = null) {
  if (tripId == null) return false;
  return strips.some((s) => s.tripId === tripId && present.has(s.id));
}

export function readiness({ strips = [], present = new Set(), tripId = null, voice = false }) {
  const mapOk = mapKept(strips, present, tripId);
  const voiceOk = !!voice;
  const missing = [...(mapOk ? [] : ['map']), ...(voiceOk ? [] : ['voice'])];
  return { mapOk, voiceOk, missing, ready: missing.length === 0 };
}
