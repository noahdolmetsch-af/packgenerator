// «Rückblick in 30 Sekunden» (Noah 05.11.2026, Touren 3b): the faces map onto the fields of the long debrief.
import { describe, it, expect } from 'vitest';
import { FUN_FACES, AMOUNT_FACES, addMissingName } from '../src/lib/debrief/kurz.js';
import { AMOUNT } from '../src/lib/debrief.js';
import { joyChange, joyOf, MAX } from '../src/lib/freude.js';

describe('Rückblick in 30 Sekunden', () => {
  it('five faces, 1 to 5, as many as the scale «Riding fun» has', () => {
    expect(FUN_FACES.map((f) => f.n)).toEqual(Array.from({ length: MAX }, (_, i) => i + 1));
  });
  it('a face is stored as «Riding fun»; a second tap on the same face takes it away', () => {
    let joy = joyChange({}, 'fun', 4);
    expect(joy).toEqual({ fun: 4 });
    expect(joyOf({ joy }).fun).toBe(4);
    joy = joyChange({ joy }, 'fun', 4);
    expect(joy).toBe(null);
  });
  it('the luggage faces are exactly the answers of «How was it?»', () => {
    expect(AMOUNT_FACES.map((f) => f.key).sort()).toEqual(AMOUNT.map((a) => a.key).sort());
  });
  it('a missed thing is added once; gear with the same name is linked, a new name stays as typed', () => {
    const items = [{ id: 'i1', name: 'Headlamp', nameDe: 'Stirnlampe' }];
    const one = addMissingName([], '  stirnlampe ', items, 'm1');
    expect(one).toEqual([{ id: 'm1', name: 'Headlamp', itemId: 'i1' }]);
    expect(addMissingName(one, 'HEADLAMP', items, 'm2')).toBe(null);
    expect(addMissingName(one, 'test_data_gtp_ Schloss', items, 'm3')).toEqual([...one, { id: 'm3', name: 'test_data_gtp_ Schloss', itemId: null }]);
    expect(addMissingName(one, '   ', items, 'm4')).toBe(null);
  });
  it('does not change the list it is given', () => {
    const list = [{ id: 'm1', name: 'A', itemId: null }];
    addMissingName(list, 'B', [], 'm2');
    expect(list).toHaveLength(1);
  });
});
