/**
 * «Wegweiser statt Katalog» PR 23 (plan Noah 01.11.2026 «freigabe», step 23): functions that show only in the right
 * situation (heimat.js GAPS 'when', the sentence in know/wann.js) say so on their own page. At the end of the page a quiet
 * fold «Only in the right situation» lists them, each with «Appears when …» and, where the example trip of the playground
 * shows it, «Show it in the example». A function whose part is on screen right now (its `shown` selector) is left out.
 *
 * ERSCHEINT: id → { play: day of the playground (play.js DAYS) or null, shown: CSS selector of its part or null }.
 * SKIPPED: id → why it gets no line. tests/erscheint.test.js checks every 'when' function is in one of the two.
 * Pure (the component is src/lib/ui/ErscheintWenn.svelte).
 */
import { FEATURE } from './features.js';
import { HOME } from './know/heimat.js';
import { WHEN } from './know/wann.js';

export const ERSCHEINT = {
  'f.homecoming': { play: 'after', shown: null },
  'f.tripstate': { play: null, shown: null },
  'f.abroad': { play: null, shown: '[data-abroad]' },
  'f.checkin': { play: null, shown: '[data-checkin-until],[data-checkin-ok],[data-checkin-late],[data-checkin-callby]' },
  'f.laundry': { play: 'pack', shown: null },
  'f.morninglist': { play: 'ride', shown: '[data-morning-list]' },
  'f.tourhints': { play: null, shown: null },
  'f.tripalert': { play: null, shown: null },
  'f.readytomorrow': { play: null, shown: null },
  'f.evening': { play: 'ride', shown: null },
  event: { play: null, shown: null },
  'f.prep': { play: null, shown: '[data-prep-day]' },
  'f.springservice': { play: null, shown: null },
  'f.feel': { play: null, shown: '[data-after-feel]' },
  learn: { play: null, shown: null },
};

/** Functions without a line, and why. */
export const SKIPPED = {
  'f.tipweek': 'Heute (never a line on Heute)',
  'f.comeback': 'Heute (never a line on Heute)',
};

/** The page of a hash as HOME writes it: path plus tab= / view= (sorted). */
export function pageOf(hash = '') {
  const [path, query = ''] = String(hash).split('?');
  const keep = query.split('&').filter((p) => /^(tab|view)=/.test(p)).sort().join('&');
  return keep ? `${path}?${keep}` : path;
}

/** The lines of a page: [{ id, title, when, play, shown }] in catalogue order, without «Not for me» and never on Heute. */
export function erscheintHier(hash, notForMe = {}) {
  const here = pageOf(hash);
  if (!here || here === '#/') return [];
  return Object.entries(ERSCHEINT)
    .filter(([id]) => FEATURE[id] && WHEN[id] && HOME[id] && pageOf(HOME[id]) === here && !notForMe[id])
    .map(([id, e]) => ({ id, title: FEATURE[id].title, when: WHEN[id], play: e.play, shown: e.shown }));
}
