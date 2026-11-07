/**
 * «Cardio-Belastung» Idee A (Noah 07.11.2026 «alle A–F»): the trips inside the shown days as a list under the
 * course, each with the mean of the value over its days. Pure: days are 'YYYY-MM-DD', nothing reads the clock.
 */
const fin = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The page of a finished trip (only once it is over; before that the list shows the name only). */
export const tripPageHref = (id) => `#/tour/${encodeURIComponent(`t:${id}`)}`;

/**
 * One row per trip that touches `days`, newest first:
 * { id, name, from, to, n (days with a value), avg (mean of those days, or null), href (or null) }.
 * get: the value of a day; endOf: the last day of a trip; today: a trip links only when it ended before today.
 */
export function tripRows(trips = [], days = [], endOf, get, today = '') {
  if (!days.length) return [];
  const first = days[0];
  const last = days.at(-1);
  const out = [];
  for (const tr of trips) {
    const s = tr?.startDate;
    const e = endOf?.(tr) ?? s;
    if (!s || !e || e < first || s > last) continue;
    const from = s < first ? first : s;
    const to = e > last ? last : e;
    const vals = days.filter((d) => d >= from && d <= to).map((d) => fin(get?.(d))).filter((v) => v != null);
    out.push({
      id: tr.id ?? null,
      name: tr.title ?? tr.name ?? '',
      from,
      to,
      n: vals.length,
      avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      href: tr.id != null && today && e < today ? tripPageHref(tr.id) : null,
    });
  }
  return out.sort((a, b) => (a.from < b.from ? 1 : a.from > b.from ? -1 : 0));
}
