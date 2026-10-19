// Package G: .ics in and out (#84, #163), a full sport bag counts as movement (#222). Fictional data only.
import { describe, it, expect } from 'vitest';
import { tripsIcs, parseIcs, PACK_ALARM } from '../src/lib/icsio.js';
import { packedDays, seedBags } from '../src/lib/flowbag.js';
import { balance } from '../src/lib/balance.js';

describe('.ics', () => {
  it('writes tours over all their days with a reminder to pack, and reads them back', () => {
    const text = tripsIcs([{ id: 't1', title: 'Jura, zwei Tage', startDate: '2026-10-24', days: 2 }], { title: (n) => `Tour: ${n}`, note: 'Packen', now: Date.parse('2026-10-19T10:00:00Z') });
    expect(text).toContain('DTSTART;VALUE=DATE:20261024\r\nDTEND;VALUE=DATE:20261026');
    expect(text).toContain(`TRIGGER:${PACK_ALARM}`);
    expect(text).toContain('SUMMARY:Tour: Jura\\, zwei Tage');
    expect(parseIcs(text)).toEqual([{ uid: 't-t1@packgenerator'.replace('t-t1', 'trip-t1'), title: 'Tour: Jura, zwei Tage', day: '2026-10-24', lastDay: '2026-10-25', allDay: true, from: null, to: null, where: '', note: 'Packen' }]);
  });
  it('reads timed events in UTC and local time, folded lines, and leaves out cancelled ones', () => {
    const ics = ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'UID:a', 'SUMMARY:Tennis-Lek', ' tion', 'DTSTART:20261020T160000Z', 'DTEND:20261020T170000Z', 'LOCATION:Halle Muster', 'END:VEVENT', 'BEGIN:VEVENT', 'UID:b', 'SUMMARY:Velo-Service', 'DTSTART;TZID=Europe/Zurich:20261022T083000', 'DTEND;TZID=Europe/Zurich:20261022T090000', 'END:VEVENT', 'BEGIN:VEVENT', 'UID:c', 'STATUS:CANCELLED', 'SUMMARY:x', 'DTSTART:20261023', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    expect(parseIcs(ics).map((e) => [e.title, e.day, e.from, e.to, e.allDay, e.where])).toEqual([
      ['Tennis-Lektion', '2026-10-20', '18:00', '19:00', false, 'Halle Muster'],
      ['Velo-Service', '2026-10-22', '08:30', '09:00', false, ''],
    ]);
    expect(parseIcs('nonsense')).toEqual([]);
  });
});

describe('#222 a full sport bag counts as movement', () => {
  const bags = seedBags();
  const yoga = bags.find((b) => b.id === 'bag-yoga');
  it('finds the days a bag was packed in full', () => {
    const packs = { 'bag-yoga': { day: '2026-10-18', ids: yoga.items.map((x) => x.id) }, 'bag-tennis': { day: '2026-10-19', ids: ['racket'] } };
    expect(packedDays(bags, packs)).toEqual(['2026-10-18']);
  });
  it('fills Sport in the balance', () => {
    const acts = [{ id: 'yoga', ring: 'move' }];
    const without = balance({ acts, today: '2026-10-19' });
    const withBag = balance({ acts, bagDays: ['2026-10-18', '2026-09-01'], today: '2026-10-19' });
    expect(without.cats.find((c) => c.key === 'sport').value).toBe(null);
    expect(withBag.cats.find((c) => c.key === 'sport').value).toBe(33);
  });
});

describe('#226 fixed dates of the day', async () => {
  const { todayAppointments } = await import('../src/lib/todayfixed.js');
  it('takes today\'s fixed dates and timed Google appointments, by time', () => {
    const list = todayAppointments({
      fixed: [{ id: 'f1', actId: 'tennis', wd: 1, time: '18:00' }, { id: 'f2', actId: 'yoga', wd: 2, time: '07:00' }],
      events: [{ id: 'e1', title: 'Zahnarzt Muster', day: '2026-10-19', allDay: false, start: '2026-10-19T08:30:00+02:00' }, { id: 'e2', title: 'Ferien', day: '2026-10-19', allDay: true }],
      today: '2026-10-19',
      nameOf: (id) => id.toUpperCase(),
    });
    expect(list.map((x) => [x.time, x.title, x.kind])).toEqual([['08:30', 'Zahnarzt Muster', 'google'], ['18:00', 'TENNIS', 'fixed']]);
  });
});
