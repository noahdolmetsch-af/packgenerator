/**
 * HG1 2b «Wie gaht's? / Was häsch vor?»: the answer of the sheet on Today into the ONE history of
 * «Deine Abfragen» (abfragen.js answerRow, abdb.js saveAnswers; no table of its own).
 */
import { QUESTION, answerRow, stampOf } from '../abfragen.js';
import { saveAnswers } from '../abdb.js';
import { db } from '../db.js';
import { NAME_ASKED_KEY } from './hallo.js';

/**
 * The history rows of one answer: { mood: a key of MOODS or null, plans: [keys of PLANS], text }.
 * The free text goes into the note of «Was häsch vor?». Nothing chosen and nothing written: no rows.
 */
export function helloRows({ mood = null, plans = [], text = '' } = {}, at = stampOf()) {
  return [answerRow(QUESTION['hallo.gaht'], mood, { at }), answerRow(QUESTION['hallo.vor'], plans, { at, note: text })].filter(Boolean);
}

/** HG1 2b: save the answer; returns how many rows went into the history. */
export async function saveHello(answer, at = stampOf()) {
  const rows = helloRows(answer, at);
  await saveAnswers(rows);
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
