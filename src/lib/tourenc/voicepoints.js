/**
 * Touren c 68 «Rückblick als Sprachnachricht» (Noah 26.10.2026 «3a 4b, a zuschaltbar»): what you told about the trip
 * (dictated, up to a minute) becomes key points you confirm one by one. The app splits the sentences itself and
 * guesses the kind from words. Each kept point goes where you would tap it: not needed, was missing, a learning, a note on the
 * trip, or a bike note in the Inbox. Pure, tested in tests/touren-c.test.js.
 */
import { nameOf } from '../i18n.svelte.js';

export const KINDS = [
  { key: 'learn', name: 'Learning|voice' },
  { key: 'unused', name: 'Not needed|voice' },
  { key: 'missing', name: 'Was missing|voice' },
  { key: 'bike', name: 'Bike|voice' },
  { key: 'note', name: 'Note|voice' },
];
const KEYS = new Set(KINDS.map((k) => k.key));
export const MAX_POINTS = 8;
export const MAX_TEXT = 1800;

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const GUESS = [
  ['unused', /nie gebraucht|nicht gebraucht|nie benutzt|nicht benutzt|umsonst mit|never used|did not need|didn't need|not needed/i],
  ['missing', /gefehlt|fehlte|vermisst|hätte .* gebraucht|vergessen|was missing|i missed|forgot/i],
  ['bike', /\b(kette|bremse|bremsen|reifen|schaltung|speiche|lager|velo|platten|chain|brake|tyre|tire|gears?|puncture)\b/i],
  ['learn', /nächstes mal|naechstes mal|lieber|besser|zu warm|zu kalt|zu schwer|next time|better|too (warm|cold|heavy)/i],
];

/** The sentences of the text, each with a guessed kind. */
export function localPoints(text) {
  return String(text ?? '')
    .slice(0, MAX_TEXT)
    .split(/(?<=[.!?])\s+|\n+/)
    .map(clean)
    .filter((s) => s.length >= 6)
    .slice(0, MAX_POINTS)
    .map((s) => ({ text: s.slice(0, 240), kind: GUESS.find(([, re]) => re.test(s))?.[0] ?? 'note' }));
}

/** The item a point names (the longest name found in it), or null. items: the trip's items first. */
export function itemIn(text, items = []) {
  const low = String(text).toLowerCase();
  let best = null;
  for (const i of items) {
    for (const n of new Set([nameOf(i), i.name].filter(Boolean).map((x) => String(x).toLowerCase().trim()))) {
      if (n.length >= 3 && low.includes(n) && (!best || n.length > best.n.length)) best = { i, n };
    }
  }
  return best?.i ?? null;
}

/** Points with their item and «keep» set: unused only for an item on the trip, else it becomes a note. */
export function withItems(points, trip, items = []) {
  const on = new Set((trip?.entries ?? []).map((e) => e.itemId));
  const onTrip = items.filter((i) => on.has(i.id));
  const rest = items.filter((i) => !on.has(i.id));
  return points.map((p) => {
    const item = itemIn(p.text, onTrip) ?? (p.kind === 'missing' || p.kind === 'learn' ? itemIn(p.text, rest) : null);
    const kind = KEYS.has(p.kind) ? (p.kind === 'unused' && !(item && on.has(item.id)) ? 'note' : p.kind) : 'note';
    return { text: p.text, kind, itemId: item?.id ?? null, itemName: item ? nameOf(item) : '', keep: true };
  });
}

/**
 * The records for the kept points: { items: { [itemId]: 'unused' }, missing: [...], learnings: [...], notes: [...] }.
 * learnings: next ids after `learnings`; notes: a trip note (kept) or a bike note (open in the Inbox).
 */
export function applyPoints(points, { trip, learnings = [], now = new Date().toISOString(), stamp = Date.now() } = {}) {
  const out = { items: {}, missing: [], learnings: [], notes: [] };
  let next = Math.max(0, ...learnings.map((l) => (typeof l.id === 'number' ? l.id : 0))) + 1;
  points
    .filter((p) => p.keep)
    .forEach((p, k) => {
      const id = `${stamp.toString(36)}${k}`;
      if (p.kind === 'unused' && p.itemId) out.items[p.itemId] = 'unused';
      else if (p.kind === 'missing') out.missing.push({ id: `m${id}`, name: p.itemName || p.text, itemId: p.itemId ?? null });
      else if (p.kind === 'learn') out.learnings.push({ id: next++, topic: 'Debrief', rule: p.text, action: '', itemIds: p.itemId ? [p.itemId] : [], source: trip?.title ?? '', tripId: trip?.id ?? null, appliesTo: ['all'], priority: 'medium', confirmed: 0, createdAt: now, from: 'voice' });
      else if (p.kind === 'bike') out.notes.push({ id: `note-v${id}`, at: now, text: p.text, photo: null, page: 'debrief', tripId: trip?.id ?? null, bikeId: trip?.bikeId ?? null, status: 'open', to: null, sortedAt: null });
      else out.notes.push({ id: `note-v${id}`, kind: 'note', status: 'kept', at: now, editedAt: now, title: trip?.title ?? '', text: p.text, topic: 'trip', pinned: false, photo: null, tripId: trip?.id ?? null });
    });
  return out;
}
