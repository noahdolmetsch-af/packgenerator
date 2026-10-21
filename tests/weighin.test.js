// P6 «Heute ergänzen», SN2l: the weight once a week on Heute. Fictional data only.
import { describe, it, expect } from 'vitest';
import { weighDue, notToday } from '../src/lib/home/weighin.js';

const T = '2026-10-21';
describe('weigh-in', () => {
  it('due without a weight in the last 7 days', () => {
    expect(weighDue([], T)).toBe(true);
    expect(weighDue([{ day: '2026-10-14', kg: 72.4 }], T)).toBe(true);
    expect(weighDue([{ day: '2026-10-15', kg: 72.4 }], T)).toBe(false);
    expect(weighDue([{ day: T, kg: 72 }], T)).toBe(false);
  });
  it('«Not today» hides it until tomorrow', () => {
    const ask = notToday(T);
    expect(ask).toEqual({ until: '2026-10-22' });
    expect(weighDue([], T, ask)).toBe(false);
    expect(weighDue([], '2026-10-22', ask)).toBe(true);
  });
});
