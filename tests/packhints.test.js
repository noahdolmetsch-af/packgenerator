import { describe, it, expect } from 'vitest';
import { packBadges, ballast, leaveAtHome, keepOnTrip } from '../src/lib/packhints.js';

const items = [
  { id: 'OB01', name: 'Zip-off trousers', category: 'offbike', weightG: 300, ownership: 'owned' },
  { id: 'LX01', name: 'Seat mat', category: 'lux', weightG: 60, ownership: 'owned' },
  { id: 'KL15', name: 'Buff', category: 'onbike', weightG: 30, ownership: 'owned' },
  { id: 'TA01', name: 'Tailfin', category: 'bags', weightG: 900, ownership: 'owned' },
  { id: 'WZ19', name: 'Brake pads', category: 'tools', weightG: null, ownership: 'owned' },
];
const on = (...ids) => ids.map((itemId) => ({ itemId, slot: 'seat', qty: 1 }));
const trips = [
  { id: 'a', title: 'Trip A', startDate: '2026-05-01', entries: on('OB01', 'LX01', 'KL15', 'TA01', 'WZ19') },
  { id: 'b', title: 'Trip B', startDate: '2026-06-01', entries: on('OB01', 'LX01', 'KL15', 'TA01', 'WZ19') },
  { id: 'c', title: 'Trip C', startDate: '2026-07-01', entries: on('OB01', 'KL15', 'TA01', 'WZ19') },
  { id: 'now', title: 'Next', startDate: '2026-10-15', entries: on('OB01', 'LX01', 'KL15', 'TA01', 'WZ19') },
];
const debriefs = [
  { tripId: 'a', status: 'done', items: { OB01: 'unused', LX01: 'unused', TA01: 'unused', WZ19: 'unused' } },
  { tripId: 'b', status: 'done', items: { OB01: 'unused', LX01: 'unused', KL15: 'broken', TA01: 'unused', WZ19: 'unused' } },
  { tripId: 'c', status: 'done', items: { OB01: 'unused', WZ19: 'unused' }, missing: [{ name: 'Buff', itemId: 'KL15' }] },
  { tripId: 'now', status: 'draft', items: {} },
];
const now = trips.at(-1);

describe('ballast card', () => {
  it('lists what was not used the last times, heaviest first, without bags', () => {
    const b = ballast(now, items, trips, debriefs);
    expect(b.rows.map((r) => [r.itemId, r.n])).toEqual([['OB01', 3], ['LX01', 2], ['WZ19', 3]]);
    expect(b.totalG).toBe(360);
    expect(b.unweighed).toBe(1);
    expect(b.rows[0].titles).toEqual(['Trip C', 'Trip B', 'Trip A']);
  });

  it('a use in between ends the streak', () => {
    const d = debriefs.map((x) => (x.tripId === 'b' ? { ...x, items: { ...x.items, LX01: 'used' } } : x));
    expect(ballast(now, items, trips, d).rows.map((r) => r.itemId)).not.toContain('LX01');
  });

  it('Leave at home takes the items off, Keep stops asking', () => {
    expect(leaveAtHome(now, ['OB01', 'LX01']).entries.map((e) => e.itemId)).toEqual(['KL15', 'TA01', 'WZ19']);
    const kept = { ...now, ...keepOnTrip(now, 'OB01') };
    expect(ballast(kept, items, trips, debriefs).rows.map((r) => r.itemId)).toEqual(['LX01', 'WZ19']);
  });

  it('nothing without debriefs', () => {
    expect(ballast(now, items, trips, []).rows).toEqual([]);
  });
});

describe('badges', () => {
  it('gives short labels with the sentence behind them', () => {
    const tips = { LX01: { rule: 'Only on trips with a camp.' } };
    const b = packBadges(now, trips, debriefs, tips);
    expect(b.OB01.map((x) => x.label)).toEqual(['3× not used']);
    expect(b.KL15.map((x) => x.label)).toEqual(['Missed last time']);
    expect(b.LX01.map((x) => x.label)).toEqual(['2× not used', 'Tip']);
    expect(b.LX01[1].text).toBe('Only on trips with a camp.');
  });

  it('says when an item broke the last time it came along', () => {
    const t = trips.filter((x) => x.id !== 'c');
    expect(packBadges(now, t, debriefs).KL15.map((x) => x.key)).toEqual(['broke']);
  });
});
