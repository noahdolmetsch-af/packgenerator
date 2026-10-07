/**
 * v0.25.1: today's date as YYYY-MM-DD on the device's own clock. Before, "today" came from
 * toISOString (UTC), so between midnight and 2 a.m. in Zurich the app still showed yesterday.
 * Dates computed from a saved date string (addDays with T00:00:00Z) stay in UTC; that is correct.
 */
export function localDay(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
