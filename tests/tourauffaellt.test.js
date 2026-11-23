// «Das fällt auf» nach der Tour (Plan «ganze App», Schritt 7b): one sentence, only after the debrief is saved. Fictional data.
import { describe, it, expect } from 'vitest';
import { tourAuffaellt, KM_GAP, UNUSED_MIN } from '../src/lib/tourpfad/auffaellt.js';

const trip = (extra = {}) => ({ id: 't1', title: 'Jura', route: { km: 300 }, entries: [{ itemId: 'a', qty: 1 }, { itemId: 'b', qty: 1 }, { itemId: 'c', qty: 2 }, { itemId: 'd', qty: 1 }], ...extra });
const done = (extra = {}) => ({ tripId: 't1', status: 'done', items: {}, missing: [], ...extra });
const items = [{ id: 'a', weightG: 500 }, { id: 'b', weightG: 300 }, { id: 'c', weightG: 100 }, { id: 'd' }];

describe('tourAuffaellt', () => {
  it('says nothing without a tour or before the debrief is saved', () => {
    expect(tourAuffaellt()).toBeNull();
    expect(tourAuffaellt({ trip: trip(), debrief: null })).toBeNull();
    expect(tourAuffaellt({ trip: trip(), debrief: done({ status: 'draft', km: 100 }) })).toBeNull();
  });
  it('says nothing when nothing stands out', () => {
    expect(tourAuffaellt({ trip: trip(), debrief: done({ km: 290 }), items })).toBeNull();
  });
  it('names a gap of 15 % or more between plan and ridden km', () => {
    const hit = tourAuffaellt({ trip: trip(), debrief: done({ km: 240 }), items });
    expect(hit.key).toBe('km');
    expect(hit.text).toContain('240');
    expect(hit.text).toContain('300');
    expect(hit.text).toContain('20 %');
    expect(KM_GAP).toBe(0.15);
    // exactly 15 % counts, 14 % does not
    expect(tourAuffaellt({ trip: trip(), debrief: done({ km: 255 }) })?.key).toBe('km');
    expect(tourAuffaellt({ trip: trip(), debrief: done({ km: 258 }) })).toBeNull();
  });
  it('prefers the matched rides to the km of the debrief', () => {
    const rides = [{ tripId: 't1', km: 150 }, { tripId: 't1', km: 120 }, { tripId: 'other', km: 999 }];
    expect(tourAuffaellt({ trip: trip(), debrief: done({ km: 100 }), rides })).toBeNull(); // 270 km against 300: 10 %
  });
  it('names three or more unused things, with the weight where it is known', () => {
    const d = done({ items: { a: 'unused', b: 'unused', c: 'unused' } });
    const hit = tourAuffaellt({ trip: trip(), debrief: d, items });
    expect(hit.key).toBe('unused');
    expect(hit.text).toContain('3');
    expect(hit.text).toContain('1');
    expect(UNUSED_MIN).toBe(3);
    expect(tourAuffaellt({ trip: trip(), debrief: done({ items: { a: 'unused', b: 'unused' } }), items })).toBeNull();
  });
  it('names what was missing, at most three', () => {
    const d = done({ missing: [{ name: 'Pumpe' }, { name: 'Lampe' }, { name: 'Handschuhe' }, { name: 'Mütze' }] });
    const hit = tourAuffaellt({ trip: trip(), debrief: d, items });
    expect(hit.key).toBe('missing');
    expect(hit.text).toContain('Pumpe, Lampe, Handschuhe');
    expect(hit.text).not.toContain('Mütze');
  });
  it('takes the km rule first, then unused, then missing', () => {
    const d = done({ km: 100, items: { a: 'unused', b: 'unused', c: 'unused' }, missing: [{ name: 'Pumpe' }] });
    expect(tourAuffaellt({ trip: trip(), debrief: d, items }).key).toBe('km');
    expect(tourAuffaellt({ trip: trip({ route: null }), debrief: d, items }).key).toBe('unused');
  });
});
