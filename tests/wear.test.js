import { describe, it, expect } from 'vitest';
import { LIFE_STD, pastParts, lifeOf, weeklyKm, dueDay, partCost, wearRows, wearSummary, wearForTrip, lifeChange, isHidden, addableParts, serviceAt, serviceWithout, serviceDropDay, servicePeriods } from '../src/lib/wear.js';
import { serviceDone, serviceLast } from '../src/lib/bikeservice.js';
import { withVisits } from '../src/lib/workshop.js';

// «Verschleiss» (Noah 20.10.2026): fictional bike, fictional km. Dates are plain calendar days.
const TODAY = '2026-10-20';
const rep = (date, km, extra = {}) => ({ date, km, action: 'replace', result: 'done', ...extra });
const bike = (parts = [], extra = {}) => ({ id: 'b1', name: 'Test-Velo', km: 5000, parts, ...extra });
const rides = (list) => list.map(([date, km], i) => ({ id: `r${i}`, bikeId: 'b1', kind: 'ride', state: 'counted', date, km }));

describe('the parts before and how long a part lasts', () => {
  it('lists the parts before with the km they lasted, newest first', () => {
    const chain = { key: 'chain', history: [rep('2025-01-01', 0), rep('2025-08-01', 2800, { model: 'A' }), rep('2026-05-01', 4200)] };
    expect(pastParts(chain)).toEqual([
      { from: '2025-08-01', to: '2026-05-01', km: 1400, model: 'A' },
      { from: '2025-01-01', to: '2025-08-01', km: 2800, model: null },
    ]);
  });
  it('starts with the start value and learns from own changes (the start value counts once)', () => {
    expect(lifeOf(bike(), { key: 'chain', history: [rep('2026-01-01', 0)] })).toMatchObject({ km: LIFE_STD.chain, source: 'std' });
    const learned = lifeOf(bike(), { key: 'chain', history: [rep('2025-01-01', 0), rep('2025-08-01', 2000), rep('2026-05-01', 4000)] });
    expect(learned).toMatchObject({ source: 'learned', n: 2, km: Math.round((3000 + 2000 + 2000) / 3 / 50) * 50 });
    expect(lifeOf(bike([], { life: { chain: 4500 } }), { key: 'chain', history: [] })).toMatchObject({ km: 4500, source: 'own' });
    expect(lifeOf(bike(), { key: 'frame', history: [] })).toMatchObject({ km: null, source: null });
  });
});

describe('forecast', () => {
  it('km per week of the last 8 weeks, and the day the life is reached', () => {
    const entries = rides([['2026-10-10', 160], ['2026-09-01', 160], ['2026-07-01', 999]]);
    expect(weeklyKm(entries, 'b1', TODAY)).toBe(40);
    expect(weeklyKm([], 'b1', TODAY)).toBe(null);
    expect(dueDay(400, 40, TODAY)).toBe('2026-12-29');
    expect(dueDay(0, 40, TODAY)).toBe(TODAY);
    expect(dueDay(400, null, TODAY)).toBe(null);
  });
});

describe('rows of a bike', () => {
  it('km on the part since it was mounted, km left, state, measured values win', () => {
    const b = bike([
      { key: 'chain', history: [rep('2026-01-01', 2600)] },
      { key: 'padsF', history: [rep('2026-01-01', 4000), { date: '2026-10-01', km: 4900, action: 'check', result: 'ok', value: 45 }] },
      { key: 'tyres', history: [] },
      { key: 'frame', history: [] },
    ]);
    const rows = wearRows(b, { entries: rides([['2026-10-01', 320]]), today: TODAY });
    expect(rows.map((r) => r.key)).toEqual(['padsF', 'chain', 'tyres']);
    const chain = rows.find((r) => r.key === 'chain');
    expect(chain).toMatchObject({ km: 2400, left: 600, state: 'soon', why: 'km' });
    expect(chain.due).toBe('2027-02-02');
    expect(rows[0]).toMatchObject({ key: 'padsF', state: 'due', why: 'measured' });
    expect(rows[2].state).toBe('unknown');
    expect(wearSummary(rows)).toMatchObject({ state: 'due', n: 2, unknown: 1 });
  });
  it('a part replaced in a workshop visit starts at 0 km; a service shows «since service»', () => {
    const b = bike([{ key: 'chain', history: [rep('2025-01-01', 0)] }, { key: 'cassette', history: [rep('2025-01-01', 0)] }]);
    const visits = [{ id: 'v1', bikeId: 'b1', date: '2026-09-01', km: 4800, parts: [{ part: 'chain', action: 'replace', chf: 40 }, { part: 'cassette', action: 'service' }] }];
    const rows = wearRows(withVisits(b, visits), { today: TODAY });
    expect(rows.find((r) => r.key === 'chain')).toMatchObject({ km: 200, past: [{ km: 4800 }] });
    expect(rows.find((r) => r.key === 'cassette')).toMatchObject({ km: 5000, since: { km: 200, date: '2026-09-01' } });
  });
  it('cost per part per 1000 km only after 1000 km', () => {
    expect(partCost(bike(), { key: 'chain', history: [rep('2025-01-01', 3000, { chf: 50 })] })).toEqual({ chf: 25, km: 2000 });
    expect(partCost(bike(), { key: 'chain', history: [rep('2025-01-01', 4500, { chf: 50 })] })).toBe(null);
  });
  it('a part can be taken off the page, added, or set back to the suggestion', () => {
    const b = bike([{ key: 'chain', history: [] }, { key: 'saddle', history: [] }]);
    const off = { ...b, ...lifeChange(b, 'chain', 'off') };
    expect(isHidden(off, 'chain')).toBe(true);
    expect(wearRows(off, { today: TODAY }).map((r) => r.key)).toEqual([]);
    expect(addableParts(off).map((p) => p.key)).toEqual(['chain', 'saddle']);
    const own = { ...off, ...lifeChange(off, 'saddle', 20000) };
    expect(wearRows(own, { today: TODAY }).map((r) => r.key)).toEqual(['saddle']);
    expect(lifeChange(own, 'saddle', '').life).toEqual({ chain: null });
  });
});

describe('before a trip', () => {
  it('parts that run out before or on the trip; measured worn parts stay in the bike rows', () => {
    const rows = [
      { key: 'chain', name: 'Chain', state: 'soon', left: 300, due: '2026-11-20', why: 'km' },
      { key: 'tyres', name: 'Tyres', state: 'due', left: -10, why: 'km' },
      { key: 'padsF', name: 'Pads', state: 'due', left: 500, why: 'measured' },
      { key: 'cassette', name: 'Cassette', state: 'ok', left: 5000, due: '2027-06-01', why: null },
    ];
    expect(wearForTrip(rows, { startDate: '2026-10-25', days: 3, route: { km: 400 } }, TODAY).map((r) => [r.key, r.when])).toEqual([['chain', 'during'], ['tyres', 'now']]);
    expect(wearForTrip(rows, { startDate: '2026-11-19', days: 3 }, TODAY).map((r) => r.key)).toEqual(['chain', 'tyres']);
    expect(wearForTrip(rows, null, TODAY)).toEqual([]);
  });
});

describe('the whole-bike counter keeps every service', () => {
  it('serviceDone keeps the one before in past; a correction (serviceLast) does not', () => {
    const b = bike([], { service: { last: { day: '2026-03-01', km: 1000, hours: null } } });
    const done = serviceDone(b, { day: TODAY, km: 5000 });
    expect(done.service.past).toEqual([{ day: '2026-03-01', km: 1000, hours: null }]);
    expect(serviceLast(b, { day: '2026-04-01', km: 1500 }).service.past).toBe(undefined);
  });
  it('a visit becomes the last service when it is the newest, an older receipt goes into past; removing the visit takes it away', () => {
    const b = bike([], { service: { everyKm: 2000, last: { day: '2026-06-01', km: 3000, hours: null } } });
    const s1 = serviceAt(b, { day: '2026-09-01', km: 4500, visitId: 'v1' }).service;
    expect(s1.last).toMatchObject({ day: '2026-09-01', visitId: 'v1' });
    expect(s1.past.map((p) => p.day)).toEqual(['2026-06-01']);
    const s2 = serviceAt({ ...b, service: s1 }, { day: '2026-01-01', km: 500, visitId: 'v0' }).service;
    expect(s2.last.day).toBe('2026-09-01');
    expect(s2.past.map((p) => p.day)).toEqual(['2026-01-01', '2026-06-01']);
    const back = serviceWithout({ ...b, service: s2 }, 'v1').service;
    expect(back).toMatchObject({ everyKm: 2000, last: { day: '2026-06-01' } });
    expect(back.past.map((p) => p.day)).toEqual(['2026-01-01']);
    expect(serviceWithout(b, 'nope')).toBe(null);
    expect(serviceDropDay({ ...b, service: s2 }, '2026-06-01').service.past.map((p) => p.day)).toEqual(['2026-01-01']);
    expect(serviceDropDay({ ...b, service: s2 }, '2026-09-01')).toBe(null); // a visit stands behind it
  });
  it('periods newest first, the newest until today', () => {
    const b = bike([], { service: { past: [{ day: '2026-01-01', km: 1000 }], last: { day: '2026-06-01', km: 3000, visitId: 'v1' } } });
    expect(servicePeriods(b, TODAY)).toEqual([
      { from: '2026-06-01', to: TODAY, km: 2000, days: 141, visitId: 'v1', now: true },
      { from: '2026-01-01', to: '2026-06-01', km: 2000, days: 151, visitId: null, now: false },
    ]);
    expect(servicePeriods(bike(), TODAY)).toEqual([]);
  });
});

describe('reminders on the phone (Noah: «Kette nach 1000 km ersetzen … als Reminder»)', () => {
  it('a part with an own limit of 1000 km: today when reached, else the day at the pace of the last weeks', async () => {
    const { wearPush } = await import('../src/lib/wear.js');
    const b = { id: 'lux', name: 'Test-Lux', km: 1000, life: { chain: 1000 }, parts: [{ key: 'chain', history: [rep('2026-10-01', 0)] }] };
    expect(wearPush([b], { today: TODAY })).toEqual([{ key: 'wear:lux:chain:2026-10-01:1000', day: TODAY, bike: 'Test-Lux', part: 'Chain', life: 1000, left: 0, url: '#/bikes?tab=care&view=wear&bike=lux' }]);
    const soon = { ...b, km: 900 };
    const entries = [{ bikeId: 'lux', kind: 'ride', state: 'counted', date: '2026-10-15', km: 560 }];
    expect(wearPush([soon], { entries, today: TODAY })[0]).toMatchObject({ day: '2026-10-30', left: 100 });
    expect(wearPush([soon], { today: TODAY })).toEqual([]); // no pace, not reached: no reminder yet
  });
});
