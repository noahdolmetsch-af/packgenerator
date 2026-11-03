/**
 * «Was die App noch wissen sollte» (idea D3 of «App denkt mit», Noah 02.11.2026 «3b»): the few things the app
 * does not know yet that make a function work better: your home place (weather on Today), the weight of
 * a bike (bike comparison), the start point of a wear part (wear forecast), the weight of your gear (packing
 * weight). Each says what it is for and where to fill it in. Only a hint, never required, never repeated
 * once it is filled. Pure function, tested in tests/needs.test.js.
 */
import { isInventory, itemWeight } from './gear.js';
import { partStart } from './kmbook.js';
import { WEAR_KEYS } from './wear.js';
import { activeBikes } from './bikeretire.js';
import { bikesHash } from './bikes.js';

/** From this many items without a weight the hint shows (a few unweighed items are normal). */
export const MIN_UNWEIGHED = 5;

const usable = (p) => !!p && typeof p.lat === 'number' && typeof p.lon === 'number';

/**
 * → [{ key, n, href }]: key 'home' | 'bikeweight' | 'partstart' | 'gearweight'; n: how many (null for home).
 * homePlace: the setting; bikes, items: the records.
 */
export function needsToKnow({ homePlace = null, bikes = [], items = [] } = {}) {
  const out = [];
  if (!usable(homePlace)) out.push({ key: 'home', n: null, href: '#/wetter' });
  const live = activeBikes(bikes);
  const light = live.filter((b) => !(typeof b.weightG === 'number' && b.weightG > 0));
  if (light.length) out.push({ key: 'bikeweight', n: light.length, href: bikesHash({ tab: 'compare', view: 'all', bike: light[0].id }) });
  const open = live.flatMap((b) => (b.parts ?? []).filter((p) => WEAR_KEYS.includes(p.key) && !partStart(p)).map((p) => ({ bike: b, part: p })));
  if (open.length) out.push({ key: 'partstart', n: open.length, href: bikesHash({ tab: 'care', bike: open[0].bike.id, open: true }) });
  const unweighed = items.filter((i) => isInventory(i) && i.ownership !== 'gone' && itemWeight(i) == null);
  if (unweighed.length >= MIN_UNWEIGHED) out.push({ key: 'gearweight', n: unweighed.length, href: '#/gear' });
  return out;
}
