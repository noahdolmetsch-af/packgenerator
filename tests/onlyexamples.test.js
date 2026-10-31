// UI-Test T10 (G5-04): a device with only the examples of the first start counts as empty for «Check import»
import { describe, it, expect } from 'vitest';
import { onlyExamples } from '../src/lib/firststart.js';

describe('onlyExamples', () => {
  const left = { trips: [{ id: 'ex-t' }], items: [{ id: 'ex-i' }], bikes: [{ id: 'ex-b' }] };
  it('nothing or only examples: empty', () => {
    expect(onlyExamples({}, {})).toBe(true);
    expect(onlyExamples({ trips: [], items: [], bikes: [] }, {})).toBe(true);
    expect(onlyExamples({ trips: ['ex-t'], items: ['ex-i'], bikes: ['ex-b'] }, left)).toBe(true);
  });
  it('one own trip, thing or bike: not empty', () => {
    expect(onlyExamples({ trips: ['ex-t', 'mine'] }, left)).toBe(false);
    expect(onlyExamples({ items: ['mine'] }, left)).toBe(false);
    expect(onlyExamples({ bikes: ['mine'] }, {})).toBe(false);
  });
  it('the parts the app put in by itself do not count', () => {
    expect(onlyExamples({ trips: ['ex-t'], items: ['ex-i', 'SL01'] }, left, ['SL01'])).toBe(true);
    expect(onlyExamples({ items: ['SL01', 'mine'] }, left, ['SL01'])).toBe(false);
  });
});
