// v0.101.0 Design-Refresh P2 (H1): the trip card's number boxes and the packing bar (fictional data).
import { describe, it, expect } from 'vitest';
import { timeLeft, packedOf, START_HOUR } from '../src/lib/home/heute.js';

describe('days and hours until the trip starts', () => {
  it('counts to the start hour of the first day', () => {
    const now = new Date(2026, 9, 10, 18, 0);
    expect(timeLeft({ startDate: '2026-10-16' }, now)).toEqual({ days: 5, hours: 14 });
    expect(timeLeft({ startDate: '2026-10-11' }, now)).toEqual({ days: 0, hours: 14 });
  });
  it('says nothing without a date or once the trip has started', () => {
    expect(timeLeft({}, new Date())).toBeNull();
    expect(timeLeft({ startDate: '2026-10-10' }, new Date(2026, 9, 10, 9, 0))).toBeNull();
  });
});

describe('how far packing is', () => {
  const items = { a: { name: 'Gas cartridge' }, b: { name: 'Lamp' }, c: { name: 'Tube' }, d: { name: 'Pump' } };
  it('counts the packed entries and names the first three still open', () => {
    const trip = { entries: [{ itemId: 'a' }, { itemId: 'b' }, { itemId: 'c', packed: true }, { itemId: 'd' }, { itemId: 'x' }] };
    expect(packedOf(trip, items)).toEqual({ packed: 1, of: 5, left: ['Gas cartridge', 'Lamp', 'Pump'] });
  });
  it('is empty for an empty list', () => {
    expect(packedOf({ entries: [] }, items)).toBeNull();
    expect(packedOf(null)).toBeNull();
  });
});
