// «Cardio-Belastung» Idee E: the highest days of the range (lib/analyse/hoechste.js). Fictional values only.
import { describe, it, expect } from 'vitest';
import { topDays, whatText } from '../src/lib/analyse/hoechste.js';

const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
const val = { '2026-10-01': 300, '2026-10-02': 900, '2026-10-03': 900, '2026-10-04': 0, '2026-10-05': 500 };
const get = (d) => val[d] ?? null;

describe('topDays', () => {
  it('lists the highest first; on a tie the newer day first', () => {
    expect(topDays(days, get, 3)).toEqual([
      { day: '2026-10-03', v: 900 },
      { day: '2026-10-02', v: 900 },
      { day: '2026-10-05', v: 500 },
    ]);
  });
  it('leaves out days without a value or with 0', () => {
    expect(topDays(days, get, 9).map((x) => x.day)).not.toContain('2026-10-04');
    expect(topDays(days, () => null)).toEqual([]);
    expect(topDays([], get)).toEqual([]);
  });
});

describe('whatText', () => {
  it('joins the trip and the names', () => {
    expect(whatText('Alpenrunde', 'Morgenlauf, Yoga')).toBe('Alpenrunde · Morgenlauf, Yoga');
    expect(whatText('', 'Yoga')).toBe('Yoga');
    expect(whatText('Alpenrunde', '')).toBe('Alpenrunde');
    expect(whatText('', '')).toBe('');
  });
});
