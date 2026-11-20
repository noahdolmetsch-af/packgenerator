import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { FEEL_WORDS, FEEL_KEY, wordOfNumber, feelWordOf, feelPatch } from '../src/lib/flow/feelword.js';
import { feelOf, feelZone, WORD_FEEL, KEEP } from '../src/lib/training.js';
import { FETCHED } from '../src/lib/sync/engine.js';
import { createDb } from '../src/lib/db.js';

describe('«Von selbst»: Wie war’s? in drei Wörtern', () => {
  it('the three words and their keys', () => {
    expect(FEEL_WORDS).toEqual(['light', 'good', 'hard']);
    expect(Object.keys(FEEL_KEY)).toEqual(FEEL_WORDS);
  });
  it('the old 1–10 reads as a word: 1–3 light, 4–6 good, 7–10 hard', () => {
    expect([1, 3, 4, 6, 7, 10].map(wordOfNumber)).toEqual(['light', 'light', 'good', 'good', 'hard', 'hard']);
    expect([0, 11, null, NaN, undefined].map(wordOfNumber)).toEqual([null, null, null, null, null]);
  });
  it('feelWordOf: the own word, else the own number, else Strava’s «How hard?»', () => {
    expect(feelWordOf({ feelWord: 'hard', feel: 2 })).toBe('hard');
    expect(feelWordOf({ feel: 5 })).toBe('good');
    expect(feelWordOf({ rpe: 9 })).toBe('hard');
    expect(feelWordOf({ feelWord: 'tired' })).toBe(null);
    expect(feelWordOf({})).toBe(null);
  });
  it('a word counts for the plans as the middle of its numbers and stays inside its zone', () => {
    expect(WORD_FEEL).toEqual({ light: 2, good: 5, hard: 8 });
    expect(feelOf({ feelWord: 'good' })).toBe(5);
    expect(feelOf({ feel: 7, feelWord: 'light' })).toBe(7); // an own number is the more exact answer
    expect(feelOf({ feelWord: 'hard', rpe: 3 })).toBe(8); // own before Strava’s
    expect(feelOf({ rpe: 3 })).toBe(3);
    expect(feelOf({ feelWord: 'tired' })).toBe(null);
    expect(['light', 'good', 'hard'].map((w) => wordOfNumber(WORD_FEEL[w]))).toEqual(['light', 'good', 'hard']);
    expect(['light', 'good', 'hard'].map((w) => feelZone(WORD_FEEL[w]))).toEqual([1, 3, 4]);
  });
  it('a tap sets the word and drops an own number; the same word again takes it back; nonsense changes nothing', () => {
    expect(feelPatch({ feel: 7 }, 'light')).toEqual({ feelWord: 'light', feel: null, feelSkip: false });
    expect(feelPatch({ feelWord: 'light' }, 'light')).toEqual({ feelWord: null });
    expect(feelPatch({}, 'tired')).toEqual({});
  });
  it('the word is kept when Strava sends the activity again and is an own field in the sync', () => {
    expect(KEEP).toContain('feelWord');
    expect(FETCHED.activities.own).toContain('feelWord');
  });
  it('an activity with and without feelWord is stored as it is', async () => {
    const db = createDb('fw-a');
    await db.activities.bulkPut([{ id: 'a', day: '2026-10-20' }, { id: 'b', day: '2026-10-20', feelWord: 'good' }]);
    expect((await db.activities.get('a')).feelWord).toBeUndefined();
    expect((await db.activities.get('b')).feelWord).toBe('good');
  });
});
