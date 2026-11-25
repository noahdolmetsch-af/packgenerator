/**
 * «Was ist neu» mit Release-Datum (Warteliste 3; Noah 22.11.2026 «2a und Uhrzeit», «3a»): every entry shows the full day with the
 * weekday («Sa., 21. Nov. 2026») and, where the merge time is known, the clock time of the merge in Zurich («, 14:32»). The tile
 * «New» on Today shows the day without the year. Pure; `iso` is a day 'YYYY-MM-DD', `time` 'HH:MM' or missing (the old entries).
 */

/** The day with weekday, in the language `loc`; withYear false drops the year. Empty for an unknown day. */
export function newsDay(iso, loc, withYear = true) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return '';
  return new Date(`${iso}T12:00:00`).toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });
}

/** «Sa., 21. Nov. 2026, 14:32» (or without the time for an entry that has none). */
export function newsWhen(iso, time, loc) {
  const d = newsDay(iso, loc);
  return d && /^\d{2}:\d{2}$/.test(time ?? '') ? `${d}, ${time}` : d;
}
