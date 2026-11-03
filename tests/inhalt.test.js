// «Wegweiser statt Katalog» PR 24: every function has its «what for», 2+ steps and an example. The gap lists in
// src/lib/know/inhalt.js may only get shorter; «Good to know» is counted (tests/wissen.test.js asks for it on card pages).
import { describe, it, expect } from 'vitest';
import { FEATURES } from '../src/lib/features.js';
import { HANDBOOK } from '../src/lib/handbook.js';
import { WISSEN } from '../src/lib/wissen/index.js';
import { HOME } from '../src/lib/know/heimat.js';
import { ON_PAGES } from '../src/lib/seiteninhalt.js';
import { contentGaps, NO_STEPS, NO_EXAMPLE } from '../src/lib/know/inhalt.js';

// 02.11.2026: 2 without a second step, 0 without an example. Only lower these, never raise them.
const MAX_NO_STEPS = 2;
const MAX_NO_EXAMPLE = 0;

const gaps = contentGaps(FEATURES, HANDBOOK, WISSEN, ON_PAGES, HOME);
const ids = new Set(FEATURES.map((f) => f.id));
const withWissen = FEATURES.length - gaps.wissen.length;

describe(`content of every function (${FEATURES.length} functions, ${withWissen} with «Good to know»)`, () => {
  it('every function says what it is for', () => {
    expect(gaps.wozu, 'add a text in src/lib/features.js').toEqual([]);
  });

  it(`a function with fewer than 2 steps is listed in NO_STEPS (${gaps.steps.length} of max ${MAX_NO_STEPS})`, () => {
    expect(gaps.steps.filter((id) => !NO_STEPS.includes(id)), 'add a second step in src/lib/handbook.js or list it in NO_STEPS').toEqual([]);
    expect(NO_STEPS.filter((id) => !gaps.steps.includes(id)), 'fixed: take these out of NO_STEPS in src/lib/know/inhalt.js').toEqual([]);
  });

  it(`a function without an example is listed in NO_EXAMPLE (${gaps.example.length} of max ${MAX_NO_EXAMPLE})`, () => {
    expect(gaps.example.filter((id) => !NO_EXAMPLE.includes(id)), 'add an example in src/lib/handbook.js or list it in NO_EXAMPLE').toEqual([]);
    expect(NO_EXAMPLE.filter((id) => !gaps.example.includes(id)), 'fixed: take these out of NO_EXAMPLE in src/lib/know/inhalt.js').toEqual([]);
  });

  it('the lists name existing functions once and only get shorter', () => {
    for (const list of [NO_STEPS, NO_EXAMPLE]) {
      expect(list.filter((id) => !ids.has(id))).toEqual([]);
      expect(new Set(list).size).toBe(list.length);
    }
    expect(NO_STEPS.length).toBeLessThanOrEqual(MAX_NO_STEPS);
    expect(NO_EXAMPLE.length).toBeLessThanOrEqual(MAX_NO_EXAMPLE);
  });

  it(`«Good to know» on every page with the card (${gaps.wissen.length} functions elsewhere still without, counted only)`, () => {
    expect(gaps.wissenOnPages).toEqual([]);
  });

  it('finds each missing part, blank texts included', () => {
    const f = [{ id: 'a', text: 'For x' }, { id: 'b', text: ' ' }, { id: 'c', text: 'For y' }];
    const h = { a: { steps: ['1', '2'], example: 'Ex' }, b: { steps: ['1', ''], example: '' } };
    const g = contentGaps(f, h, { a: 'Tip' }, ['#/p'], { b: '#/p?x=1', c: '#/q' });
    expect(g).toEqual({ wozu: ['b'], steps: ['b', 'c'], example: ['b', 'c'], wissen: ['b', 'c'], wissenOnPages: ['b'] });
  });
});
