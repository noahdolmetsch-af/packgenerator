// Paket Q #361: suggestions can be switched off per area.
import { describe, it, expect } from 'vitest';
import { SUGGEST_AREAS, offOf, toggleArea } from '../src/lib/clear/suggest.js';

describe('suggestions per area', () => {
  it('all areas are on at the start', () => {
    expect(offOf(undefined).size).toBe(0);
  });
  it('switches one area off and on again', () => {
    const v = toggleArea([], 'weather', false);
    expect(v).toEqual(['weather']);
    expect(toggleArea(v, 'weather', true)).toEqual([]);
  });
  it('drops unknown areas', () => {
    expect([...offOf(['weather', 'nope'])]).toEqual(['weather']);
    expect(toggleArea([], 'nope', false)).toEqual([]);
  });
  it('every area has a label and a text', () => {
    for (const a of SUGGEST_AREAS) expect(a.label && a.text).toBeTruthy();
  });
});
