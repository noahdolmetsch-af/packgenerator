// «Meditation» › Rückblick (mockup ME3, approved 13.10.2026 «ME1-ME3 und Z1-Z5 freigeben»). Fictional data.
import { describe, it, expect } from 'vitest';
import { reviewRows, filterReview, periodOf, daysSoFar, periodStats, weekBars, monthBars, periodDays, weekGoalMin, helps } from '../src/lib/medreview.js';

// times in Zurich (summer time, UTC+2)
const at = (day, hm) => new Date(`${day}T${hm}:00+02:00`).toISOString();
const log = [
  { id: 'a', actId: 'meditation', day: '2026-10-12', at: at('2026-10-12', '07:10'), min: 20 },
  { id: 'b', actId: 'meditation', day: '2026-10-11', at: at('2026-10-11', '06:45'), min: 30 },
  { id: 'c', actId: 'meditation', day: '2026-10-10', at: at('2026-10-10', '21:30'), min: 20 },
  { id: 'd', actId: 'meditation', day: '2026-10-09', at: at('2026-10-09', '18:20'), min: 45 },
  { id: 'e', actId: 'meditation', day: '2026-09-30', at: at('2026-09-30', '07:00'), min: 10 },
  { id: 'x', actId: 'yoga', day: '2026-10-12', min: 60 },
  { id: 'z', actId: 'meditation', day: '2026-10-08', min: 0 },
];
const sessions = [
  { id: 'a', depth: 4, art: 'breath', tplId: 'tpl-morning20', note: 'ruhig, Vögel gehört', bowl: { mode: 'none' } },
  { id: 'b', depth: 5, art: 'mantra', tplId: 'tpl-om30', bowl: { mode: 'every', every: 10 } },
  { id: 'c', depth: 2, art: 'breath', tplId: 'tpl-morning20', note: 'unruhig', bowl: { mode: 'none' } },
  { id: 'd', depth: 3, art: 'breath', bowl: { mode: 'random', count: 3 } },
  { id: 'e', depth: 4, bowl: { mode: 'marks', marks: [] } },
];
const today = '2026-10-13';

describe('the Rückblick of the meditation', () => {
  it('rows: only meditation with minutes, newest first, with the session details', () => {
    const rows = reviewRows(log, sessions);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(rows[0]).toMatchObject({ depth: 4, art: 'breath', tplId: 'tpl-morning20', note: 'ruhig, Vögel gehört', gong: false });
    expect(rows.map((r) => r.gong)).toEqual([false, true, false, true, false]);
    expect(filterReview(rows, { art: 'breath' }).map((r) => r.id)).toEqual(['a', 'c', 'd']);
    expect(filterReview(rows, { tpl: 'tpl-morning20' }).map((r) => r.id)).toEqual(['a', 'c']);
  });

  it('periods: week from Monday, month, year, and earlier ones', () => {
    expect(periodOf('week', today)).toMatchObject({ from: '2026-10-12', to: '2026-10-18' });
    expect(periodOf('week', today, 1)).toMatchObject({ from: '2026-10-05', to: '2026-10-11' });
    expect(periodOf('month', today)).toMatchObject({ from: '2026-10-01', to: '2026-10-31', key: '2026-10' });
    expect(periodOf('month', today, 1)).toMatchObject({ from: '2026-09-01', to: '2026-09-30' });
    expect(periodOf('month', '2026-01-15', 1)).toMatchObject({ from: '2025-12-01', to: '2025-12-31' });
    expect(periodOf('year', today)).toMatchObject({ from: '2026-01-01', to: '2026-12-31' });
    expect(daysSoFar(periodOf('month', today), today)).toBe(13);
    expect(daysSoFar(periodOf('month', today, 1), today)).toBe(30);
  });

  it('numbers of a period', () => {
    const rows = reviewRows(log, sessions);
    expect(periodStats(rows, periodOf('month', today), today)).toEqual({ days: 4, of: 13, min: 115, longest: 45, n: 4 });
    expect(periodStats(rows, periodOf('week', today), today)).toEqual({ days: 1, of: 2, min: 20, longest: 20, n: 1 });
  });

  it('minutes per week and per month; the calendar', () => {
    const rows = reviewRows(log, sessions);
    expect(weekBars(rows, today, 3)).toEqual([
      { week: '2026-09-28', min: 10 },
      { week: '2026-10-05', min: 95 },
      { week: '2026-10-12', min: 20 },
    ]);
    const m = monthBars(rows, 2026);
    expect(m).toHaveLength(12);
    expect(m[8]).toEqual({ month: '2026-09', min: 10, days: 1 });
    expect(m[9]).toEqual({ month: '2026-10', min: 115, days: 4 });
    const cal = periodDays(rows, periodOf('month', today), today);
    expect(cal.length % 7).toBe(0);
    expect(cal.slice(0, 3)).toEqual([null, null, null]); // 1 October 2026 is a Thursday
    expect(cal.find((c) => c?.day === '2026-10-09')).toMatchObject({ min: 45, level: 3 });
    expect(cal.find((c) => c?.day === '2026-10-12')).toMatchObject({ min: 20, level: 2 });
    expect(cal.find((c) => c?.day === '2026-10-20')).toMatchObject({ future: true, level: 0 });
  });

  it('the weekly goal: sessions per week × the usual minutes', () => {
    expect(weekGoalMin([{ count: 1, days: 1 }], 20)).toBe(140);
    expect(weekGoalMin([{ count: 3, days: 7 }], 30)).toBe(90);
    expect(weekGoalMin([], 20)).toBe(null);
    expect(weekGoalMin([{ count: 1, days: 1 }], 0)).toBe(null);
  });

  it('what helps: only what the sessions show, observation only', () => {
    const rows = reviewRows(log, sessions);
    const h = helps(rows, (id) => ({ breath: 'Atemzüge zählen' })[id] ?? id);
    expect(h.map((x) => x.id)).toEqual(['morning', 'gong', 'kind']);
    expect(h[0]).toMatchObject({ key: 'Deeper in the morning', vars: { a: 4.3, b: 2.5 } });
    expect(h[1]).toMatchObject({ key: 'Longer with the singing bowl', vars: { a: 38, b: 17 } });
    expect(h[2]).toMatchObject({ vars: { name: 'Atemzüge zählen', n: 3 } });
    expect(helps(rows.slice(0, 1))).toEqual([]);
  });
});

describe('«Meditation» is the name everywhere (Noah 3a)', () => {
  it('the old playful name of the seed goes, a name of your own stays', async () => {
    const { oldMedNick } = await import('../src/lib/flowtiles.js');
    expect(oldMedNick({ id: 'meditation', nick: 'Cushion time', nickDe: 'Kissenzeit' })).toEqual({ nick: null, nickDe: null });
    expect(oldMedNick({ id: 'meditation', nick: 'Stille', nickDe: null })).toBe(null);
    expect(oldMedNick({ id: 'meditation', nick: 'Kissenzeit', nickDe: null })).toBe(null);
    expect(oldMedNick({ id: 'yoga', nick: 'Cushion time' })).toBe(null);
  });
});
