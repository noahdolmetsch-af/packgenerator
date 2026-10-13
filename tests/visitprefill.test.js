// v0.124.0 A-J1 «Ein Weg zum Erfassen»: what the workshop visit window suggests (fictional data only).
import { describe, it, expect } from 'vitest';
import { visitPrefill, movedHint } from '../src/lib/visitprefill.js';
import { VISIT_JOBS } from '../src/lib/inbox.js';

const bike = { id: 'b1', name: 'Testvelo Gravel', km: 3050 };
const other = { id: 'b2', name: 'Testvelo Stadt', km: 900 };
const entries = [
  { id: 'k1', bikeId: 'b1', date: '2026-09-01', km: 3000, state: 'counted' },
  { id: 'k2', bikeId: 'b1', date: '2026-10-10', km: 100, state: 'counted' },
  { id: 'k3', bikeId: 'b1', date: '2026-10-12', km: 50, state: 'open' },
];
const visits = [
  { id: 'v1', bikeId: 'b1', date: '2026-05-08', shop: 'Werkstatt A' },
  { id: 'v2', bikeId: 'b2', date: '2026-09-20', shop: 'Werkstatt B' },
  { id: 'v3', bikeId: 'b1', date: '2026-03-07', shop: 'Werkstatt A' },
];

describe('visitPrefill', () => {
  it('takes the km of the day from the km book (counted entries only)', () => {
    const p = visitPrefill({ bike, date: '2026-10-13', today: '2026-10-13', entries, visits });
    expect(p.km).toBe(3100);
    expect(p.kmFrom).toBe('book');
  });

  it('a day in the past gets the km of that day', () => {
    expect(visitPrefill({ bike, date: '2026-09-15', today: '2026-10-13', entries, visits }).km).toBe(3000);
  });

  it('without km book entries: the counter only for today, else nothing', () => {
    expect(visitPrefill({ bike: other, date: '2026-10-13', today: '2026-10-13', entries, visits })).toMatchObject({ km: 900, kmFrom: 'counter' });
    expect(visitPrefill({ bike: other, date: '2026-10-01', today: '2026-10-13', entries, visits })).toMatchObject({ km: null, kmFrom: null });
  });

  it('suggests the shop of the bike’s newest visit, else of any bike', () => {
    const p = visitPrefill({ bike, date: '2026-10-13', today: '2026-10-13', entries, visits });
    expect(p.shop).toBe('Werkstatt A');
    expect(p.shopDate).toBe('2026-05-08');
    expect(p.shops.find((s) => s.last).shop).toBe('Werkstatt A');
    const q = visitPrefill({ bike: { id: 'b3', name: 'Neu' }, date: '2026-10-13', today: '2026-10-13', entries, visits });
    expect(q.shop).toBe('Werkstatt B');
  });

  it('with no visits there is nothing to suggest', () => {
    expect(visitPrefill({ bike, date: '2026-10-13', today: '2026-10-13', entries: [], visits: [] })).toMatchObject({ shop: '', shopDate: null, shops: [] });
  });

  it('the job chips name known parts and actions', () => {
    expect(VISIT_JOBS.length).toBeGreaterThan(3);
    for (const j of VISIT_JOBS) expect(['replace', 'service']).toContain(j.action);
  });
});

describe('movedHint', () => {
  it('shows for 30 days from the first day', () => {
    expect(movedHint(null, '2026-10-13')).toEqual({ show: true, since: '2026-10-13' });
    expect(movedHint('2026-10-13', '2026-11-11').show).toBe(true);
    expect(movedHint('2026-10-13', '2026-11-12').show).toBe(false);
  });
  it('a broken stored value starts again today', () => {
    expect(movedHint('kaputt', '2026-10-13')).toEqual({ show: true, since: '2026-10-13' });
  });
});
