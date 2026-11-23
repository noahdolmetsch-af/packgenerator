/**
 * Nachtträume (Noah 04./05.11.2026, Thread «Wi gaht's? um Träume und Visionen erweitern»): the sentence that goes with the
 * morning question «What did you dream last night?» also becomes an entry of the Tagebuch with the tag «Traum».
 * One entry per day (id `traum-<day>`), so a second answer or a changed sentence changes that entry instead of adding one.
 * Pure (tests/tagebuch-traum.test.js); the database part is saveAnswers in abdb.js. No new table: a row of «frei», kind 'diary'.
 */
import { newEntry, cleanTags } from './journal.js';

export const DREAM_Q = 'erholung.traum';
/** The tag in the Tagebuch. German on purpose: it is the word Noah chose, and a tag is data, not a UI text. */
export const DREAM_TAG = 'Traum';
export const dreamId = (day) => `traum-${day}`;

/**
 * The entry for an answer row of the dream question, or null when nothing must be written:
 * - no sentence: nothing (the chips alone stay in «Wi gaht's?»);
 * - the entry exists and its text is no longer the sentence of the last answer: it was changed in the Tagebuch, so it stays.
 * `existing`: the row `traum-<day>` of the table «frei» (or undefined), `prevNote`: the sentence of the answer before this save.
 */
export function dreamEntry(row, existing = null, prevNote = '', now = new Date().toISOString()) {
  const note = String(row?.note ?? '').trim();
  if (!note || !row?.day) return null;
  if (existing?.text && existing.text.trim() !== String(prevNote ?? '').trim() && existing.text.trim() !== note) return null;
  const time = /^\d{2}:\d{2}$/.test(String(row.at ?? '').slice(11, 16)) ? String(row.at).slice(11, 16) : null;
  return newEntry(
    { ...(existing ?? {}), id: dreamId(row.day), day: row.day, ...(existing ? {} : time ? { time } : {}), title: existing?.title ?? '', text: note, tags: cleanTags([DREAM_TAG, ...(existing?.tags ?? [])]) },
    { id: dreamId(row.day), now, today: row.day },
  );
}
