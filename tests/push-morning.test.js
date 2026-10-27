// Idee A1 «Eine Nachricht am Morgen» (Noah 27.10.2026 «3a»): the 08:00 reminders of a day as one message at 07:00.
// Fictional data only. Times on the device's own clock (atMs), days on the calendar.
import { describe, it, expect } from 'vitest';
import { buildList, KINDS, atMs, pushOf } from '../src/lib/push/schedule.js';
import { bundleMorning, MORNING_AT, MORNING_LINES, morningOn } from '../src/lib/push/morning.js';
import de from '../src/lib/i18n/de/index.js';

const now = new Date(2026, 9, 20, 10, 0); // Tuesday 20 Oct 2026, 10:00
const kinds = Object.fromEntries(KINDS.map((k) => [k.key, true]));
const trip = (id, start, extra = {}) => ({ id, title: `Testtour ${id}`, status: 'planned', startDate: start, ...extra });
const base = (over = {}) => ({ trips: [], repairs: [], bikes: [], settings: { push: { on: true, kinds } }, lastBackup: null, now, ...over });
const texts = { title: 'Your morning', trip: 'Today: {trip}', event: 'Appointment: {what}', more: 'and {n} more in the app' };
const it8 = (key, day, body = key) => ({ key, at: atMs(day, '08:00'), title: key, body, url: '#/' });

describe('the morning message', () => {
  it('is on unless switched off, and the switch is kept', () => {
    expect(morningOn(undefined)).toBe(true);
    expect(morningOn({ morning: false })).toBe(false);
    expect(pushOf({}).morning).toBe(true);
    expect(pushOf({ morning: false }).morning).toBe(false);
  });

  it('bundles the 08:00 reminders of a day at 07:00; safety and other times stay single', () => {
    const items = [
      it8('wear:bike1:chain', '2026-10-22', 'Testvelo: chain'),
      it8('lend:l1:2026-10-22', '2026-10-22', 'Testperson brings it back'),
      it8('ice:2026-10-22', '2026-10-22'), // safety: never bundled
      { key: 'eve:a:2026-10-23', at: atMs('2026-10-22', '19:00'), title: 'Evening', body: 'eve', url: '#/' },
    ];
    const out = bundleMorning(items, { ms: now.getTime(), atMs, texts });
    expect(out.map((i) => i.key)).toEqual(['morning:2026-10-22', 'ice:2026-10-22', 'eve:a:2026-10-23']);
    const m = out[0];
    expect(m.at).toBe(atMs('2026-10-22', MORNING_AT));
    expect(m.body).toBe('Testvelo: chain\nTestperson brings it back');
    expect(m.bundled).toEqual(['wear:bike1:chain', 'lend:l1:2026-10-22']);
    expect(m.url).toBe('#/');
  });

  it('starts with the trip and the first two appointments, at most 4 lines and the rest counted', () => {
    const items = ['a', 'b', 'c'].map((x) => it8(`supply:${x}`, '2026-10-23', `Vorrat ${x}`));
    const events = [
      { day: '2026-10-23', title: 'Ganztag', allDay: true, start: '2026-10-23' },
      { day: '2026-10-23', title: 'Zahnarzt', allDay: false, start: new Date(2026, 9, 23, 10, 0).toISOString() },
      { day: '2026-10-23', title: 'Dritter', allDay: false, start: new Date(2026, 9, 23, 15, 0).toISOString() },
      { day: '2026-10-24', title: 'Anderer Tag', allDay: true, start: '2026-10-24' },
    ];
    const out = bundleMorning(items, { ms: now.getTime(), atMs, texts, trips: [trip('a', '2026-10-23')], events });
    expect(out).toHaveLength(1);
    expect(out[0].body.split('\n')).toEqual(['Today: Testtour a', 'Appointment: Ganztag', 'Appointment: 10:00 Zahnarzt', 'Vorrat a', 'and 2 more in the app']);
    expect(MORNING_LINES).toBe(4);
  });

  it('a trip or an appointment alone sends nothing; a morning already past leaves today single', () => {
    expect(bundleMorning([], { ms: now.getTime(), atMs, texts, trips: [trip('a', '2026-10-23')], events: [{ day: '2026-10-23', title: 'X', allDay: true }] })).toEqual([]);
    const late = new Date(2026, 9, 22, 7, 30).getTime();
    const out = bundleMorning([it8('wear:x', '2026-10-22')], { ms: late, atMs, texts });
    expect(out.map((i) => i.key)).toEqual(['wear:x']);
  });

  it('buildList bundles by default and keeps them single when switched off', () => {
    const items = [{ id: 's1', name: 'Testgel', expires: '2026-11-05', ownership: 'own' }]; // 14 days before: 22 Oct, 08:00
    const on = buildList(base({ items }));
    expect(on.items.map((i) => i.key)).toContain('morning:2026-10-22');
    expect(on.items.map((i) => i.key)).not.toContain('supply:s1:2026-11-05');
    const off = buildList(base({ items, settings: { push: { on: true, kinds, morning: false } } }));
    expect(off.items.map((i) => i.key)).toContain('supply:s1:2026-11-05');
    expect(off.items.map((i) => i.key)).not.toContain('morning:2026-10-22');
  });

  it('has German for its words', () => {
    for (const k of ['Your morning', 'Today: {trip}', 'Appointment: {what}', 'and {n} more in the app', 'In the morning', 'One message in the morning']) expect(de[k], k).toBeTruthy();
  });
});
