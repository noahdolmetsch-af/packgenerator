/**
 * «Wegweiser statt Katalog» PR 12 (Noah 01.11.2026 «1-5a»: Claude writes the knowledge, short, bikepacking humour where it
 * fits): «Good to know» for each function, shown in the card «What you can do here» (src/lib/ui/SeitenInhalt.svelte) under
 * the function's name. One file per area exports `{ 'f.id': 'English sentence(s).' }`; its German lives in
 * src/lib/i18n/de/wissen-<area>.js. A PR that switches on the pages of an area (ON_PAGES in src/lib/seiteninhalt.js) adds
 * `import <area> from './<area>.js';` and `...<area>` here. tests/wissen.test.js checks: every function on a switched-on page
 * has a text, every id exists, each text is at most 220 characters and has German.
 */
import lust from './lust.js';
import packen from './packen.js';
import planen from './planen.js';
import unterwegs from './unterwegs.js';
import velo from './velo.js';
import zurueck from './zurueck.js';
import alltag from './alltag.js';

export const WISSEN = { ...lust, ...packen, ...planen, ...unterwegs, ...velo, ...zurueck, ...alltag };
