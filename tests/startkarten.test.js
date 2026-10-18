// Start-Karten ST1/ST2 (Noah 14.10.2026 «1a 2a 3b»): the card on Today instead of the jump
import { describe, it, expect } from 'vitest';
import { startCard, rideSeen } from '../src/lib/home/startkarten.js';

const T = '2026-10-09';
const trip = (extra = {}) => ({ id: 'test_data_gtp_runde', title: 'test_data_gtp_ Runde', startDate: '2026-10-08', days: 2, ...extra });
describe('startCard', () => {
  it('a trip day: «Heute unterwegs» with the day, until On the way was opened today (3b)', () => {
    expect(startCard({ ride: trip(), today: T })).toMatchObject({ kind: 'ride', day: 2, days: 2 });
    expect(startCard({ ride: trip(), seen: rideSeen('test_data_gtp_runde', T), today: T })).toBe(null);
    expect(startCard({ ride: trip(), seen: rideSeen('test_data_gtp_runde', '2026-10-08'), today: T })).toMatchObject({ kind: 'ride' });
  });
  it('the last evening wins and stays (2a)', () => {
    const tr = trip();
    expect(startCard({ ride: tr, evening: tr, seen: rideSeen(tr.id, T), today: T })).toMatchObject({ kind: 'evening', trip: tr });
  });
  it('nothing without a trip', () => {
    expect(startCard({ today: T })).toBe(null);
  });
});
