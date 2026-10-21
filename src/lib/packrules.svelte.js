/**
 * «Packliste aufräumen» (Noah 21.10.2026 «1b … 2 … 3a 4 … 5a»): a few rules for what comes along by itself,
 * saved in the settings «pack-rules» and kept here as state (App.svelte keeps it current), so every
 * $derived that reads them follows a change at once (like rainlimit.svelte.js). Pure helpers take the
 * rules as an argument too (tests pass them).
 *
 *   dayOff        blocks that do NOT come by themselves on a day ride without a night (e.g. ['repair']);
 *                 in Packen they stay a button, so one tap brings them («nur ein Mini-Hinweis»).
 *   darkBuffer    minutes before sunset and after sunrise that count as dark for the block Light
 *                 («früh morgens, abends, nachts», 3a: 30).
 *   lightAlways   Light comes on every trip with a night and every race, dark or not.
 *   lightExtra    item ids of Light that come only on a trip with a night or a race (the head torch).
 *   stdOrder      the order of «Immer dabei» (Standard), item ids; new trips list them in this order.
 *
 * Without a saved value nothing changes: the defaults are the app's behaviour before.
 */

export const PACK_RULES_KEY = 'pack-rules';

/** The rules before «Packliste aufräumen» (nothing changes). */
export const PACK_RULES_DEFAULT = Object.freeze({ dayOff: [], darkBuffer: 0, lightAlways: false, lightExtra: [], stdOrder: [] });

/** The suggestion of the page (Noah's answers): Repair only as a button on a day ride, 30 min, Light always with a night or race. */
export const PACK_RULES_SUGGESTED = Object.freeze({ dayOff: ['repair'], darkBuffer: 30, lightAlways: true });

/** Blocks that can stay a button on a day ride. */
export const DAY_OFF_BLOCKS = ['repair', 'charge'];

const ids = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x))] : []);

/** The rules from the saved value, every field checked (a broken value falls back to the default). */
export function packRulesOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const buf = Number(v.darkBuffer);
  return {
    dayOff: ids(v.dayOff).filter((k) => DAY_OFF_BLOCKS.includes(k)),
    darkBuffer: Number.isFinite(buf) && buf >= 0 && buf <= 180 ? Math.round(buf) : 0,
    lightAlways: v.lightAlways === true,
    lightExtra: ids(v.lightExtra),
    stdOrder: ids(v.stdOrder),
  };
}

const live = $state({ rules: { ...PACK_RULES_DEFAULT } });

/** The rules now. */
export const packRules = () => live.rules;
/** Keep the rules (App.svelte, from the settings «pack-rules»). */
export function setPackRules(value) {
  live.rules = packRulesOf(value);
}

/** A day ride without a night: one day, overnight 'none' (an older trip without a known night is not one). */
export const isDayRide = (trip) => trip?.overnight === 'none' && Math.max(1, Number(trip?.days) || 1) === 1;
/** A trip with a night or a race: Light always and the head torch (lightAlways, lightExtra). */
export const isBigRide = (trip) => trip?.event === true || trip?.overnight === 'lodging' || trip?.overnight === 'outdoor' || Math.max(1, Number(trip?.days) || 1) > 1;

/** Sort items by stdOrder: the ordered ones first in their order, the rest as they were. */
export function byStdOrder(list, order = packRules().stdOrder, idOf = (x) => x.id) {
  if (!order?.length) return list;
  const rank = new Map(order.map((id, i) => [id, i]));
  return list
    .map((x, i) => ({ x, i, r: rank.has(idOf(x)) ? rank.get(idOf(x)) : order.length + i }))
    .sort((a, b) => a.r - b.r)
    .map((o) => o.x);
}
