import { describe, it, expect } from 'vitest';
import { eveningRows, laterDay, EVENING_MIN } from '../src/lib/tag/abend.js';

const TODAY = '2026-11-25';
const shift = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const E = [
  { id: 'wi1', kind: 'todo', title: 'Reifen', time: '', own: true, done: false },
  { id: 'wi2', kind: 'date', title: 'Zahnarzt', time: '14:30', mins: 45, own: true, done: false },
  { id: 'wi3', kind: 'todo', title: 'Fertig', time: '', own: true, done: true },
  { id: 'wi4', kind: 'date', title: 'Kino', time: '20:00', mins: 120, own: true, done: false },
  { id: 'tr:tp-1', kind: 'sport', title: 'Intervalle', time: '', done: false },
  { id: 'tr:sug-1', kind: 'sport', title: 'Vorschlag', time: '', done: false },
  { id: 'cal:g:1', kind: 'date', title: 'Fremd', time: '15:00', done: false },
  { id: 'fx:1', kind: 'sport', title: 'Fest und getan', time: '', done: true },
];
const isOwn = (e) => !!e.own;

describe('eveningRows', () => {
  it('stays silent before 18:00 today and on later days', () => {
    expect(eveningRows(E, { day: TODAY, today: TODAY, now: EVENING_MIN - 1, isOwn })).toEqual([]);
    expect(eveningRows(E, { day: shift(TODAY, 1), today: TODAY, now: 23 * 60, isOwn })).toEqual([]);
  });
  it('lists open own points and plan sessions in the evening; not done ones, suggestions, others or what has not begun', () => {
    const ids = eveningRows(E, { day: TODAY, today: TODAY, now: 19 * 60, isOwn }).map((r) => r.e.id);
    expect(ids).toEqual(['wi1', 'wi2', 'tr:tp-1']);
    expect(eveningRows(E, { day: TODAY, today: TODAY, now: 19 * 60, isOwn }).map((r) => r.own)).toEqual([true, true, false]);
  });
  it('a timed point counts when it is over: the cinema at 20:00 until 22:00', () => {
    expect(eveningRows(E, { day: TODAY, today: TODAY, now: 21 * 60, isOwn }).some((r) => r.e.id === 'wi4')).toBe(false);
    expect(eveningRows(E, { day: TODAY, today: TODAY, now: 22 * 60, isOwn }).some((r) => r.e.id === 'wi4')).toBe(true);
  });
  it('an earlier day lists its open points at any hour', () => {
    expect(eveningRows(E, { day: shift(TODAY, -1), today: TODAY, now: 8 * 60, isOwn }).map((r) => r.e.id)).toEqual(['wi1', 'wi2', 'wi4', 'tr:tp-1']);
  });
});

describe('laterDay', () => {
  it('tomorrow from today, today from an earlier day', () => {
    expect(laterDay(TODAY, TODAY, shift)).toBe(shift(TODAY, 1));
    expect(laterDay(shift(TODAY, -2), TODAY, shift)).toBe(TODAY);
  });
});
