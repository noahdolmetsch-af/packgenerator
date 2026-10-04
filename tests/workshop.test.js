import { describe, it, expect } from 'vitest';
import { withVisits, visitTotal, tyreSetup, timeDue, costByYear, costByPart, costPer1000, lastPrice } from '../src/lib/workshop.js';
import { ensureParts, logPart, lastReplace, wishFor } from '../src/lib/care.js';
import { bikePhotos, packPhoto } from '../src/lib/photo.js';

const visit = (over = {}) => ({
  id: 'v1',
  bikeId: 'fully',
  date: '2026-06-26',
  shop: 'Bike shop',
  invoice: 'R-1',
  totalChf: 100,
  km: null,
  parts: [
    { part: 'chain', action: 'replace', model: 'SRAM GX Eagle', chf: 39 },
    { part: 'fork', action: 'service', what: 'Fork service small', chf: 50 },
    { part: 'tyres', action: 'service', chf: 11, setup: { front: 'tubeless', rear: 'tubeless' } },
  ],
  ...over,
});
const bike = (over = {}) => ({ id: 'fully', name: 'Spark', type: 'Full suspension', km: null, parts: [], ...over });

describe('workshop visits as part history', () => {
  it('merges the jobs into the parts by date and takes the model from the receipt', () => {
    const own = logPart(ensureParts(bike()), 'chain', { date: '2026-08-01', km: null, action: 'check', result: 'ok', by: 'self' });
    const v = withVisits(bike({ parts: own }), [visit()]);
    const chain = v.parts.find((p) => p.key === 'chain');
    expect(chain.history.map((h) => h.date)).toEqual(['2026-06-26', '2026-08-01']);
    expect(chain.model).toBe('SRAM GX Eagle');
    expect(lastReplace(chain).by).toBe('shop');
    // The stored bike is not changed.
    expect(own.find((p) => p.key === 'chain').history).toHaveLength(1);
  });

  it('adds the new parts to a bike that has an older list, rear linkage only on a full suspension', () => {
    const old = [{ key: 'chain', model: '', history: [] }];
    expect(ensureParts(bike({ parts: old })).map((p) => p.key)).toEqual(expect.arrayContaining(['chain', 'brakes', 'wheels', 'cockpit', 'linkage']));
    expect(ensureParts({ id: 'factor-ls', type: 'Gravel', parts: old }).map((p) => p.key)).not.toContain('linkage');
  });

  it('logs into a part the bike did not have yet', () => {
    const parts = logPart([{ key: 'chain', history: [] }], 'brakes', { date: '2026-10-04', action: 'service', result: 'done' });
    expect(parts.find((p) => p.key === 'brakes').history).toHaveLength(1);
  });

  it('uses the receipt total, else the sum of the jobs', () => {
    expect(visitTotal(visit())).toBe(100);
    expect(visitTotal(visit({ totalChf: null }))).toBe(100);
  });
});

describe('due by time', () => {
  it('fork once a year and sealant every 3 months from the last service', () => {
    const v = withVisits(bike(), [visit()]);
    const due = timeDue(v, tyreSetup(v, [visit()]), '2026-10-04');
    const sealant = due.find((d) => d.key === 'tyres');
    expect(sealant).toMatchObject({ next: '2026-09-24', overdue: true });
    expect(due.find((d) => d.key === 'fork')).toMatchObject({ next: '2027-06-26', overdue: false });
    expect(due.find((d) => d.key === 'shock')).toMatchObject({ never: true });
  });

  it('no sealant when both wheels have tubes; the bike setting wins over the receipt', () => {
    const b = bike({ tyreSetup: { front: 'tube', rear: 'tube' } });
    const setup = tyreSetup(b, [visit()]);
    expect(setup).toEqual({ front: 'tube', rear: 'tube' });
    expect(timeDue(withVisits(b, [visit()]), setup, '2026-10-04').map((d) => d.key)).not.toContain('tyres');
  });
});

describe('costs', () => {
  const visits = [visit(), visit({ id: 'v2', date: '2025-05-01', totalChf: 50, km: 1000 }), visit({ id: 'v3', date: '2026-08-28', totalChf: 30, km: 3000 })];
  it('per year and per part', () => {
    expect(costByYear(visits)).toEqual([
      { year: '2026', chf: 130, visits: 2 },
      { year: '2025', chf: 50, visits: 1 },
    ]);
    expect(costByPart([visit()], 2)).toEqual([
      { key: 'fork', name: 'Fork', chf: 50 },
      { key: 'chain', name: 'Chain', chf: 39 },
    ]);
  });
  it('per 1000 km once the km are known at a visit and now', () => {
    expect(costPer1000(visits, bike())).toBeNull();
    expect(costPer1000(visits, bike({ km: 5000 }))).toEqual({ chf: 33, km: 4000, since: '2025-05-01' });
  });
  it('the last price goes to the wishlist', () => {
    const price = lastPrice([visit()], 'fully', 'chain');
    expect(price).toMatchObject({ chf: 39, model: 'SRAM GX Eagle' });
    const item = wishFor({ key: 'chain', model: '' }, bike(), [], 'bike99', price);
    expect(item.model).toBe('SRAM GX Eagle');
    expect(item.priceChf).toBe(39);
    expect(item.note).toContain('CHF 39.00');
  });
});

describe('setup photos', () => {
  const photos = [
    { id: 'p1', bikeId: 'fully', name: 'Hope', tripId: 't1', main: false, data: 'data:a' },
    { id: 'p2', bikeId: 'fully', name: 'Main', tripId: null, main: true, data: 'data:b' },
    { id: 'p3', bikeId: 'other', name: 'X', tripId: null, main: true, data: 'data:c' },
  ];
  it('gallery has the main photo first, the old bike photo too', () => {
    expect(bikePhotos(bike({ photo: 'data:old' }), photos).map((p) => p.name)).toEqual(['Main', 'Bike photo', 'Hope']);
  });
  it('Pack shows the trip photo, else the main one', () => {
    expect(packPhoto({ id: 't1' }, bike(), photos).name).toBe('Hope');
    expect(packPhoto({ id: 't2' }, bike(), photos).name).toBe('Main');
    expect(packPhoto({ id: 't2' }, bike({ photo: 'data:old' }), []).src).toBe('data:old');
    expect(packPhoto({ id: 't2' }, bike(), [])).toBeNull();
  });
});
