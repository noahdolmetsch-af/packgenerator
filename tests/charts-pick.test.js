// «Diagramme zum Antippen» (Noah 27.10.2026 «1-5 a»): which column a finger or the keyboard points at,
// and what is behind a tapped bar of «Haken ausgewertet».
import { describe, it, expect } from 'vitest';
import { indexAt, stepKey, diffText } from '../src/lib/charts/pick.js';
import { inSlot, actCounts, daysWith } from '../src/lib/flow/auswertung.js';

describe('indexAt', () => {
  const rect = { left: 100, width: 200 };
  it('finds the column under the pointer', () => {
    expect(indexAt(100, rect, 4)).toBe(0);
    expect(indexAt(149, rect, 4)).toBe(0);
    expect(indexAt(150, rect, 4)).toBe(1);
    expect(indexAt(300, rect, 4)).toBe(3);
  });
  it('is null outside the plot or without columns', () => {
    expect(indexAt(99, rect, 4)).toBe(null);
    expect(indexAt(301, rect, 4)).toBe(null);
    expect(indexAt(150, rect, 0)).toBe(null);
    expect(indexAt(150, null, 4)).toBe(null);
  });
});

describe('stepKey', () => {
  it('moves one, seven, to the ends, and stays inside', () => {
    expect(stepKey('ArrowLeft', null, 10)).toBe(9);
    expect(stepKey('ArrowRight', null, 10)).toBe(0);
    expect(stepKey('ArrowLeft', 0, 10)).toBe(0);
    expect(stepKey('ArrowRight', 9, 10)).toBe(9);
    expect(stepKey('PageUp', 9, 10)).toBe(2);
    expect(stepKey('PageDown', 5, 10)).toBe(9);
    expect(stepKey('Home', 5, 10)).toBe(0);
    expect(stepKey('End', 5, 10)).toBe(9);
    expect(stepKey('a', 5, 10)).toBe(null);
  });
});

describe('diffText', () => {
  it('writes the difference with its sign', () => {
    expect(diffText(17, 14)).toBe('+3');
    expect(diffText(12, 14)).toBe('−2');
    expect(diffText(5, 5)).toBe('±0');
    expect(diffText(5, undefined)).toBe('');
  });
});

describe('behind a bar', () => {
  const list = [
    { actId: 'yoga', day: '2026-10-05', at: '2026-10-05T07:10:00' }, // Monday morning
    { actId: 'velo', day: '2026-10-05', at: '2026-10-05T18:30:00' },
    { actId: 'yoga', day: '2026-10-06', at: '2026-10-06T07:40:00' },
    { actId: 'velo', day: '2026-10-11', at: '2026-10-11T08:00:00', via: 'trip' },
  ];
  it('finds the ticks of a weekday and of a time of day', () => {
    expect(inSlot(list, 'days', 0).length).toBe(2);
    expect(inSlot(list, 'days', 6).length).toBe(1);
    expect(inSlot(list, 'hours', 2).map((e) => e.actId)).toEqual(['yoga', 'yoga']); // 06–09, the trip left out
  });
  it('counts the activities, most first', () => {
    expect(actCounts(list)).toEqual([
      { actId: 'velo', n: 2 },
      { actId: 'yoga', n: 2 },
    ]);
  });
  it('gives every day of a week, also the empty ones', () => {
    const w = daysWith(list, '2026-10-05', '2026-10-11');
    expect(w.map((d) => d.es.length)).toEqual([2, 1, 0, 0, 0, 0, 1]);
    expect(w[0].es.map((e) => e.actId)).toEqual(['yoga', 'velo']);
  });
});
