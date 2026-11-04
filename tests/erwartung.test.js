// «Erwartung und Erlebnis» (Persönliches Lernen Idee 1): the guess, the comparison and the habit line.
import { describe, it, expect } from 'vitest';
import { expectOf, expectChange, feltOf, feltChange, compare, habit, unanswered, wordOf, MIN_TOURS } from '../src/lib/erwartung.js';

describe('the guess of a trip', () => {
  it('reads 1–10 whole numbers only', () => {
    expect(expectOf({ expectEffort: 6 })).toBe(6);
    expect(expectOf({ expectEffort: 0 })).toBe(null);
    expect(expectOf({ expectEffort: 11 })).toBe(null);
    expect(expectOf({ expectEffort: 5.5 })).toBe(null);
    expect(expectOf({})).toBe(null);
    expect(expectOf(null)).toBe(null);
  });
  it('a second tap on the same number takes the guess away, another number changes it', () => {
    expect(expectChange({}, 4)).toEqual({ expectEffort: 4 });
    expect(expectChange({ expectEffort: 4 }, 4)).toEqual({ expectEffort: null });
    expect(expectChange({ expectEffort: 4 }, 7)).toEqual({ expectEffort: 7 });
  });
  it('names the scale', () => {
    expect(wordOf(1)).toBe('very easy');
    expect(wordOf(4)).toBe('easy');
    expect(wordOf(10)).toBe('all out');
  });
});

describe('how it felt', () => {
  it('is the mean of the answers; rides without an answer do not count', () => {
    expect(feltOf([{ feel: 6 }, { feel: 7 }, {}])).toEqual({ value: 6.5, n: 2 });
    expect(feltOf([{ rpe: 5 }])).toEqual({ value: 5, n: 1 });
    expect(feltOf([{}])).toBe(null);
    expect(feltOf([])).toBe(null);
  });
  it('takes the answer on the trip when no activity has one (an uploaded ride)', () => {
    expect(feltOf([], { feltEffort: 8 })).toEqual({ value: 8, n: 1 });
    expect(feltOf([{ feel: 4 }], { feltEffort: 8 })).toEqual({ value: 4, n: 1 });
    expect(feltOf([{}], { feltEffort: 12 })).toBe(null);
    expect(feltChange({}, 6)).toEqual({ feltEffort: 6 });
    expect(feltChange({ feltEffort: 6 }, 6)).toEqual({ feltEffort: null });
  });
  it('finds the first ride that still lacks an answer', () => {
    expect(unanswered([{ id: 1, feel: 5 }, { id: 2 }, { id: 3 }])?.id).toBe(2);
    expect(unanswered([{ id: 1, feel: 5 }])).toBe(null);
  });
});

describe('guess and felt', () => {
  it('says nothing without both', () => {
    expect(compare(null, 5)).toBe(null);
    expect(compare(5, null)).toBe(null);
  });
  it('same below one point, harder or easier from one point', () => {
    expect(compare(6, 6.5).kind).toBe('same');
    expect(compare(6, 5.5).kind).toBe('same');
    expect(compare(6, 7)).toMatchObject({ kind: 'harder', diff: 1, size: 1 });
    expect(compare(6, 3.5)).toMatchObject({ kind: 'easier', diff: -2.5, size: 2.5 });
  });
});

describe('the habit over several tours', () => {
  const p = (guess, felt) => ({ guess, felt });
  it('needs at least three tours with both numbers', () => {
    expect(MIN_TOURS).toBe(3);
    expect(habit([p(5, 6), p(6, 7)])).toBe(null);
    expect(habit([p(5, 6), p(6, 7), p(4, null)])).toBe(null);
    expect(habit(null)).toBe(null);
  });
  it('is the mean of felt minus guess', () => {
    expect(habit([p(5, 7), p(6, 7), p(4, 6)])).toEqual({ n: 3, mean: 1.7, size: 1.7, kind: 'harder' });
    expect(habit([p(7, 5), p(8, 6), p(6, 5)])).toMatchObject({ n: 3, kind: 'easier' });
    expect(habit([p(5, 5), p(6, 6), p(4, 4.2)])).toMatchObject({ kind: 'same' });
  });
});
