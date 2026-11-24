/**
 * Bikepacking-Vorschlag R1 «Rückblick in drei Stufen» (Noah 23.11.2026): after the debrief of a trip the app asks
 * three short questions again after 1 day, 1 week and 1 month: what hurts, what you know after sleeping on it, what
 * you only see later. The answers belong to the trip (`trip.later[key] = { day, a: [text, text, text] }`), no new
 * table. Every answer is optional; a stage can stay empty. Pure functions; the page part is Spaeter.svelte.
 * Tested in tests/spaeter.test.js.
 */
import { addDays } from '../agenda.js';
import { tripEnd } from '../tripstate.js';

/** The three stages: after how many days from the last day of the trip, and the three questions (English keys for t()). */
export const STAGES = [
  { key: 'd1', after: 1, name: 'After 1 day', questions: ['What hurts?', 'What do you know after a night of sleep?', 'What was the best moment?'] },
  { key: 'w1', after: 7, name: 'After 1 week', questions: ['What do you still think about?', 'What would you do differently with the bags?', 'Did your body recover as you expected?'] },
  { key: 'm1', after: 30, name: 'After 1 month', questions: ['What do you only see now?', 'What would you tell yourself before the next one?', 'What do you want to keep for next time?'] },
];

export const ANSWER_MAX = 300;

/** Clean answers: three strings, trimmed, at most ANSWER_MAX characters. */
export const cleanAnswers = (list = []) => [0, 1, 2].map((i) => String(list?.[i] ?? '').replace(/\s+/g, ' ').trim().slice(0, ANSWER_MAX));

/** The saved answers of a trip: { key: { day, a } }, only stages with at least one answer. */
export function laterOf(trip) {
  const out = {};
  for (const s of STAGES) {
    const v = trip?.later?.[s.key];
    const a = cleanAnswers(v?.a);
    if (a.some(Boolean)) out[s.key] = { day: v?.day ?? '', a };
  }
  return out;
}

/**
 * The stages of a trip on a day: [{ ...stage, dueDay, state: 'later' | 'open' | 'done', answers }].
 * 'later': the day has not come yet; 'open': due and not answered; 'done': answered. A trip without an end day has none.
 */
export function stagesOf(trip, today) {
  const end = tripEnd(trip);
  if (!end) return [];
  const mine = laterOf(trip);
  return STAGES.map((s) => {
    const dueDay = addDays(end, s.after);
    const answers = mine[s.key] ?? null;
    return { ...s, dueDay, state: answers ? 'done' : dueDay <= today ? 'open' : 'later', answers };
  });
}

/** The `later` object after answering a stage (all three empty: the stage is taken away again). */
export function withLater(trip, key, answers, day = '') {
  const next = { ...(trip?.later ?? {}) };
  const a = cleanAnswers(answers);
  if (a.some(Boolean)) next[key] = { day, a };
  else delete next[key];
  return next;
}

/** How many stages wait for an answer on a day. */
export const openCount = (trip, today) => stagesOf(trip, today).filter((s) => s.state === 'open').length;
