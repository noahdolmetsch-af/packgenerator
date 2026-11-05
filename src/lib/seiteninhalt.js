/**
 * «Wegweiser statt Katalog» PR 11 (Noah 01.11.2026 «1-5a», «einverstanden»): «What you can do here», the content of a page on the
 * page itself instead of only in the handbook behind «?». For each function whose home page (know/heimat.js) is this page: its
 * name, «what for» (the catalogue text) and, opened, «how it works» (the handbook steps) with the example.
 * The texts exist for every function already; pages are switched on area by area (ON_PAGES), thinnest first (PR 12–20 add
 * knowledge per area). A page shows all its functions, whatever their moment. Heute ('#/') never shows the card. Pure; the card is src/lib/ui/SeitenInhalt.svelte, tested in tests/seiteninhalt.test.js.
 */
import { FEATURES } from './features.js';
import { HOME } from './know/heimat.js';

/** The pages that show the card (page keys as pageKey writes them); one PR per area adds its pages. */
export const ON_PAGES = [
  // PR 11, area «Lust» (the thinnest in the content check of 01.11.2026)
  '#/me/frei/lust', '#/me/frei/reise', '#/me/frei/wesentlich', '#/me/frei/nacht', '#/me/compass', '#/trips/dreams', '#/inspiration',
  // PR 15, area «Unterwegs»: On the way, before you leave, mountain, weather, ski start (not Live, not Heute)
  '#/ride', '#/ride/abfahrt', '#/mountain', '#/wetter', '#/ski/start',
  // PR 14, area «Zurück» (after a trip). '#/debrief/:trip' comes with PR 21
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
  // PR 21, pages of one thing (a placeholder ':name' stands for one id): one trip's debrief, a race and its parts, one diary
  // entry. Not the race mode (#/race/:race/ride): while racing the first screen belongs to the ride, like Unterwegs. Not one
  // note (#/notes?open=:note): the note opens as a window over Notes, so the card would only sit hidden behind it.
  '#/debrief/:trip', '#/race/:race', '#/race/:race/route', '#/race/:race/map', '#/tagebuch/:entry',
  // Wegweiser 26b: pages without any content in the check of 02.11.2026 (Touren and Ski start as one line, FOLDED_FIRST)
  '#/trips', '#/trips/fuel', '#/neuland', '#/me/frei', '#/me/frei/sammlungen', '#/me/ruhig/herkunft', '#/me/ruhig/zahlen',
  '#/ski', '#/racecheck',
  // Wegweiser 26a: pages with many functions that were left out for the 2.5-screen rule; the card starts as one line there
  '#/me/data', '#/me/look', '#/me/connections', '#/me/push', '#/bikes?tab=care', '#/timer',
  // Wegweiser Werkzeuge (Noah 03.11.2026 «a» after the final measurement): the mini tools, as one line
  '#/me/tools',
];
/** Words that are fixed sub-pages, never the id of a placeholder (#/debrief/logbook is not a trip). */
export const RESERVED = ['learnings', 'pace', 'compare', 'logbook', 'paesse', 'tourenpass', 'freude', 'play', 'ride', 'brief', 'new', 'shared'];
/** Rows shown before «Show all n». */
export const SHOWN = 4;
export const FOLD_KEY = 'seiteninhalt.folded';
/**
 * Pages where the card starts as one line (Noah 02.11.2026): on the way the helpers, «End trip» and the emergency button
 * must stay on the first screen; on Pack the packing list comes first. A tap opens it, and the choice is kept like ×.
 */
// Wegweiser 18: Training and Auswerten start as one line too (heimat.spec: their functions must stay within 2.5 screens)
// Wegweiser 26b: Touren and Ski tours are main pages with their own list first
export const FOLDED_FIRST = ['#/ride', '#/pack', '#/bikes', '#/gear', '#/flow/training', '#/auswerten', '#/debrief/:trip', '#/trips', '#/ski',
  // Wegweiser 26a: settings-like pages and the care tab keep their own controls on the first screen
  '#/me/data', '#/me/look', '#/me/connections', '#/me/push', '#/bikes?tab=care', '#/timer',
  '#/me/tools'];

/** The page of a hash, as HOME writes it: path plus «tab=…» or «view=…» when they choose the page. */
export function pageKey(hash = '') {
  const [path, query = ''] = String(hash).split('?');
  const keep = query.split('&').filter((p) => /^(tab|view|open)=/.test(p)).sort().join('&');
  return keep ? `${path}?${keep}` : path;
}

const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whether a page key fits a page of ON_PAGES: equal, or ':name' parts stand for one id that is not a RESERVED word. */
export function fits(here, page) {
  if (here === page) return true;
  if (!page.includes(':')) return false;
  const re = new RegExp(`^${page.split(/(:\w+)/).map((x) => (x.startsWith(':') ? '([^/?&]+)' : esc(x))).join('')}$`);
  const m = here.match(re);
  return !!m && m.slice(1).every((v) => !RESERVED.includes(decodeURIComponent(v)));
}

/** A made-up id for each placeholder name; the page of that id is then a "real" page for pagePattern (Wegweiser 24 reads ON_PAGES). */
export const SAMPLE_IDS = { trip: 'sample-trip', race: 'race-sample', entry: 'sample-entry' };
/** A page of ON_PAGES with every ':name' replaced by an id (ids[name], else SAMPLE_IDS[name]), so it can be opened or matched. */
export function samplePage(page, ids = {}) {
  return page.replace(/:(\w+)/g, (_, n) => ids[n] ?? SAMPLE_IDS[n] ?? n);
}

/** The switched-on page (as written in ON_PAGES, with its placeholders) a hash belongs to, or '' (a fixed page wins). */
export function pagePattern(hash, on = ON_PAGES) {
  const here = pageKey(hash);
  if (!here || here === '#/') return '';
  return on.includes(here) ? here : (on.find((p) => fits(here, p)) ?? '');
}

/**
 * The rows for a page: [{ id, title, text, steps, example, know }] (English keys for t()), only on switched-on pages.
 * on: the pages switched on (default ON_PAGES). A page of one thing (#/debrief/<trip>) shows the functions HOME writes
 * for its pattern (#/debrief/:trip).
 */
/**
 * Wegweiser 26c: functions whose page opens as a window over another page show in that page's card. An open note is a
 * window over Notes, so a card there would sit hidden behind it; the six note functions show on Notes instead.
 */
export const SHOWS_TOO = { '#/notes': ['#/notes?open=:note'] };

/**
 * know: the «Good to know» texts by function id (WISSEN). They are not part of the start (Tempo-Budget,
 * scripts/size-guard.mjs): the card loads them with loadWissen() (src/lib/wissen/load.js) and hands them in.
 * handbook: the handbook entries by function id (HANDBOOK), the same way (loadHandbook(), src/lib/handbook/load.js); without
 * them the rows have a title and a text but no steps yet.
 */
export function pageContent(hash, on = ON_PAGES, know = {}, handbook = {}) {
  const here = pagePattern(hash, on);
  if (!here) return [];
  // the page's own functions first, then those of the windows it opens (SHOWS_TOO)
  const homes = [here, ...(SHOWS_TOO[here] ?? [])];
  const rank = (f) => homes.indexOf(pageKey(HOME[f.id]));
  return FEATURES.filter((f) => HOME[f.id] && rank(f) >= 0).sort((a, b) => rank(a) - rank(b)).map((f) => {
    const h = handbook[f.id] ?? {};
    return { id: f.id, title: f.title, text: f.text, steps: h.steps ?? [], example: h.example ?? '', know: know[f.id] ?? '' };
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
