/**
 * Paket C › Eigene kleine Experimente (996 Ideen UC-254-I1, 87 ideas in one): a personal try with a
 * question, what you change, a time span and a deliberate end. Builds on «Kleine Experimente als
 * Challenge» (challenge.js), but it never runs on as a routine: after the last day it asks for a short
 * look back (what you learned; keep, adapt or drop) and is finished. «Again» starts a new one.
 *
 * Settings EXP_KEY = [{ id, q, change, from, days, ticks: { day: 'yes'|'no' }, notes: { day: text },
 *                       review: { learned, keep, at } | null, stopped: day | null }]
 * Pure, tested in tests/ruhig.test.js.
 */
import { clean, isDay, uid, addDays, daysBetween } from './base.js';

export const EXP_KEY = 'ruhig.experiments';
export const EXP_DAYS = [3, 7, 14, 21, 28];
export const EXP_MIN = 3;
export const EXP_MAX = 42;
export const KEEP = [
  { key: 'keep', label: 'Keep it' },
  { key: 'adapt', label: 'Adapt it' },
  { key: 'drop', label: 'Let it go' },
];
/** Examples to start from (English keys). */
export const EXP_EXAMPLES = [
  { q: 'Do I sleep better without a screen after 21:00?', change: 'No phone after 21:00' },
  { q: 'Is the morning ride easier with breakfast first?', change: 'Breakfast before every ride' },
  { q: 'Do I pack faster with the list from the evening before?', change: 'Pack the evening before' },
];

const daysOk = (n) => Math.min(EXP_MAX, Math.max(EXP_MIN, Math.round(Number(n)) || 7));

export function expsOf(value) {
  return (Array.isArray(value) ? value : [])
    .filter((e) => e && e.id && clean(e.q, 160) && isDay(e.from))
    .map((e) => {
      const ticks = {};
      for (const [d, v] of Object.entries(e.ticks ?? {})) if (isDay(d) && (v === 'yes' || v === 'no')) ticks[d] = v;
      const notes = {};
      for (const [d, v] of Object.entries(e.notes ?? {})) if (isDay(d) && clean(v, 300)) notes[d] = clean(v, 300);
      const r = e.review && typeof e.review === 'object' ? e.review : null;
      return {
        id: String(e.id),
        q: clean(e.q, 160),
        change: clean(e.change, 160),
        from: e.from,
        days: daysOk(e.days),
        ticks,
        notes,
        review: r ? { learned: clean(r.learned, 600, true), keep: KEEP.some((k) => k.key === r.keep) ? r.keep : '', at: isDay(r.at) ? r.at : '' } : null,
        stopped: isDay(e.stopped) ? e.stopped : null,
      };
    });
}
export function newExp({ q, change = '', from, days = 7 }, id = uid('exp')) {
  const qq = clean(q, 160);
  return qq && isDay(from) ? { id, q: qq, change: clean(change, 160), from, days: daysOk(days), ticks: {}, notes: {}, review: null, stopped: null } : null;
}
/** The last day of the try. */
export const expEnd = (e) => addDays(e.from, e.days - 1);
/** 'soon' (not started) · 'running' · 'review' (over, look back missing) · 'done' · 'stopped' */
export function expState(e, today) {
  if (e.review) return 'done';
  if (e.stopped) return e.stopped < expEnd(e) ? 'stopped' : 'review';
  if (today < e.from) return 'soon';
  if (today <= expEnd(e)) return 'running';
  return 'review';
}
/** Day n of the try (1-based) and the counts so far. */
export function expProgress(e, today) {
  const last = today < expEnd(e) ? today : expEnd(e);
  const n = Math.max(0, Math.min(e.days, daysBetween(e.from, today) + 1));
  let yes = 0;
  let no = 0;
  for (const [d, v] of Object.entries(e.ticks)) if (d >= e.from && d <= last) v === 'yes' ? yes++ : no++;
  return { day: n, yes, no, open: Math.max(0, Math.min(n, e.days) - yes - no) };
}
/** A tick for a day of the try (the same answer again takes it back); days outside it change nothing. */
export function expTick(e, day, v) {
  if (day < e.from || day > expEnd(e) || !['yes', 'no'].includes(v)) return e;
  const ticks = { ...e.ticks };
  if (ticks[day] === v) delete ticks[day];
  else ticks[day] = v;
  return { ...e, ticks };
}
export function expNote(e, day, text) {
  const notes = { ...e.notes };
  if (clean(text, 300)) notes[day] = clean(text, 300);
  else delete notes[day];
  return { ...e, notes };
}
export const expReview = (e, { learned, keep }, today) => ({ ...e, review: { learned: clean(learned, 600, true), keep: KEEP.some((k) => k.key === keep) ? keep : '', at: today } });
/** Stop early: it still gets its look back (state 'stopped' until reviewed). */
export const expStop = (e, today) => ({ ...e, stopped: today });
/** «Again»: a new try with the same question from today (never an extension of the old one). */
export const expAgain = (e, today, id) => newExp({ q: e.q, change: e.change, from: today, days: e.days }, id);
