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
  // PR 17, area «Alltag»: documents and links, calm, reminders, friends and mini tools (not Reminders on the phone and
  // Data and backup: their many functions would slip below 2.5 screens, tests/e2e/heimat.spec.js)
  '#/me/docs', '#/me/links', '#/me/tools/markup', '#/me/ruhig', '#/me/ruhig/aus', '#/me/ruhig/belege', '#/me/ruhig/weniger',
  '#/me/reminders', '#/calendar/pflanzen', '#/inbox/vorgaenge', '#/me/album', '#/me/freunde',
  '#/me/ki-projekte', '#/me/mini', '#/me/mini/abfahrt', '#/me/mini/los', '#/me/next', '#/me/frei/abend', '#/notes/zusammenhang',
  // PR 16, area «Packen»
  '#/pack', '#/pack/templates', '#/blocks', '#/blocks/aufraeumen', '#/blocks/check', '#/ski/check', '#/me/tools/labels', '#/me/checks',
  // PR 13, area «Planen»: Woche, Merken, Termine, Notizen, Tagebuch, Eingang, Mail, Alltag
  '#/week', '#/calendar', '#/me/agenda', '#/notes', '#/tagebuch', '#/inbox', '#/me/mail', '#/me/alltag',
  // PR 19, area Velo: Velos with their tabs, Material, Wardrobe, Ski care, bike shops
  // not #/bikes?tab=care: on a phone the card pushed «All tips» below 2.5 screens (tests/e2e/heimat.spec.js)
  '#/bikes', '#/bikes?tab=care&view=faq', '#/bikes?tab=care&view=import', '#/bikes?tab=care&view=photos',
  '#/bikes?tab=care&view=season', '#/bikes?tab=care&view=sell', '#/bikes?tab=care&view=spick', '#/bikes?tab=care&view=strava',
  '#/bikes?tab=care&view=templates', '#/bikes?tab=care&view=wear', '#/bikes?tab=care&view=year', '#/bikes?tab=compare',
  '#/bikes?tab=compare&view=all', '#/bikes?tab=compare&view=enter', '#/bikes?tab=rig', '#/bikes?tab=rig&view=bags',
  '#/bikes?tab=rig&view=log', '#/bikes?tab=setup', '#/bikes?tab=shop', '#/equipment', '#/gear', '#/me/pros', '#/ski/care', '#/wardrobe',
  // PR 18, area Körper (Aktiv, sports, training, meditation, body values; the Ruhiger pages go with Alltag)
  '#/flow', '#/flow/sports', '#/flow/sport/act%3Agym', '#/flow/sport/act%3Atennis', '#/flow/training', '#/flow/form', '#/flow/review',
  '#/flow/stats/hr', '#/flow/act/meditation', '#/flow/act/meditation/log', '#/flow/act/meditation/mehr', '#/auswerten',
  '#/auswerten/analyse', '#/me/abfragen', '#/me/insights', '#/me/weight', '#/me/wohl', '#/me/fitbit', '#/trips/rides',
  // PR 20, area «App»: the app itself (lists, privacy, rules, own values, search, assistant, helper, mini apps).
  // Not Data and backup, Appearance, Connections: with many functions the card pushes them below 2.5 phone screens (heimat.spec.js).
  '#/me/lists', '#/me/privacy', '#/me/regeln', '#/me/verstehen', '#/me/werte', '#/me/hinweise',
  '#/me/suche', '#/assistent', '#/helper', '#/me/apps',
];
/** Rows shown before «Show all n». */
export const SHOWN = 4;
export const FOLD_KEY = 'seiteninhalt.folded';
/**
 * Pages where the card starts as one line (Noah 02.11.2026): on the way the helpers, «End trip» and the emergency button
 * must stay on the first screen; on Pack the packing list comes first. A tap opens it, and the choice is kept like ×.
 */
// Wegweiser 18: Training and Auswerten start as one line too (heimat.spec: their functions must stay within 2.5 screens)
export const FOLDED_FIRST = ['#/ride', '#/pack', '#/bikes', '#/gear', '#/flow/training', '#/auswerten'];

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
