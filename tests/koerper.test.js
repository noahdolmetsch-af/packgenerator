// «Körperwerte» (Noah 20.10.2026 «1-5 alle», «1a 2a 3a 4a 5a», «1-5a»): the values of the page behind
// the heart rate tile. Fictional numbers only.
import { describe, it, expect } from 'vitest';
import { cleanBp, cleanL, bpEntries, waterEntries, withDay, zoneMinOf, medByDay, bedMin, bedText, spreadMin, cadOf, spdOf, yearKm, yearToDate, tempPoints, tempBands } from '../src/lib/koerper.js';
import { BODY, BODY_GROUPS, BODY_TABS, BODY_KEYS, groupOf, bodyOf, bodyStats, stackBars, stagesOf } from '../src/lib/uebersicht.js';
import { dayTable } from '../src/lib/messwerte.js';
import { daysFrom, dailyOf } from '../api/_lib/googledays.js';
import { cleanDay, EXTRA, syncHealth, HEALTH_KEY, FILL_V } from '../src/lib/health.js';

const TODAY = '2026-10-09';
const ride = (id, day, o = {}) => ({ id, day, kind: 'bike', movingS: 3600, km: 25, ...o });

describe('Körperwerte: the groups', () => {
  it('every value sits in exactly one of the five groups', () => {
    expect(BODY_GROUPS.map((g) => g.key)).toEqual(['heart', 'sleep', 'act', 'body', 'bike']);
    expect([...BODY_TABS].sort()).toEqual(BODY_KEYS.map((b) => b.key).sort());
    expect(new Set(BODY_TABS).size).toBe(BODY_TABS.length);
    expect(groupOf('bp')).toBe('heart');
    expect(groupOf('water')).toBe('body');
    expect(groupOf('temp')).toBe('bike');
  });
  it('entries are blood pressure, water and weight', () => {
    expect(BODY_KEYS.filter((b) => b.entry).map((b) => b.key).sort()).toEqual(['bp', 'water', 'weight']);
  });
});

describe('Körperwerte: own entries', () => {
  it('cleans blood pressure', () => {
    expect(cleanBp('121', '79')).toEqual({ sys: 121, dia: 79 });
    expect(cleanBp(80, 90)).toBeNull();
    expect(cleanBp(300, 80)).toBeNull();
    expect(cleanBp('', '')).toBeNull();
  });
  it('cleans litres', () => {
    expect(cleanL('2,5')).toBe(2.5);
    expect(cleanL(0)).toBeNull();
    expect(cleanL(12)).toBeNull();
  });
  it('keeps one entry per day, the last one counts, and removes a day', () => {
    const e = bpEntries({ entries: [{ day: '2026-10-02', sys: 120, dia: 80 }, { day: '2026-10-01', sys: 118, dia: 76 }, { day: '2026-10-02', sys: 125, dia: 82 }, { day: 'x', sys: 120, dia: 80 }] });
    expect(e).toEqual([{ day: '2026-10-01', sys: 118, dia: 76 }, { day: '2026-10-02', sys: 125, dia: 82 }]);
    expect(withDay(e, '2026-10-01', null)).toEqual([{ day: '2026-10-02', sys: 125, dia: 82 }]);
    const w = withDay(waterEntries({ entries: [{ day: '2026-10-03', l: 2 }] }), '2026-10-01', { l: 1.5 });
    expect(w).toEqual([{ day: '2026-10-01', l: 1.5 }, { day: '2026-10-03', l: 2 }]);
  });
});

describe('Körperwerte: counted values', () => {
  it('minutes per pulse zone from the histograms', () => {
    const row = { acts: [{ hist: { 100: 600, 150: 1200 } }, { hist: { 185: 300 } }, { hist: null }] };
    expect(zoneMinOf(row, [120, 140, 160, 175])).toEqual([10, 0, 20, 0, 5]);
    expect(zoneMinOf({ acts: [] }, [120, 140, 160, 175])).toBeNull();
  });
  it('meditation minutes per day, 10 for a tick without minutes', () => {
    const m = medByDay([{ actId: 'meditation', day: TODAY, min: 15 }, { actId: 'meditation', day: TODAY }, { actId: 'read', day: TODAY, min: 30 }]);
    expect(m.get(TODAY)).toBe(25);
    expect(m.size).toBe(1);
  });
  it('bedtime as minutes after noon, so midnight does not split it', () => {
    expect(bedMin('23:30')).toBe(690);
    expect(bedMin('00:30')).toBe(750);
    expect(bedText(750)).toBe('00:30');
    expect(bedMin('x')).toBeNull();
    expect(spreadMin([690, 690, 690])).toBe(0);
    expect(spreadMin([660, 720])).toBeNull();
  });
  it('cadence and speed of the rides, weighted by time', () => {
    const row = { acts: [ride('a', TODAY, { cad: 80, km: 30 }), ride('b', TODAY, { cad: 90, movingS: 1800, km: 10 }), { kind: 'run', movingS: 3600, km: 10, cad: 170 }] };
    expect(cadOf(row)).toBe(83);
    expect(spdOf(row)).toBe(26.7);
    expect(cadOf({ acts: [] })).toBeNull();
  });
  it('kilometres of the year against the year before', () => {
    const table = new Map([
      ['2026-01-10', { bikeKm: 100 }],
      ['2026-03-05', { bikeKm: 50 }],
      ['2026-10-20', { bikeKm: 70 }],
      ['2025-02-01', { bikeKm: 80 }],
      ['2025-11-01', { bikeKm: 40 }],
    ]);
    const y = yearKm(table, 2026, TODAY);
    expect(y).toHaveLength(12);
    expect(y[0]).toEqual({ key: '2026-01-01', now: 100, before: 0 });
    expect(y[9].now).toBe(220);
    expect(y[10].now).toBeNull();
    expect(y[11].before).toBe(120);
    expect(yearToDate(table, TODAY)).toEqual({ now: 150, before: 80 });
  });
  it('temperature and pulse, one dot per ride, three bands', () => {
    const table = new Map([[TODAY, { acts: [ride('a', TODAY, { tempAvg: 25, hrAvg: 150 }), ride('b', TODAY, { tempAvg: 5, hrAvg: 130 }), ride('c', TODAY, { hrAvg: 140 })] }]]);
    const p = tempPoints(table, '2026-10-01', TODAY);
    expect(p.map((x) => x.id)).toEqual(['a', 'b']);
    expect(tempBands(p)).toEqual([{ band: 'cold', n: 1, hr: 130 }, { band: 'mild', n: 0, hr: null }, { band: 'warm', n: 1, hr: 150 }]);
  });
});

describe('Körperwerte: per day and range', () => {
  const health = [
    { date: TODAY, sleep: { asleepMin: 420, deepMin: 80, remMin: 90, lightMin: 220, awakeMin: 30, start: '23:10', end: '07:00', efficiency: 92 }, spo2: 96.5, breath: 14.2, skinTemp: -0.3 },
    { date: '2026-10-08', sleep: { asleepMin: 400, start: '00:20', end: '07:10', efficiency: 88 } },
  ];
  const table = dayTable({ health, acts: [ride('a', TODAY, { cad: 85, hist: { 150: 1800 } })], bikeRides: [{ date: TODAY, km: 25, gainM: 200 }] });
  it('the Fitbit night values reach the day table', () => {
    const r = table.get(TODAY);
    expect([r.spo2, r.breath, r.skinTemp, r.bikeKm]).toEqual([96.5, 14.2, -0.3, 25]);
    expect(stagesOf(r)).toMatchObject({ deep: 80, rem: 90, start: '23:10' });
  });
  it('bodyOf reads every kind of value', () => {
    const ctx = { bounds: [120, 140, 160, 175], bp: new Map([[TODAY, { sys: 121, dia: 79 }]]), water: new Map([[TODAY, 2.5]]), med: new Map([[TODAY, 15]]) };
    expect(bodyOf(table, TODAY, 'eff')).toBe(92);
    expect(bodyOf(table, TODAY, 'bed')).toBe(670);
    expect(bodyOf(table, '2026-10-08', 'bed')).toBe(740);
    expect(bodyOf(table, TODAY, 'spo2')).toBe(96.5);
    expect(bodyOf(table, TODAY, 'skin')).toBe(-0.3);
    expect(bodyOf(table, TODAY, 'cad')).toBe(85);
    expect(bodyOf(table, TODAY, 'zones', new Map(), ctx)).toBe(30);
    expect(bodyOf(table, TODAY, 'bp', new Map(), ctx, 'dia')).toBe(79);
    expect(bodyOf(table, TODAY, 'water', new Map(), ctx)).toBe(2.5);
    expect(bodyOf(table, TODAY, 'med', new Map(), ctx)).toBe(15);
  });
  it('a range: mean, total for counted values, stacked bars', () => {
    const s = bodyStats(table, TODAY, 'eff', 'd7');
    expect(s.points).toHaveLength(7);
    expect(s.mean).toBe(90);
    expect(s.total).toBeNull();
    const z = stackBars(table, TODAY, 'd7', 0, 'zones', [120, 140, 160, 175]);
    expect(z.at(-1)).toMatchObject({ z3: 30, asleep: 30 });
    expect(stackBars(table, TODAY, 'y1', 0, 'stages')).toHaveLength(12);
    expect(BODY.zones.sum).toBe(true);
  });
});

describe('Körperwerte: Fitbit oxygen, breathing and skin temperature', () => {
  it('reads the daily summaries tolerantly', () => {
    const date = { year: 2026, month: 10, day: 9 };
    expect(dailyOf({ dailyOxygenSaturation: { date, averagePercentage: 96 } })?.date).toBe(TODAY);
    const rows = daysFrom(
      {
        spo2: [{ dailyOxygenSaturation: { date, upperBoundPercentage: 99, averagePercentage: 96.4, lowerBoundPercentage: 92 } }],
        breath: [{ dailyRespiratoryRate: { date, breathsPerMinute: 14.26 } }],
        skin: [{ dailySleepTemperatureDerivations: { date, baselineTemperatureCelsius: 33.5, nightlyTemperatureCelsius: 33.266 } }, { dailySleepTemperatureDerivations: { date: { year: 2026, month: 10, day: 8 }, nightlyTemperatureCelsius: 34 } }],
      },
      '2026-10-08',
      TODAY,
    );
    expect(rows).toEqual([{ date: TODAY, spo2: 96.4, breath: 14.3, skinTemp: -0.23 }]);
  });
  it('the app keeps them with a day', () => {
    expect(EXTRA).toEqual(expect.arrayContaining(['spo2', 'breath', 'skinTemp']));
    expect(cleanDay({ date: TODAY, spo2: 96, breath: 14, skinTemp: 0.1 })).toEqual({ date: TODAY, spo2: 96, breath: 14, skinTemp: 0.1 });
  });
});

describe('Körperwerte: new values reach the older days once', () => {
  const fake = (rows = [], prefs = {}) => {
    const days = new Map(rows.map((r) => [r.date, r]));
    const settings = new Map([[HEALTH_KEY, { key: HEALTH_KEY, value: prefs }]]);
    const sorted = () => [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
    return {
      healthDays: {
        orderBy: () => ({ last: async () => sorted().at(-1), first: async () => sorted()[0] }),
        bulkGet: async (ks) => ks.map((k) => days.get(k)),
        bulkPut: async (list) => list.forEach((r) => days.set(r.date, r)),
      },
      settings: { get: async (k) => settings.get(k), put: async (r) => settings.set(r.key, r) },
      transaction: async (_m, _t, fn) => fn(),
    };
  };
  const now = new Date('2026-10-09T10:00:00+02:00');
  it('the first fetch after the update goes back 30 days, the next one only a few', async () => {
    const db = fake([{ date: '2026-10-08', restingHr: 50 }]);
    const asked = [];
    const c = async (_s, o) => (asked.push(o.params), { days: [] });
    await syncHealth(db, { c, now });
    expect(asked[0]).toEqual({ from: '2026-09-10', to: TODAY });
    expect((await db.settings.get(HEALTH_KEY)).value.fill).toBe(FILL_V);
    await syncHealth(db, { c, now });
    expect(asked[1]).toEqual({ from: '2026-10-05', to: TODAY });
  });
});
