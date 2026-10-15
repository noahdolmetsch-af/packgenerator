/**
 * GPX-Weg (Noah 15.10.2026 «1-5 a»): what the app tells you right after a ride is saved. «Fahrt hochladen»
 * notes the saved rides here; the ride page shows the card «Fahrt gespeichert» once, «Dein Tempo» marks
 * them «Neu». Kept for this visit only (sessionStorage), so nothing stays behind.
 */
const KEY = 'ride.saved';
const KEEP_MS = 30 * 60 * 1000;

/** Note the rides just saved (added to the ones of this visit). first: the very first ride on this device. */
export function markSaved(ids, { first = false } = {}, now = Date.now()) {
  try {
    const had = savedNote(now)?.ids ?? [];
    sessionStorage.setItem(KEY, JSON.stringify({ ids: [...new Set([...had, ...ids])], last: ids, first, at: now }));
  } catch {
    /* private mode: no card, nothing lost */
  }
}

/** The rides saved in the last half hour: { ids, last, first, seen } or null. last: the newest save. */
export function savedNote(now = Date.now()) {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    return v && Array.isArray(v.ids) && now - v.at < KEEP_MS ? v : null;
  } catch {
    return null;
  }
}

/** The card was read: it does not come back. The «Neu» marks stay for this visit. */
export function seenCard() {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null');
    if (v) sessionStorage.setItem(KEY, JSON.stringify({ ...v, seen: true }));
  } catch {
    /* nothing to do */
  }
}
