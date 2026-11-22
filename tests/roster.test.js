import { describe, it, expect } from 'vitest';
import { deadlineSetting, deadlineState, deadlineWord, daysBetween, rosterOf, rosterText } from '../src/lib/booking/roster.js';

const tr = (s, p = {}) => s.replace(/\{(\w+)\}/g, (a, k) => (k in p ? p[k] : a));
const offer = {
  id: 'o1',
  title: 'Group lesson',
  types: [{ key: 'group', label: 'Group', places: 4 }, { key: 'solo', label: 'Single', places: 1 }],
  slots: [
    { id: 's2', at: '2026-11-12T17:00', type: 'group' },
    { id: 's1', at: '2026-11-10T17:00', type: 'group' },
    { id: 's3', at: '2026-11-13T09:00', type: 'solo' },
    { id: 's0', at: '2026-11-01T17:00', type: 'group' },
  ],
};
const b = (id, slot, name, status = 'confirmed') => ({ id, slot, name, status });
const bookings = [b('1', 's1', 'Mia'), b('2', 's1', 'Ben'), b('3', 's1', 'Cleo', 'requested'), b('4', 's1', 'Dan', 'declined'), b('5', 's0', 'Old'), b('6', 's3', 'Eve')];
const waitlist = [{ id: 'w1', offer: 'o1', slot: 's3', name: 'Finn' }, { id: 'w2', offer: 'other', slot: 's3', name: 'Zoe' }, { id: 'w3', offer: 'o1', slot: 's2', name: 'Gus' }];

describe('Teilnehmerliste', () => {
  it('lists only coming times with people or a waiting list, by time, with free places', () => {
    const rows = rosterOf(offer, bookings, waitlist, '2026-11-09T12:00');
    expect(rows.map((r) => r.slot.id)).toEqual(['s1', 's2', 's3']);
    const s1 = rows[0];
    expect(s1.names).toEqual(['Mia', 'Ben']);
    expect(s1.free).toBe(2);
    expect(s1.asking).toBe(1);
    expect(rows[1]).toMatchObject({ names: [], free: 4, waiting: ['Gus'] });
    expect(rows[2]).toMatchObject({ names: ['Eve'], free: 0, waiting: ['Finn'] });
  });
  it('a time that is over is left out, and an empty offer has no rows', () => {
    expect(rosterOf(offer, bookings, [], '2026-11-13T10:00')).toEqual([]);
    expect(rosterOf({ ...offer, slots: [] }, bookings, waitlist, '')).toEqual([]);
  });
  it('the text has names only, the deadline and the waiting list', () => {
    const rows = rosterOf(offer, bookings, waitlist, '2026-11-09T12:00');
    const text = rosterText({ title: 'Group lesson', deadline: '2026-11-09', rows }, tr, (at) => at, (d) => d);
    expect(text.split('\n')).toEqual([
      'Participant list: Group lesson',
      'Register by 2026-11-09',
      '',
      '2026-11-10T17:00 · 2 of 4 · 2 free',
      '1. Mia',
      '2. Ben',
      '',
      '2026-11-12T17:00 · 0 of 4 · 4 free',
      'Waiting list: Gus',
      '',
      '2026-11-13T09:00 · 1 of 1',
      '1. Eve',
      'Waiting list: Finn',
    ]);
    expect(rosterText({ title: 'T', rows: [] }, tr)).toBe('Participant list: T');
  });
  it('the deadline: only valid days are kept, and the state counts calendar days', () => {
    expect(deadlineSetting({ a: '2026-11-09', b: '9.11.', c: 5, d: null })).toEqual({ a: '2026-11-09' });
    expect(deadlineSetting([1, 2])).toEqual({});
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(deadlineState('', '2026-11-09')).toBeNull();
    expect(deadlineState('2026-11-12', '2026-11-09')).toEqual({ state: 'open', days: 3 });
    expect(deadlineState('2026-11-09', '2026-11-09')).toEqual({ state: 'today', days: 0 });
    expect(deadlineState('2026-11-07', '2026-11-09')).toEqual({ state: 'over', days: 2 });
    expect(deadlineWord({ state: 'open', days: 1 }, tr)).toBe('{n} day left'.replace('{n}', 1));
    expect(deadlineWord({ state: 'over', days: 2 }, tr)).toBe('Over since 2 days');
  });
});
