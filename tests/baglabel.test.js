import { describe, it, expect } from 'vitest';
import { labelLines, labelFileName, LABEL_MAX } from '../src/lib/pack/baglabel.js';

const items = { a: { name: 'Sleeping bag', weightG: 900 }, b: { name: 'Tent pegs', weightG: 60 }, c: { name: 'Stove' }, d: { name: 'Socks', weightG: 40 } };
const name = (i) => i.name;

describe('K2 bag label', () => {
  it('lists the heaviest first, multiplies by the amount, counts what is not weighed', () => {
    const r = labelLines([{ itemId: 'd', qty: 2 }, { itemId: 'a' }, { itemId: 'c' }, { itemId: 'b' }], items, name);
    expect(r.rows.map((x) => [x.text, x.qty, x.g])).toEqual([['Sleeping bag', 1, 900], ['Tent pegs', 1, 60], ['Socks', 2, 80], ['Stove', 1, null]].sort((p, q) => (q[2] ?? -1) - (p[2] ?? -1)));
    expect(r.totalG).toBe(1040);
    expect(r.missing).toBe(1);
    expect(r.more).toBe(0);
  });
  it('cuts long lists and says how many are left out', () => {
    const entries = Array.from({ length: LABEL_MAX + 5 }, (_, i) => ({ itemId: `x${i}` }));
    const many = Object.fromEntries(entries.map((e, i) => [e.itemId, { name: `Item ${i}`, weightG: i }]));
    const r = labelLines(entries, many, name);
    expect(r.rows.length).toBe(LABEL_MAX);
    expect(r.more).toBe(5);
    expect(r.rows[0].g).toBe(LABEL_MAX + 4);
  });
  it('takes the name of an entry whose item is gone', () => {
    expect(labelLines([{ itemId: 'gone', name: 'Old thing' }], {}, name).rows[0]).toEqual({ text: 'Old thing', qty: 1, g: null });
  });
  it('makes a plain file name', () => {
    expect(labelFileName('Satteltasche links', 'Alpen-Ultra 350')).toBe('Satteltasche-links-Alpen-Ultra-350.jpg');
    expect(labelFileName('', '')).toBe('bag.jpg');
    expect(labelFileName('Rahmentäsche', 'x')).toBe('Rahmentasche-x.jpg');
  });
});
