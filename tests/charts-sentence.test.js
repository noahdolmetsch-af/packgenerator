// «Sätze über dem Diagramm» (Noah 21.11.2026 «2b»): rule-based, quiet when nothing stands out.
import { describe, it, expect } from 'vitest';
import { sentencesOf } from '../src/lib/charts/sentence.js';

const mk = (vs) => vs.map((v, i) => ({ label: `M${i + 1}`, v }));

describe('sentencesOf', () => {
  it('is quiet under six real bars', () => {
    expect(sentencesOf(mk([1, 2, 3, 4, 5]))).toEqual([]);
    expect(sentencesOf([...mk([1, 2, 3, 4, 5]), { label: 'x', v: 0, none: 'Not yet' }])).toEqual([]);
  });
  it('names the highest bar and a rise of the last three', () => {
    const s = sentencesOf(mk([5, 9, 3, 4, 5, 6]), (v) => `${v} h`);
    expect(s[0]).toBe('Most: M2 with 9 h');
    expect(s).toContain('The last three bars are rising');
  });
  it('names a fall and the longest break', () => {
    const s = sentencesOf(mk([5, 0, 0, 0, 3, 2, 1]));
    expect(s).toContain('The last three bars are falling');
    expect(s).toContain('Longest break: 3 bars in a row without anything');
    expect(s.length).toBeLessThanOrEqual(3);
  });
});
