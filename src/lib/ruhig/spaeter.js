/**
 * Paket C › Dein späteres Ich (996 Ideen UC-153-I1, UC-153-I3, UC-159-I2):
 *
 *   Brief mit Anlass (LETTERS_KEY): a letter to yourself that opens in a situation you choose: the first
 *     night of your next trip of several days, the start of the next trip, the day after it, the first ride
 *     after a break of more than 14 days, or on a date. Until then it stays closed.
 *   Antwort von später: an opened letter can be answered; the answer can become the next letter, so the
 *     letters form one private story over several trips (prev links them).
 *   Später anders gesehen (LATER_KEY): next to how you rated a day back then (the evening question «How
 *     happy are you with the day?»), a later view; the old answer stays as it was.
 *
 *   letters = [{ id, text, when: { kind, day? }, written, opened, reply: { text, day } | null, prev }]
 *   later   = { [day]: { text, v (1–10 | null), at } }
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay, uid, addDays, daysBetween, realTrips, tripEnd } from './base.js';

export const LETTERS_KEY = 'ruhig.letters';
export const LATER_KEY = 'ruhig.later';
export const PAUSE_DAYS = 14;
/** The moments a letter can wait for (English keys). */
export const WHEN = [
  { key: 'firstnight', label: 'The first night of my next trip', short: 'first night' },
  { key: 'tripstart', label: 'The start of my next trip', short: 'start of the trip' },
  { key: 'home', label: 'The day after my next trip', short: 'back home' },
  { key: 'pause', label: 'When I ride again after a break of 14 days', short: 'after a break' },
  { key: 'date', label: 'On a date', short: 'on a date' },
];
/** The question whose answer is «how you rated the day back then». */
export const DAY_QUESTION = 'erreicht.zufrieden';

export function lettersOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((l) => l && l.id && clean(l.text, 2000, true) && isDay(l.written) && WHEN.some((w) => w.key === l.when?.kind))
    .map((l) => ({
      id: String(l.id),
      text: clean(l.text, 2000, true),
      when: { kind: l.when.kind, ...(l.when.kind === 'date' && isDay(l.when.day) ? { day: l.when.day } : {}) },
      written: l.written,
      opened: isDay(l.opened) ? l.opened : null,
      reply: l.reply && clean(l.reply.text, 2000, true) ? { text: clean(l.reply.text, 2000, true), day: isDay(l.reply.day) ? l.reply.day : l.written } : null,
      prev: l.prev ? String(l.prev) : null,
    }));
}
export function newLetter({ text, kind, day = null, prev = null }, today, id = uid('brief')) {
  const tx = clean(text, 2000, true);
  if (!tx || !WHEN.some((w) => w.key === kind)) return null;
  if (kind === 'date' && (!isDay(day) || day <= today)) return null;
  return { id, text: tx, when: kind === 'date' ? { kind, day } : { kind }, written: today, opened: null, reply: null, prev };
}

/**
 * The day a letter's moment comes, or null (not yet known). ctx: { trips, rideDays: sorted days with a
 * ride or a tick, today }. Trip moments use the first real trip that starts after the letter was written.
 */
export function momentOf(letter, { trips = [], rideDays = [], today }) {
  const k = letter.when.kind;
  if (k === 'date') return letter.when.day ?? null;
  if (k === 'pause') {
    // «Rückkehr nach Pause»: the first ride after more than PAUSE_DAYS days without one (counted from the letter)
    const seq = [letter.written, ...rideDays.filter((d) => d > letter.written)];
    for (let i = 1; i < seq.length; i++) if (daysBetween(seq[i - 1], seq[i]) > PAUSE_DAYS) return seq[i];
    return null;
  }
  const next = realTrips(trips)
    .filter((x) => x.startDate > letter.written && (k !== 'firstnight' || (Number(x.days) || 1) >= 2))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (!next) return null;
  if (k === 'tripstart' || k === 'firstnight') return next.startDate;
  return addDays(tripEnd(next), 1);
}
/** Closed letters whose moment came (on or before today), oldest moment first. */
export function dueLetters(letters, ctx) {
  return letters
    .filter((l) => !l.opened)
    .map((l) => ({ l, at: momentOf(l, ctx) }))
    .filter((x) => x.at && x.at <= ctx.today)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((x) => x.l);
}
export const openLetter = (letters, id, today) => letters.map((l) => (l.id === id && !l.opened ? { ...l, opened: today } : l));
export const replyLetter = (letters, id, text, today) => letters.map((l) => (l.id === id ? { ...l, reply: clean(text, 2000, true) ? { text: clean(text, 2000, true), day: today } : null } : l));
/** The letters of one story, oldest first (following prev from the newest one). */
export function storyOf(letters, id) {
  const by = new Map(letters.map((l) => [l.id, l]));
  const out = [];
  const seen = new Set();
  for (let l = by.get(id); l && !seen.has(l.id); l = l.prev ? by.get(l.prev) : null) {
    seen.add(l.id);
    out.unshift(l);
  }
  return out;
}

/* ---------- Später anders gesehen ---------- */

export function laterOf(value) {
  const out = {};
  for (const [d, x] of Object.entries(value && typeof value === 'object' ? value : {})) {
    if (!isDay(d) || !x) continue;
    const v = Number(x.v);
    const text = clean(x.text, 600, true);
    if (text || (v >= 1 && v <= 10)) out[d] = { text, v: Number.isInteger(v) && v >= 1 && v <= 10 ? v : null, at: isDay(x.at) ? x.at : '' };
  }
  return out;
}
export function setLater(map, day, { text = '', v = null }, today) {
  const next = { ...map };
  const tx = clean(text, 600, true);
  const vv = Number.isInteger(v) && v >= 1 && v <= 10 ? v : null;
  if (tx || vv) next[day] = { text: tx, v: vv, at: today };
  else delete next[day];
  return next;
}
/**
 * The past days with an answer to the day question, newest first: [{ day, then, note, later }]
 * (then: the value back then, 1–10; later: the later view or null). Today itself is not «later» yet.
 */
export function ratedDays(rows = [], later = {}, today, n = 60) {
  const by = new Map();
  for (const r of rows) {
    if (r?.qid !== DAY_QUESTION || !isDay(r.day) || r.day >= today) continue;
    const v = Number(r.value);
    if (!(v >= 1 && v <= 10)) continue;
    const old = by.get(r.day);
    if (!old || String(r.at ?? '') > String(old.at ?? '')) by.set(r.day, { day: r.day, then: v, note: clean(r.note, 300), at: r.at });
  }
  return [...by.values()]
    .sort((a, b) => b.day.localeCompare(a.day))
    .slice(0, n)
    .map(({ day, then, note }) => ({ day, then, note, later: later[day] ?? null }));
}
