import { describe, it, expect } from 'vitest';
import { verlaufRows, yearsOf, filterRows, sumRows } from '../src/lib/care/verlauf.js';
import { partName } from '../src/lib/care.js';
import { costGlance } from '../src/lib/care/glance.js';
import { withVisits } from '../src/lib/workshop.js';

// «Verlauf» (Noah 21.11.2026, Schritt D): fictional bike, km and prices. Plain calendar days.
const rep = (date, km, extra = {}) => ({ date, km, action: 'replace', result: 'done', ...extra });
const bike = (parts = []) => ({ id: 'b1', name: 'Test-Velo', km: 6420, parts });
const visits = [
  { id: 'v1', bikeId: 'b1', date: '2026-09-12', km: 6000, shop: 'Test-Werkstatt', totalChf: 189, parts: [{ part: 'padsF', action: 'replace', chf: 60 }, { part: 'padsR', action: 'replace', chf: 60 }] },
  { id: 'v2', bikeId: 'b1', date: '2025-05-02', km: 3000, shop: 'Test-Werkstatt', parts: [{ part: 'chain', action: 'service' }] },
  { id: 'vx', bikeId: 'other', date: '2026-09-13', totalChf: 999, parts: [] },
];
const inspections = [
  { id: 'i1', bikeId: 'b1', level: 'monthly', date: '2026-11-09', km: 6090, done: true, results: [{ state: 'ok' }, { state: 'ok' }, { state: 'watch' }, { state: 'shop' }] },
  { id: 'i2', bikeId: 'b1', level: 'quick', date: '2026-11-20', done: false, results: [] },
  { id: 'i3', bikeId: 'other', level: 'full', date: '2026-10-01', done: true, results: [] },
];
const parts = [
  { key: 'chain', model: 'Testkette', history: [rep('2026-08-18', 5700, { chf: 54, by: 'self' }), { date: '2026-11-09', km: 6090, action: 'check', result: 'ok', value: 0.2 }] },
  { key: 'tyres', history: [rep('2026-06-24', 5200, { chf: 96, by: 'self' }), rep('2026-03-01', 4800, { by: 'self' }), { date: '2026-04-01', action: 'replace', result: 'needed', by: 'self' }] },
  { key: 'cassette', history: [rep('2026-02-10', 4000, { chf: 25, by: 'shop' })] },
];

describe('the timeline', () => {
  const rows = verlaufRows(withVisits(bike(parts), visits), visits, inspections);
  it('has service, checks and parts of this bike only, newest first', () => {
    expect(rows.map((r) => `${r.day} ${r.kind}`)).toEqual([
      '2026-11-09 check',
      '2026-09-12 service',
      '2026-08-18 part',
      '2026-06-24 part',
      '2026-03-01 part',
      '2026-02-10 service',
      '2025-05-02 service',
    ]);
  });
  it('counts a visit once (not again as the part entries it brought), with its total', () => {
    const v = rows.find((r) => r.visitId === 'v1');
    expect(v).toMatchObject({ kind: 'service', chf: 189, shop: 'Test-Werkstatt', km: 6000 });
    expect(rows.filter((r) => r.day === '2026-09-12')).toHaveLength(1);
    expect(rows.find((r) => r.visitId === 'v2').chf).toBe(null);
  });
  it('a check says what it found; an open one is not there', () => {
    expect(rows[0]).toMatchObject({ kind: 'check', level: 'monthly', ok: 2, watch: 1, fix: 1, chf: null });
    expect(rows.some((r) => r.id.startsWith('i-i2') || r.day === '2026-11-20')).toBe(false);
  });
  it('shop work without a visit is one service row per day; «work needed» is not a row', () => {
    expect(rows.find((r) => r.id === 's-2026-02-10')).toMatchObject({ kind: 'service', chf: 25, jobs: [partName({ key: 'cassette' })] });
    expect(rows.some((r) => r.day === '2026-04-01')).toBe(false);
  });
  it('filters by kind and year, lists the years', () => {
    expect(yearsOf(rows)).toEqual(['2026', '2025']);
    expect(filterRows(rows, 'service').map((r) => r.kind)).toEqual(['service', 'service', 'service']);
    expect(filterRows(rows, 'all', '2025')).toHaveLength(1);
    expect(filterRows(rows, 'part', '2025')).toHaveLength(0);
  });
  it('the year sum is the same as «Costs» in «Auf einen Blick»', () => {
    const view = withVisits(bike(parts), visits);
    const s = sumRows(filterRows(rows, 'all', '2026'));
    expect(s.chf).toBe(costGlance(view, visits, '2026').total);
    expect(s.chf).toBe(189 + 25 + 54 + 96);
    expect(s.unknown).toBe(0);
    expect(sumRows(filterRows(rows, 'all', '2025'))).toEqual({ chf: 0, unknown: 1 });
  });
});
