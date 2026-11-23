/**
 * «Dein Stand» (V4b2, Noah 22.11.2026 «2a»): the lines of the card on Training › Woche. Only to look at, no diagnosis.
 * Pure: the resting pulse of the last days against the usual one.
 */

/** The resting pulse of the last 7 days (median) against the usual one: { now, usual, diff } or null with fewer than 3 days. */
export function restLine(table, today, usual, dayBefore) {
  const v = [];
  for (let i = 0; i < 7; i++) {
    const r = table?.get?.(dayBefore(today, i))?.rhr;
    if (Number.isFinite(r)) v.push(r);
  }
  if (v.length < 3 || !Number.isFinite(usual)) return null;
  v.sort((a, b) => a - b);
  const now = v[v.length >> 1];
  return { now, usual, diff: now - usual };
}
