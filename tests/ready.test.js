import { describe, it, expect } from 'vitest';
import { mapKept, readiness } from '../src/lib/live/ready.js';

const strips = [
  { id: 'a', tripId: 't1' },
  { id: 'b', tripId: 't2' },
];

describe('mapKept', () => {
  it('counts a strip of this tour whose tiles are on the phone', () => {
    expect(mapKept(strips, new Set(['a']), 't1')).toBe(true);
  });
  it('does not count a strip of another tour or one that is not on this phone', () => {
    expect(mapKept(strips, new Set(['b']), 't1')).toBe(false);
    expect(mapKept(strips, new Set(), 't1')).toBe(false);
    expect(mapKept(strips, new Set(['a']), null)).toBe(false);
  });
});

describe('readiness', () => {
  it('names what is missing', () => {
    expect(readiness({ strips, present: new Set(), tripId: 't1', voice: false })).toEqual({ mapOk: false, voiceOk: false, missing: ['map', 'voice'], ready: false });
    expect(readiness({ strips, present: new Set(['a']), tripId: 't1', voice: false }).missing).toEqual(['voice']);
  });
  it('is ready when both are there', () => {
    expect(readiness({ strips, present: new Set(['a']), tripId: 't1', voice: true }).ready).toBe(true);
  });
});
