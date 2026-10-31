import { describe, it, expect } from 'vitest';
import { gehoertDazu, PAGE_MOMENT, SHOWN, allHref } from '../src/lib/know/gehoert.js';
import { momentOfFeature } from '../src/lib/moment.js';

describe('«Belongs to …» on top of a page (PR 7)', () => {
  it('Pack is the first page; the row has at most 5 functions of the moment', () => {
    expect(PAGE_MOMENT.pack).toBe('packen');
    const r = gehoertDazu({ moment: 'packen', here: '#/pack' });
    expect(r.items.length).toBe(SHOWN);
    expect(r.total).toBeGreaterThan(SHOWN);
    for (const f of r.items) expect(momentOfFeature(f.id)).toBe('packen');
  });
  it('never used first, «Not for me» out', () => {
    const r = gehoertDazu({ moment: 'packen', here: '#/pack' });
    const used = new Set([r.items[0].id]);
    const r2 = gehoertDazu({ moment: 'packen', here: '#/pack', used });
    expect(r2.items.map((f) => f.id)).not.toContain(r.items[0].id);
    const r3 = gehoertDazu({ moment: 'packen', here: '#/pack', notForMe: { [r.items[0].id]: { why: '', at: '' } } });
    expect(r3.total).toBe(r.total - 1);
  });
  it('a function on the page itself is left out', () => {
    const all = gehoertDazu({ moment: 'packen', here: '#/nowhere' }).total;
    expect(gehoertDazu({ moment: 'packen', here: '#/pack' }).total).toBeLessThan(all);
  });
  it('Trips (planning) is the second page', () => {
    expect(PAGE_MOMENT.trips).toBe('planen');
    const r = gehoertDazu({ moment: 'planen', here: '#/trips' });
    expect(r.items.length).toBe(SHOWN);
    for (const f of r.items) expect(momentOfFeature(f.id)).toBe('planen');
  });
  it('«all n ›» opens the catalogue by moment', () => {
    expect(allHref('packen')).toBe('#/features?by=moment&moment=packen');
  });
});
