/**
 * «Zurück zu Heute» (UI-Prüfung 07.11.2026 A2, Noah «4a»): the page of one value in Analyse (or its old page) remembers where you came from.
 * Pure rules, no page: noteMove(state, from, to) keeps the address you left when you step onto a value of Analyse from
 * somewhere else (a tile on Heute, a row on Aktiv); moving inside Analyse keeps it. backOf(from) → { href, place } of the
 * place that address belongs to (its name goes through t() in the page), or null when there is nothing to go back to.
 */
import { pageOf, placeOf, ALL_PLACES } from '../nav.js';

// a value of Analyse, or the old page of one value (Körperwerte, Garmin-Übersicht of a sport: #/flow/stats/<id>), Noah «5a» of the Wege-Entwurf
const VALUE = /^#\/(auswerten\/analyse|flow\/stats)\/[^/?#]+/;
// Auswerten, Analyse and the old value pages count as one place: moving between them keeps where you came from
const INSIDE = /^#\/(auswerten|flow\/stats)(\/|\?|$)/;

/** The new remembered address after moving from `from` to `to` (an address with #), `old` when nothing changes. */
export function noteMove(old, from, to) {
  if (VALUE.test(to ?? '') && from && !INSIDE.test(from)) return from;
  return old ?? null;
}

/** Where «Zurück zu …» leads: { href, place } (place: a key of the nav places) or null. Auswerten itself is in the path already. */
export function backOf(from) {
  if (!from || INSIDE.test(from)) return null;
  const place = placeOf(pageOf(from), from);
  const p = ALL_PLACES.find((x) => x.key === place);
  return p ? { href: from, place: p.label } : null;
}
