import { describe, it, expect } from 'vitest';
import { whoYear, recentWork, doneBySelf, nextForShop, bySelf } from '../src/lib/bikes/who.js';
import { withVisits } from '../src/lib/workshop.js';

// Fictional data only.
const visit = (over = {}) => ({
  id: 'v1',
  bikeId: 'test_data_gtp_spark',
  date: '2026-06-10',
  shop: 'test_data_gtp_ Velo shop',
  totalChf: 185.5,
  km: 4200,
  parts: [
    { part: 'padsR', action: 'replace', chf: 60 },
    { part: 'shifting', action: 'service', chf: 40 },
    { part: 'wheels', action: 'service', chf: 85.5 },
  ],
  ...over,
});
const bike = (parts = []) => ({ id: 'test_data_gtp_spark', name: 'test_data_gtp_ Spark', type: 'Full suspension', km: 5000, parts });
const h = (date, action, by, over = {}) => ({ date, km: 4700, value: null, action, result: action === 'check' ? 'ok' : 'done', by, ...over });

describe('who works on the bike', () => {
  const parts = [
    { key: 'chain', model: '', history: [h('2026-09-08', 'service', 'self'), h('2026-08-01', 'service', 'self'), h('2025-12-01', 'service', 'self')] },
    { key: 'bolts', model: '', history: [h('2026-07-01', 'check', 'self'), h('2026-07-02', 'check', 'self', { result: 'needed' })] },
    { key: 'fork', model: '', history: [h('2026-03-01', 'service', 'shop', { chf: 90 })] },
  ];
  const visits = [visit(), visit({ id: 'v0', date: '2025-05-01', totalChf: 50 }), visit({ id: 'vx', bikeId: 'other' })];
  const view = withVisits(bike(parts), visits);

  it('bySelf: entries of a visit, "bike shop" entries and entries without `by` are not mine', () => {
    expect(bySelf({ by: 'self' })).toBe(true);
    expect(bySelf({})).toBe(false);
    expect(bySelf({ by: 'shop' })).toBe(false);
    expect(bySelf({ by: 'shop', visitId: 'v1' })).toBe(false);
  });

  it('whoYear counts my jobs, the shop visits of the year and what they cost', () => {
    const y = whoYear(view, visits, [{ id: 1, task: 'test_data_gtp_ fix bell', area: 'Repair', bikeId: 'test_data_gtp_spark', status: 'done', statusDate: '2026-05-05' }], '2026');
    // chain twice, the bolt check (the "work needed" finding is not work), the repair.
    expect(y.self).toBe(4);
    // the visit of June plus the fork marked "bike shop" in March; not last year's, not the other bike's.
    expect(y.shop).toBe(2);
    expect(y.chf).toBe(275.5);
    expect(y.unknown).toBe(0);
    expect(y.share).toBeCloseTo(4 / 6);
  });

  it('whoYear without anything done: share is null', () => {
    expect(whoYear(bike(), [], [], '2026')).toMatchObject({ self: 0, shop: 0, chf: 0, share: null });
  });

  it('a visit without a price counts as unknown', () => {
    const y = whoYear(withVisits(bike(), [visit({ totalChf: null, parts: [{ part: 'chain', action: 'replace' }] })]), [visit({ totalChf: null, parts: [{ part: 'chain', action: 'replace' }] })], [], '2026');
    expect(y).toMatchObject({ shop: 1, chf: 0, unknown: 1 });
  });

  it('recentWork: newest first, a visit is one row, my jobs of one day are one row', () => {
    const rows = recentWork(view, visits, [], 4);
    expect(rows.map((r) => [r.date, r.who])).toEqual([
      ['2026-09-08', 'self'],
      ['2026-08-01', 'self'],
      ['2026-07-01', 'self'],
      ['2026-06-10', 'shop'],
    ]);
    expect(rows[0].what).toBe('Chain waxed');
    expect(rows[3]).toMatchObject({ what: 'Brake pads rear, Rear derailleur, Wheels', shop: 'test_data_gtp_ Velo shop', chf: 185.5, km: 4200 });
    expect(recentWork(view, visits).length).toBe(3);
  });

  it('doneBySelf: services or replacements by me, the 1000 km check by any check of mine', () => {
    expect(doneBySelf(view, 'chain')).toBe(true);
    expect(doneBySelf(view, 'fork')).toBe(false); // the shop did it
    expect(doneBySelf(view, 'padsR')).toBe(false); // only in a visit
    expect(doneBySelf(view, 'check')).toBe(true);
    expect(doneBySelf(withVisits(bike(), []), 'check')).toBe(false);
  });

  it('nextForShop leaves out what I did myself before, keeps repairs and sums the prices', () => {
    const order = {
      rows: [
        { key: 'fork:now', name: 'Fork service', chf: 90 },
        { key: 'check:now', name: '1,000 km check', chf: 40 },
        { key: 'shock:now', name: 'Shock service', chf: null },
        { key: 'repair:7', name: 'test_data_gtp_ creak', chf: null },
      ],
    };
    const next = nextForShop(order, view);
    expect(next.rows.map((r) => r.key)).toEqual(['fork:now', 'shock:now', 'repair:7']);
    expect(next.total).toBe(90);
    expect(next.unknown).toBe(2);
    expect(nextForShop(null, view)).toEqual({ rows: [], total: 0, unknown: 0 });
  });
});
