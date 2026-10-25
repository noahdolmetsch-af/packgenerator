/**
 * Paket C › Bedeutung neben Leistung (996 Ideen UC-140-I1, UC-220-I3; builds on «Gutes Umplanen festhalten»):
 *
 *   Touren nach Bedeutung (MEANING_KEY): your own marks for a trip, like «With friends», «First night
 *     outside» or «Especially quiet», and the trips found by them, beyond km and metres.
 *     { kinds: [{ id, std? , name? }], trips: { [tripId]: [kindId] } }; kinds are editable (kinds.js).
 *   Gute Entscheidungen (DECISIONS_KEY): a private collection of good decisions: turned back on purpose,
 *     accepted help, took a day off. No ranking, no points; the evening answers «replanned on purpose: good»
 *     (wohl.js, ziele.umplanen) show in the same list.
 *     [{ id, day, text, tripId? }]
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay, uid } from './base.js';
import { kindsOf } from './kinds.js';

export const MEANING_KEY = 'ruhig.meanings';
export const DECISIONS_KEY = 'ruhig.decisions';
export const MEANING_STD = [
  { id: 'friends', std: 'With friends' },
  { id: 'firstnight', std: 'First night outside' },
  { id: 'quiet', std: 'Especially quiet' },
  { id: 'new', std: 'Somewhere new' },
  { id: 'hard', std: 'Hard, and made it' },
];

export function meaningsOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const kinds = kindsOf(v.kinds, MEANING_STD);
  const ok = new Set(kinds.map((k) => k.id));
  const trips = {};
  for (const [id, list] of Object.entries(v.trips && typeof v.trips === 'object' ? v.trips : {})) {
    const marks = [...new Set((Array.isArray(list) ? list : []).filter((k) => typeof k === 'string'))];
    if (marks.length) trips[id] = marks;
  }
  return { kinds, trips, known: ok };
}
/** A mark on a trip switched on or off. */
export function flipMeaning(m, tripId, kindId) {
  const now = m.trips[tripId] ?? [];
  const next = now.includes(kindId) ? now.filter((k) => k !== kindId) : [...now, kindId];
  const trips = { ...m.trips };
  if (next.length) trips[tripId] = next;
  else delete trips[tripId];
  return { ...m, trips };
}
/** How many trips carry a kind. */
export const meaningCount = (m, kindId) => Object.values(m.trips).filter((l) => l.includes(kindId)).length;
/**
 * A kind deleted: its trips lose the mark, or get `to` instead (GroupDeleteSheet). A mark of a kind that
 * is gone stays out of sight; «Ohne …» keeps it, so Undo restores everything.
 */
export function dropMeaning(m, kindId, to = null) {
  const trips = {};
  for (const [id, l] of Object.entries(m.trips)) {
    const next = [...new Set(l.flatMap((k) => (k === kindId ? (to ? [to] : []) : [k])))];
    if (next.length) trips[id] = next;
  }
  return { ...m, kinds: m.kinds.filter((k) => k.id !== kindId), trips };
}
/** The trips with a kind (newest first); kindId '' = trips with any mark. */
export function tripsWith(m, trips, kindId = '') {
  return (trips ?? [])
    .filter((x) => x && (kindId ? (m.trips[x.id] ?? []).includes(kindId) : (m.trips[x.id] ?? []).length))
    .sort((a, b) => String(b.startDate ?? '').localeCompare(String(a.startDate ?? '')));
}
export const meaningStore = (m) => ({ kinds: m.kinds, trips: m.trips });

/* ---------- Gute Entscheidungen ---------- */

/** Starts to tap (English keys); they only fill the text, they are no groups. */
export const DECISION_STARTS = ['Turned back on purpose', 'Accepted help', 'Took a day off', 'Made the route shorter', 'Said no'];

export function decisionsOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((x) => x && x.id && isDay(x.day) && clean(x.text, 300))
    .map((x) => ({ id: String(x.id), day: x.day, text: clean(x.text, 300), ...(x.tripId ? { tripId: String(x.tripId) } : {}) }));
}
export function newDecision({ text, day, tripId = '' }, id = uid('dec')) {
  const tx = clean(text, 300);
  return tx && isDay(day) ? { id, day, text: tx, ...(tripId ? { tripId } : {}) } : null;
}
/**
 * The list to show, newest first: own entries plus the evening answers «replanned on purpose» that were
 * good ({ day, good } from wohl.js facts, read-only, marked from: 'evening').
 */
export function decisionList(own, replans = []) {
  const days = new Set(own.map((x) => x.day));
  const fromEve = replans.filter((r) => r?.good && isDay(r.day) && !days.has(r.day)).map((r) => ({ id: `eve-${r.day}`, day: r.day, text: '', from: 'evening' }));
  return [...own, ...fromEve].sort((a, b) => b.day.localeCompare(a.day));
}

/* ---------- Eigenes Entdeckerbingo (UC-157-I3) ---------- */

/**
 * Your own bingo of unusual finds: fields like «A good fountain» or «A place with history», a find per
 * field with a day and a line. No ranking, nothing shared. The card uses the first 9 fields (3 × 3) and
 * counts the finds of the year shown. { kinds, finds: [{ id, kind, day, text }] }
 */
export const BINGO_KEY = 'ruhig.bingo';
export const BINGO_STD = [
  { id: 'fountain', std: 'A good fountain' },
  { id: 'history', std: 'A place with history' },
  { id: 'view', std: 'A view to remember' },
  { id: 'bench', std: 'A bench in the sun' },
  { id: 'chapel', std: 'A small chapel' },
  { id: 'cafe', std: 'A friendly café' },
  { id: 'bridge', std: 'An old bridge' },
  { id: 'swim', std: 'A lake to swim in' },
  { id: 'path', std: 'A path never ridden' },
];
export function bingoOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const kinds = kindsOf(v.kinds, BINGO_STD);
  const finds = (Array.isArray(v.finds) ? v.finds : []).filter((f) => f && f.id && f.kind && isDay(f.day)).map((f) => ({ id: String(f.id), kind: String(f.kind), day: f.day, text: clean(f.text, 120) }));
  return { kinds, finds };
}
export function addFind(b, kind, day, text, id = uid('find')) {
  return b.kinds.some((k) => k.id === kind) && isDay(day) ? { ...b, finds: [{ id, kind, day, text: clean(text, 120) }, ...b.finds] } : b;
}
export const dropFind = (b, id) => ({ ...b, finds: b.finds.filter((f) => f.id !== id) });
/** A deleted field: its finds go to `to`, or keep their mark out of sight («Ohne Feld»), so Undo is exact. */
export const dropBingoKind = (b, id, to = null) => ({ kinds: b.kinds.filter((k) => k.id !== id), finds: b.finds.map((f) => (f.kind === id && to ? { ...f, kind: to } : f)) });
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
/** The 3 × 3 card of a year: [{ kind, finds }] and the full lines (bingos). */
export function bingoCard(b, year) {
  const cells = b.kinds.slice(0, 9).map((k) => ({ kind: k, finds: b.finds.filter((f) => f.kind === k.id && f.day.startsWith(String(year))) }));
  const lines = cells.length === 9 ? LINES.filter((l) => l.every((i) => cells[i].finds.length)) : [];
  return { cells, lines, marked: cells.filter((c) => c.finds.length).length };
}

/* ---------- Belohnung ohne Kauf (UC-229-I2) ---------- */

/**
 * Rewards that cost nothing, all of the same worth: free time, something together, a day of doing nothing.
 * You pick one for what you reached and note when you took it. { kinds, taken: [{ id, kind, day, for }] }
 */
export const REWARDS_KEY = 'ruhig.rewards';
export const REWARDS_STD = [
  { id: 'free', std: 'Free time with nothing planned' },
  { id: 'together', std: 'Something together with friends' },
  { id: 'nothing', std: 'A day of doing nothing' },
  { id: 'breakfast', std: 'A long breakfast' },
  { id: 'lake', std: 'A swim in the lake' },
];
export function rewardsOf(value) {
  const v = value && typeof value === 'object' ? value : {};
  const kinds = kindsOf(v.kinds, REWARDS_STD);
  const taken = (Array.isArray(v.taken) ? v.taken : []).filter((x) => x && x.id && x.kind && isDay(x.day)).map((x) => ({ id: String(x.id), kind: String(x.kind), day: x.day, for: clean(x.for, 120) }));
  return { kinds, taken };
}
export function takeReward(r, kind, day, forWhat = '', id = uid('rew')) {
  return r.kinds.some((k) => k.id === kind) && isDay(day) ? { ...r, taken: [{ id, kind, day, for: clean(forWhat, 120) }, ...r.taken] } : r;
}
export const dropTaken = (r, id) => ({ ...r, taken: r.taken.filter((x) => x.id !== id) });
export const dropRewardKind = (r, id, to = null) => ({ kinds: r.kinds.filter((k) => k.id !== id), taken: r.taken.map((x) => (x.kind === id && to ? { ...x, kind: to } : x)) });
