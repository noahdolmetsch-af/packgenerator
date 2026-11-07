// Warteliste (Noah 04.11.2026 «7a»)
import { describe, it, expect } from 'vitest';
import { waitingFree } from '../src/lib/booking/model.js';

const offer = { id: 'o1', types: [{ key: 'g', label: 'Group', places: 2, price: 2500 }], slots: [{ id: 's1', at: '2026-11-10T18:00', type: 'g' }, { id: 's2', at: '2026-11-03T18:00', type: 'g' }] };
const w = (name, slot, offerId = 'o1') => ({ id: name, offer: offerId, slot, name, contact: '', addedAt: '2026-11-01' });

describe('waiting list', () => {
  it('shows nobody while the time is full', () => {
    const full = [{ id: 'a', slot: 's1' }, { id: 'b', slot: 's1' }];
    expect(waitingFree([w('Mia', 's1')], offer, full, '2026-11-05T10:00')).toEqual([]);
  });
  it('shows the people of a time with a free place, in the order they came', () => {
    const one = [{ id: 'a', slot: 's1' }, { id: 'b', slot: 's1', status: 'declined' }];
    const out = waitingFree([w('Mia', 's1'), w('Leo', 's1')], offer, one, '2026-11-05T10:00');
    expect(out.map((x) => x.w.name)).toEqual(['Mia', 'Leo']);
    expect(out[0].slot.id).toBe('s1');
  });
  it('skips times in the past and other offers', () => {
    expect(waitingFree([w('Mia', 's2'), w('Leo', 's1', 'other')], offer, [], '2026-11-05T10:00')).toEqual([]);
  });
});
