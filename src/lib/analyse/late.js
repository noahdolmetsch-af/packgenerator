/**
 * «Muster entdeckt» (Noah 03.11.2026, Idee 5 der Cockpit-Ideen: «Schlafe ich nach späten Einheiten kürzer?»):
 * the value «Late sessions» per day, so the links of Analyse can look at it next to sleep, resting pulse and the
 * rest. A session is late when it ends at LATE_HOUR (19:00) or after, by the local start time of Strava and the
 * time it took. Pure; only an observation, never a cause.
 */
/** A session that ends at this hour or later (local time) is late. */
export const LATE_HOUR = 19;

const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The local start of an activity as hours (7.5 = 07:30), null without a time. */
export function startHour(a) {
  const m = /^(\d{1,2}):(\d{2})/.exec(a?.time ?? '');
  return m ? Number(m[1]) + Number(m[2]) / 60 : null;
}

/** Does this activity end at hour or later? null when its start time is not known. */
export function isLate(a, hour = LATE_HOUR) {
  const from = startHour(a);
  if (from == null) return null;
  const dur = (fin(a.elapsedS) ?? fin(a.movingS) ?? 0) / 3600;
  return from + dur >= hour;
}

/**
 * The late sessions of a day (a row of messwerte.js dayTable): their number; 0 on a day with sessions that are
 * not late; null on a day without a session with a start time (so a day off is not counted as «not late»).
 */
export function lateOf(row, hour = LATE_HOUR) {
  const list = (row?.acts ?? []).map((a) => isLate(a, hour)).filter((x) => x != null);
  return list.length ? list.filter(Boolean).length : null;
}
