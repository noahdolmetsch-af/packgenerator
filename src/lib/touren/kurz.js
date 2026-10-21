/**
 * 0.163.0 «Handy kurz» (Durchklick 2, Noah 15.10.2026 «freigabe», answers 1 «wo sinnvoll» and 2b): on a phone a
 * long page is at most three screens. A list shows PHONE_ROWS rows, then «Show n more»; the values of a trip
 * or an activity are one small grey line under its row (2b) instead of a box, and a value without data is left
 * out. A computer keeps the full rows. The pure parts live here (tests/kurz.test.js).
 */

/** A list on a phone shows this many rows first. */
export const PHONE_ROWS = 5;
/** Tempo (Noah 19.10.2026 «3a»): the trip list draws 20 rows first, «Show n more» adds 20 at a time. */
export const TOUR_ROWS = 20;

/** How many rows the next «Show n more» adds: up to the next step of TOUR_ROWS, never past the total. */
export const nextRows = (total, shown, step = TOUR_ROWS) => Math.max(0, Math.min(total, (Math.floor(shown / step) + 1) * step) - shown);

/** A phone page is at most this many screens high (the guard test measures it). */
export const MAX_SCREENS = 3;

/**
 * The values of an activity that go into its grey line, in this order (Noah 15.10.2026 «b», with heart rate, TSS,
 * elapsed time and more); cadence, max. speed and the power peaks after a tap.
 */
export const ACT_LINE = ['dauer', 'verstr', 'kmh', 'hf', 'hfmax', 'tss', 'w'];

/**
 * One grey line from [label, value, unit] parts: the parts without a value («–», empty) are left out.
 * → '' when nothing is left.
 */
export function shortLine(parts, dash = '–') {
  return parts
    .filter(([, value]) => value != null && value !== '' && value !== dash)
    .map(([label, value, unit]) => [label, unit ? `${value} ${unit}` : value].filter(Boolean).join(' '))
    .join(' · ');
}

/**
 * Gesamttest 21.10.2026 C7: a phone list cut to `n` rows. The rows `keep` names (due, overdue, an open draft)
 * always stay; the other rows fill up to `n` in the order of the list. → the rows to show, in order.
 */
export function capKeep(rows, n, keep = () => false) {
  let left = Math.max(0, n - rows.filter(keep).length);
  return rows.filter((r) => keep(r) || (left > 0 && left-- > 0));
}

/** The first `n` rows of month groups ([{ ..., rows }]), the groups kept in order and the empty ones left out. */
export function capGroups(groups, n, key = 'rows') {
  const out = [];
  let left = n;
  for (const g of groups) {
    if (left <= 0) break;
    const rows = g[key].slice(0, left);
    left -= rows.length;
    out.push({ ...g, [key]: rows });
  }
  return out;
}
