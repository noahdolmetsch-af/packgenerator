// AT1 «Abgeschlossene Touren aus Strava»: the rows of every Strava activity (touren/aktivitaeten.js).
import { describe, it, expect } from 'vitest';
import { tourRows, actRow, fieldsOf, FIELDS, PAGE, inPeriodRows, sportCounts, byMonth, zoneParts, bikeMap, stravaOfTrip } from '../src/lib/touren/aktivitaeten.js';
import { actRecord, DEFAULT_BOUNDS } from '../src/lib/training.js';

// fictional activities, as the store keeps them (training.js actRecord) plus the detail fields
const act = (id, day, o = {}) => ({
  ...actRecord({ id, startLocal: `${day}T${o.time ?? '08:00'}:00`, name: o.name ?? `Fahrt ${id}`, type: o.type ?? 'Ride', km: o.km ?? 40, hm: o.hm ?? 500, movingS: o.movingS ?? 7200, elapsedS: o.elapsedS ?? 8000, hrAvg: o.hrAvg ?? 130, hrMax: o.hrMax ?? 165, cad: o.cad ?? 85, spdAvg: o.spdAvg ?? 20, spdMax: o.spdMax ?? 50, wAvg: o.wAvg ?? null, wMax: o.wMax ?? null, wDevice: o.wDevice ?? false, wNorm: o.wNorm ?? null }),
  ...(o.hist ? { hist: o.hist } : {}),
  ...(o.w20 ? { w20: o.w20 } : {}),
});
const trip = (id, startDate, days = 1, title = `Tour ${id}`) => ({ id, title, startDate, days, entries: [] });

describe('AT1 rows', () => {
  it('every activity is a row, newest first', () => {
    const rows = tourRows([act('1', '2026-10-01'), act('2', '2026-10-05', { type: 'Run' }), act('3', '2026-09-20', { type: 'Hike' })]);
    expect(rows.map((r) => r.id)).toEqual(['a:2', 'a:1', 'a:3']);
    expect(rows.map((r) => r.kind)).toEqual(['run', 'bike', 'hike']);
    expect(rows[0].href).toBe('#/flow/training/a/2');
  });

  it('a Packmodus trip marks its one activity and keeps the Strava name', () => {
    const rows = tourRows([act('1', '2026-10-06', { name: 'Napf mit Bergpreis' }), act('2', '2026-10-07')], { packed: [{ trip: trip('t1', '2026-10-06'), state: 'rated' }] });
    const napf = rows.find((r) => r.id === 'a:1');
    expect(napf.name).toBe('Napf mit Bergpreis');
    expect(napf.pm).toEqual({ tripId: 't1', title: 'Tour t1', state: 'rated' });
    expect(rows.find((r) => r.id === 'a:2').pm).toBeNull();
  });

  it('3a: several activities of one multi-day trip are one row with the trip name', () => {
    const acts = [act('1', '2026-09-30', { km: 60, hm: 900, movingS: 3600 * 3, hrAvg: 130, hrMax: 160 }), act('2', '2026-10-01', { km: 50, hm: 700, movingS: 3600, hrAvg: 140, hrMax: 170 })];
    const rows = tourRows(acts, { packed: [{ trip: trip('t1', '2026-09-30', 2, 'Chasseral'), state: 'done' }] });
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r).toMatchObject({ id: 't:t1', name: 'Chasseral', n: 2, day: '2026-09-30', endDay: '2026-10-01', km: 110, hm: 1600, dauer: 4 * 3600, hfmax: 170 });
    expect(r.hf).toBe(133); // weighted by moving time: (130×3 + 140×1) / 4 = 132.5
    expect(r.kmh).toBe(27.5);
    expect(r.actIds).toEqual(['1', '2']);
  });

  it('a run or a hike never joins a trip (only bike activities count for a tour)', () => {
    const rows = tourRows([act('1', '2026-10-06'), act('2', '2026-10-06', { type: 'Run' })], { packed: [{ trip: trip('t1', '2026-10-06'), state: 'done' }] });
    expect(rows.map((r) => [r.id, !!r.pm])).toEqual([
      ['a:1', true],
      ['a:2', false],
    ]);
  });

  it('the bike is the one the ride ledger counted the activity for', () => {
    const rows = tourRows([act('7', '2026-10-01')], { kmBook: [{ stravaId: '7', bikeId: 'b1', source: 'strava' }] });
    expect(rows[0].bikeId).toBe('b1');
    expect(bikeMap([{ stravaId: '7', bikeId: 'b1', state: 'removed' }])({ id: '7' })).toBeNull();
  });
});

describe('AT1 values (answers 1a, 2a, 3b)', () => {
  it('1a: TSS only with a power meter, from NP and the FTP', () => {
    const withPm = actRow(act('1', '2026-10-01', { wDevice: true, wAvg: 180, wMax: 700, wNorm: 200, movingS: 3600, w20: 240 }), { ftp: 200 });
    expect(withPm.tss).toBe(100);
    expect(withPm.wmax).toBe(700);
    expect(withPm.w20).toBe(240);
    const estimated = actRow(act('2', '2026-10-01', { wDevice: false, wAvg: 150, wMax: 600, wNorm: 160 }), { ftp: 200 });
    expect(estimated.tss).toBeNull();
    expect(estimated.wmax).toBeNull();
    expect(estimated.w).toBe(150);
  });

  it('2a: the zones in minutes and percent', () => {
    const r = actRow(act('1', '2026-10-01', { hist: { 100: 600, 125: 1200, 140: 600, 160: 300, 180: 300 } }), { bounds: DEFAULT_BOUNDS });
    expect(r.zones).toEqual([600, 1200, 600, 300, 300]);
    expect(zoneParts(r.zones)).toEqual([
      { min: 10, pct: 20 },
      { min: 20, pct: 40 },
      { min: 10, pct: 20 },
      { min: 5, pct: 10 },
      { min: 5, pct: 10 },
    ]);
    expect(zoneParts(null)).toBeNull();
  });

  it('3b: a ride shows every value, other sports only those that fit', () => {
    expect(fieldsOf(actRow(act('1', '2026-10-01')))).toEqual(FIELDS.bike);
    const run = actRow(act('2', '2026-10-01', { type: 'Run', cad: 82 }));
    expect(fieldsOf(run)).toEqual(['dauer', 'verstr', 'hf', 'hfmax', 'tf', 'kmh', 'kmhmax']);
    expect(run.tf).toBe(164); // Strava sends a run's cadence per leg
    expect(fieldsOf(actRow(act('3', '2026-10-01', { type: 'Hike' })))).toEqual(FIELDS.hike);
    expect(fieldsOf(actRow(act('4', '2026-10-01', { type: 'Yoga' })))).toEqual(FIELDS.other);
  });
});

describe('AT1 list (answer 4b)', () => {
  it('20 at first; period, sport chips and months', () => {
    expect(PAGE).toBe(20);
    const rows = tourRows([act('1', '2026-10-01'), act('2', '2026-09-03', { type: 'Run' }), act('3', '2025-01-01')]);
    expect(inPeriodRows(rows, { from: '2025-10-15', to: '2026-10-14' }).map((r) => r.id)).toEqual(['a:1', 'a:2']);
    expect(sportCounts(rows)).toEqual([
      { key: 'all', n: 3 },
      { key: 'bike', n: 2 },
      { key: 'run', n: 1 },
    ]);
    expect(byMonth(rows).map((g) => [g.month, g.rows.length])).toEqual([
      ['2026-10', 1],
      ['2026-09', 1],
      ['2025-01', 1],
    ]);
  });

  it('the Strava line of a Packmodus row', () => {
    const t1 = trip('t1', '2026-10-06');
    expect(stravaOfTrip(t1, [act('1', '2026-10-06', { name: 'Napf' })])).toEqual({ n: 1, name: 'Napf' });
    expect(stravaOfTrip(t1, [])).toEqual({ n: 0, name: '' });
  });
});
