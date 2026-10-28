import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { longTimeS } from '../src/lib/review/fmt.js';

// Tour-Seite (Noah 27.10.2026 «1a»): the total time readable instead of «00:02:02:18». Fictional values.
describe('the total time on the tour page in words', () => {
  it('hours, minutes and seconds', () => {
    expect(longTimeS(7338)).toBe('2 h 02 min 18 s');
    expect(longTimeS(1605)).toBe('26 min 45 s');
    expect(longTimeS(45)).toBe('45 s');
  });
  it('from one day on without seconds', () => {
    expect(longTimeS(94500)).toBe('1 day 2 h 15 min');
    expect(longTimeS(2 * 86400 + 60)).toBe('2 days 0 h 01 min');
  });
  it('unknown or zero is a calm dash', () => {
    expect(longTimeS(null)).toBe('–');
    expect(longTimeS(0)).toBe('–');
  });
});
