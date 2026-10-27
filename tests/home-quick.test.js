// «Heute ruhiger» part 1 (Noah 26.10.2026 «1a», mockup H1): every small tile in one calm list «Schnell öffnen».
import { describe, it, expect } from 'vitest';
import { runsOf, inShownOrder } from '../src/lib/home/quick.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = (l) => l.map((x) => x.id);

describe('Heute ruhiger: the small tiles as one list (1a)', () => {
  it('keeps the wall order, the small tiles together where the first stands', () => {
    const r = runsOf([{ id: 'body', size: 'l' }, { id: 'fn:trip', size: 's' }, { id: 'week', size: 'l' }, { id: 'fn:note', size: 's' }]);
    expect(r.map((x) => x.key)).toEqual(['all', 'quick', 'all']);
    expect(ids(r[1].tiles)).toEqual(['fn:trip', 'fn:note']);
    expect(ids(r[2].tiles)).toEqual(['week']);
  });
  it('a wall without small tiles has no list', () => {
    const r = runsOf([{ id: 'body', size: 'l' }, { id: 'week', size: 'w' }]);
    expect(r.map((x) => x.key)).toEqual(['all']);
    expect(ids(r[0].tiles)).toEqual(['body', 'week']);
  });
  it('the shown order moves the small tiles up to the first one', () => {
    expect(ids(inShownOrder([{ id: 'a', size: 's' }, { id: 'b', size: 'l' }, { id: 'c', size: 's' }]))).toEqual(['a', 'c', 'b']);
    expect(runsOf()).toEqual([]);
  });
  it('the heading is German', () => {
    expect(DE['Open quickly']).toBe('Schnell öffnen');
  });
});
