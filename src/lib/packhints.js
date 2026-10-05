/**
 * What the debriefs say while packing (v0.19.5, "Packen und Fahren"):
 * - badges per item (answer 3a): short labels instead of the learning sentence, the sentence on tap;
 * - the ballast card (N3, answer 2a): what is on this trip but was not used the last times, in grams,
 *   with "Leave at home".
 * Pure functions, easy to test.
 */
import { debriefedTrips } from './insights.js';
import { isInventory } from './gear.js';
import { t } from './i18n.svelte.js';

/** Not used this many times in a row (the last times it came along) makes an item ballast. */
export const BALLAST_AFTER = 2;
/** Only the last times count: an item used long ago and not since is ballast. */
const LOOK_BACK = 3;
const NOT_BALLAST = ['bags', 'bike', 'food'];

/** The other finished trips, newest first. */
function history(trip, trips, debriefs) {
  return debriefedTrips(trips, debriefs)
    .filter(({ t }) => t.id !== trip?.id)
    .reverse();
}

/** How often an item was not used in a row, counting back from its last trip: { n, titles }. */
function unusedStreak(itemId, hist) {
  const on = hist.filter(({ t }) => (t.entries ?? []).some((e) => e.itemId === itemId)).slice(0, LOOK_BACK);
  const titles = [];
  for (const { d, t } of on) {
    if (d.items?.[itemId] !== 'unused') break;
    titles.push(t.title);
  }
  return { n: titles.length, titles };
}

/**
 * Badges per item on this trip: { [itemId]: [{ key, label, text, tone }] }.
 * key: 'unused' | 'missed' | 'broke' | 'tip'; tone: 'warn' for the ones that ask for something.
 * tips: the learning per item (tipsByItem).
 */
export function packBadges(trip, trips, debriefs, tips = {}) {
  const hist = history(trip, trips, debriefs);
  const last = hist[0];
  const out = {};
  const add = (id, b) => (out[id] ??= []).push(b);
  for (const id of new Set((trip?.entries ?? []).map((e) => e.itemId))) {
    const s = unusedStreak(id, hist);
    if (s.n >= BALLAST_AFTER) add(id, { key: 'unused', label: t('{n}× not used', { n: s.n }), text: t('Not used on {trips}.', { trips: s.titles.join(', ') }), tone: 'warn' });
    if (last && (last.d.missing ?? []).some((m) => m.itemId === id)) add(id, { key: 'missed', label: t('Missed last time'), text: t('You missed it on {trip}. Good that it is on.', { trip: last.t.title }), tone: '' });
    const lastOn = hist.find(({ t }) => (t.entries ?? []).some((e) => e.itemId === id));
    if (lastOn?.d.items?.[id] === 'broken') add(id, { key: 'broke', label: t('Broke last time'), text: t('It broke on {trip}. Repaired or replaced?', { trip: lastOn.t.title }), tone: 'warn' });
    if (tips[id]) add(id, { key: 'tip', label: t('Tip'), text: tips[id].rule, tone: '' });
  }
  return out;
}

/**
 * The ballast on this trip (N3): items not used the last BALLAST_AFTER or more times they came
 * along, heaviest first. Bags, bike parts and food stay out, and so do items kept on purpose
 * (trip.keep). Returns { rows: [{ itemId, name, g, n, titles }], totalG, unweighed }.
 */
export function ballast(trip, items, trips, debriefs) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const hist = history(trip, trips, debriefs);
  const keep = new Set(trip?.keep ?? []);
  const rows = [];
  for (const e of trip?.entries ?? []) {
    const item = byId[e.itemId];
    if (!item || !isInventory(item) || NOT_BALLAST.includes(item.category) || keep.has(e.itemId)) continue;
    const s = unusedStreak(e.itemId, hist);
    if (s.n < BALLAST_AFTER) continue;
    rows.push({ itemId: e.itemId, name: item.name, g: item.weightG == null ? null : item.weightG * (e.qty || 1), n: s.n, titles: s.titles });
  }
  rows.sort((a, b) => (b.g ?? -1) - (a.g ?? -1) || a.name.localeCompare(b.name));
  return { rows, totalG: rows.reduce((s, r) => s + (r.g ?? 0), 0), unweighed: rows.filter((r) => r.g == null).length };
}

/** Take items off the trip (Leave at home). */
export const leaveAtHome = (trip, ids) => ({ entries: (trip.entries ?? []).filter((e) => !ids.includes(e.itemId)) });

/** Keep an item on the trip on purpose: the ballast card stops asking for it on this trip. */
export const keepOnTrip = (trip, id) => ({ keep: [...new Set([...(trip.keep ?? []), id])] });
