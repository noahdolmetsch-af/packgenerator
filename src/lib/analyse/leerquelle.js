/**
 * «Leere Kachel sagt, woher der Wert kommt» (UI-Prüfung 07.11.2026, Befunde A3 und I1; Noah «alle Vorschläge»): when
 * tiles of Auswerten or Analyse are empty, ONE line says which source is missing and leads there, instead of one empty
 * tile after the other. Pure: no page, no database, no clock. The page passes what it knows.
 *
 * leerQuelle(items, connected): items = [{ key, name, src, empty }] (the values of the Analyse catalogue, `empty` = no
 * value in the shown period); connected = { fitbit: true, strava: false, … } (which sources deliver at all; a source
 * that is missing counts as not connected). → one group per source that has a page of its own and at least one empty
 * value, the biggest first: { src, name, href, n, keys, connected }. A value of an own calculation (src «body») has no
 * source page, so it never makes a group; a value of a connected source that is empty just has no day yet and also
 * never makes a group (nothing to connect). Observation only; the line is a suggestion.
 * leerSumme(groups): how many values wait for a source in all.
 * The line itself (src/lib/ui, text through t()) comes with the page PR that uses it; the page is built later.
 */
import { sourceLink } from './zahlweg.js';

export function leerQuelle(items = [], connected = {}) {
  const by = new Map();
  for (const it of items) {
    if (!it?.empty || !it.key) continue;
    const s = sourceLink(it.src);
    if (!s || connected[it.src]) continue;
    const g = by.get(it.src) ?? { src: it.src, name: s.name, href: s.href, n: 0, keys: [], connected: false };
    g.n += 1;
    g.keys.push(it.key);
    by.set(it.src, g);
  }
  return [...by.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
}

/** The count of values that wait for a source. */
export const leerSumme = (groups = []) => groups.reduce((n, g) => n + g.n, 0);
