/**
 * UI-Test 26.10.2026 T7 (G4-01): bags and bottle cages are counted apart, the same way in the bike's head,
 * on Setup and on «Mein Setup»: «1 bag, 2 bottle cages». Bottle cages are weighed with the bike
 * (bikes.js ON_BIKE_SLOTS), so the weight beside the words is the bags' weight only.
 */
import { t, tn } from '../i18n.svelte.js';
import { onBikeSlot } from '../bikes.js';

/** «1 bag, 2 bottle cages» / «3 bags» / «2 bottle cages»; bagCount counts the cages too (bikes.js bikeSetup). */
export function bagWords(bagCount, cageCount = 0) {
  const bags = bagCount - cageCount;
  if (!cageCount) return tn(bags, '{n} bag', '{n} bags');
  const cages = tn(cageCount, '{n} bottle cage', '{n} bottle cages');
  return bags ? `${tn(bags, '{n} bag', '{n} bags')}, ${cages}` : cages;
}

/**
 * UI-Test T7 (G2-08): where the things of a trip are, counted like the bike's head: «2 bags, plus Back,
 * on the bike and on you». zones = tripStats().zones; only places with something in them.
 * A trip without a bike (own bags) says only its bags.
 */
export function placeWords(zones = [], { bike = true } = {}) {
  const used = zones.filter((z) => z.entries?.length);
  const bags = used.filter((z) => z.key !== 'body' && z.key !== 'mounted' && !z.worn);
  if (!bike) return tn(bags.length, '{n} bag', '{n} bags');
  const cages = bags.filter((z) => onBikeSlot(z.key)).length;
  const extra = [...used.filter((z) => z.worn).map((z) => t(z.zone?.name ?? z.key)), used.some((z) => z.key === 'mounted') ? t('on the bike|fixed') : '', used.some((z) => z.key === 'body') ? t('on you') : ''].filter(Boolean);
  const head = bags.length ? bagWords(bags.length, cages) : '';
  if (!extra.length) return head;
  const list = extra.length > 1 ? t('{list} and {last}', { list: extra.slice(0, -1).join(', '), last: extra.at(-1) }) : extra[0];
  return head ? `${head}, ${t('plus {list}', { list })}` : list;
}
