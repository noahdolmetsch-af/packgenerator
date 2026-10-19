// Package G «Daten kommen von selbst» (#231–#233): the data milestones (Velo-km from the ledger and
// Strava, Fitbit as observation, Tages-Check streak, nothing forgotten, care on time), that they never
// show on Heute, and their German words. Fictional data only; days are calendar days (addDays on a
// date string), never «now + n × 24 h».
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { seedActs, addDays } from '../src/lib/flow.js';
import { msContext, dataMilestones, allMilestones, crossMilestones, evaluate, forHeute, showcase, DATA_AREAS } from '../src/lib/flowms.js';
import { msExtra, rideKmByDay, healthMaps, checkDaysOf, packOkDays, careOnTimeDays } from '../src/lib/flow/msdata.js';
import DE from '../src/lib/i18n/de/sterne-g.js';

const T = '2026-10-09'; // a Friday
const Y = T.slice(0, 4);
const acts = seedActs();
const ctxOf = (extra, today = T, log = []) => msContext({ acts, log, today, extra });
const byId = (ctx, id) => dataMilestones(ctx).find((m) => m.id === id);
const run = (ctx, id) => evaluate(byId(ctx, id), ctx);

describe('without the data sources nothing changes', () => {
  it('a caller without extra gets the same days and no data milestone', () => {
    const log = [{ id: 'e1', actId: 'meditation', day: addDays(T, -3), at: `${addDays(T, -3)}T07:00:00.000Z`, min: 20, n: 1 }];
    const ctx = msContext({ acts, log, today: T });
    expect(ctx.days[0]).toBe(addDays(T, -3));
    expect(ctx.extra).toBeNull();
    expect(dataMilestones(ctx)).toEqual([]);
    expect(allMilestones(ctx).some((r) => r.m.group === 'data')).toBe(false);
  });
  it('the days start at the earliest day of any source', () => {
    const ctx = ctxOf({ rideKm: new Map([[addDays(T, -400), 30]]) });
    expect(ctx.days[0]).toBe(addDays(T, -400));
    expect(ctx.days.at(-1)).toBe(T);
  });
  it('days after today and broken days are left out', () => {
    const ctx = ctxOf({ rideKm: new Map([[addDays(T, 2), 50], ['nope', 10], [T, 20]]) });
    expect(ctx.days).toEqual([T]);
    expect(run(ctx, `d.bikeKm.${Y}`).value).toBe(20);
  });
});

describe('#231 Velo-km: each ride counts once', () => {
  const book = [
    { id: 'k1', kind: 'ride', state: 'counted', date: `${Y}-03-01`, km: 300, source: 'csv', stravaId: '11' },
    { id: 'k2', kind: 'ride', state: 'counted', date: `${Y}-05-01`, km: 250, source: 'strava', stravaId: '12' },
    { id: 'k3', kind: 'ride', state: 'open', date: `${Y}-05-02`, km: 99, source: 'strava', stravaId: '13' },
    { id: 'k4', kind: 'ride', state: 'removed', date: `${Y}-05-03`, km: 77, source: 'strava', stravaId: '14' },
    { id: 'k5', kind: 'start', state: 'counted', date: `${Y}-01-01`, km: 5000, source: 'hand' },
    { id: 'k6', kind: 'ride', state: 'counted', date: `${Y}-06-01`, km: 40, source: 'fit' },
  ];
  const strava = [
    { id: '11', kind: 'bike', day: `${Y}-03-01`, km: 300 }, // in the ledger (Strava id)
    { id: '12', kind: 'bike', day: `${Y}-05-01`, km: 250 }, // in the ledger
    { id: '13', kind: 'bike', day: `${Y}-05-02`, km: 99 }, // waits in «Zum Prüfen»: not yet
    { id: '14', kind: 'bike', day: `${Y}-05-03`, km: 77 }, // left out by you: never
    { id: '15', kind: 'bike', day: `${Y}-02-10`, km: 60 }, // before a bike's start point: no entry, counts
    { id: '16', kind: 'bike', day: `${Y}-06-01`, km: 40.5 }, // the same ride as the file k6: once
    { id: '17', kind: 'bike', day: `${Y}-07-01`, km: 35, type: 'VirtualRide' }, // indoor without a bike
    { id: '18', kind: 'bike', day: `${Y}-07-02`, km: 80, gearId: 'g9' }, // on an ignored Strava bike
    { id: '19', kind: 'run', day: `${Y}-07-03`, km: 10 }, // not a ride
  ];
  it('ledger rides that count plus the Strava rides the ledger does not know', () => {
    const m = rideKmByDay(book, strava, ['g9']);
    expect([...m.entries()].sort()).toEqual([
      [`${Y}-02-10`, 60],
      [`${Y}-03-01`, 300],
      [`${Y}-05-01`, 250],
      [`${Y}-06-01`, 40],
    ]);
  });
  it('stars per year: 500 km reached on the day the year passed it', () => {
    const ctx = ctxOf({ rideKm: rideKmByDay(book, strava, ['g9']) });
    const r = run(ctx, `d.bikeKm.${Y}`);
    expect(r.value).toBe(650);
    expect(r.reached).toEqual([{ star: 1, day: `${Y}-05-01`, id: `d.bikeKm.${Y}:1` }]);
    expect(r.m.unit).toBe('km');
    expect(r.m.area).toBe('bike');
  });
  it('last year’s km do not count for this year', () => {
    const ctx = ctxOf({ rideKm: new Map([[`${Number(Y) - 1}-12-31`, 900], [`${Y}-01-01`, 10]]) });
    expect(run(ctx, `d.bikeKm.${Y}`).value).toBe(10);
  });
});

describe('#232 Fitbit: observation only, suggested and optional', () => {
  const rows = [
    { date: addDays(T, -2), steps: 12000, azm: 40, sleep: { asleepMin: 430 } },
    { date: addDays(T, -1), steps: 9000, azm: 20, sleep: { asleepMin: 380 } },
    { date: T, steps: 10000, azm: 30 },
  ];
  const ctx = ctxOf(healthMaps(rows));
  it('step days, active zone minutes of the year, nights of 7 hours', () => {
    expect(run(ctx, 'd.steps10k').value).toBe(2);
    expect(run(ctx, `d.azm.${Y}`).value).toBe(90);
    expect(run(ctx, 'd.sleep7').value).toBe(1);
  });
  it('all three can be switched off and are suggestions; the words judge nothing', () => {
    const fit = dataMilestones(ctx).filter((m) => m.area === 'fitbit');
    expect(fit).toHaveLength(3);
    for (const m of fit) {
      expect(m.sugg && m.opt).toBe(true);
      const words = `${m.name} ${m.what} ${DE[m.name]} ${DE[m.what]}`;
      expect(words).not.toMatch(/good|bad|better|worse|healthy|gut|schlecht|besser|schlechter|gesund/i);
    }
  });
  it('without Fitbit days there are no Fitbit milestones', () => {
    expect(dataMilestones(ctxOf(healthMaps([]))).filter((m) => m.area === 'fitbit')).toEqual([]);
  });
});

describe('#233 everyday and packing', () => {
  it('a check day needs an answer; «Deine Abfragen» answers count too', () => {
    const days = checkDaysOf(
      [
        { day: addDays(T, -3), sleep: 7 },
        { day: addDays(T, -2), joy: ['sun'] },
        { day: addDays(T, -1) }, // an empty row: no answer
      ],
      [{ day: addDays(T, -1), qid: 'erholung.akku', value: 6 }, { day: T, qid: 'x', value: null, note: null }],
    );
    expect([...days].sort()).toEqual([addDays(T, -3), addDays(T, -2), addDays(T, -1)]);
  });
  it('the streak runs on until today has passed', () => {
    const ctx = ctxOf({ checkDays: new Set([addDays(T, -3), addDays(T, -2), addDays(T, -1)]) });
    const r = run(ctx, 'd.checkStreak');
    expect(r.value).toBe(3);
    expect(r.reached.map((s) => s.day)).toEqual([addDays(T, -1)]);
  });
  it('nothing forgotten: finished debriefs without anything missing, on the trip’s last day', () => {
    const trips = [
      { id: 't1', startDate: `${Y}-06-10`, days: 3 },
      { id: 't2', startDate: `${Y}-07-10`, days: 2 },
      { id: 't3', startDate: `${Y}-08-10`, days: 1, testTrip: true },
      { id: 't4', startDate: `${Y}-09-01`, days: 2 },
    ];
    const debriefs = [
      { tripId: 't1', status: 'done', missing: [] },
      { tripId: 't2', status: 'done', missing: [{ id: 'm1', name: 'Fictional pump' }] },
      { tripId: 't3', status: 'done', missing: [] },
      { tripId: 't4', status: 'draft', missing: [] },
    ];
    expect(packOkDays(trips, debriefs)).toEqual([`${Y}-06-12`]);
    expect(packOkDays(trips, [])).toBeNull();
    const ctx = ctxOf({ packOk: packOkDays(trips, debriefs) });
    expect(run(ctx, 'd.packOk').reached).toEqual([{ star: 1, day: `${Y}-06-12`, id: 'd.packOk:1' }]);
  });
  it('care on time: within the interval by km and by days; the first service compares with nothing', () => {
    const bike = {
      id: 'b1',
      parts: [
        {
          key: 'chain',
          history: [
            { date: `${Y}-03-01`, km: 1000, action: 'service', result: 'done' },
            { date: `${Y}-03-20`, km: 1140, action: 'service', result: 'done' }, // 140 km: on time
            { date: `${Y}-04-20`, km: 1400, action: 'service', result: 'done' }, // 260 km: late
            { date: `${Y}-04-25`, km: 1450, action: 'check', result: 'ok' }, // a check is no service
          ],
        },
        {
          key: 'tyres',
          history: [
            { date: `${Y}-01-10`, km: null, action: 'service', result: 'done' },
            { date: `${Y}-03-31`, km: null, action: 'service', result: 'done' }, // 80 days: on time
            { date: `${Y}-08-01`, km: null, action: 'service', result: 'done' }, // 123 days: late
          ],
        },
        { key: 'bolts', history: [{ date: `${Y}-02-01`, action: 'service' }, { date: `${Y}-02-02`, action: 'service' }] }, // no interval
      ],
    };
    expect(careOnTimeDays([bike]).sort()).toEqual([`${Y}-03-20`, `${Y}-03-31`]);
    expect(careOnTimeDays([])).toBeNull();
  });
});

describe('only on Aktiv, Meilensteine and the Vitrine, never on Heute', () => {
  const extra = msExtra({
    book: [{ id: 'k1', kind: 'ride', state: 'counted', date: addDays(T, -5), km: 600 }],
    health: [{ date: addDays(T, -1), steps: 11000 }],
    checks: [{ day: T, mood: 7 }],
  });
  const ctx = ctxOf(extra);
  const list = allMilestones(ctx);
  it('the data milestones are in the list with group «data» and a data area', () => {
    const data = list.filter((r) => r.m.group === 'data');
    expect(data.map((r) => r.id).sort()).toEqual([`d.bikeKm.${Y}`, 'd.checkStreak', 'd.steps10k']);
    for (const r of data) expect(DATA_AREAS).toContain(r.m.area);
  });
  it('forHeute drops them, the showcase groups them by their area', () => {
    expect(forHeute(list).some((r) => r.m.group === 'data')).toBe(false);
    expect(forHeute(list).length).toBe(list.length - list.filter((r) => r.m.group === 'data').length);
    expect(showcase(list).groups.map((g) => g.key)).toContain('bike');
  });
  it('no Heute source reads the data milestones', () => {
    const files = [...readdirSync('src/lib/home').map((f) => `src/lib/home/${f}`), 'src/pages/Home.svelte'];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/dataMilestones|msExtra|flow\/msdata|hobbyQuery/);
    }
  });
});

describe('German words', () => {
  it('every name, description and area of the data milestones has a German text', () => {
    const extra = {
      rideKm: new Map([[T, 1]]),
      steps: new Map([[T, 1]]),
      azm: new Map([[T, 1]]),
      sleepMin: new Map([[T, 1]]),
      checkDays: new Set([T]),
      packOk: [T],
      careOnTime: [T],
    };
    const all = dataMilestones(ctxOf(extra));
    expect(all).toHaveLength(7);
    for (const m of all) {
      expect(DE[m.name], m.name).toBeTruthy();
      expect(DE[m.what], m.what).toBeTruthy();
      expect(m.steps.length).toBeLessThanOrEqual(7);
      expect([...m.steps].sort((a, b) => a - b)).toEqual(m.steps);
    }
    for (const k of ['Bike|msarea', 'Fitbit|msarea', 'Everyday|msarea']) expect(DE[k], k).toBeTruthy();
    for (const v of Object.values(DE)) expect(v).not.toMatch(/ß/);
  });
});
