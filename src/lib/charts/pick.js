/**
 * «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): which bar or day of a chart a finger, the mouse or
 * the keyboard points at. Pure, no DOM: the chart passes the box of its plot and the number of columns.
 * The columns are equally wide and fill the plot from left to right (bars, days of a line).
 */

/** The column under clientX in a plot of n equal columns, or null outside the plot. */
export function indexAt(clientX, rect, n) {
  if (!rect || !(rect.width > 0) || !(n > 0)) return null;
  const f = (clientX - rect.left) / rect.width;
  if (f < 0 || f > 1) return null;
  return Math.min(n - 1, Math.max(0, Math.floor(f * n)));
}

/**
 * The column after a key: ← → one step, Home and End the first and the last, PageUp/PageDown 7 steps
 * (a week of days). From nothing chosen yet, ← starts at the last column and → at the first.
 * Returns null when the key does nothing.
 */
export function stepKey(key, i, n) {
  if (!(n > 0)) return null;
  const last = n - 1;
  const from = i == null ? null : Math.min(last, Math.max(0, i));
  switch (key) {
    case 'ArrowLeft':
      return from == null ? last : Math.max(0, from - 1);
    case 'ArrowRight':
      return from == null ? 0 : Math.min(last, from + 1);
    case 'PageUp':
      return from == null ? last : Math.max(0, from - 7);
    case 'PageDown':
      return from == null ? 0 : Math.min(last, from + 7);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return null;
  }
}

/** The number in words with its sign against an earlier value: «+3», «−2», «±0». */
export function diffText(now, before, num = (x) => String(x)) {
  if (!Number.isFinite(now) || !Number.isFinite(before)) return '';
  const d = Math.round((now - before) * 10) / 10;
  return d > 0 ? `+${num(d)}` : d < 0 ? `−${num(-d)}` : '±0';
}
