/**
 * «Ist der Abgleich in Ordnung?» (Noah 21.11.2026 «1-5a», points 1 and 2 of the thread «Fix Abhaken-Sync»):
 * what the app knows about its sync, as one word for a small dot at «Ich» and a line on Heute.
 * The computer of that day had no sync at all and nothing said so.
 *
 *   'ok'    sync on, the last round was less than LATE_MS ago and had no error → green dot
 *   'late'  sync on, but the last round failed or is older than LATE_MS → orange dot; dirty = changes not sent yet
 *   'off'   sync off although this device has data and nobody said «only here» → orange dot
 *   'none'  nothing to say: demo, no data, or «only one device» was chosen
 *
 * Pure: gets what the page knows. now: ms.
 */
export const LATE_MS = 10 * 60_000;

export function syncHealth({ on = false, error = null, last = null, dirty = 0, hasData = false, demo = false, hide = false, now = Date.now() } = {}) {
  if (demo || !hasData) return { state: 'none', dirty: 0 };
  if (!on) return { state: hide ? 'none' : 'off', dirty: 0 };
  const at = last ? Date.parse(last) : NaN;
  const late = !!error || Number.isNaN(at) || now - at > LATE_MS;
  return { state: late ? 'late' : 'ok', dirty: Math.max(0, Number(dirty) || 0), error: error ?? null };
}
