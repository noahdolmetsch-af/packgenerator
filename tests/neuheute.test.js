// «Neu heute» (Träume und Neuland N11): what was reached for the first time since yesterday. Fictional data only.
import { describe, it, expect } from 'vitest';
import { dayBefore, rodeSince, newSince } from '../src/lib/neuland/neuheute.js';

const P = 'test_data_gtp_';
const result = {
  collections: [
    { id: 'municipalities', on: true, visited: new Map([['m1', { day: '2026-10-27' }], ['m2', { day: '2026-10-26' }], ['m3', { day: '2026-09-01' }]]) },
    { id: 'lakes', on: true, visited: new Map([['l1', { day: '2026-10-27' }]]) },
    { id: 'passes', on: false, visited: new Map([['p1', { day: '2026-10-27' }]]) },
    { id: 'u-cafes', on: true, name: `${P}Cafés`, visited: new Map([['c1', { day: '2026-10-27' }]]) },
  ],
};

describe('Neu heute (N11)', () => {
  it('the day before, across a month', () => {
    expect(dayBefore('2026-11-01')).toBe('2026-10-31');
  });
  it('rode since yesterday: only trips, rides and activities with a place', () => {
    const raw = { trips: [{ id: 't', startDate: '2026-10-26', place: { lat: 47.3, lon: 8.5 } }], rides: [], activities: [] };
    expect(rodeSince(raw, '2026-10-26', '2026-10-27')).toBe(true);
    expect(rodeSince(raw, '2026-10-27', '2026-10-27')).toBe(false);
    expect(rodeSince({ trips: [{ id: 'x', startDate: '2026-10-27' }] }, '2026-10-26', '2026-10-27')).toBe(false);
  });
  it('lists what is new since a day, switched-on collections only', () => {
    const r = newSince(result, '2026-10-26');
    expect(r.n).toBe(4);
    expect(r.parts.map((p) => [p.cid, p.n])).toEqual([['municipalities', 2], ['lakes', 1], ['u-cafes', 1]]);
    expect(r.text).toBe(`New since yesterday: 2 municipalities, 1 lake, 1 × ${P}Cafés`);
    expect(r.key).toBe('lakes:l1|municipalities:m1|municipalities:m2|u-cafes:c1');
    expect(newSince(result, '2026-10-28')).toMatchObject({ n: 0, text: '', key: '' });
  });
});
