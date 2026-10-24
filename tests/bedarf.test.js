import { describe, it, expect } from 'vitest';
import { NEEDS, itemsFor, pickVariant, amountOf, planNeeds, variantGrams, usedCount, applyPlan } from '../src/lib/bedarf/bedarf.js';

const own = (id, sets, weightG, category, extra = {}) => ({ id, name: id, ownership: 'owned', sets, weightG, category, ...extra });
const items = [
  own('bag-down', ['bivy'], 600, 'sleep'),
  own('bag-synth', ['bivy'], 1100, 'sleep'),
  own('mat', ['sleepwell'], 400, 'mat'),
  own('stove', ['cook'], 300, 'kitchen'),
  own('bar', ['food'], 50, 'food'),
  own('socks', ['hygiene'], 60, 'clothes', { name: 'Socken' }),
  { ...own('old', ['bivy'], 100, 'sleep'), ownership: 'wish' },
];
const need = (k) => NEEDS.find((n) => n.key === k);

describe('Packen nach Bedürfnis', () => {
  it('fills a need from your own gear only', () => {
    expect(itemsFor(need('sleepwarm'), items).map((i) => i.id)).toEqual(['bag-down', 'bag-synth', 'mat']);
  });
  it('picks one thing per kind for each variant', () => {
    const list = itemsFor(need('sleepwarm'), items);
    expect(pickVariant(list, 'light').map((i) => i.id)).toEqual(['bag-down', 'mat']);
    expect(pickVariant(list, 'comfort').map((i) => i.id)).toEqual(['bag-synth', 'mat']);
    const used = usedCount([{ id: 'a', entries: [{ itemId: 'bag-synth' }, { itemId: 'bag-synth' }] }, { id: 'b', entries: [{ itemId: 'bag-synth' }] }]);
    expect(used['bag-synth']).toBe(2);
    expect(pickVariant(list, 'easy', used).map((i) => i.id)).toEqual(['bag-synth', 'mat']);
  });
  it('amounts follow days and people; shared things once', () => {
    const o = { days: 5, people: 2 };
    expect(amountOf(items[3], need('cook'), o)).toBe(1);
    expect(amountOf(items[4], need('eat'), o)).toBe(10);
    expect(amountOf(items[5], need('clean'), o)).toBe(6);
    expect(amountOf(items[0], need('sleepwarm'), o)).toBe(2);
  });
  it('plans, compares the variants and says what is missing', () => {
    const p = planNeeds(['sleepwarm', 'cook', 'see'], items, { variant: 'light', days: 2, people: 1 });
    expect(p.rows.map((r) => r.need.key)).toEqual(['sleepwarm', 'cook']);
    expect(p.empty.map((n) => n.key)).toEqual(['see']);
    expect(p.g).toBe(1300);
    expect(variantGrams(['sleepwarm'], items, { days: 2 })).toEqual({ light: 1000, comfort: 1500, easy: 1000 });
  });
  it('takes the plan onto the list without dropping anything', () => {
    const p = planNeeds(['eat', 'cook'], items, { days: 3 });
    const out = applyPlan([{ itemId: 'bar', slot: 'top', qty: 1, packed: true }, { itemId: 'x', slot: 'seat', qty: 1 }], p, () => 'seat');
    expect(out).toEqual([
      { itemId: 'bar', slot: 'top', qty: 3, packed: true },
      { itemId: 'x', slot: 'seat', qty: 1 },
      { itemId: 'stove', slot: 'seat', qty: 1, packed: false, src: 'set' },
    ]);
  });
});
