/**
 * «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a», «einverstanden»): «What you can do here», the content of a page on the
 * page itself instead of only in the handbook behind «?». For each function whose home page (know/heimat.js) is this page: its
 * name, «what for» (the catalogue text) and, opened, «how it works» (the handbook steps) with the example.
 * The texts exist for every function already; pages are switched on area by area (ON_PAGES), thinnest first (PR 12–20 add
 * knowledge per area). A page shows all its functions, whatever their moment. Heute ('#/') never shows the card. Pure; the card is src/lib/ui/SeitenInhalt.svelte, tested in tests/seiteninhalt.test.js.
 */
import { FEATURES } from './features.js';
import { HANDBOOK } from './handbook.js';
import { HOME } from './know/heimat.js';
import { WISSEN } from './wissen/index.js';

/** The pages that show the card (page keys as pageKey writes them); one PR per area adds its pages. */
export const ON_PAGES = [
  // PR 11, area «Lust» (the thinnest in the content check of 01.11.2026)
  '#/me/frei/lust', '#/me/frei/reise', '#/me/frei/wesentlich', '#/me/frei/nacht', '#/me/compass', '#/trips/dreams', '#/inspiration',
  // PR 15, area «Unterwegs»: On the way, before you leave, mountain, weather, ski start (not Live, not Heute)
  '#/ride', '#/ride/abfahrt', '#/mountain', '#/wetter', '#/ski/start',
  // PR 14, area «Zurück» (after a trip). '#/debrief/:trip' is not listed: ON_PAGES matches whole paths, not placeholders
  '#/debrief', '#/debrief/pace', '#/debrief/logbook', '#/debrief/learnings', '#/pack/past', '#/check/evening', '#/me/ruhig/spaeter',
  '#/me/ruhig/bedeutung', '#/me/ruhig/koennen', '#/me/frei/naechstes', '#/ski/after',
  // PR 16, area «Packen»
  '#/pack', '#/pack/templates', '#/blocks', '#/blocks/aufraeumen', '#/blocks/check', '#/ski/check', '#/me/tools/labels', '#/me/checks',
  // PR 13, area «Planen»: Woche, Merken, Termine, Notizen, Tagebuch, Eingang, Mail, Alltag
  '#/week', '#/calendar', '#/me/agenda', '#/notes', '#/tagebuch', '#/inbox', '#/me/mail', '#/me/alltag',
];
/** Rows shown before «Show all n». */
export const SHOWN = 4;
export const FOLD_KEY = 'seiteninhalt.folded';
/**
 * Pages where the card starts as one line (Noah 02.11.2026): on the way the helpers, «End trip» and the emergency button
 * must stay on the first screen; on Pack the packing list comes first. A tap opens it, and the choice is kept like ×.
 */
export const FOLDED_FIRST = ['#/ride', '#/pack'];

/** The page of a hash, as HOME writes it: path plus «tab=…» or «view=…» when they choose the page. */
export function pageKey(hash = '') {
  const [path, query = ''] = String(hash).split('?');
  const keep = query.split('&').filter((p) => /^(tab|view|open)=/.test(p)).sort().join('&');
  return keep ? `${path}?${keep}` : path;
}

/**
 * The rows for a page: [{ id, title, text, steps, example, know }] (English keys for t()), only on switched-on pages.
 * on: the pages switched on (default ON_PAGES).
 */
export function pageContent(hash, on = ON_PAGES) {
  const here = pageKey(hash);
  if (!here || here === '#/' || !on.includes(here)) return [];
  return FEATURES.filter((f) => HOME[f.id] && pageKey(HOME[f.id]) === here).map((f) => {
    const h = HANDBOOK[f.id] ?? {};
    return { id: f.id, title: f.title, text: f.text, steps: h.steps ?? [], example: h.example ?? '', know: WISSEN[f.id] ?? '' };
  });
}

/** The folded pages ({ [page key]: true }) from the stored setting. */
export const foldedOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => x === true)) : {});

/** The stored choices ({ [page key]: true folded | false opened }), other values left out. */
export const foldMapOf = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === 'boolean')) : {});

/** Whether the card of a page shows as one line: the stored choice, else folded on FOLDED_FIRST pages. */
export function isFolded(map, key, first = FOLDED_FIRST) {
  const m = foldMapOf(map);
  return key in m ? m[key] : first.includes(key);
}
