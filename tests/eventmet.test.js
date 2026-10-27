// «Neue Leute merken» (Noah 26.10.2026; check of 27.10.2026): an event group of several days leaves one reminder
// for the day after it ends; a group of one day leaves none.
import { describe, it, expect } from 'vitest';
import { metTodoOf, MET_SRC } from '../src/lib/live/eventmet.js';

describe('the reminder after an event', () => {
  const end = Date.parse('2026-10-11T21:30:00Z'); // 23:30 in Zurich on 11.10.
  it('is due the day after the event ends, in the area people', () => {
    expect(metTodoOf({ gid: 'g1', end, days: 3 }, 'test_data_gtp_ Wen?')).toEqual({ text: 'test_data_gtp_ Wen?', due: '2026-10-12', remind: { before: 0 }, area: 'people', src: `${MET_SRC}g1` });
    expect(metTodoOf({ gid: 'g1', end: new Date(end).toISOString(), days: 7 }, 'x').due).toBe('2026-10-12');
  });
  it('a group of one day or without an end leaves none', () => {
    expect(metTodoOf({ gid: 'g1', end, days: 1 }, 'x')).toBeNull();
    expect(metTodoOf({ gid: 'g1', end: 'nie', days: 3 }, 'x')).toBeNull();
    expect(metTodoOf({ end, days: 3 }, 'x')).toBeNull();
  });
});
