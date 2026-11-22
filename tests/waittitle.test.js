// Durchklick Etappe 2, Frage 5a (Noah 05.11.2026): the name that stands above the placeholder while a page loads (src/lib/nav/waittitle.js).
import { describe, it, expect } from 'vitest';
import { waitTitle } from '../src/lib/nav/waittitle.js';

describe('waitTitle', () => {
  it('names the place of a page', () => {
    expect(waitTitle('#/trips')).not.toBe('');
  });
  it('names the tab when the address has one', () => {
    expect(waitTitle('#/week')).not.toBe('');
    expect(waitTitle('#/week')).not.toBe(waitTitle('#/trips'));
  });
  it('always gives a text, never undefined', () => {
    expect(typeof waitTitle('#/nonsense/x')).toBe('string');
  });
});
