/**
 * v0.118.0 «KI-Helfer ausblenden» (mockup K4, Noah 12.10.2026 «k1-k4 ok»): the places where the AI helper
 * shows when the one switch under Ich › KI-Helfer is on (client.svelte.js isOn / isShown). English keys
 * for t(); the page lists them with «on»/«off». Each place checks the switch itself:
 *   today    pages/Home.svelte       the tile «Helper», when it is on your wall
 */
export const HELPER_PLACES = [
  { key: 'today', name: 'Today|helper', what: 'Tile «Helper», if it is on your wall', icon: 'sun' },
];
