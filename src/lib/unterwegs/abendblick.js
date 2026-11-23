/**
 * «Abendblick» (Noah 23.11.2026 «G2», Thread «Packen leichter und besser machen»): on the evening of a tour of
 * several days, in 30 seconds: what did I not use so far, what broke, what was missing. The same marks the
 * debrief and the page of the tour use (debrief.items[itemId] = 'unused' | 'broken', no entry = used;
 * debrief.missing), written into the debrief while you are away, so the debrief afterwards is already filled in
 * and «Meist vergessen» and the ballast list learn from the moment, not from days later. Nothing is asked
 * twice, nothing is mandatory, a tap again changes a mark. Pure, tested in tests/abendblick.test.js.
 */
import { gearGroups } from '../touren/tourgear.js';

/** Used → not used → broken → used (the order of the three marks everywhere in the app). */
export const NEXT_MARK = { used: 'unused', unused: 'broken', broken: 'used' };

/**
 * The things of the trip's list, food and drink left out (they have their own counting), as rows
 * { id, name, qty, mark, g (grams of all pieces, null without a weight) }: marked ones first, then by name.
 * Before a debrief exists «open» counts as used (the app's rule: used unless you say otherwise).
 */
export function abendRows(trip, debrief, items = [], nameOf = (i) => i.name) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const side = gearGroups(trip?.entries ?? [], debrief, items, nameOf).gear;
  const rows = [...side.used, ...side.unused, ...side.broken, ...side.open].map((r) => {
    const w = byId[r.id]?.weightG;
    return { id: r.id, name: r.name, qty: r.qty, mark: r.mark === 'open' ? 'used' : r.mark, g: w == null ? null : w * (r.qty || 1) };
  });
  const rank = (m) => (m === 'used' ? 1 : 0);
  return rows.sort((a, b) => rank(a.mark) - rank(b.mark) || a.name.localeCompare(b.name));
}

/** What the marks add up to: { unused, broken, g (grams of the unused ones), unweighed (unused without a weight) }. */
export function abendSummary(rows) {
  const unused = rows.filter((r) => r.mark === 'unused');
  return {
    unused: unused.length,
    broken: rows.filter((r) => r.mark === 'broken').length,
    g: unused.reduce((s, r) => s + (r.g ?? 0), 0),
    unweighed: unused.filter((r) => r.g == null).length,
  };
}

/** Does the Abendblick show? On a tour of several days, on the evening before its last day (blockplan.js hasEvening, `eve`). */
export const abendShows = (eve, trip) => !!eve && (trip?.entries ?? []).length > 0;
