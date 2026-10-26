import { describe, it, expect } from 'vitest';
import { stretchRate, chainForecast, measureDue, chainForTrip, chainPlan, chainPush, MEASURE_EVERY, MEASURE_CLOSE } from '../src/lib/chainplan.js';

// «Kette vorausschauend»: fictional bike, fictional km. Dates are plain calendar days.
const TODAY = '2026-10-25';
const rep = (date, km) => ({ date, km, action: 'replace', result: 'done' });
const chk = (date, km, value) => ({ date, km, value, action: 'check', result: value >= 0.5 ? 'needed' : 'ok' });
const lube = (date, km) => ({ date, km, action: 'service', result: 'done' });
const bike = (history, km = 2000, extra = {}) => ({ id: 'b1', name: 'Test-Velo', km, parts: [{ key: 'chain', history }], ...extra });
// 40 km a week for the last 8 weeks
const rides = [['2026-10-20', 160], ['2026-09-15', 160]].map(([date, km], i) => ({ id: `r${i}`, bikeId: 'b1', kind: 'ride', state: 'counted', date, km }));

describe('stretch per 1000 km', () => {
  it('fits a line through the values', () => {
    expect(stretchRate([{ km: 0, value: 0 }, { km: 1000, value: 0.1 }, { km: 2000, value: 0.2 }])).toBe(0.1);
  });
  it('needs two values at least 100 km apart and a growing chain', () => {
    expect(stretchRate([{ km: 0, value: 0.1 }])).toBe(null);
    expect(stretchRate([{ km: 0, value: 0.1 }, { km: 50, value: 0.2 }])).toBe(null);
    expect(stretchRate([{ km: 0, value: 0.3 }, { km: 1000, value: 0.2 }])).toBe(null);
  });
});

describe('forecast', () => {
  it('one value after a new chain: estimated from 0 % at the mounting km', () => {
    const fc = chainForecast(bike([rep('2026-06-01', 0), chk('2026-10-20', 2000, 0.2)]), { entries: rides, today: TODAY });
    expect(fc.estimated).toBe(true);
    expect(fc.rate).toBe(0.1);
    expect(fc.kmToWarn).toBe(2000);
    expect(fc.kmToLimit).toBe(3000);
    expect(fc.limitDay > TODAY).toBe(true);
  });
  it('without a new chain on record and one value: no forecast', () => {
    const fc = chainForecast(bike([chk('2026-10-20', 2000, 0.2)]), { today: TODAY });
    expect(fc.rate).toBe(null);
    expect(fc.kmToLimit).toBe(null);
  });
  it('counts the km ridden since the last value', () => {
    const fc = chainForecast(bike([rep('2026-01-01', 0), chk('2026-05-01', 1000, 0.1), chk('2026-08-01', 2000, 0.2)], 3000), { today: TODAY });
    expect(fc.estimated).toBe(false);
    expect(fc.now).toBe(0.3);
    expect(fc.kmToLimit).toBe(2000);
  });
  it('a chain over the limit has 0 km left', () => {
    const fc = chainForecast(bike([rep('2026-01-01', 0), chk('2026-10-01', 2000, 0.55)]), { today: TODAY });
    expect(fc.kmToLimit).toBe(0);
  });
});

describe('next measurement', () => {
  it('every 500 km, every 250 km near the limit', () => {
    const b = bike([rep('2026-06-01', 0), chk('2026-09-01', 1200, 0.1)], 1800);
    const m = measureDue(b, chainForecast(b, { today: TODAY }));
    expect(m).toMatchObject({ every: MEASURE_EVERY, since: 600, never: false });
    expect(m.left).toBeLessThan(0);
    const close = bike([rep('2026-06-01', 0), chk('2026-09-01', 1000, 0.42)], 1100);
    expect(measureDue(close, chainForecast(close, { today: TODAY }))).toMatchObject({ every: MEASURE_CLOSE, close: true });
  });
  it('never measured: counts from the new chain', () => {
    const b = bike([rep('2026-06-01', 1000)], 1700);
    expect(measureDue(b, chainForecast(b, { today: TODAY }))).toMatchObject({ never: true, since: 700 });
  });
});

describe('trip check', () => {
  const fc = { kmToLimit: 300, limitDay: '2026-12-10', perWeek: 40 };
  it('route km take the chain over its limit during the trip', () => {
    expect(chainForTrip(fc, { id: 't1', startDate: '2026-11-01', days: 3, route: { km: 400 } }, TODAY)).toMatchObject({ when: 'during' });
    expect(chainForTrip(fc, { id: 't1', startDate: '2026-11-01', days: 3, route: { km: 100 } }, TODAY)).toBe(null);
  });
  it('without route km: the day at the pace of the last weeks', () => {
    expect(chainForTrip(fc, { id: 't1', startDate: '2026-12-15', days: 2 }, TODAY)).toMatchObject({ when: 'before' });
    expect(chainForTrip(fc, { id: 't1', startDate: '2026-12-09', days: 3 }, TODAY)).toMatchObject({ when: 'during' });
    expect(chainForTrip(fc, { id: 't1', startDate: '2026-11-01', days: 1 }, TODAY)).toBe(null);
  });
});

describe('the plan', () => {
  it('a worn chain: replace first, cassette too over 0.75 %', () => {
    const plan = chainPlan(bike([rep('2026-01-01', 0), chk('2026-10-20', 2000, 0.8)]), { today: TODAY });
    expect(plan.steps[0]).toMatchObject({ kind: 'replace', tone: 'due', cassette: true });
    expect(plan.steps.some((s) => s.kind === 'measure')).toBe(false);
  });
  it('measure and lube when due, at most three steps', () => {
    const plan = chainPlan(bike([rep('2026-06-01', 0), chk('2026-08-01', 900, 0.05), lube('2026-08-01', 900)], 1600), { entries: rides, today: TODAY });
    expect(plan.steps.map((s) => s.kind)).toEqual(['lube', 'measure']);
    expect(plan.steps.length).toBeLessThanOrEqual(3);
  });
  it('nothing due: no steps', () => {
    const plan = chainPlan(bike([rep('2026-06-01', 0), chk('2026-10-20', 1950, 0.05), lube('2026-10-20', 1950)]), { entries: rides, today: TODAY });
    expect(plan.steps).toEqual([]);
  });
  it('a bike without chain: no plan', () => {
    expect(chainPlan({ id: 'b2', km: 10, parts: [] }, { today: TODAY })).toBe(null);
  });
});

describe('phone reminders', () => {
  it('one «measure» per last measured km, nothing for sold bikes', () => {
    const b = bike([rep('2026-06-01', 0), chk('2026-08-01', 900, 0.05), lube('2026-10-24', 1590)], 1600);
    const out = chainPush([b, { ...b, id: 'b9', status: 'sold' }], { today: TODAY });
    expect(out).toEqual([expect.objectContaining({ key: 'chainmeasure:b1:900', kind: 'measure', day: TODAY })]);
  });
});

describe('rides waiting in «To check»', () => {
  it('counts open rides without a bike or of this bike', async () => {
    const { openRides } = await import('../src/lib/chainplan.js');
    const e = [{ kind: 'ride', state: 'open' }, { kind: 'ride', state: 'open', bikeId: 'b1' }, { kind: 'ride', state: 'open', bikeId: 'b2' }, { kind: 'ride', state: 'counted', bikeId: 'b1' }];
    expect(openRides(e, 'b1')).toBe(2);
  });
});
