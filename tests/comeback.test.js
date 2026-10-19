// Paket Q #142: after a long break the app greets with what is due and new.
import { describe, it, expect } from 'vitest';
import { startComeback, showComeback, later, notToday, comebackLines, PAUSE_DAYS } from '../src/lib/clear/comeback.js';

const now = new Date('2026-10-19T08:00:00Z');

describe('Wiedereinstieg', () => {
  it('a first start never greets', () => {
    expect(startComeback(null, null, now)).toBeNull();
  });
  it('a short break does not greet, a long one does', () => {
    expect(startComeback('2026-10-10T08:00:00Z', null, now)).toBeNull();
    const r = startComeback('2026-09-01T08:00:00Z', null, now);
    expect(r.since).toBe('2026-09-01T08:00:00Z');
    expect(showComeback(r, now)).toBe(true);
    expect(PAUSE_DAYS).toBe(21);
  });
  it('«Später» waits an hour, «Heute nicht» until tomorrow', () => {
    const r = startComeback('2026-09-01T08:00:00Z', null, now);
    const l = later(r, now);
    expect(showComeback(l, new Date('2026-10-19T08:30:00Z'))).toBe(false);
    expect(showComeback(l, new Date('2026-10-19T09:01:00Z'))).toBe(true);
    const n = notToday(r, now);
    expect(showComeback(n, new Date('2026-10-19T20:00:00Z'))).toBe(false);
    expect(showComeback(n, new Date('2026-10-20T23:00:00Z'))).toBe(true);
  });
  it('a waiting greeting survives the next start, but not for ever', () => {
    const r = startComeback('2026-09-01T08:00:00Z', null, now);
    expect(startComeback(now.toISOString(), r, new Date('2026-10-20T08:00:00Z'))).toEqual(r);
    expect(startComeback(now.toISOString(), r, new Date('2026-10-30T08:00:00Z'))).toBeNull();
  });
  it('lists only what has something in it', () => {
    expect(comebackLines({}, '2026-10-19')).toEqual([]);
    const l = comebackLines({ care: 2, trip: { title: 'Testtour', startDate: '2026-10-22' }, backupDue: true, backupDays: 30, inbox: 1, news: 3 }, '2026-10-19');
    expect(l.map((x) => x.key)).toEqual(['care', 'trip', 'inbox', 'backup', 'news']);
    expect(l[1].vars.n).toBe(3);
  });
});
