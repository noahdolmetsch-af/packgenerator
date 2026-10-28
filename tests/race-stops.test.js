// «Nacht-Stopp-Ablauf» (Noah 28.10.2026): what you do at every night stop, ticked off. Made-up steps.
import { describe, it, expect } from 'vitest';
import { STOP_STEPS, stopsOf, stopCount, nextStop } from '../src/lib/race/stop-lib.js';

describe('night stop routine', () => {
  it('shows the suggestions, translated, while nothing is saved', () => {
    const got = stopsOf({}, (x) => `de:${x}`);
    expect(got.map((r) => r.id)).toEqual(STOP_STEPS.map((r) => r.id));
    expect(got[0].text).toBe(`de:${STOP_STEPS[0].text}`);
    expect(got.every((r) => r.done === false)).toBe(true);
  });
  it('keeps your own list with its ticks', () => {
    const stored = { stops: { list: [{ id: 'a', text: 'Made-up step', done: true }], n: 2 } };
    expect(stopsOf(stored)).toEqual([{ id: 'a', text: 'Made-up step', done: true }]);
    expect(stopCount(stored)).toBe(2);
    expect(stopCount({})).toBe(0);
  });
  it('next stop: every tick off, the count one up', () => {
    const got = nextStop([{ id: 'a', text: 'A', done: true }, { id: 'b', text: 'B', done: false }], 1);
    expect(got).toEqual({ list: [{ id: 'a', text: 'A', done: false }, { id: 'b', text: 'B', done: false }], n: 2 });
  });
});
