/**
 * v0.71.0 «Fünf Orte» 1 (Noah 10.10.2026): the menu «More» is gone. Every page has one home:
 * - the five places (Today, Trips, Gear, Bikes, Active) in the bar, with their pages in the sidebar,
 * - «Ich» (top right, #/me) for the Inbox, the notes, your data and what the app can do,
 * - «New» (+) for everything you create.
 * These rows are what the search finds besides gear, trips, bikes and notes; group: the place a
 * page lives under (its name shows under the result). The trip tabs stay in the trip band.
 * (v0.38.0 had the same rows in the four groups of «More».)
 *
 * Titles are English keys for t(); words: what the search also matches (English and German).
 * A row has an href (a page) or an action (nav.js does it, see Search.svelte and pages/Me.svelte).
 */
export const PAGE_GROUPS = [
  {
    key: 'trips',
    name: 'Trips|place',
    rows: [
      { id: 'templates', title: 'Templates', href: '#/pack/templates', icon: 'file', words: 'templates template vorlagen vorlage kits kit packing lists packlisten packliste' },
      // v0.49.0 R1 (Noah 4a): one page «Rückblick» (the last ride, the 12 months, trips compared);
      // «Letzte 12 Monate» and «Touren vergleichen» are parts of it, their words find it.
      { id: 'debriefs', title: 'Look back|page', href: '#/debrief', icon: 'chart', words: 'look back rückblick rückblicke debriefs debrief last 12 months letzte 12 monate review jahr year jahresrückblick statistik statistics numbers zahlen compare vergleichen vergleich trend' },
      { id: 'past', title: 'Past trips', href: '#/pack/past', icon: 'calendar', words: 'past trips vergangene touren finished vorbei archiv table tabelle' },
      { id: 'learnings', title: 'Learnings', href: '#/debrief/learnings', icon: 'book', words: 'learnings learning lernen gelernt erkenntnisse what the app learned was die app gelernt hat' },
      { id: 'pace', title: 'Your pace', href: '#/debrief/pace', icon: 'gauge', words: 'pace tempo speed geschwindigkeit gpx riding time fahrzeit' },
    ],
  },
  {
    key: 'gear',
    name: 'Gear|place',
    rows: [
      { id: 'favorites', title: 'Favourites', href: '#/favorites', icon: 'star', words: 'favourites favorites favourite favorite best things lieblingsstücke favoriten beste' },
      // v0.32.0 (finding 5, stage 1): the old words (role, worn, every trip, kits) find the new places.
      { id: 'blocks', title: 'Building blocks', href: '#/blocks', icon: 'layers', words: 'building blocks block bausteine baustein sets set standard always with you immer dabei with the night mit nacht to add dazunehmen role rolle every trip jeder tour' },
      // v0.66.0 (Noah 4a): one block after the other, keep / out / elsewhere.
      { id: 'blockcheck', title: 'Check building blocks', href: '#/blocks/check', icon: 'layers', words: 'check building blocks bausteine prüfen pruefen review blocks aufräumen tidy' },
      // v0.42.0 (Noah 1): the clothing by layer and body zone.
      { id: 'wardrobe', title: 'Wardrobe', href: '#/wardrobe', icon: 'shirt', words: 'wardrobe clothing clothes layers onion kleiderschrank kleider kleidung schicht schichten zwiebel' },
    ],
  },
  {
    key: 'active',
    name: 'Active|place',
    rows: [
      // v0.51.0 «Im Flow»; v0.71.0: the place «Aktiv».
      { id: 'flow', title: 'In the flow', href: '#/flow', icon: 'flow', words: 'in the flow im flow flow aktiv active goals ziele sport training meditation yoga rings ringe daily check tagescheck stopwatch stoppuhr countdown habit gewohnheit' },
    ],
  },
  {
    key: 'me',
    name: 'Me|place',
    rows: [
      { id: 'inbox', title: 'Inbox', href: '#/inbox', icon: 'inbox', words: 'inbox eingang einordnen ablegen abgelegt to sort file zettel beleg' },
      // v0.48.0 (Noah 12a-17a): the Notes page (notes kept, topics, pinned, checklists).
      { id: 'notes', title: 'Notes', href: '#/notes', icon: 'notes', words: 'notes notizen notiz merken checkliste checklist thema topics pinned angeheftet' },
      { id: 'data', title: 'Your data', action: 'data', icon: 'data', words: 'your data deine daten backup sicherung import export restore wiederherstellen' },
      { id: 'features', title: 'What the app can do', href: '#/features', icon: 'sparkles', words: 'what the app can do was die app kann features funktionen tips tipps updates neuerungen' },
      // v0.71.0: «Ich» itself, with the language, light or dark and the colour world.
      { id: 'me', title: 'Me|place', href: '#/me', icon: 'user', words: 'me ich settings einstellungen language sprache deutsch english dark dunkel light hell colours farben stil style theme home place heimat keyboard shortcuts tastenkürzel help hilfe version' },
    ],
  },
];

/** Every page row, flat, each with the name of its place. */
export const PAGE_ROWS = PAGE_GROUPS.flatMap((g) => g.rows.map((r) => ({ ...r, group: g.name })));

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
  // v0.41.0 (Noah 1): a recorded ride (GPX) → pauses, planned vs real, learnings.
  { id: 'ride', title: 'Upload ride', href: '#/debrief/ride', words: 'upload ride fahrt hochladen gpx tcx strava garmin komoot wahoo pause pausen geplant planned real track' },
  { id: 'template', title: 'New template from the open trip', href: '#/pack/templates', words: 'new template neue vorlage' },
];
