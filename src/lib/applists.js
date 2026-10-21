/**
 * «Alle Daten anpassbar» round 2 (Noah 21.10.2026 «4a»): five more lists of the app go into «Listen und
 * Typen» (standard.js STANDARD_LISTS, changes in settings «listOverrides»):
 *   pointKinds        the kinds of your own map points (map/ownpoints.js)
 *   bikeKinds         the kinds of bike (bikekind.js); an own kind starts like Gravel (template, speed)
 *   awayTypes         the kinds of time away in «Woche planen» (woche.js)
 *   journalQuestions  the 365 questions of the diary (tagebuch/fragen.js)
 *   journalMoods      the five moods of a diary entry (rename only: the curve needs its five steps)
 *   medMoods          the moods after a meditation (flowmed.js)
 * lists.js applyLists puts the person's list here; the pages read it through listOf / nameOf. Until it
 * has loaded (and in the unit tests) the Standard counts.
 * An entry: { id, name, own?, renamed?, hidden? }. A name the person typed (own or renamed) never goes
 * through t(): raw tells the pages.
 */
export const APP_LISTS = ['pointKinds', 'bikeKinds', 'awayTypes', 'journalQuestions', 'journalMoods', 'medMoods'];

// a plain object like the other lists (domains.js, care.js): App.svelte draws the page again when the
// lists arrive (listsReady); plain, so the pure files and the browser tests can import it in Node
export const appLists = Object.fromEntries(APP_LISTS.map((k) => [k, null]));

/** Put a list in place (lists.js). list: listFor(key) [{ id, name, own, renamed, hidden }]. */
export function setAppList(key, list) {
  appLists[key] = Array.isArray(list) ? list.map((e) => ({ id: e.id, name: e.name, ...(e.own ? { own: true } : {}), ...(e.renamed ? { renamed: true } : {}), ...(e.hidden ? { hidden: true } : {}) })) : null;
}

/** The list as the person has it, or the Standard ([{ id, name }]) when nothing is loaded. */
export const listOf = (key, std) => appLists[key] ?? std;
/** Only what is offered for a new choice (no hidden entries). keep: an id that stays (the current choice). */
export function offered(key, std, keep = null) {
  const list = listOf(key, std).filter((e) => !e.hidden || e.id === keep);
  if (keep == null || list.some((e) => e.id === keep)) return list;
  // the current choice was deleted: it stays offered, so the window does not change it on its own
  const old = std.find((e) => e.id === keep);
  return old ? [...list, old] : list;
}
/**
 * May a record keep this id? The list's ids, and every own id («own-…», «Listen und Typen» addOwn) even
 * before the list has loaded or after it was deleted: a record never loses its kind by being read.
 */
export const hasId = (key, std, id) => typeof id === 'string' && (id.startsWith('own-') || listOf(key, std).some((e) => e.id === id));
/** An entry's name for the page: a typed one as it is, a Standard one through tr. fallback: an unknown id. */
export function nameOf(key, std, id, tr = (s) => s, fallback = '') {
  const e = listOf(key, std).find((x) => x.id === id) ?? std.find((x) => x.id === id);
  if (!e) return fallback;
  return e.own || e.renamed ? e.name : tr(e.name);
}
