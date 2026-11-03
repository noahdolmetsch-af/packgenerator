import { describe, it, expect } from 'vitest';
import { nameKey, similarNames } from '../src/lib/flow/similar.js';

describe('similar sport names', () => {
  it('compares without case, accents and a bracket', () => {
    expect(nameKey(' Gym ')).toBe('gym');
    expect(nameKey('GYM (Winter)')).toBe('gym');
    expect(nameKey('Café')).toBe('cafe');
  });
  it('finds names that appear twice', () => {
    const list = [
      { id: 'a', name: 'Gym' },
      { id: 'b', name: 'Laufen' },
      { id: 'c', name: 'gym (Winter)' },
    ];
    expect(similarNames(list)).toEqual([{ key: 'gym', name: 'Gym', ids: ['a', 'c'] }]);
  });
  it('leaves the ones the person said «Leave it» to, and unique names', () => {
    const list = [{ id: 'a', name: 'Gym' }, { id: 'b', name: 'Gym' }, { id: 'c', name: 'Yoga' }];
    expect(similarNames(list, ['gym'])).toEqual([]);
    expect(similarNames([{ id: 'c', name: 'Yoga' }])).toEqual([]);
  });
});
