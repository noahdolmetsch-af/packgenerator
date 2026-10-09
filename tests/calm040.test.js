// v0.40.0 "Ruhige Nebenseiten": the chain on the wishlist when it is worn (quickcare.js chainWish)
// and the one list of past trips with the debrief state (hubs.js pastTripList). Fictional data only.
import { describe, it, expect, afterEach } from 'vitest';
import { defaultParts, PART } from '../src/lib/care.js';
import { chainWish, quickLog } from '../src/lib/quickcare.js';
import { pastTripList } from '../src/lib/hubs.js';
import { wishReason } from '../src/lib/insights.js';
import { lang } from '../src/lib/i18n.svelte.js';

afterEach(() => (lang.v = 'en'));

const TODAY = '2026-10-09';
const bike = () => ({ id: 'test_data_gtp_b1', name: 'test_data_gtp_ Gravel', type: 'Gravel', km: 5000, parts: defaultParts({ type: 'Gravel' }) });

describe('a worn chain goes on the wishlist', () => {
  it('at or over the replace limit: one item for this bike, with its reason', () => {
    const w = chainWish(bike(), [], { id: 'BK01', value: PART.chain.limit, today: TODAY });
    expect(w).toMatchObject({ id: 'BK01', name: 'Chain (test_data_gtp_ Gravel)', nameDe: 'Kette (test_data_gtp_ Gravel)', ownership: 'wishlist', category: 'bike', from: 'care', bikeId: 'test_data_gtp_b1', part: 'chain' });
    expect(w.note).toContain('0.5 %');
    expect(w.note).toContain(TODAY);
    // the wishlist names the reason
    expect(wishReason(w, [w], [], []).reasons).toContain('Needed on the bike');
  });

  it('under the limit nothing, and never twice for the same bike', () => {
    expect(chainWish(bike(), [], { id: 'BK01', value: 0.3, today: TODAY })).toBe(null);
    const first = chainWish(bike(), [], { id: 'BK01', value: 0.6, today: TODAY });
    expect(chainWish(bike(), [first], { id: 'BK02', value: 0.7, today: TODAY })).toBe(null);
    // the same name typed by hand on the wishlist also counts
    const byHand = { id: 'LX01', name: 'Chain (test_data_gtp_ Gravel)', ownership: 'wishlist' };
    expect(chainWish(bike(), [byHand], { id: 'BK02', value: 0.7, today: TODAY })).toBe(null);
    // once bought (owned) or gone, a new worn chain can go on the list again
    expect(chainWish(bike(), [{ ...first, ownership: 'owned' }], { id: 'BK02', value: 0.7, today: TODAY })).toMatchObject({ id: 'BK02' });
  });

  it("follows the bike's own limit and the last price paid", () => {
    const b = bike();
    b.parts = b.parts.map((p) => (p.key === 'chain' ? { ...p, limit: 0.75 } : p));
    expect(chainWish(b, [], { id: 'BK01', value: 0.6, today: TODAY })).toBe(null);
    const w = chainWish(b, [], { id: 'BK01', value: 0.8, today: TODAY, price: { chf: 39.9, date: '2026-04-01', shop: 'test_data_gtp_ Shop', model: 'test_data_gtp_ 12s' } });
    expect(w).toMatchObject({ priceChf: 39.9, model: 'test_data_gtp_ 12s' });
  });

  it('is the same step as "work needed" from the quick button', () => {
    const r = quickLog(bike(), 'wear', { today: TODAY, value: 0.55 });
    expect(r.entry.result).toBe('needed');
    expect(chainWish(bike(), [], { id: 'BK01', value: r.entry.value, today: TODAY })).not.toBe(null);
  });

  it('the reason reads in German too; the German name is always kept', () => {
    lang.v = 'de';
    const w = chainWish(bike(), [], { id: 'BK01', value: 0.5, today: TODAY });
    expect(w.nameDe).toBe('Kette (test_data_gtp_ Gravel)');
    expect(wishReason(w, [w], [], []).reasons).toContain('Am Velo gebraucht');
  });
});

describe('one list of past trips', () => {
  const today = '2026-10-09';
  const trip = (id, startDate, over = {}) => ({ id, title: `test_data_gtp_ ${id}`, startDate, days: 1, bikeId: 'b1', bike: 'test_data_gtp_ Spark', entries: [{ itemId: 'a' }, { itemId: 'b' }, { itemId: 'c' }], ...over });
  const trips = [
    trip('jura', '2026-10-06', { days: 2 }),
    trip('autumn', '2026-09-19'),
    trip('hallwil', '2026-09-27'),
    trip('seetal', '2026-09-14'),
    trip('closed', '2026-09-01', { noDebrief: true }),
    trip('outside', '2026-08-20', { entries: [] }),
    trip('next', '2026-10-20'),
    trip('skipped', '2026-08-01', { skipped: true }),
  ];
  const debriefs = [
    { tripId: 'autumn', status: 'draft', items: {}, missing: [] },
    { tripId: 'hallwil', status: 'done', km: 45, items: { a: 'unused', b: 'broken' }, missing: [{ id: 'm1', name: 'x' }] },
    { tripId: 'seetal', status: 'done', km: null, items: {}, missing: [] },
  ];

  it('open debriefs first (a draft too), then the rest; future and skipped trips are not there', () => {
    const l = pastTripList(trips, debriefs, today);
    expect(l.open.map((r) => r.trip.id)).toEqual(['jura', 'autumn']);
    expect(l.open.map((r) => r.state)).toEqual(['open', 'draft']);
    expect(l.done.map((r) => [r.trip.id, r.state])).toEqual([
      ['hallwil', 'done'],
      ['seetal', 'done'],
      ['closed', 'none'],
      ['outside', 'none'],
    ]);
    expect(l.total).toBe(6);
  });

  it('counts what was not used and missing, and sums only the known km', () => {
    const l = pastTripList(trips, debriefs, today);
    const h = l.done.find((r) => r.trip.id === 'hallwil');
    expect(h).toMatchObject({ unused: 1, missing: 1, km: 45 });
    expect(l.km).toBe(45);
    expect(l.kmKnown).toBe(1);
  });

  it('is empty without trips', () => {
    expect(pastTripList([], [], today)).toEqual({ open: [], done: [], km: 0, kmKnown: 0, total: 0 });
  });
});
