/**
 * «Erwartung und Erlebnis» (Noah 04.11.2026, Persönliches Lernen Idee 1, Runde 1 «1a»): before a bike tour you guess
 * how hard it will be (1–10, the same scale as «Wie anstrengend war die Fahrt?» after a ride, felt effort in
 * training.js). After the ride the tour page puts the guess next to what you said it felt like. Over several tours a
 * calm sentence says whether your guesses lean one way.
 *
 * Observation only: the app writes what stands there and never why. A few tours say little, and the weather,
 * sleep and route differ, so every sentence stays a description. Nothing here is mandatory: no guess, no card.
 * The guess is the field `expectEffort` of the trip (no new table); a second tap on the same number takes it away.
 *
 * Pure (no database, no clock). Tested in tests/erwartung.test.js.
 */
import { feelOf } from './training.js';

export const EXPECT_FIELD = 'expectEffort';
/** How it felt on a tour with a ride but no activity to hold the answer (an uploaded ride): the field `feltEffort` of the trip. */
export const FELT_FIELD = 'feltEffort';
/** A difference below this many points counts as «about as guessed». */
export const SAME_BELOW = 1;
/** At least this many tours with a guess and an answer before the habit line shows. */
export const MIN_TOURS = 3;
/** The scale words (English keys): 1 = very easy … 10 = all out. */
export const WORDS = { 1: 'very easy', 3: 'easy', 5: 'medium', 7: 'hard', 9: 'very hard', 10: 'all out' };

/** The guess of a trip, 1–10, or null. */
export const expectOf = (trip) => {
  const v = Number(trip?.[EXPECT_FIELD]);
  return Number.isInteger(v) && v >= 1 && v <= 10 ? v : null;
};

/** The word of a value on the scale (the nearest word at or below it). */
export const wordOf = (n) => {
  const keys = Object.keys(WORDS).map(Number).filter((k) => k <= n);
  return keys.length ? WORDS[keys.at(-1)] : null;
};

/** The changes for a trip when a number is tapped: tapping the chosen number again takes the guess away. */
export const expectChange = (trip, n) => ({ [EXPECT_FIELD]: expectOf(trip) === n ? null : n });

const r1 = (x) => Math.round(x * 10) / 10;

const whole = (v) => (Number.isInteger(v) && v >= 1 && v <= 10 ? v : null);

/**
 * How it felt on a tour: the mean of the answers on its activities («How hard was your ride?»), one decimal; without
 * one the answer on the trip itself (FELT_FIELD, for an uploaded ride); null without any.
 */
export function feltOf(acts, trip = null) {
  const vals = (acts ?? []).map(feelOf).filter((v) => v != null);
  if (vals.length) return { value: r1(vals.reduce((s, v) => s + v, 0) / vals.length), n: vals.length };
  const own = whole(Number(trip?.[FELT_FIELD]));
  return own ? { value: own, n: 1 } : null;
}

/** The changes for the trip's own answer: the same number again takes it away. */
export const feltChange = (trip, n) => ({ [FELT_FIELD]: whole(Number(trip?.[FELT_FIELD])) === n ? null : n });

/** Guess and felt side by side. → { diff (felt − guess), kind: 'same' | 'harder' | 'easier' } or null without both. */
export function compare(guess, felt) {
  if (guess == null || felt == null) return null;
  const diff = r1(felt - guess);
  return { diff, size: Math.abs(diff), kind: Math.abs(diff) < SAME_BELOW ? 'same' : diff > 0 ? 'harder' : 'easier' };
}

/**
 * Over several tours: pairs = [{ guess, felt }] (felt may be null). → { n, mean (felt − guess), size, kind } or null
 * while there are fewer than MIN_TOURS tours with both.
 */
export function habit(pairs) {
  const both = (pairs ?? []).filter((p) => p && Number.isFinite(p.guess) && Number.isFinite(p.felt));
  if (both.length < MIN_TOURS) return null;
  const mean = r1(both.reduce((s, p) => s + (p.felt - p.guess), 0) / both.length);
  return { n: both.length, mean, size: Math.abs(mean), kind: Math.abs(mean) < SAME_BELOW / 2 ? 'same' : mean > 0 ? 'harder' : 'easier' };
}

/** The ride of a tour that still lacks an answer (the first one), or null. */
export const unanswered = (acts) => (acts ?? []).find((a) => feelOf(a) == null) ?? null;
