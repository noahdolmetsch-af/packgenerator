// Regeln der App (Noah 14.10.2026): «n more due: open the bike» opens the bike of the next due card
import { describe, it, expect } from 'vitest';
import { dueCards } from '../src/lib/care/overview.js';

const row = (key, kind = 'km') => ({ key, kind, name: key });
describe('dueCards: next', () => {
  it('names the bike of the first card that is not shown', () => {
    const a = { id: 'test_data_gtp_a' };
    const b = { id: 'test_data_gtp_b' };
    const d = dueCards([{ bike: a, care: { rows: [row('x', 'part'), row('y', 'part'), row('z', 'part')] } }, { bike: b, care: { rows: [row('w')] } }], 3);
    expect(d.total).toBe(4);
    expect(d.cards).toHaveLength(3);
    expect(d.next).toBe(b);
  });
  it('is null when every card shows', () => {
    expect(dueCards([{ bike: { id: 'test_data_gtp_a' }, care: { rows: [row('x')] } }], 3).next).toBe(null);
  });
});
