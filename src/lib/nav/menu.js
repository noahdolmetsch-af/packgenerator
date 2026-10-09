/**
 * v0.38.0 (Noah 11a, 12a, 13a): the menu "More" (top right, also on a phone) and what the search finds
 * besides gear, trips, bikes and notes. Every page of the app is in exactly one menu:
 * - the four places (Today, Trips, Gear, Bikes) in the bar,
 * - "New" (+) for everything you create,
 * - "More" for the rarer pages, in four light groups.
 * No sub-tabs on the pages (13a): the rarer pages are found here and by the search.
 * The trip tabs (Plan, Pack, On the way, Debrief) stay in the trip band; Share stays a link.
 *
 * Titles are English keys for t(); words: what the search also matches (English and German).
 * A row has an href (a page) or an action (nav.js does it, see Search.svelte and MoreSheet.svelte).
 */
export const MORE_GROUPS = [
  {
    key: 'plan',
    name: 'Plan|more',
    rows: [
      { id: 'templates', title: 'Templates', href: '#/pack/templates', icon: 'file', words: 'templates template vorlagen vorlage kits kit' },
      // v0.32.0 (finding 5, stage 1): the old words (role, worn, every trip, kits) find the new places.
      { id: 'blocks', title: 'Building blocks', href: '#/blocks', icon: 'layers', words: 'building blocks block bausteine baustein sets set standard always with you immer dabei with the night mit nacht to add dazunehmen role rolle every trip jeder tour' },
    ],
  },
  {
    key: 'back',
    name: 'Look back',
    rows: [
      { id: 'past', title: 'Past trips', href: '#/pack/past', icon: 'calendar', words: 'past trips vergangene touren finished vorbei archiv' },
      { id: 'debriefs', title: 'Debriefs and learnings', href: '#/debrief', icon: 'book', words: 'debriefs debrief learnings learning rückblick rückblicke lernen gelernt' },
      { id: 'compare', title: 'Compare trips', href: '#/debrief/compare', icon: 'compare', words: 'compare vergleichen vergleich trend base weight basisgewicht' },
      { id: 'pace', title: 'Your pace', href: '#/debrief/pace', icon: 'gauge', words: 'pace tempo speed geschwindigkeit gpx riding time fahrzeit' },
    ],
  },
  {
    key: 'gear',
    name: 'Gear|place',
    rows: [{ id: 'favorites', title: 'All my favourite things', short: 'Favourites', href: '#/favorites', icon: 'star', words: 'favourites favorites favourite favorite best things lieblingsstücke favoriten beste' }],
  },
  {
    key: 'app',
    name: 'App|more',
    rows: [
      { id: 'inbox', title: 'Inbox', href: '#/inbox', icon: 'inbox', words: 'inbox eingang einordnen to sort zettel' },
      { id: 'data', title: 'Your data', action: 'data', icon: 'data', words: 'your data deine daten backup sicherung import export restore wiederherstellen' },
      { id: 'features', title: 'What the app can do', href: '#/features', icon: 'sparkles', words: 'what the app can do was die app kann features funktionen tips tipps updates neuerungen' },
    ],
  },
];

/** Every row of "More", flat, each with the name of its group. */
export const MORE_ROWS = MORE_GROUPS.flatMap((g) => g.rows.map((r) => ({ ...r, group: g.name })));

/**
 * Things to do that the search finds as well ("vorl" → "New template"), each once: they are the
 * entries of "New" and the quick buttons on Today. action: what nav.js does (Search.svelte).
 */
export const ACTIONS = [
  { id: 'trip', title: 'Plan a trip', action: 'trip', words: 'plan a trip new trip tour planen neue tour packing list packliste' },
  { id: 'dayride', title: 'Day ride now', action: 'dayride', words: 'day ride now tagestour jetzt ausfahrt' },
  { id: 'note', title: 'Note + photo', action: 'note', words: 'note photo notiz foto quick note zettel kaputt fehlte' },
  { id: 'item', title: 'Gear item', action: 'item', words: 'new gear item add item neues teil ausrüstungsteil hinzufügen' },
  { id: 'km', title: 'km for a bike', action: 'km', words: 'km kilometer counter zähler nachtragen' },
  { id: 'template', title: 'New template from the open trip', href: '#/pack/templates', words: 'new template neue vorlage' },
];
