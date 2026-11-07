/**
 * «Zahl mit Weg» und «Quelle-Zeile» (UI-Prüfung 07.11.2026, Noah «alle Vorschläge», Rang 1): the two small rules
 * behind a number that leads somewhere. Pure: no page, no database, no clock.
 *
 * numHref({ key, range, day, src }): where a tap on a number goes: the page of one value (key, with its period) or the
 * sheet of one day, both in Analyse (jump.js). A number without an analysis (Noah 07.11.2026 «2b»: every number can be
 * tapped) falls back to its source page (src, see sourceLink). Nothing to point at → null (plain text).
 * sourceLink(src): where a value comes from, as a name and a page of the app, for the line «Source: Fitbit ›».
 * src is the source key of the Analyse catalogue (fitbit, strava, check, aktiv); an own calculation (body) has no
 * page of its own → null.
 * The components are src/lib/ui/NumLink.svelte and src/lib/ui/SourceLine.svelte; pages use them one by one.
 */
import { valueHref, dayHref } from './jump.js';

/** Source key → name (a proper name, never translated) and the page where it is set up or kept. */
export const SOURCE_PAGES = {
  fitbit: { name: 'Fitbit', href: '#/me/fitbit' },
  strava: { name: 'Strava', href: '#/me/connections' },
  check: { name: "Wi gaht's?", href: '#/me/abfragen' },
  aktiv: { name: 'Aktiv', href: '#/flow' },
};

/** The link of a number: a value (key, optional period), a day, or else its source page; null when it names none. */
export function numHref({ key = null, range = null, day = null, src = null } = {}) {
  if (key) return valueHref(key, range);
  if (day) {
    const h = dayHref(day);
    if (h !== '#/auswerten/analyse') return h; // a wrong day points nowhere
  }
  return sourceLink(src)?.href ?? null;
}

/** { name, href } of a source key, or null for an own calculation or an unknown key. */
export function sourceLink(src) {
  return SOURCE_PAGES[src] ?? null;
}
