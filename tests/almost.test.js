import { describe, it, expect } from 'vitest';
import { almostOf } from '../src/lib/flow/almost.js';

const r = (o) => ({ off: false, next: 2, value: 4, target: 5, progress: 0.8, m: { unit: '' }, ...o });
describe('Fast geschafft (Meilensteine aktiver machen PR 4)', () => {
  it('picks the nearest star that is near', () => {
    const a = almostOf([r({ id: 'a', progress: 0.8 }), r({ id: 'b', value: 9, target: 10, progress: 0.9 })]);
    expect(a.r.id).toBe('b');
    expect(a.k).toBe(2);
    expect(a.left).toBe(1);
  });
  it('a counter with 2 ticks left is near, 3 is not; other units need 80 %', () => {
    expect(almostOf([r({ value: 7, target: 10, progress: 0.7 })])).toBeNull();
    expect(almostOf([r({ m: { unit: 'min' }, value: 79, target: 100, progress: 0.79 })])).toBeNull();
    expect(almostOf([r({ value: 3, target: 5, progress: 0.6 })])?.left).toBe(2);
    expect(almostOf([r({ m: { unit: 'min' }, value: 30, target: 60, progress: 0.5 })])).toBeNull();
    expect(almostOf([r({ m: { unit: 'min' }, value: 50, target: 60, progress: 0.83 })])?.left).toBe(10);
  });
  it('skips hidden, unstarted and finished milestones', () => {
    expect(almostOf([r({ off: true }), r({ value: 0, progress: 0 }), r({ next: null, progress: 1 })])).toBeNull();
  });
});
