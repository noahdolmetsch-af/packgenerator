import { describe, it, expect } from 'vitest';
import { askOf, askDay, askDue, answered, postponed } from '../src/lib/challengeask.js';
import { buildList, pushOf } from '../src/lib/push/schedule.js';

describe('challenge question every 10 days', () => {
  it('is due at once when never asked', () => {
    expect(askDue(null, '2026-11-22')).toBe(true);
    expect(askOf('x')).toEqual({ last: '', later: '' });
  });
  it('comes again 10 days after an answer, not before', () => {
    const r = answered('2026-11-22');
    expect(askDay(r, '2026-11-25')).toBe('2026-12-02');
    expect(askDue(r, '2026-12-01')).toBe(false);
    expect(askDue(r, '2026-12-02')).toBe(true);
  });
  it('«Later» asks again tomorrow and keeps the last answer', () => {
    const p = postponed({ last: '2026-11-12', later: '' }, '2026-11-22');
    expect(p).toEqual({ last: '2026-11-12', later: '2026-11-23' });
    expect(askDue(p, '2026-11-22')).toBe(false);
    expect(askDue(p, '2026-11-23')).toBe(true);
  });
  it('an answer after «Later» starts 10 new days', () => {
    expect(askDay(answered('2026-11-23'), '2026-11-23')).toBe('2026-12-03');
  });
});

describe('push: challenge question', () => {
  const now = new Date('2026-11-22T10:00:00');
  const base = (kind, rec) => ({ trips: [], repairs: [], bikes: [], settings: { push: { on: true, kinds: { fog: false, challengeask: kind }, ...(0) }, challengeask: rec }, lastBackup: null, now });
  it('is off until switched on', () => {
    expect(pushOf(undefined).kinds.challengeask).toBe(false);
    expect(buildList(base(false, null)).items).toEqual([]);
  });
  it('sends one message at 18:00 on the day it is due', () => {
    const l = buildList(base(true, { last: '2026-11-12', later: '' }));
    expect(l.items.map((i) => i.key)).toEqual(['challengeask:2026-11-22']);
    expect(l.items[0].url).toBe('#/flow/challenges');
  });
  it('waits for the day after «Later» and does not repeat an ignored question', () => {
    expect(buildList(base(true, { last: '2026-11-12', later: '2026-11-23' })).items.map((i) => i.key)).toEqual(['challengeask:2026-11-23']);
    expect(buildList(base(true, { last: '2026-11-01', later: '' })).items).toEqual([]);
  });
});
