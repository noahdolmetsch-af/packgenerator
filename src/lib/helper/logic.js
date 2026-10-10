/**
 * v0.77.0 «KI-Helfer»: what the app does with the helper's answers. Pure functions, no database.
 */
import { nextNumber } from '../notes.js';
import { isInventory } from '../gear.js';

/* ---------- 2 Suche: only a question gets an answer (Noah 2a) ---------- */
const QUESTION_WORDS = /^(was|wie|welche[rsmn]?|wieviel|wie viel|wo|wann|warum|wieso|brauche|brauch|soll|sollte|kann|könnte|muss|nehme|reicht|lohnt|what|how|which|where|when|why|should|do i|can i|is it|does|will|shall)\b/i;
/** A question: ends with «?», or (on Enter) starts like one ("Was nehme ich …"). */
export const endsAsQuestion = (text) => /\?\s*$/.test(String(text ?? '')) && String(text).trim().length >= 8;
export const looksLikeQuestion = (text) => {
  const s = String(text ?? '').trim();
  return s.length >= 8 && (endsAsQuestion(s) || (QUESTION_WORDS.test(s) && s.split(/\s+/).length >= 3));
};

/* ---------- 1 Neue Tour ---------- */
/**
 * The understood conditions as chips: [{ key, value }] in this order: area, days, overnight, weather
 * (temperature), rain, bike. A condition the helper left open has no chip. A chip the person
 * dropped (dropped: Set of keys) stays out; the dialog applies only the chips that are there.
 */
export function conditionChips(c = {}, { dropped = new Set() } = {}) {
  const out = [];
  if (c.area) out.push({ key: 'area', value: c.area });
  if (c.days > 0) out.push({ key: 'days', value: c.days });
  if (c.overnight) out.push({ key: 'overnight', value: c.overnight });
  if (c.tempMin != null || c.tempMax != null) out.push({ key: 'temp', value: [c.tempMin ?? c.tempMax, c.tempMax ?? c.tempMin] });
  if (c.rain) out.push({ key: 'rain', value: c.rain });
  if (c.bikeId) out.push({ key: 'bike', value: c.bikeId });
  return out.filter((x) => !dropped.has(x.key));
}

/**
 * The extra items of a proposal into a trip's list, each into its usual place (slotOf), marked
 * src 'helper'. Items already on the list and items that are not in the gear (any more) are skipped.
 */
export function addHelperItems(trip, items, ids, slotOf) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const have = new Set((trip.entries ?? []).map((e) => e.itemId));
  const add = [];
  for (const id of ids ?? []) {
    const it = byId.get(id);
    if (!it || !isInventory(it) || have.has(id)) continue;
    have.add(id);
    add.push({ itemId: id, slot: slotOf(it), qty: 1, packed: false, src: 'helper' });
  }
  return add.length ? { ...trip, entries: [...(trip.entries ?? []), ...add] } : trip;
}

/* ---------- 3 Rückblick ---------- */
/**
 * A learning from the helper's draft, saved like the app's own learnings (debrief.js applyDebrief):
 * a number id after the highest, topic «Debrief», the trip as the source.
 */
export function helperLearning(s, trip, learnings, now = new Date().toISOString()) {
  return { id: nextNumber(learnings), topic: 'Debrief', rule: s.rule, action: s.action ?? '', itemIds: [], source: trip.title ?? '', appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now, from: 'helper' };
}

/* ---------- 5 + 6 Wartung ---------- */
/** A short stable hash of a value (FNV-1a over its JSON), for the cache key bike + data. */
export function hashOf(value) {
  const s = JSON.stringify(value);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * The data hash of a maintenance request: everything but today's date (a new day alone changes
 * nothing) and the checks marked done here (they hide a row, they are no new data on the bike).
 */
export const careHash = (payload) => hashOf({ ...payload, today: undefined, checks: undefined });

/**
 * Noah 6a: the suggestions refresh after new km or a new ride (the data hash changed), at most once a
 * day per bike. cache: { hash, day, result } of that bike, or null.
 * Returns 'fresh' (use the cache), 'stale' (data changed, but already asked today: keep the cache)
 * or 'ask'.
 */
export function careRefresh(cache, hash, today) {
  if (cache?.result && cache.hash === hash) return 'fresh';
  if (cache?.result && cache.day === today) return 'stale';
  return 'ask';
}

/**
 * The helper's rows for «Jetzt fällig»: «soon» and «check» only («ok» is never shown there), not
 * dismissed (×) and not marked done for the same data, the most urgent first.
 * done: [{ bikeId, key, hash }] (Erledigt), dismissed the same shape (×).
 */
export function careRows(result, { bikeId, hash, done = [], dismissed = [] } = {}) {
  const gone = new Set([...done, ...dismissed].filter((x) => x.bikeId === bikeId && x.hash === hash).map((x) => x.key));
  const rank = { soon: 0, check: 1 };
  return (result?.parts ?? []).filter((p) => p.status !== 'ok' && !gone.has(p.key)).sort((a, b) => rank[a.status] - rank[b.status]);
}

/** «Als Aufgabe merken»: an open bike task (the same shape as a problem from a note). */
export function careTask(row, bike, partLabel, rows = [], today = '') {
  return {
    id: nextNumber(rows),
    area: 'Bike',
    bikeId: bike.id,
    subject: bike.name,
    task: `${partLabel}: ${row.check || row.reason}`,
    category: 'Repair',
    source: 'Helper',
    logDate: today,
    leadWeeks: null,
    priority: row.status === 'soon' ? 'medium' : 'low',
    status: 'open',
    note: row.reason ?? '',
    done: false,
    photo: null,
  };
}
