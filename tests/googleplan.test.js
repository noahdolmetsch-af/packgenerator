// Google Kalender und Aufgaben (GA): the pure helpers of api/_lib/googleplan.js. Fictional entries only.
import { describe, it, expect } from 'vitest';
import { zurichOffset, dayStart, dayEnd, spanOf, eventRow, eventBody, taskRow, taskBody, isDay } from '../api/_lib/googleplan.js';

describe('days in Zurich', () => {
  it('knows summer and winter time', () => {
    expect(zurichOffset('2026-07-01')).toBe('+02:00');
    expect(zurichOffset('2026-12-01')).toBe('+01:00');
    expect(dayStart('2026-10-25')).toBe('2026-10-25T00:00:00+02:00');
    expect(dayEnd('2026-10-25')).toBe('2026-10-26T00:00:00+01:00');
  });
  it('counts days and refuses wrong ones', () => {
    expect(spanOf('2026-10-12', '2026-10-18')).toBe(7);
    expect(spanOf('2026-10-18', '2026-10-12')).toBe(0);
    expect(isDay('2026-02-30')).toBe(false);
  });
});

describe('events', () => {
  it('a late event belongs to its day in Zurich; an all-day event keeps its last day', () => {
    const late = eventRow({ id: 'a', summary: ' Nachtfahrt ', start: { dateTime: '2026-10-16T22:30:00Z' }, end: { dateTime: '2026-10-16T23:30:00Z' } }, 'primary');
    expect(late).toMatchObject({ id: 'primary|a', title: 'Nachtfahrt', day: '2026-10-17', lastDay: '2026-10-17', allDay: false, busy: true });
    expect(eventRow({ id: 'b', start: { date: '2026-10-17' }, end: { date: '2026-10-18' }, transparency: 'transparent' }, 'c')).toMatchObject({ day: '2026-10-17', lastDay: '2026-10-17', title: '(ohne Titel)', busy: false });
    expect(eventRow({ id: 'c', status: 'cancelled', start: { date: '2026-10-17' } }, 'c')).toBeNull();
  });
  it('builds what Google expects', () => {
    expect(eventBody({ title: 'Velo-Service', day: '2026-10-20' })).toEqual({ summary: 'Velo-Service', start: { date: '2026-10-20' }, end: { date: '2026-10-21' } });
    expect(eventBody({ title: 'Lauf', day: '2026-10-20', allDay: false, from: '07:00' }).end).toEqual({ dateTime: '2026-10-20T08:00:00', timeZone: 'Europe/Zurich' });
    expect(() => eventBody({ title: 'x', day: '20.10.2026' })).toThrow('day');
    expect(() => eventBody({ title: ' ', day: '2026-10-20' })).toThrow('title');
  });
});

describe('tasks', () => {
  it('keeps the day of «due» and «done»', () => {
    expect(taskRow({ id: 't', title: 'Kette messen', due: '2026-10-14T00:00:00.000Z', status: 'completed', completed: '2026-10-14T18:00:00Z' }, 'l')).toMatchObject({ due: '2026-10-14', done: true, list: 'l' });
    expect(taskRow({ id: 't', deleted: true }, 'l')).toBeNull();
  });
  it('sends only what changed', () => {
    expect(taskBody({ done: false })).toEqual({ status: 'needsAction', completed: null });
    expect(taskBody({ due: null })).toEqual({ due: null });
    expect(() => taskBody({ title: '' })).toThrow('title');
  });
});
