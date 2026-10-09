/**
 * v0.47.2 «Material-Ansichten» (Noah 6a-9a): what the Gear page knows about each item from the trips
 * and their debriefs, and the seven fixed views. Pure functions, tested in tests/material0472.test.js.
 *
 * - Usage per item: taken (on a debriefed trip), used (the debrief did not say "not used"; broken
 *   counts as used, as in insights.js itemUsage), the share used, the last trip, one dot per trip of
 *   the last 12 months: used, taken but not used, or at home.
 * - Views: Alle, Meist genutzt (used on at least half of the debriefed trips), Bewährt (taken 5 times
 *   or more and used at least 4 times in 5), Lieblingssachen (starred), Nie gebraucht (taken 3 times
 *   or more, never used; formerly «Totes Gewicht», the stored keys stay), Ungewogen, Wunschliste.
 * - Only what the data supports: a lighter alternative (an item marked "can be taken instead of"),
 *   a learned rule (temperature or rain, only when every debriefed trip agrees), the age (from the
 *   day a wish was bought) and the cost per use (only with a price).
 */
import { debriefedTrips } from '../insights.js';
import { isInventory, isWish } from '../gear.js';
import { isClothing } from '../wardrobe.js';
import { t, tn } from '../i18n.svelte.js';

export const VIEWS = ['all', 'most', 'proven', 'fav', 'never', 'unweighed', 'wish'];
/** Nie gebraucht: taken at least this often and never used (the approved design: «ab 3× dabei»). */
export const NEVER_AFTER = 3;
/** Bewährt: taken at least this often … */
export const PROVEN_AFTER = 5;
/** … and used at least this share of those times. */
export const PROVEN_SHARE = 0.8;
/** A learned rule needs at least this many trips on each side. */
export const RULE_MIN = 2;
export const SORTS = ['taken', 'weight', 'last', 'name'];

const DAY = 864e5;
const wet = (wx) => wx?.rain === true || wx?.rain === 'rain' || wx?.rain === 'showers';
const dry = (wx) => wx?.rain === false || wx?.rain === 'none';

/** The debriefed trips, oldest first: [{ id, title, date, wx, items, ids:Set }]. */
export function tripLog(trips = [], debriefs = []) {
  return debriefedTrips(trips, debriefs).map(({ d, t: trip }) => ({
    id: trip.id,
    title: trip.title ?? '',
    date: trip.startDate ?? '',
    wx: trip.wx ?? null,
    items: d.items ?? {},
    ids: new Set((trip.entries ?? []).map((e) => e.itemId)),
  }));
}

/**
 * Usage of every item: { n, months, byId: { [id]: { taken, used, unused, share, dots, last } } }.
 * n: the number of debriefed trips. dots: one per debriefed trip of the 12 months before today,
 * oldest first: 'used' | 'unused' | 'home'. last: the latest trip (debriefed or not, started by
 * today, not skipped) the item was on: { title, date, state: 'used' | 'unused' | null }.
 */
export function materialStats(items = [], trips = [], debriefs = [], today = new Date().toISOString().slice(0, 10)) {
  const log = tripLog(trips, debriefs);
  const from = new Date(Date.parse(`${today}T00:00:00Z`) - 365 * DAY).toISOString().slice(0, 10);
  const year = log.filter((r) => r.date && r.date >= from && r.date <= today);
  const debriefed = new Map(log.map((r) => [r.id, r]));
  const past = trips
    .filter((x) => !x.skipped && x.startDate && x.startDate <= today && x.entries?.length)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastOf = new Map();
  for (const x of past)
    for (const e of x.entries) {
      if (lastOf.has(e.itemId)) continue;
      const r = debriefed.get(x.id);
      lastOf.set(e.itemId, { title: x.title ?? '', date: x.startDate, state: r ? (r.items[e.itemId] === 'unused' ? 'unused' : 'used') : null });
    }
  const byId = {};
  for (const item of items) {
    let taken = 0;
    let used = 0;
    for (const r of log) {
      if (!r.ids.has(item.id)) continue;
      taken++;
      if (r.items[item.id] !== 'unused') used++;
    }
    const dots = year.map((r) => (!r.ids.has(item.id) ? 'home' : r.items[item.id] === 'unused' ? 'unused' : 'used'));
    byId[item.id] = { taken, used, unused: taken - used, share: taken ? used / taken : null, dots, last: lastOf.get(item.id) ?? null };
  }
  return { n: log.length, months: year.length, byId };
}

const none = { taken: 0, used: 0, unused: 0, share: null, dots: [], last: null };
/** The usage of one item (zeros when the item is unknown). */
export const usageOf = (stats, id) => stats?.byId?.[id] ?? none;

/** Is the item in this view? n: the number of debriefed trips. */
export function inView(view, item, u = none, n = 0) {
  if (view === 'wish') return isWish(item);
  if (!isInventory(item)) return false;
  switch (view) {
    case 'most':
      return n > 0 && u.used >= Math.max(2, Math.ceil(n / 2));
    case 'proven':
      return u.taken >= PROVEN_AFTER && u.used / u.taken >= PROVEN_SHARE;
    case 'fav':
      return !!item.favorite;
    case 'never':
      return u.taken >= NEVER_AFTER && u.used === 0;
    case 'unweighed':
      return item.weightG == null;
    default:
      return true;
  }
}

/** How many items each view shows: { all, most, proven, fav, never, unweighed, wish }. */
export function viewCounts(items = [], stats) {
  const out = Object.fromEntries(VIEWS.map((v) => [v, 0]));
  for (const item of items) for (const v of VIEWS) if (inView(v, item, usageOf(stats, item.id), stats?.n ?? 0)) out[v]++;
  return out;
}

const w = (item) => (item.weightG == null ? null : item.weightG * (item.qty || 1));
const byName = (a, b) => String(a.name ?? '').localeCompare(String(b.name ?? ''));

/**
 * The items in the chosen order. sort: 'taken' (most often along first, then most used), 'weight'
 * (heaviest first, not weighed last), 'last' (most recently along first, never along last), 'name'.
 */
export function sortItems(list = [], sort = 'taken', stats) {
  const u = (i) => usageOf(stats, i.id);
  const cmp = {
    taken: (a, b) => u(b).taken - u(a).taken || u(b).used - u(a).used || byName(a, b),
    weight: (a, b) => (w(b) ?? -1) - (w(a) ?? -1) || byName(a, b),
    last: (a, b) => (u(b).last?.date ?? '').localeCompare(u(a).last?.date ?? '') || byName(a, b),
    name: byName,
  }[sort] ?? byName;
  return [...list].sort(cmp);
}

/** The plain sentence of a never-used item: «4 Mal mitgenommen, nie gebraucht». */
export const neverText = (u) => tn(u.taken, 'Taken {n} time, never used', 'Taken {n} times, never used');

/**
 * A rule the debriefs teach about one item, or null. Only when every debriefed trip with known
 * weather agrees and there are at least RULE_MIN trips on each side:
 * - cold: used on every trip whose coldest temperature was below `limit`, never on the others;
 * - rain: used on every wet trip, never on a dry one.
 * Returns { kind: 'cold', limit, n } or { kind: 'rain', n }; n: the trips it rests on.
 */
export function learnedRule(itemId, log = []) {
  const on = log.filter((r) => r.ids.has(itemId));
  const state = (r) => (r.items[itemId] === 'unused' ? 'unused' : 'used');
  const temp = on.filter((r) => typeof r.wx?.min === 'number');
  const usedT = temp.filter((r) => state(r) === 'used').map((r) => r.wx.min);
  const unusedT = temp.filter((r) => state(r) === 'unused').map((r) => r.wx.min);
  if (usedT.length >= RULE_MIN && unusedT.length >= RULE_MIN && Math.max(...usedT) < Math.min(...unusedT)) return { kind: 'cold', limit: Math.min(...unusedT), n: temp.length };
  const known = on.filter((r) => wet(r.wx) || dry(r.wx));
  const wetUsed = known.filter((r) => wet(r.wx));
  const dryOnes = known.filter((r) => dry(r.wx));
  if (wetUsed.length >= RULE_MIN && dryOnes.length >= RULE_MIN && wetUsed.every((r) => state(r) === 'used') && dryOnes.every((r) => state(r) === 'unused')) return { kind: 'rain', n: known.length };
  return null;
}

/** The rule in one sentence. */
export function ruleText(rule) {
  if (!rule) return '';
  return rule.kind === 'cold'
    ? tn(rule.n, 'Below {t} °C always used, above never. From {n} trip.', 'Below {t} °C always used, above never. From {n} trips.', { t: rule.limit })
    : tn(rule.n, 'Always used in the rain, never when dry. From {n} trip.', 'Always used in the rain, never when dry. From {n} trips.');
}

/**
 * The alternatives in your own gear: owned items marked "can be taken instead of" this item, the
 * item it stands in for, and the others standing in for that one. Lightest first, with the
 * difference in grams (negative = lighter). Items without a weight are left out.
 */
export function alternatives(item, items = []) {
  if (!item) return [];
  const own = items.filter((i) => isInventory(i) && i.id !== item.id && i.weightG != null);
  const group = new Set([item.id, item.altFor].filter(Boolean));
  const alts = own.filter((i) => group.has(i.altFor) || i.id === item.altFor);
  return alts
    .map((i) => ({ item: i, g: w(i), diffG: item.weightG == null ? null : w(i) - w(item) }))
    .sort((a, b) => a.g - b.g || byName(a.item, b.item));
}

/** The lightest alternative that is lighter than the item, or null (only the ones you linked). */
export function lighterAlt(item, items = []) {
  const first = alternatives(item, items)[0];
  return first && first.diffG != null && first.diffG < 0 ? first : null;
}

/**
 * v0.60.0 (Noah 2a): the setting with the suggestions you turned down: { [itemId]: [otherId, …] }.
 * «Passt nicht» adds one, Undo takes it out again.
 */
export const ALT_DISMISSED_KEY = 'altDismissed';
/** At most this many automatic suggestions per item. */
export const AUTO_ALTS = 2;
/**
 * A suggestion weighs at least this share of the item: a much lighter thing of the same category is
 * mostly another kind of thing (a cable is no lighter bike computer).
 */
export const AUTO_MIN_SHARE = 0.4;

/** The same kind of thing: clothing of the same zone (and layer, when both have one), else the same category. */
function sameKind(a, b) {
  if (a.category !== b.category) return false;
  if (!isClothing(a)) return true;
  if (!a.zone) return false; // clothing without a zone: no guess (a glove is no lighter jacket)
  if (String(b.zone ?? '').toLowerCase() !== String(a.zone).toLowerCase()) return false;
  return !a.layer || !b.layer || String(a.layer).toLowerCase() === String(b.layer).toLowerCase();
}

/**
 * v0.60.0 (Noah 2a): the lighter alternatives of an item. First the ones you linked («can be taken
 * instead of», manual: true), then at most AUTO_ALTS suggestions (auto: true): owned and weighed,
 * of the same category (clothing: the same zone and layer), lighter but at least AUTO_MIN_SHARE of
 * its weight, not turned down for this item (dismissed: the ids). The suggestions closest in weight first: they are most often the same
 * kind of thing. Nothing is ever chosen for you; a suggestion is only shown.
 * Returns [{ item, g, diffG, manual?, auto? }].
 */
export function lighterAlts(item, items = [], dismissed = []) {
  if (!item || item.weightG == null) return [];
  const mine = w(item);
  const manual = alternatives(item, items).filter((a) => a.diffG != null && a.diffG < 0).map((a) => ({ ...a, manual: true }));
  const taken = new Set([item.id, ...manual.map((a) => a.item.id), ...dismissed]);
  const auto = items
    .filter((i) => i.ownership === 'owned' && i.weightG != null && !taken.has(i.id) && w(i) < mine && w(i) >= mine * AUTO_MIN_SHARE && sameKind(item, i))
    .map((i) => ({ item: i, g: w(i), diffG: w(i) - mine, auto: true }))
    .sort((a, b) => b.g - a.g || byName(a.item, b.item))
    .slice(0, AUTO_ALTS);
  return [...manual, ...auto];
}

/**
 * v0.60.0 (Noah 3a): «Auf dem Weg dahin» under an empty «Nie gebraucht»: owned items taken 1 or 2
 * times (fewer than NEVER_AFTER) on reviewed trips and never used, most often along first.
 * Returns [{ item, taken }].
 */
export function onTheWay(items = [], stats) {
  return items
    .filter(isInventory)
    .map((item) => ({ item, u: usageOf(stats, item.id) }))
    .filter(({ u }) => u.taken >= 1 && u.taken < NEVER_AFTER && u.used === 0)
    .sort((a, b) => b.u.taken - a.u.taken || byName(a.item, b.item))
    .map(({ item, u }) => ({ item, taken: u.taken }));
}

/** Age since the day it was bought (item.boughtAt), or null: { years, months }. */
export function ageOf(item, today = new Date().toISOString().slice(0, 10)) {
  const from = item?.boughtAt ? String(item.boughtAt).slice(0, 10) : null;
  if (!from || from > today) return null;
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  let months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  months = Math.max(0, months);
  return { years: Math.floor(months / 12), months: months % 12 };
}

/** The age in a few words: «2 J. 6 M.», «5 M.». */
export const ageText = (a) => (!a ? '' : a.years ? t('{y} y {m} mo', { y: a.years, m: a.months }) : t('{m} mo', { m: a.months }));

/** The price per use (CHF), only with a price and at least one use; null otherwise. */
export function costPerUse(item, u = none) {
  return typeof item?.priceChf === 'number' && item.priceChf > 0 && u.used > 0 ? item.priceChf / u.used : null;
}

/** Sum of the items' known weights and how many have none: { g, missing }. */
export function weightOf(list = []) {
  let g = 0;
  let missing = 0;
  for (const i of list) {
    const x = w(i);
    if (x == null) missing++;
    else g += x;
  }
  return { g, missing };
}

/**
 * The numbers above a view: items, known weight, average times along and share used (both only
 * with debriefs). { n, g, missing, avgTaken, usedShare }.
 */
export function viewSummary(list = [], stats) {
  const { g, missing } = weightOf(list);
  const along = list.map((i) => usageOf(stats, i.id)).filter((u) => u.taken > 0);
  const taken = along.reduce((s, u) => s + u.taken, 0);
  const used = along.reduce((s, u) => s + u.used, 0);
  return { n: list.length, g, missing, avgTaken: along.length ? Math.round(taken / along.length) : null, usedShare: taken ? Math.round((used / taken) * 100) : null };
}
