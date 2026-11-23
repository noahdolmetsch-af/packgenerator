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

import { changeSentence } from '../src/lib/charts/sentence.js';

describe('changeSentence', () => {
  const pts = (vs) => vs.map((v, i) => ({ label: `D${i + 1}`, v }));
  it('is quiet under four real points', () => {
    expect(changeSentence(pts([70, null, 71, 72]), (v) => `${v} kg`)).toEqual([]);
  });
  it('says more or less, never better or worse', () => {
    expect(changeSentence(pts([70, 71, 72, 73]), (v) => `${v} kg`)).toEqual(['Now 73 kg, 3 kg more than on D1']);
    expect(changeSentence(pts([73, 72, null, 71, 70]), (v) => `${v} kg`)).toEqual(['Now 70 kg, 3 kg less than on D1']);
  });
  it('says the same when nothing changed', () => {
    expect(changeSentence(pts([70, 71, 70, 70]), (v) => `${v} kg`)).toEqual(['Now 70 kg, the same as at the start']);
  });
});

import { usualBand } from '../src/lib/charts/sentence.js';

describe('usualBand', () => {
  it('is the middle half of your own values', () => {
    const v = Array.from({ length: 21 }, (_, i) => i); // 0..20
    expect(usualBand(v)).toEqual({ from: 5, to: 15 });
  });
  it('needs ten real values and a spread', () => {
    expect(usualBand([1, 2, 3, null, 5])).toBeNull();
    expect(usualBand(Array(12).fill(60))).toBeNull();
  });
  it('leaves gaps out', () => {
    expect(usualBand([...Array.from({ length: 21 }, (_, i) => i), null, undefined])).toEqual({ from: 5, to: 15 });
  });
});
