/**
 * Paket C › Assistent mit Belegen (996 Ideen UC-018-I1, UC-018-I3, UC-311-I2, UC-019-I2):
 *
 *   Antwort mit Beleg: an answer names the own entries it used (trips, gear, notes, logbook), each one a
 *     link to open it. The free AI gets the same entries numbered and is asked to cite them as [1], [2].
 *   Plan hinterfragen: the assistant questions a trip kindly: what is still open or assumed (no weather
 *     yet, no plan B, gear not weighed, no place to sleep), and on request the strongest counter-arguments.
 *   KI-Vorschläge erst prüfen (CHECK_KEY): what an AI suggests waits with its origin and «still to check»
 *     until you take it (as a to-do) or drop it; nothing changes gear, tasks or rules by itself.
 *     [{ id, from, q, text, day, state: 'open' | 'taken' | 'dropped' }]
 *   Eigene Verbote (BANS_KEY): things you do not want to take or buy. The assistant gets them with every
 *     question; a packing list or wish list that holds one shows a hint. [{ id, text, kind: 'take' | 'buy' }]
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay, uid, realTrips, tripEnd } from './base.js';
import { fold } from '../search.js';

export const CHECK_KEY = 'ruhig.aiCheck';
export const BANS_KEY = 'ruhig.bans';

/* ---------- Antwort mit Beleg ---------- */

const STOP = new Set('der die das ein eine einen einem einer und oder ich mir mich mein meine meinen wie was wann wo wer welche welcher welches ist sind war hat habe haben für fuer mit von zum zur auf im in an am zu den dem des nicht noch schon auch nur the a an and or i my me how what when where which is are was has have for with of to on at in it'.split(' '));
/** The words of a question that can find entries (folded, 3+ letters, no small words). */
export const questionWords = (q) => [...new Set(fold(q).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w)))].slice(0, 6);
/**
 * The own entries a question touches: searchAll (search.js) once per word, merged, the most words first.
 * groupsOf(word) → searchAll groups; kinds: which kinds count. → [{ kind, id, title, sub, href, tripId?, n }]
 */
export function sourcesFor(q, groupsOf, { max = 8, kinds = ['trip', 'gear', 'note', 'log', 'bike', 'template'] } = {}) {
  const by = new Map();
  for (const w of questionWords(q)) {
    for (const g of groupsOf(w)) {
      if (!kinds.includes(g.kind)) continue;
      for (const r of g.rows) {
        const k = `${g.kind}:${r.id}`;
        const old = by.get(k);
        by.set(k, old ? { ...old, n: old.n + 1 } : { kind: g.kind, id: r.id, title: r.title, sub: r.sub, href: r.href, ...(r.tripId ? { tripId: r.tripId } : {}), n: 1 });
      }
    }
  }
  return [...by.values()].sort((a, b) => b.n - a.n).slice(0, max);
}
/** The numbered entries as context for the free AI, with the ask to cite them. */
export function sourceContext(sources, bans = [], { cite, banLine }) {
  const lines = sources.map((s, i) => `[${i + 1}] ${s.title}${s.sub ? ` (${s.sub})` : ''}`);
  const b = bans.length ? [`${banLine} ${bans.map((x) => x.text).join('; ')}`] : [];
  return [cite, ...lines, ...b].join('\n');
}
/** The numbers an answer cites ([1], [2, 3]) that exist, in order. */
export function citedIn(text, n) {
  const out = [];
  for (const m of String(text ?? '').matchAll(/\[(\d+(?:\s*,\s*\d+)*)\]/g)) for (const x of m[1].split(',')) {
    const i = Number(x.trim());
    if (i >= 1 && i <= n && !out.includes(i)) out.push(i);
  }
  return out;
}

/* ---------- Plan hinterfragen ---------- */

/** The next real trip that has not ended. */
export const nextTrip = (trips, today) => realTrips(trips).filter((x) => tripEnd(x) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
/**
 * What is still open or only assumed for a trip (English keys): [{ key, text }]. items: the gear by id.
 */
export function openAssumptions(trip, itemsById = {}) {
  if (!trip) return [];
  const out = [];
  const add = (key, text) => out.push({ key, text });
  const entries = Array.isArray(trip.entries) ? trip.entries : [];
  if (!entries.length) add('list', 'There is no packing list yet.');
  const unweighed = entries.filter((e) => itemsById[e.itemId]?.weightG == null).length;
  if (unweighed) add('weight', unweighed === 1 ? 'One thing has no weight: the total is a guess.' : 'Some things have no weight: the total is a guess.');
  if (!trip.wx && !trip.weather) add('weather', 'The weather is assumed, not looked up for the days.');
  if (!trip.route && !trip.gpx) add('route', 'There is no route yet: distance and climbing are a guess.');
  if ((Number(trip.days) || 1) > 1 && !trip.overnight) add('night', 'Where you sleep is not set.');
  if (trip.overnight === 'outdoor' && !entries.some((e) => /zelt|tent|biwak|bivy|tarp/i.test(itemsById[e.itemId]?.name ?? '') || /zelt|tent|biwak|bivy|tarp/i.test(itemsById[e.itemId]?.nameDe ?? ''))) add('shelter', 'A night outside, but nothing to sleep under on the list.');
  if (!trip.planB && !trip.planb) add('planb', 'There is no plan B for bad weather.');
  return out;
}

/* ---------- KI-Vorschläge erst prüfen ---------- */

export function checksOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((x) => x && x.id && clean(x.text, 4000, true) && isDay(x.day))
    .map((x) => ({ id: String(x.id), from: clean(x.from, 40) || 'AI', q: clean(x.q, 300), text: clean(x.text, 4000, true), day: x.day, state: ['open', 'taken', 'dropped'].includes(x.state) ? x.state : 'open' }));
}
export const newCheck = ({ from, q, text }, today, id = uid('ki')) => (clean(text, 4000, true) ? { id, from: clean(from, 40) || 'AI', q: clean(q, 300), text: clean(text, 4000, true), day: today, state: 'open' } : null);
export const setCheck = (list, id, state) => list.map((x) => (x.id === id ? { ...x, state } : x));

/* ---------- Eigene Verbote ---------- */

export const BAN_KINDS = [
  { key: 'take', label: 'Do not take along' },
  { key: 'buy', label: 'Do not buy' },
];
export function bansOf(value) {
  return (Array.isArray(value) ? value : []).filter((x) => x && x.id && clean(x.text, 80)).map((x) => ({ id: String(x.id), text: clean(x.text, 80), kind: x.kind === 'buy' ? 'buy' : 'take' }));
}
export const newBan = (text, kind = 'take', id = uid('ban')) => (clean(text, 80) ? { id, text: clean(text, 80), kind: kind === 'buy' ? 'buy' : 'take' } : null);
const hits = (ban, name) => {
  const b = fold(ban.text);
  const n = fold(name);
  return b.length >= 3 && n.length >= 2 && (n.includes(b) || b.includes(n));
};
/**
 * Where a no-go shows up: on the packing list of a trip (take) or on the wish and shopping list (buy).
 * → [{ ban, item, where: 'trip' | 'wish' }]
 */
export function banHits(bans, { trip = null, items = [] } = {}) {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  const out = [];
  for (const ban of bans) {
    if (ban.kind === 'take' && trip) for (const e of trip.entries ?? []) {
      const it = byId[e.itemId];
      if (it && (hits(ban, it.name ?? '') || hits(ban, it.nameDe ?? ''))) out.push({ ban, item: it, where: 'trip' });
    }
    if (ban.kind === 'buy') for (const it of items) if ((it.ownership === 'wishlist' || it.ownership === 'to-buy') && (hits(ban, it.name ?? '') || hits(ban, it.nameDe ?? ''))) out.push({ ban, item: it, where: 'wish' });
  }
  return out;
}
