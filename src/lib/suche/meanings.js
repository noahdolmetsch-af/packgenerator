/**
 * Einzelidee 40 «Suche fragt bei zwei Bedeutungen nach» (996 Ideen, Noah 25.10.2026): when a short search
 * finds things of two kinds (a «Kette» in Material and on a bike, «Jura» as a trip and as a note), the search
 * asks which one is meant with two buttons; a tap narrows the search with the kind word that smart.js
 * already knows («material kette»). Nothing is hidden before the tap. Pure, tested in tests/einzeln-material.test.js.
 */
import { parseFilters } from '../kisuche/smart.js';

/** The kind word a tap puts in front (smart.js KIND_WORDS). */
export const KIND_WORD = { gear: 'material', trip: 'touren', bike: 'velos', note: 'notizen', log: 'lernpunkte', template: 'vorlagen' };

/**
 * The two meanings of a search: [{ kind, name, n, q }] (two, the kinds with the most hits first), or []
 * when it is clear: one kind only, a kind word or a filter already given, or more than four words.
 */
export function meaningsOf(q, groups = []) {
  const text = String(q ?? '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length || words.length > 4) return [];
  const f = parseFilters(text);
  if (f.kinds.size || Object.keys(f.weight).length || Object.keys(f.temp).length) return [];
  const kinds = groups
    .filter((g) => KIND_WORD[g.kind] && g.rows?.length)
    .map((g) => ({ kind: g.kind, name: g.name, n: g.rows.length + (g.more ?? 0), q: `${KIND_WORD[g.kind]} ${text}` }))
    .sort((a, b) => b.n - a.n);
  return kinds.length >= 2 ? kinds.slice(0, 2) : [];
}
