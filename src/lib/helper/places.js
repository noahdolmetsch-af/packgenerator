/**
 * v0.118.0 «KI-Helfer ausblenden» (mockup K4, Noah 12.10.2026 «k1-k4 ok»): the places where the AI helper
 * shows when the one switch under Ich › KI-Helfer is on (client.svelte.js isOn / isShown). English keys
 * for t(); the page lists them with «on»/«off». Each place checks the switch itself:
 *   trip     pack/TripDialog.svelte  «Ask the helper», only with a question from the search
 *   pack     pack/CalmPack.svelte    «Check the list»
 *   debrief  pages/Debrief.svelte    «With the helper», a draft from your notes
 *   care     care/BikeCare.svelte    suggestions in «Due now»
 *   search   nav/Search.svelte       the answer to a question (helper/SearchAnswer.svelte)
 *   today    pages/Home.svelte       the tile «Helper», when it is on your wall
 */
export const HELPER_PLACES = [
  { key: 'trip', name: 'New trip', what: '«Ask the helper», with a question from the search', icon: 'route' },
  { key: 'pack', name: 'Packing|helper', what: 'Button «Check the list»', icon: 'backpack' },
  { key: 'debrief', name: 'Debrief|helper', what: '«With the helper»: a draft from your notes', icon: 'book' },
  { key: 'care', name: 'Bike care', what: 'Suggestions in «Due now»', icon: 'bike' },
  { key: 'search', name: 'Search|helper', what: 'Answer to questions', icon: 'search' },
  { key: 'today', name: 'Today|helper', what: 'Tile «Helper», if it is on your wall', icon: 'sun' },
];
