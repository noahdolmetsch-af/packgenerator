/**
 * HG1 2b «Wi gaht's? / Was häsch vor?»: the answer of the sheet on Today into the ONE history of
 * «Deine Abfragen» (abfragen.js answerRow, abdb.js saveAnswers; no table of its own).
 */
import { QUESTION, answerRow, stampOf } from '../abfragen.js';
import { saveAnswers } from '../abdb.js';
import { db } from '../db.js';
import { NAME_ASKED_KEY, HELLO_QUESTIONS } from './hallo.js';

/**
 * The history rows of one answer: { mood: a key of MOODS or null, feelings: [keys of FEELINGS], plans: [keys of PLANS], text }.
 * The free text goes into the note of «Was häsch vor?». Nothing chosen and nothing written: no rows.
 * Gruss A: the row ids are fixed by question and time, so every tap saves over the same rows (nothing piles up).
 */
export function helloRows({ mood = null, feelings = [], plans = [], text = '' } = {}, at = stampOf()) {
  return [
    answerRow(QUESTION['hallo.gaht'], mood, { at }),
    answerRow(QUESTION['hallo.gefuehl'], feelings, { at }),
    answerRow(QUESTION['hallo.vor'], plans, { at, note: text }),
  ]
    .filter(Boolean)
    .map((r) => ({ ...r, id: helloId(r.qid, at) }));
}
const helloId = (qid, at) => `ab-${qid}-${at}`;

/** Gruss A: save the answer as it stands (every tap); a row that is empty now is taken away. Returns how many rows stand. */
export async function saveHello(answer, at = stampOf()) {
  const rows = helloRows(answer, at);
  const keep = new Set(rows.map((r) => r.id));
  const stale = HELLO_QUESTIONS.map((q) => helloId(q.id, at)).filter((id) => !keep.has(id));
  if (stale.length) await db.abAnswers.bulkDelete(stale);
  if (rows.length) await saveAnswers(rows);
  return rows.length;
}

/** HG1b, HG1c: the name for the greeting (the setting `userName`, only on this device); empty = no name. */
export async function saveUserName(name) {
  await db.settings.bulkPut([
    { key: 'userName', value: String(name ?? '').trim().slice(0, 40) },
    { key: NAME_ASKED_KEY, value: true },
  ]);
}
/** HG1b «Nicht jetzt»: the name is asked only once. */
export const nameAsked = () => db.settings.put({ key: NAME_ASKED_KEY, value: true });
