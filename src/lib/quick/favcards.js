/**
 * «Favoriten» on Heute (Noah 27.11.2026 «1-5a», step 2): the first six favourites as small cards (3a), the rest behind «All n ›».
 * Pure functions (tests/favcards.test.js); the tile (home/PinsTile.svelte) and the window (home/FavoritenAlle.svelte) draw them.
 * The quiet second line of a card is your own note, nothing else (Noah 27.11.2026 «1, 2, 3, 4», point 2: calmer cards; the group is in the window «All»).
 */
import { FEATURE } from '../features.js';
import { flatPins, pinLabel } from './quicklinks.js';

/** Noah 3a: this many favourites show as cards on Heute. */
export const FAV_SHOWN = 6;
/** Noah «5a»: this many suggestions («Often used») show quietly under the cards. */
export const FAV_SUGGESTED = 2;

/** The icon word of a feature group (features.js FEATURE_GROUPS); a view (a page with its filter) gets the arrow. */
const ICON = { before: 'compass', onway: 'backpack', after: 'book', bike: 'bike', active: 'leaf', data: 'save' };
export const favIcon = (p) => (p.feature ? (ICON[FEATURE[p.feature]?.group] ?? 'star') : 'link');

/** The cards of the tile: [{ pin, label, sub, icon }], in the order the person sees the favourites. */
export function favCards(s, tr = (x) => x, n = FAV_SHOWN) {
  return flatPins(s)
    .slice(0, n)
    .map((p) => ({ pin: p, label: pinLabel(p, tr), sub: p.note || '', icon: favIcon(p) }));
}

/** How many favourites are behind «All n ›» (0: all show). */
export const favHidden = (s, n = FAV_SHOWN) => Math.max(0, flatPins(s).length - n);
/** How many favourites there are in all (the number on «All n ›»). */
export const favTotal = (s) => s.pins.length;
