// Mini-Tools «Termin finden» (Noah 28.10.2026): the date question, answers, counting and the calendar file. Fictional data.
import { describe, it, expect } from 'vitest';
import { dateQuestion, readDateQuestion, cleanAnswer, cleanOpts, tally, busyDays, addDays, nextDays, icsOf, optKey, OPTS_MAX } from '../src/lib/mini/termin.js';

const opts = [{ d: '2026-11-14', t: '' }, { d: '2026-11-15', t: '' }, { d: '2026-11-28', t: '09:00' }];

describe('the date question', () => {
  it('needs a title and two days; sorts, drops doubles and wrong days, at most 8', () => {
    expect(dateQuestion({ title: '', opts })).toBeNull();
    expect(dateQuestion({ title: 'Test', opts: [opts[0]] })).toBeNull();
    const many = Array.from({ length: 12 }, (_, i) => ({ d: addDays('2026-11-01', i) }));
    expect(cleanOpts([...many, { d: '2026-13-01' }, { d: 'x' }])).toHaveLength(OPTS_MAX);
    const q = dateQuestion({ title: '  Test   Tour ', opts: [opts[1], opts[0], opts[0], { d: '2026-11-28', t: '25:00' }] });
    expect(q.title).toBe('Test Tour');
    expect(q.opts.map(optKey)).toEqual(['2026-11-14', '2026-11-15', '2026-11-28']);
    expect(readDateQuestion({ ...q, pk: 'k' })?.pk).toBe('k');
    expect(readDateQuestion({ ...q, kind: 'poll', pk: 'k' })).toBeNull();
    expect(readDateQuestion(q)).toBeNull();
  });

  it('keeps only answers to its days', () => {
    const a = cleanAnswer({ name: ' Test ', picks: { '2026-11-14': 'y', '2026-12-01': 'y', '2026-11-28T09:00': 'x' } }, opts);
    expect(a).toEqual({ name: 'Test', picks: { '2026-11-14': 'y' }, note: '' });
  });
});

describe('counting', () => {
  it('the most «works» wins, «maybe» counts half, ties go to the earlier day', () => {
    const rows = [
      { picks: { '2026-11-14': 'y', '2026-11-15': 'y', '2026-11-28T09:00': 'n' } },
      { picks: { '2026-11-14': 'm', '2026-11-15': 'y' } },
      { picks: { '2026-11-14': 'y', '2026-11-15': 'n', '2026-11-28T09:00': 'y' } },
    ];
    const r = tally(opts, rows);
    expect(r.list.map((c) => [c.y, c.m, c.n, c.open])).toEqual([[2, 1, 0, 0], [2, 0, 1, 0], [1, 0, 1, 1]]);
    expect(r.best.key).toBe('2026-11-14');
    expect(tally(opts, [{ picks: { '2026-11-14': 'y' } }, { picks: { '2026-11-15': 'y' } }]).best.key).toBe('2026-11-14');
    expect(tally(opts, []).best).toBeNull();
    expect(tally(opts, [{ picks: { '2026-11-14': 'n' } }]).best).toBeNull();
  });
});

describe('days', () => {
  it('busy days come from trips and calendar events; calendar-day arithmetic', () => {
    const b = busyDays([{ startDate: '2026-10-30', days: 3 }, { startDate: '2026-11-20', days: 1, status: 'cancelled' }], [{ day: '2026-11-05' }]);
    expect([...b].sort()).toEqual(['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-05']);
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26'); // over the end of summer time
    expect(nextDays('2026-12-30', 3)).toEqual(['2026-12-30', '2026-12-31', '2027-01-01']);
  });

  it('a calendar file for a whole day and for a time', () => {
    const all = icsOf('Test; Tour', opts[0], '20261102T080000Z', 'x');
    expect(all).toContain('DTSTART;VALUE=DATE:20261114');
    expect(all).toContain('DTEND;VALUE=DATE:20261115');
    expect(all).toContain(String.raw`SUMMARY:Test\; Tour`);
    const timed = icsOf('Test', opts[2]);
    expect(timed).toContain('DTSTART;TZID=Europe/Zurich:20261128T090000');
    expect(timed).toContain('DTEND;TZID=Europe/Zurich:20261128T110000');
  });
});
