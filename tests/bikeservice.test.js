// «Velo im Griff» #193 (Noah 19.10.2026): the whole-bike service by km, riding hours or days, whichever comes first.
// Fictional data only; dates by calendar day.
import { describe, it, expect } from 'vitest';
import { SERVICE_STD, serviceValues, serviceOn, serviceState, serviceDone, serviceChange, serviceReset, serviceSwitch, serviceChanged, serviceLast } from '../src/lib/bikeservice.js';
import { firstDue } from '../src/lib/care.js';
import { hourSeries } from '../src/lib/bikehours.js';
import { bikeDue } from '../src/lib/workshop.js';
import { bikeCare } from '../src/lib/readiness.js';
import { useHours } from '../src/lib/veloimgriff.svelte.js';

const TODAY = '2026-10-19';
const bike = (service, extra = {}) => ({ id: 'test_data_gtp_svc', name: 'test_data_gtp_ Gravel', kind: 'gravel', km: 5000, parts: [], ...(service ? { service } : {}), ...extra });

describe('firstDue with riding hours', () => {
  it('takes whichever of km, days or hours comes first', () => {
    expect(firstDue({ sinceHours: 40, everyHours: 50 })).toMatchObject({ due: false, by: null, hoursLeft: 10, frac: 0.8 });
    expect(firstDue({ sinceKm: 100, everyKm: 3000, sinceDays: 10, everyDays: 365, sinceHours: 101, everyHours: 100 })).toMatchObject({ due: true, by: 'hours', hoursLeft: -1 });
    expect(firstDue({ sinceKm: 3100, everyKm: 3000, sinceHours: 101, everyHours: 100 })).toMatchObject({ due: true, by: 'km' });
    // the old calls stay the same
    expect(firstDue({ sinceKm: 20, everyKm: 150, sinceDays: 61, everyDays: 60 })).toMatchObject({ due: true, by: 'days', daysLeft: -1, hoursLeft: null });
  });
});

describe('the whole-bike service', () => {
  it('suggests 3000 km, 100 h and a year, each switchable off', () => {
    expect(serviceValues(bike())).toEqual(SERVICE_STD);
    expect(serviceValues(bike({ everyHours: null }))).toEqual({ ...SERVICE_STD, everyHours: null });
    expect(serviceOn(bike(serviceSwitch(bike(), false).service))).toBe(false);
    expect(serviceOn(bike(serviceSwitch(bike({ everyKm: 2000 }), true).service))).toBe(true);
    const ch = serviceChange(bike(), { everyKm: 2000, everyHours: 100, everyDays: '' });
    expect(ch.service).toEqual({ everyKm: 2000, everyDays: null });
    expect(serviceChanged(bike(ch.service))).toBe(true);
    expect(serviceReset(bike({ everyKm: 2000, last: { day: '2026-01-01', km: 1, hours: null } }))).toEqual({ service: { last: { day: '2026-01-01', km: 1, hours: null } } });
  });

  it('is not due before a first service is recorded', () => {
    expect(serviceState(bike(), null, TODAY)).toMatchObject({ on: true, never: true, due: false });
  });

  it('is due by km, by hours or by days, whichever comes first', () => {
    const last = (day, km) => ({ last: { day, km, hours: null } });
    expect(serviceState(bike(last('2026-09-01', 1900)), null, TODAY)).toMatchObject({ due: true, by: 'km', sinceKm: 3100 });
    expect(serviceState(bike(last('2025-10-18', 4900)), null, TODAY)).toMatchObject({ due: true, by: 'days', next: '2026-10-18' });
    expect(serviceState(bike(last('2026-09-01', 4500)), null, TODAY)).toMatchObject({ due: false, kmLeft: 2500 });
    // hours: an mtb at 14 km/h, 1500 km since the service ≈ 107 h
    const series = hourSeries({ id: 'test_data_gtp_svc', kind: 'mtb', km: 5000 }, [], []);
    const s = serviceState(bike(last('2026-09-01', 3500), { kind: 'mtb' }), series, TODAY);
    expect(s).toMatchObject({ due: true, by: 'hours', hoursEst: true });
    expect(s.sinceHours).toBeCloseTo(107.14, 1);
    expect(serviceState(bike({ ...last('2026-09-01', 3500), everyHours: null }, { kind: 'mtb' }), series, TODAY).due).toBe(false);
  });

  it('records «Service done» and the last service by hand', () => {
    expect(serviceDone(bike({ everyKm: 2000 }), { day: TODAY, km: 5000, hours: 300 })).toEqual({ service: { everyKm: 2000, last: { day: TODAY, km: 5000, hours: 300 } } });
    expect(serviceLast(bike(), { day: '2026-03-01', km: 3000 }).service.last).toEqual({ day: '2026-03-01', km: 3000, hours: null });
    expect(serviceLast(bike({ last: { day: '2026-03-01' } }), { day: '' }).service.last).toBe(null);
  });

  it('shows a due service where the other due points show (Bike care, Today, Bikes)', () => {
    const b = bike({ last: { day: '2026-09-01', km: 1900, hours: null } });
    const rows = bikeDue(b, { startDate: TODAY, days: 1 }, { front: null, rear: null }, TODAY, TODAY).rows;
    expect(rows.find((r) => r.key === 'service')).toMatchObject({ service: true, late: true, when: 'now' });
    const care = bikeCare(b, { today: TODAY });
    expect(care.rows.find((r) => r.kind === 'service')).toMatchObject({ part: null, late: true });
    expect(care.status).toBe('due');
    expect(bikeCare(bike(), { today: TODAY }).rows.some((r) => r.kind === 'service')).toBe(false);
  });

  it('makes fork and shock due by riding hours when set', () => {
    const fork = { key: 'fork', model: '', everyHours: 50, history: [{ date: '2026-09-01', km: 4000, action: 'service', result: 'done', by: 'self' }] };
    const b = { ...bike(), kind: 'mtb', type: 'Hardtail', parts: [fork] };
    useHours({ [b.id]: hourSeries(b, [], []) }); // 1000 km at 14 km/h ≈ 71 h
    try {
      const row = bikeDue(b, { startDate: TODAY, days: 1 }, { front: null, rear: null }, TODAY, TODAY).rows.find((r) => r.key === 'fork');
      expect(row).toMatchObject({ late: true, when: 'now' });
      expect(row.detail).toMatch(/≈ 71 h/);
      const off = { ...b, parts: [{ ...fork, everyHours: null }] };
      expect(bikeDue(off, { startDate: TODAY, days: 1 }, { front: null, rear: null }, TODAY, TODAY).rows.some((r) => r.key === 'fork')).toBe(false);
    } finally {
      useHours({});
    }
  });
});

describe('«Pflege für …»: fork and shock by riding hours', () => {
  it('offers an hours interval for fork and shock, off as the standard', async () => {
    const { careStd, careRow, checkCare, careChange, careHoursHint } = await import('../src/lib/care/plan.js');
    const { careText } = await import('../src/lib/care/plantext.js');
    expect(careStd('fork')).toEqual({ everyKm: null, everyDays: 365, everyHours: null });
    expect(careStd('wax')).not.toHaveProperty('everyHours');
    expect(careHoursHint('fork')).toBe(50);
    expect(checkCare('fork', { everyKm: null, everyDays: null, everyHours: 50 })).toEqual({ values: { everyKm: null, everyDays: null, everyHours: 50 } });
    expect(checkCare('fork', { everyKm: null, everyDays: null, everyHours: null })).toEqual({ error: 'interval' });
    const b = { id: 'test_data_gtp_mtb', type: 'Full suspension', kind: 'mtb', parts: [] };
    const ch = careChange(b, 'fork', { values: { everyDays: 365, everyHours: 50 } });
    expect(ch.parts.find((p) => p.key === 'fork')).toMatchObject({ everyHours: 50 });
    const row = careRow({ ...b, ...ch }, 'fork');
    expect(row).toMatchObject({ on: true, changed: true, values: { everyDays: 365, everyHours: 50 } });
    expect(careText(row)).toBe('every 365 days or 50 h, whichever comes first');
    expect(careText(row, { everyKm: 1000, everyDays: 365, everyHours: 50 })).toBe('every 1,000 km, 365 days or 50 h, whichever comes first');
  });
});
