/**
 * «Tagebuch» with Gemini (Noah 20.10.2026 «1a»: free, the text goes to Google only with a tick each time).
 * Four jobs (api/helper.js DIARY_MODES): a title for an entry, tidy a dictated text, sum up a month, answer
 * a question about the diary. This file builds what goes along; askGemini (assistent/gemini.js) sends it.
 * Photos, places and the weather never go along, only date, tags, mood and text.
 */
import { askGemini } from '../assistent/gemini.js';
import { sortEntries } from './journal.js';

/** How many signs of diary text go along at most (the server takes 12000). */
export const MAX_CONTEXT = 11000;

/** One entry as a line block for Gemini: date, tags, mood, title, text. */
export function entryLine(e) {
  const head = [e.day, e.time, (e.tags ?? []).map((x) => `#${x}`).join(' '), e.mood ? `mood ${e.mood}/5` : ''].filter(Boolean).join(' ');
  const body = [e.title?.trim(), String(e.text ?? '').trim()].filter(Boolean).join(': ');
  return `[${head}] ${body}`;
}

/** Entries joined until `max` signs are reached (in the given order). */
function pack(list, max) {
  const out = [];
  let size = 0;
  for (const e of list) {
    const line = entryLine(e).slice(0, 2000);
    if (size + line.length + 1 > max) break;
    out.push(line);
    size += line.length + 1;
  }
  return out;
}

/**
 * The entries that go along with a question: first those with a word of the question (newest first),
 * then the newest others, until MAX_CONTEXT; given oldest first.
 */
export function askContext(entries, question, max = MAX_CONTEXT) {
  const words = String(question).toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) ?? [];
  const hit = (e) => words.some((w) => `${e.title ?? ''} ${e.text ?? ''} ${(e.tags ?? []).join(' ')}`.toLowerCase().includes(w));
  const sorted = sortEntries(entries);
  const chosen = pack([...sorted.filter(hit), ...sorted.filter((e) => !hit(e))], max);
  return chosen.sort().join('\n');
}

/** The entries of a period (days from … to), oldest first, until MAX_CONTEXT. */
export function periodContext(entries, from, to, max = MAX_CONTEXT) {
  const inside = sortEntries(entries.filter((e) => e.day >= from && e.day <= to)).reverse();
  return pack(inside, max).join('\n');
}

/** A title from Gemini: one line, no quotes, no full stop. */
export const cleanTitle = (s) => String(s ?? '').split('\n')[0].replace(/^["«»“”']+|["«»“”'.]+$/g, '').trim().slice(0, 80);

/** Ask Gemini for a diary job. → { ok, text } | { ok: false, error } (gemini.js errors). */
export function diaryAi(mode, { question = '', context = '', lang = 'de', fetchFn } = {}) {
  const q = question || { title: 'Title for this entry', tidy: 'Tidy up this dictated text', summary: 'Sum up these diary entries', ask: '' }[mode];
  return askGemini(q, { context, lang, mode, ...(fetchFn ? { fetchFn } : {}) });
}
