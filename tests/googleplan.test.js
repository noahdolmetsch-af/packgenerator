// Google Kalender und Aufgaben (GA): the pure helpers of api/_lib/googleplan.js. Fictional entries only.
import { describe, it, expect } from 'vitest';
import { zurichOffset, dayStart, dayEnd, spanOf, eventRow, eventBody, plainNote, remindOf, taskRow, taskBody, isDay } from '../api/_lib/googleplan.js';

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

describe('the appointment editor: description, reminders, availability, visibility, time zone', () => {
  it('reads the description as plain text and the reminders as a list', () => {
    expect(plainNote('Mit <b>Helm</b><br>und Licht &amp; Pumpe')).toBe('Mit Helm\nund Licht & Pumpe');
    expect(remindOf({ useDefault: true })).toBeNull();
    expect(remindOf({ useDefault: false, overrides: [{ method: 'popup', minutes: 1440 }, { method: 'sms', minutes: 5 }] })).toEqual([{ minutes: 1440, method: 'popup' }]);
    const row = eventRow({ id: 'r', summary: 'Wiederholt', recurringEventId: 'x', visibility: 'private', start: { dateTime: '2026-10-29T18:30:00+01:00', timeZone: 'Europe/Zurich' }, end: { dateTime: '2026-10-29T19:30:00+01:00' }, reminders: { useDefault: false, overrides: [{ method: 'email', minutes: 60 }] } }, 'c');
    expect(row).toMatchObject({ repeat: true, visibility: 'private', tz: 'Europe/Zurich', remind: [{ minutes: 60, method: 'email' }] });
  });
  it('writes what the editor sends, and refuses wrong values', () => {
    const b = eventBody({ title: 'Lauf', day: '2026-10-20', allDay: false, from: '07:00', to: '08:00', tz: 'America/New_York', busy: false, visibility: 'private', note: 'Treffpunkt', remind: [{ minutes: 60, method: 'popup' }, 1440] });
    expect(b).toMatchObject({ transparency: 'transparent', visibility: 'private', description: 'Treffpunkt', start: { dateTime: '2026-10-20T07:00:00', timeZone: 'America/New_York' }, reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }, { method: 'popup', minutes: 1440 }] } });
    expect(eventBody({ title: 'x', day: '2026-10-20', remind: null }).reminders).toEqual({ useDefault: true });
    expect(eventBody({ title: 'x', day: '2026-10-20', remind: [] }).reminders).toEqual({ useDefault: false, overrides: [] });
    expect(eventBody({ title: 'x', day: '2026-10-20' }).reminders).toBeUndefined();
    expect(() => eventBody({ title: 'x', day: '2026-10-20', remind: [{ minutes: 99999 }] })).toThrow('remind');
    expect(() => eventBody({ title: 'x', day: '2026-10-20', visibility: 'secret' })).toThrow('visibility');
    expect(() => eventBody({ title: 'x', day: '2026-10-20', allDay: false, from: '07:00', tz: 'Mars/Base' })).toThrow('tz');
  });
});
