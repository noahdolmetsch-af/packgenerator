/**
 * Paket P5 «Eingang» (Noah 21.10.2026, mockup A-J4 «Ablegen-Runde»): the open notes one after the other, each
 * with the app's suggestion and why («weil «Bremse» vorkommt»), three other targets as chips, «Behalten»,
 * «Löschen», «Überspringen» and «Pause»; at the end how many were filed, kept and deleted.
 * Pure functions; the Eingang page writes the records (inboxdb.js fileTo, notes/trash.js).
 * done: { [noteId]: 'filed' | 'kept' | 'deleted' | 'skipped' } — what happened to each note in this round.
 */
import { RECEIPT, IDEA, PLACE } from '../inbox.js';
import { REPAIR, WISH } from '../notes.js';

/** About 7 seconds per note: «Dauert ca. 3 Minuten» for 25 notes. */
export const roundMinutes = (n) => Math.max(1, Math.round((n * 7) / 60));

/** The order of the round: the open notes, newest first (as in the list). Returns their ids. */
export function roundQueue(notes = []) {
  return notes
    .filter((n) => n.status === 'open')
    .sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')))
    .map((n) => n.id);
}

/**
 * Where the round stands: the current note (the first in the queue that is still open and not handled),
 * its place («3 von 25») and whether the round is over.
 */
export function roundState(queue = [], done = {}, notes = []) {
  const open = new Map(notes.filter((n) => n.status === 'open').map((n) => [n.id, n]));
  const id = queue.find((x) => !done[x] && open.has(x));
  const handled = queue.filter((x) => done[x] || !open.has(x)).length;
  return { current: id ? open.get(id) : null, pos: Math.min(handled + 1, queue.length), total: queue.length, over: !id };
}

/** The counts of the end screen. */
export function roundTally(done = {}) {
  const c = { filed: 0, kept: 0, deleted: 0, skipped: 0 };
  for (const v of Object.values(done)) if (v in c) c[v] += 1;
  return c;
}

/** The chips under the suggestion: three other targets (never the suggestion, never «Behalten», which has its own button). */
const CHIPS = ['list', 'tour', 'idea', 'wish', 'problem', 'task'];
export const otherTargets = (sug) => CHIPS.filter((k) => k !== sug).slice(0, 3);

const WORDS = { receipt: RECEIPT, problem: REPAIR, wish: WISH, tour: PLACE, idea: IDEA };

/** The words of the note that led to the suggestion (at most two, as typed): «Bremse», «hinten». */
export function whyWords(note, kind) {
  const re = WORDS[kind];
  const text = note?.text ?? '';
  if (!re || !text) return [];
  const all = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  const out = [];
  for (const m of text.matchAll(all)) {
    const w = m[0].replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (w && !out.some((x) => x.toLowerCase() === w.toLowerCase())) out.push(w);
    if (out.length === 2) break;
  }
  return out;
}
