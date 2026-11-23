/**
 * Bikepacking-Vorschlag K2 «Taschen-Etiketten» (Noah 23.11.2026): one picture per bag with its content, to keep on
 * the phone or to print: packing in the hotel room, searching on the way. Pure functions for the lines; the picture
 * is drawn in BagLabel.svelte. Tested in tests/baglabel.test.js.
 */

/** At most this many lines on a label; the rest is counted («+ 3 more»). */
export const LABEL_MAX = 22;

/**
 * The lines of a label. entries: the entries of the bag ({ itemId, qty }); name(item) → text; items by id.
 * → { rows: [{ text, qty, g }], more, totalG, missing } (g: grams of the line or null; totalG: of the known ones;
 * missing: lines without a weight). The heaviest lines come first so a long bag still shows what matters.
 */
export function labelLines(entries = [], itemsById = {}, name = (i) => i?.name ?? '', max = LABEL_MAX) {
  const all = entries.map((e) => {
    const item = itemsById[e.itemId];
    const qty = Math.max(1, Number(e.qty) || 1);
    const w = item?.weightG;
    return { text: String(item ? name(item) : e.name ?? e.itemId ?? '').trim() || '–', qty, g: Number.isFinite(Number(w)) && w !== null ? Math.round(Number(w) * qty) : null };
  });
  const sorted = [...all].sort((a, b) => (b.g ?? -1) - (a.g ?? -1) || a.text.localeCompare(b.text));
  const rows = sorted.slice(0, max);
  return {
    rows,
    more: Math.max(0, sorted.length - rows.length),
    totalG: all.reduce((s, r) => s + (r.g ?? 0), 0),
    missing: all.filter((r) => r.g == null).length,
  };
}

/** A file name from a bag and a trip: letters, digits and dashes, «.jpg» at the end. */
export const labelFileName = (bag = '', trip = '') =>
  `${[bag, trip]
    .map((s) => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean)
    .join('-')
    .slice(0, 60) || 'bag'}.jpg`;
