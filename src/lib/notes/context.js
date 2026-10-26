/**
 * Notizen im Zusammenhang (996 Ideen, Noah 25.10.2026 «bauen … 12, 13, 14, 15»), pure functions:
 * - «Notiz-Verbindungen mit Bedeutung» (UC-263-I1): a link between two notes can say what it is:
 *   source, counter-argument or follow-up question. The link stays on the note where it was made
 *   ({ kind: 'note', ref, label, rel? }); the other note reads it the other way round.
 * - «Erinnerung nach einem Ereignis» (UC-269-I1): a note comes back after the next trip or the next
 *   workshop visit, not at a time. note.after = { kind: 'trip' | 'visit', since, tripId?, skip?, done? }
 *   (its own field: the time reminder note.remind and its phone messages stay as they are).
 * - «Wiederherstellen mit Anhängen» (UC-270-I1): before a note comes back from the trash, the app shows
 *   what comes with it (photos, files, links) and what is missing (a linked note also in the trash).
 * - «Erinnerungskarte» (UC-271-I3): text, sound, picture and place of a note as one small scene.
 *   note.card = { photo: index, voice?: data URL, voiceS?, at }.
 * Tested in tests/einzelplanen.test.js.
 */
import { noteTitle, isKept } from '../notebook.js';
import { photosOf, linksOf } from '../noteformats.js';

/* ---------- links with a meaning ---------- */

/** own: how the note that keeps the link names the other one; back: how the other note reads it. */
export const RELS = [
  { key: 'source', own: 'Source', back: 'Is the source of' },
  { key: 'counter', own: 'Counter-argument', back: 'Is a counter-argument to' },
  { key: 'followup', own: 'Follow-up question', back: 'Is a follow-up question of' },
];
export const REL = Object.fromEntries(RELS.map((r) => [r.key, r]));
const relOk = (r) => (REL[r] ? r : null);

/** The notes linked with a note, both ways, with the meaning: [{ id, title, own, rel }]. */
export function relLinks(note, notes = []) {
  if (!note) return [];
  const byId = new Map(notes.filter(isKept).map((n) => [n.id, n]));
  const out = new Map();
  for (const l of note.links ?? []) if (l.kind === 'note' && byId.has(l.ref) && l.ref !== note.id) out.set(l.ref, { id: l.ref, title: noteTitle(byId.get(l.ref)), own: true, rel: relOk(l.rel) });
  for (const n of byId.values()) {
    if (n.id === note.id || out.has(n.id)) continue;
    const l = (n.links ?? []).find((x) => x.kind === 'note' && x.ref === note.id);
    if (l) out.set(n.id, { id: n.id, title: noteTitle(n), own: false, rel: relOk(l.rel) });
  }
  return [...out.values()];
}

/** The note with the meaning of its link to another note set (rel null: no meaning). */
export function setRel(note, otherId, rel, now = new Date().toISOString()) {
  const links = (note.links ?? []).map((l) => {
    if (!(l.kind === 'note' && l.ref === otherId)) return l;
    const { rel: _old, ...rest } = l;
    return relOk(rel) ? { ...rest, rel } : rest;
  });
  return { ...note, links, editedAt: now };
}

/** All links between kept notes by meaning: { source: [{ from, to }], counter, followup, none }. */
export function relOverview(notes = []) {
  const kept = notes.filter(isKept);
  const byId = new Map(kept.map((n) => [n.id, n]));
  const out = { source: [], counter: [], followup: [], none: [] };
  for (const n of kept) {
    for (const l of n.links ?? []) {
      if (l.kind !== 'note' || !byId.has(l.ref) || l.ref === n.id) continue;
      out[relOk(l.rel) ?? 'none'].push({ from: { id: n.id, title: noteTitle(n) }, to: { id: l.ref, title: noteTitle(byId.get(l.ref)) } });
    }
  }
  return out;
}

/* ---------- a reminder after an event ---------- */

export const AFTER = [
  { key: 'trip', label: 'After the next trip', short: 'after the trip' },
  { key: 'visit', label: 'After the next workshop visit', short: 'after the workshop visit' },
];
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const addDays = (day, n) => {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** The last day of a trip, or null. */
export const lastDay = (trip) => (DAY.test(trip?.startDate ?? '') ? addDays(trip.startDate, Math.max(1, Number(trip.days) || 1) - 1) : null);
const realTrip = (x) => x && !x.idea && !x.skipped && DAY.test(x.startDate ?? '');

/**
 * A new «after» for a note. kind 'trip' (tripId: one trip, or any next one) or 'visit'. Visits already
 * there on `today` are left out (skip), so only a visit after setting it counts.
 */
export function newAfter(kind, { today, tripId = null, visits = [] } = {}) {
  if (!AFTER.some((a) => a.key === kind) || !DAY.test(today ?? '')) return null;
  const a = { kind, since: today };
  if (kind === 'trip' && tripId) a.tripId = tripId;
  if (kind === 'visit') {
    const skip = visits.filter((v) => (v.date ?? '') >= today).map((v) => v.id);
    if (skip.length) a.skip = skip;
  }
  return a;
}

/** The event that brings a note back, or null: { kind, day, title? }. today: localDay(). */
export function afterHit(note, { trips = [], visits = [], today } = {}) {
  const a = note?.after;
  if (!a || a.done || !DAY.test(a.since ?? '')) return null;
  if (a.kind === 'trip') {
    const done = trips
      .filter((x) => realTrip(x) && (!a.tripId || x.id === a.tripId))
      .map((x) => ({ x, end: lastDay(x) }))
      .filter(({ x, end }) => end && end >= a.since && (end < today || x.finished))
      .sort((p, q) => p.end.localeCompare(q.end))[0];
    return done ? { kind: 'trip', day: done.end, title: done.x.title ?? '' } : null;
  }
  if (a.kind === 'visit') {
    const skip = new Set(a.skip ?? []);
    const v = visits.filter((x) => DAY.test(x?.date ?? '') && x.date >= a.since && x.date <= today && !skip.has(x.id)).sort((p, q) => p.date.localeCompare(q.date))[0];
    return v ? { kind: 'visit', day: v.date, title: v.shop ?? '' } : null;
  }
  return null;
}

/** Notes that wait for an event (not yet happened): [{ note, after }]; due ones are in afterDue. */
export const afterWaiting = (notes, ctx) => notes.filter((n) => n?.after && !n.after.done && !afterHit(n, ctx));
/** Notes whose event happened: [{ note, hit }], the oldest event first. */
export function afterDue(notes = [], ctx = {}) {
  return notes
    .map((note) => ({ note, hit: afterHit(note, ctx) }))
    .filter((x) => x.hit)
    .sort((a, b) => a.hit.day.localeCompare(b.hit.day));
}

/* ---------- restore with what belongs to the note ---------- */

/**
 * What comes back with a trashed note and what is missing.
 * row: the trash row ({ note, noteId }); files: the note's file rows; notes: the notes now; trash: the trash rows.
 * → { photos, files, links, back, inTrash: [trash row], gone }
 *   back: other notes that link to it (their links work again); gone: links to notes that no longer exist.
 */
export function restoreInfo(row, { files = [], notes = [], trash = [] } = {}) {
  const n = row?.note ?? {};
  const here = new Set(notes.map((x) => x.id));
  const trashByNote = new Map(trash.filter((r) => r.id !== row?.id).map((r) => [r.noteId, r]));
  const own = (n.links ?? []).filter((l) => l.kind === 'note');
  const inTrash = [];
  let gone = 0;
  for (const l of own) {
    if (here.has(l.ref)) continue;
    const r = trashByNote.get(l.ref);
    if (r) inTrash.push(r);
    else gone++;
  }
  // a trashed note that links to this one comes back with it, if wanted
  for (const r of trashByNote.values()) if (!inTrash.includes(r) && (r.note?.links ?? []).some((l) => l.kind === 'note' && l.ref === row?.noteId)) inTrash.push(r);
  return {
    photos: photosOf(n).length,
    files: files.filter((f) => f.noteId === row?.noteId).length,
    links: own.length - gone + linksOf(n).length,
    back: notes.filter((x) => (x.links ?? []).some((l) => l.kind === 'note' && l.ref === row?.noteId)).length,
    inTrash,
    gone,
  };
}

/* ---------- a memory card ---------- */

/** The scene of a note: { photo, title, text, place, voice, voiceS } or null when it has no card. */
export function cardOf(note) {
  const c = note?.card;
  if (!c) return null;
  const photos = photosOf(note);
  const idx = Number.isInteger(c.photo) && c.photo >= 0 && c.photo < photos.length ? c.photo : 0;
  const body = String(note.text ?? '').replace(/<[^>]+>/g, ' ').replace(/[#*_>`[\]]/g, '').replace(/\s+/g, ' ').trim();
  return {
    photo: photos[idx] ?? null,
    title: noteTitle(note),
    text: body.length > 280 ? `${body.slice(0, 279)}…` : body,
    place: note.place ? note.place.label || `${Number(note.place.lat).toFixed(3)}, ${Number(note.place.lon).toFixed(3)}` : '',
    voice: typeof c.voice === 'string' && c.voice.startsWith('data:audio') ? c.voice : '',
    voiceS: Number(c.voiceS) || 0,
  };
}
/** A clean card for a note (photo index, sound). */
export function newCard({ photo = 0, voice = '', voiceS = 0 } = {}, now = new Date().toISOString()) {
  const c = { photo: Number.isInteger(photo) && photo >= 0 ? photo : 0, at: now };
  if (typeof voice === 'string' && voice.startsWith('data:audio')) Object.assign(c, { voice, voiceS: Math.min(60, Math.max(0, Math.round(Number(voiceS) || 0))) });
  return c;
}
/** How many of the four parts (text, sound, picture, place) a card has. */
export function cardParts(card) {
  if (!card) return 0;
  return [card.text || card.title, card.voice, card.photo, card.place].filter(Boolean).length;
}
/** Kept notes with a card, newest card first. */
export const cardNotes = (notes = []) => notes.filter((n) => isKept(n) && n.card).sort((a, b) => String(b.card.at ?? '').localeCompare(String(a.card.at ?? '')));
