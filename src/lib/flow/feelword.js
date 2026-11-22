/**
 * «Von selbst» (Noah 19.11.2026 «1-5a», Thread «Training erfassen vereinfachen», T3): after a Strava activity the app asks
 * «How was it?» with three words: light, good, hard (or «Later»). The answer is kept on the activity as `feelWord`.
 * The old answer 1–10 (`feel`) stays readable: 1–3 reads as light, 4–6 as good, 7–10 as hard; a word counts for the plans
 * as the middle of its numbers (training.js WORD_FEEL). Pure functions; the card is src/lib/training/plans/FeelAsk.svelte.
 */
import { WORD_FEEL } from '../training.js';

export const FEEL_WORDS = ['light', 'good', 'hard'];
/** The English key of each word for `t()` (German: leicht, gut, hart). */
export const FEEL_KEY = { light: 'light|feel', good: 'good|feel', hard: 'hard|feel' };

/** The word an old 1–10 answer reads as: 1–3 light, 4–6 good, 7–10 hard; null for anything else. */
export const wordOfNumber = (n) => (Number.isFinite(n) && n >= 1 && n <= 10 ? (n <= 3 ? 'light' : n <= 6 ? 'good' : 'hard') : null);

/** The word of an activity: the own word, else the own number read as a word, else Strava's own «How hard?» read as a word; null without one. */
export const feelWordOf = (a) => (a?.feelWord in WORD_FEEL ? a.feelWord : wordOfNumber(a?.feel) ?? wordOfNumber(a?.rpe));

/**
 * The change for a tap on a word: the same word again takes the answer back; a word replaces an own number (never both).
 * → the fields to write on the activity.
 */
export function feelPatch(a, word) {
  if (!(word in WORD_FEEL)) return {};
  if (a?.feelWord === word) return { feelWord: null };
  return { feelWord: word, feel: null, feelSkip: false };
}
