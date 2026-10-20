/**
 * «Heatmap» (Noah 20.10.2026 «5a»): older Strava activities without a route line get it once, in the
 * background. The app reads the activity list again (200 per call, so ~1300 rides are 7 calls of
 * Strava's 100 per 15 minutes) and keeps only the lines; nothing else of an activity changes.
 * An activity Strava sends no line for (indoor, hidden route) is marked noLine and not asked again.
 */
export const BACKFILL_KEY = 'heat.backfill'; // { at: ISO, got: n } once done
export const BACKFILL_PAGES = 20;

/** → { got, none } or throws the call's error (no network, not connected: try again later). */
export async function backfillLines(db, call, { now = new Date(), pages = BACKFILL_PAGES } = {}) {
  const missing = new Set((await db.activities.toArray()).filter((a) => !a.line && !a.noLine).map((a) => String(a.id)));
  let got = 0;
  if (missing.size) {
    for (let page = 1; page <= pages && missing.size; page++) {
      const res = await call('activities', { params: { page: String(page) } });
      for (const a of res?.activities ?? []) {
        const id = String(a?.id ?? '');
        if (!missing.has(id) || typeof a.line !== 'string' || !a.line) continue;
        await db.activities.update(id, { line: a.line });
        missing.delete(id);
        got++;
      }
      if (!res?.more) break;
    }
  }
  // what Strava has no line for: not asked again (an indoor ride, a hidden route)
  for (const id of missing) await db.activities.update(id, { noLine: true });
  await db.settings.put({ key: BACKFILL_KEY, value: { at: now.toISOString(), got } });
  return { got, none: missing.size };
}
