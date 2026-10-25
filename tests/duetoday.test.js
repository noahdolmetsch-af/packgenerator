// «Alltag sichtbar» (Noah 24.10.2026 «1a»): «Heute fällig» on Heute shows only what is really due today.
import { describe, it, expect } from 'vitest';
import { dueToday } from '../src/lib/home/duetoday.js';

const today = '2026-10-24';
const todo = (id, due, extra = {}) => ({ id, text: `Aufgabe ${id}`, due, created: `2026-10-0${id}T08:00:00Z`, doneAt: null, ...extra });

describe('Heute fällig', () => {
  it('is empty when nothing is due', () => {
    expect(dueToday({ todos: [todo(1, '2026-10-30'), todo(2, null)], today, care: 0 })).toEqual([]);
  });

  it('counts late and today to-dos together, names a single one, and skips done or switched off ones', () => {
    const one = dueToday({ todos: [todo(1, '2026-10-20'), todo(2, '2026-10-24', { doneAt: '2026-10-24T07:00:00Z' }), todo(3, '2026-10-24', { off: true })], today });
    expect(one).toEqual([{ key: 'todo', kind: 'todo', n: 1, name: 'Aufgabe 1', href: '#/calendar' }]);
    const two = dueToday({ todos: [todo(1, '2026-10-20'), todo(2, '2026-10-24')], today });
    expect(two[0]).toMatchObject({ kind: 'todo', n: 2, name: null });
  });

  it('shows a birthday only on the day, plants when watering is due, and bike care with its count', () => {
    const todos = [
      { id: 'b1', kind: 'birthday', text: 'Mia', bday: { md: '10-24', year: 1990 }, created: '2026-01-01', doneAt: null },
      { id: 'b2', kind: 'birthday', text: 'Leo', bday: { md: '10-25', year: 1990 }, created: '2026-01-01', doneAt: null },
      { id: 'p1', kind: 'plant', text: 'Basilikum', plant: { every: 3, last: '2026-10-20' }, created: '2026-01-01', doneAt: null },
      { id: 'p2', kind: 'plant', text: 'Kaktus', plant: { every: 14, last: '2026-10-20' }, created: '2026-01-01', doneAt: null },
    ];
    expect(dueToday({ todos, today, care: 2 })).toEqual([
      { key: 'bday:b1', kind: 'birthday', n: 1, name: 'Mia', href: '#/calendar' },
      { key: 'plant', kind: 'plant', n: 1, name: 'Basilikum', href: '#/calendar' },
      { key: 'care', kind: 'care', n: 2, href: '#/bikes?tab=care' },
    ]);
  });
});
