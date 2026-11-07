/**
 * «Tour-Ampel» (Noah 05.11.2026, Touren 3a): before a trip, one small card on Pack: is it packed, does the
 * weather fit the list, is the bike in order, are the devices charged. Each line has a calm tone and a
 * tap to the place that fixes it. Observation only: nothing is blocked, nothing is mandatory.
 *
 * Pure functions, tested in tests/ampel.test.js. Texts are English keys for t().
 *
 * tone: 'ok' (green), 'wait' (yellow, still to do), 'stop' (red, soon and still open), 'none' (grey, no data).
 */

/** Whole days between two YYYY-MM-DD days (calendar arithmetic, no 864e5 on timestamps). */
export function daysBetween(from, to) {
  const a = Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8, 10));
  const b = Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8, 10));
  return Math.round((b - a) / 864e5);
}

/** Does the card show for this trip? A planned trip that has not started and has something on its list. */
export function ampelShows(trip, stats, today) {
  if (!trip || trip.skipped || trip.finished || trip.status === 'done') return false;
  if (typeof trip.startDate !== 'string' || trip.startDate.slice(0, 10) < today) return false;
  return !!stats?.count;
}

/**
 * The lines. in: { trip, stats, today, forecast: bool (has a forecast for the trip days), wxGap: bool,
 * care: { due, late, nodata, open } | null (null = no bike trip), charged: { done, total } | null }.
 * → [{ key, tone, text, vars, act }]  act = what a tap does ('pack' | 'weather' | 'bike' | 'power' | null)
 */
export function ampelRows({ trip, stats, today, forecast = false, wxGap = false, care = null, charged = null }) {
  const rows = [];
  const left = daysBetween(today, trip.startDate.slice(0, 10));

  // 1. packed
  const total = stats.count;
  const pct = Math.floor((stats.packed / total) * 100);
  const packTone = pct >= 100 ? 'ok' : pct >= 70 || left > 2 ? 'wait' : 'stop';
  rows.push({ key: 'pack', tone: packTone, text: pct >= 100 ? 'Everything is packed' : 'Packed {n} %', vars: { n: pct }, act: pct >= 100 ? null : 'pack' });

  // 2. weather
  if (!forecast) rows.push({ key: 'weather', tone: 'none', text: 'No forecast for these days yet', vars: {}, act: null });
  else if (wxGap) rows.push({ key: 'weather', tone: 'wait', text: 'The forecast differs from your list', vars: {}, act: 'weather' });
  else rows.push({ key: 'weather', tone: 'ok', text: 'The weather fits your list', vars: {}, act: null });

  // 3. bike (only a trip with a bike)
  if (care) {
    const n = (care.due ?? 0) + (care.open ?? 0);
    if (n > 0) rows.push({ key: 'bike', tone: care.late ? 'stop' : 'wait', text: n === 1 ? 'Bike: 1 thing to do' : 'Bike: {n} things to do', vars: { n }, act: 'bike' });
    else if (care.nodata) rows.push({ key: 'bike', tone: 'none', text: 'Bike: no check recorded yet', vars: {}, act: 'bike' });
    else rows.push({ key: 'bike', tone: 'ok', text: 'Bike: nothing due', vars: {}, act: null });
  }

  // 4. devices
  if (charged?.total) {
    const full = charged.done >= charged.total;
    rows.push({ key: 'power', tone: full ? 'ok' : 'wait', text: full ? 'Devices charged' : 'Charged {done} of {total} devices', vars: { done: charged.done, total: charged.total }, act: full ? null : 'power' });
  }
  return rows;
}

/** The headline of the card from its lines (English key). */
export function ampelHead(rows) {
  if (rows.some((r) => r.tone === 'stop')) return 'Not ready yet';
  if (rows.some((r) => r.tone === 'wait')) return 'Almost ready';
  return 'Ready to go';
}
