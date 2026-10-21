// 0.163.0 «Handy kurz»: the grey value line and the five rows of a list on a phone.
import { describe, it, expect } from 'vitest';
import { shortLine, capGroups, capKeep, PHONE_ROWS, MAX_SCREENS, ACT_LINE } from '../src/lib/touren/kurz.js';

describe('the grey line of a row (answer 2b)', () => {
  it('joins label, value and unit, without the values that are missing', () => {
    expect(shortLine([['Fahrzeit', '1:40', ''], ['Ø Tempo', '18.0', 'km/h'], ['Ø Puls', '–', 'bpm'], ['Wetter', 'trocken', ''], ['Temp.', null, '']])).toBe('Fahrzeit 1:40 · Ø Tempo 18.0 km/h · Wetter trocken');
  });
  it('is empty when nothing has a value', () => {
    expect(shortLine([['Fahrzeit', '–', ''], ['Wetter', '', '']])).toBe('');
  });
});

describe('five rows first', () => {
  const groups = [{ month: '2026-10', rows: [1, 2, 3] }, { month: '2026-09', rows: [4, 5, 6] }, { month: '2026-08', rows: [7] }];
  it('keeps the months in order and stops after n rows', () => {
    expect(capGroups(groups, PHONE_ROWS)).toEqual([{ month: '2026-10', rows: [1, 2, 3] }, { month: '2026-09', rows: [4, 5] }]);
  });
  it('shows everything when there are fewer rows', () => {
    expect(capGroups(groups, 20).flatMap((g) => g.rows)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('the limits Noah approved: 5 rows, 3 screens; the line with heart rate, TSS and elapsed time («b»)', () => {
    expect([PHONE_ROWS, MAX_SCREENS]).toEqual([5, 3]);
    expect(ACT_LINE).toEqual(expect.arrayContaining(['hf', 'tss', 'verstr']));
  });
});

// Gesamttest 21.10.2026 C7: Velopflege and the inspections cut long lists on a phone; what is due always stays.
describe('capKeep: the first rows, the kept ones always', () => {
  const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ n, due: n === 7 }));
  it('the first n rows in order', () => {
    expect(capKeep(rows, 3).map((r) => r.n)).toEqual([1, 2, 3]);
  });
  it('a kept row shows although it comes late; the others fill up to n', () => {
    expect(capKeep(rows, 3, (r) => r.due).map((r) => r.n)).toEqual([1, 2, 7]);
  });
  it('more kept rows than n: all of them, nothing else', () => {
    expect(capKeep(rows, 1, (r) => r.n > 6).map((r) => r.n)).toEqual([7, 8]);
  });
  it('a short list stays whole', () => {
    expect(capKeep(rows.slice(0, 2), 5)).toHaveLength(2);
  });
});
