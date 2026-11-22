import { describe, it, expect } from 'vitest';
import { chainGlance, serviceGlance, checkGlance, costGlance } from '../src/lib/care/glance.js';
import { withVisits } from '../src/lib/workshop.js';

// «Auf einen Blick» (Noah 21.11.2026): fictional bike, fictional km and prices. Plain calendar days.
const TODAY = '2026-11-21';
const rep = (date, km, extra = {}) => ({ date, km, action: 'replace', result: 'done', ...extra });
const bike = (parts = [], extra = {}) => ({ id: 'b1', name: 'Test-Velo', km: 6420, parts, ...extra });

describe('the chain at a glance', () => {
  const chain = { key: 'chain', model: 'Testkette', history: [rep('2026-08-18', 5700, { chf: 54 }), { date: '2026-11-09', km: 6090, action: 'check', result: 'ok', value: 0.2 }] };
  it('km done and left from the own limit, since when, price and the last measurement', () => {
    const plain = { ...chain, history: [chain.history[0]] };
    const g = chainGlance(bike([plain], { life: { chain: 1000 } }), { today: TODAY });
    expect(g).toMatchObject({ km: 720, life: 1000, left: 280, own: true, since: '2026-08-18', chf: 54, model: 'Testkette', measured: null });
    expect(g.frac).toBeCloseTo(0.72, 2);
    // a measurement that grows faster than the km says less is left: the measured value counts (wear.js)
    const m = chainGlance(bike([chain], { life: { chain: 1000 } }), { today: TODAY });
    expect(m.measured).toMatchObject({ value: 0.2, date: '2026-11-09' });
    expect(m.left).toBeLessThanOrEqual(280);
  });
  it('without a start point there is nothing to show (the tile then says how to start)', () => {
    expect(chainGlance(bike([{ key: 'chain', history: [] }]), { today: TODAY })).toBe(null);
    expect(chainGlance(bike([]), { today: TODAY })).toBe(null);
  });
});

describe('the last service', () => {
  it('uses the service point and finds the visit that cost something', () => {
    const b = bike([], { service: { last: { day: '2026-09-12', km: 6000 } } });
    const visits = [{ id: 'v1', bikeId: 'b1', date: '2026-09-12', km: 6000, shop: 'Test-Werkstatt', totalChf: 189, parts: [] }];
    expect(serviceGlance(b, visits, TODAY)).toMatchObject({ kind: 'service', day: '2026-09-12', shop: 'Test-Werkstatt', chf: 189, km: 6000, sinceKm: 420 });
    expect(serviceGlance(b, visits, TODAY).kmLeft).toBe(2580);
  });
  it('a service by hand has no price; without a service point the newest visit counts', () => {
    expect(serviceGlance(bike([], { service: { last: { day: '2026-09-12', km: 6000 } } }), [], TODAY)).toMatchObject({ kind: 'service', chf: null, shop: '' });
    const visits = [{ id: 'v0', bikeId: 'b1', date: '2026-01-05', km: 3000, shop: 'Alt', totalChf: 80, parts: [] }, { id: 'v1', bikeId: 'b1', date: '2026-05-05', km: 4500, shop: 'Neu', parts: [{ part: 'chain', action: 'replace', chf: 60 }] }];
    expect(serviceGlance(bike(), visits, TODAY)).toMatchObject({ kind: 'visit', day: '2026-05-05', shop: 'Neu', chf: 60 });
    expect(serviceGlance(bike(), [], TODAY)).toBe(null);
  });
});

describe('the last check', () => {
  const list = [
    { bikeId: 'b1', level: 'full', date: '2026-09-12', km: 6000, done: true, results: [{ id: 'a', state: 'ok' }] },
    { bikeId: 'b1', level: 'monthly', date: '2026-11-09', km: 6090, done: true, results: [{ id: 'a', state: 'ok' }, { id: 'b', state: 'watch' }, { id: 'c', state: 'shop' }] },
    { bikeId: 'b1', level: 'quick', date: '2026-11-20', done: false, results: [] },
    { bikeId: 'other', level: 'monthly', date: '2026-11-19', done: true, results: [] },
  ];
  it('is the newest finished one of the bike, with what it found and the last full inspection', () => {
    expect(checkGlance(list, 'b1', { monthly: { kmLeft: 133.6, next: '2026-12-09', due: false } })).toMatchObject({
      level: 'monthly', day: '2026-11-09', km: 6090, ok: 1, watch: 1, fix: 1, fullDay: '2026-09-12', next: { kmLeft: 134, day: '2026-12-09', due: false },
    });
  });
  it('is null without a finished check; no next one when the reminders are off', () => {
    expect(checkGlance(list, 'none')).toBe(null);
    expect(checkGlance(list, 'b1', { monthly: { off: true } }).next).toBe(null);
  });
});

describe('what the year cost', () => {
  it('adds the visits and the parts you paid for yourself, but not the visit jobs twice', () => {
    const b = bike([{ key: 'chain', history: [rep('2026-08-18', 5700, { chf: 54 })] }, { key: 'tyres', history: [rep('2026-06-24', 5200, { chf: 96 }), rep('2025-03-01', 1000, { chf: 70 })] }]);
    const visits = [{ id: 'v1', bikeId: 'b1', date: '2026-09-12', km: 6000, totalChf: 189, parts: [{ part: 'padsF', action: 'replace', chf: 28 }] }];
    const g = costGlance(withVisits(b, visits), visits, '2026');
    expect(g).toMatchObject({ year: '2026', work: 189, parts: 150, total: 339, unknown: 0 });
    expect(g.top.map((x) => x.key)).toEqual(['tyres', 'chain']);
  });
  it('is 0 without prices', () => {
    expect(costGlance(bike([{ key: 'chain', history: [rep('2026-08-18', 5700)] }]), [], '2026').total).toBe(0);
  });
});
