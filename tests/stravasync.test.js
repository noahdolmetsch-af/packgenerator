// E3: Strava activities from the server as ledger rides. Fictional bikes and rides only.
import { describe, it, expect } from 'vitest';
import { toRides, gearChanges, typeName } from '../src/lib/stravasync.js';

const bikes = [{ id: 'b1', name: 'Gravel Blau' }, { id: 'b2', name: 'MTB Rot' }];
const act = (over = {}) => ({ id: '11', name: 'Runde', type: 'GravelRide', start: '2026-10-11T22:30:00Z', km: 42.3, gearId: 'b1', device: 'Garmin Edge 540', trainer: false, ...over });

describe('toRides', () => {
  it('turns an activity into a ledger ride with the bike name and the Zurich day', () => {
    const { rides, other } = toRides([act()], bikes);
    expect(other).toBe(0);
    expect(rides[0]).toMatchObject({ source: 'strava', date: '2026-10-12', km: 42.3, type: 'Gravel Ride', gear: 'Gravel Blau', stravaId: '11' });
  });

  it('counts runs and indoor rides without a bike as other', () => {
    const { rides, other } = toRides([act({ id: '1', type: 'Run' }), act({ id: '2', type: 'VirtualRide', gearId: null }), act({ id: '3', type: 'VirtualRide' })], bikes);
    expect(other).toBe(2);
    expect(rides.map((r) => r.stravaId)).toEqual(['3']);
  });

  it('keeps a ride without a bike (it goes to «Prüfen»)', () => {
    expect(toRides([act({ gearId: null })], bikes).rides[0].gear).toBe('');
  });

  it('typeName splits Strava sport types', () => {
    expect(typeName('EMountainBikeRide')).toBe('E-Mountain Bike Ride');
    expect(typeName('Ride')).toBe('Ride');
  });
});

describe('gearChanges', () => {
  it('finds rides whose bike was changed in Strava', () => {
    const known = [{ id: 'k1', stravaId: '11', gear: 'Gravel Blau' }, { id: 'k2', stravaId: '12', gear: 'MTB Rot' }];
    const { rides } = toRides([act({ gearId: 'b2' }), act({ id: '12', gearId: 'b2' }), act({ id: '13' })], bikes);
    const changes = gearChanges(known, rides);
    expect(changes).toHaveLength(1);
    expect(changes[0].entry.id).toBe('k1');
    expect(changes[0].ride.gear).toBe('MTB Rot');
  });
});

// v0.112.0 «Strava-Verbindung»: one fetch planned (decisions 2a, 3b, 4b; server answer 3a)
import { planSync, suggestBike, recheckFrom, mergeChanges, errorText } from '../src/lib/stravasync.js';
import { makeEntry } from '../src/lib/kmbook.js';

describe('planSync', () => {
  const appBikes = [{ id: 'gb', name: 'Gravel Blau' }, { id: 'mr', name: 'MTB Rot' }];
  const gear = [{ id: 'g1', name: 'Gravel Blau' }, { id: 'g2', name: 'MTB Rot' }, { id: 'g3', name: 'Altes Rennvelo' }];
  const a = (id, over = {}) => ({ id, name: `Fahrt ${id}`, type: 'GravelRide', start: '2026-10-05T07:00:00Z', km: 40, gearId: 'g1', device: '', trainer: false, ...over });
  const start = (bikeId, date) => makeEntry({ id: `s-${bikeId}`, bikeId, date, km: 1000, kind: 'start', source: 'hand' });
  const base = [start('gb', '2026-01-01'), start('mr', '2026-01-01')];

  it('assigns rides by their Strava bike, counts what is known, before the start, to check', () => {
    const csv = makeEntry({ id: 'csv1', bikeId: 'gb', date: '2026-10-02', km: 30, kind: 'ride', source: 'csv', gear: 'Gravel Blau', stravaId: '2' });
    const csvNoId = makeEntry({ id: 'csv2', bikeId: 'mr', date: '2026-10-03', time: '2026-10-03T08:00:00Z', km: 25, kind: 'ride', source: 'csv', gear: 'MTB Rot' });
    const acts = [
      a('1'),
      a('2', { start: '2026-10-02T07:00:00Z', km: 30 }),
      a('3', { start: '2026-10-03T08:05:00Z', km: 25.2, gearId: 'g2', type: 'MountainBikeRide' }),
      a('4', { start: '2025-06-01T07:00:00Z', gearId: 'g2' }),
      a('5', { gearId: null, start: '2026-10-06T07:00:00Z' }),
      a('6', { gearId: 'g3', start: '2026-10-07T07:00:00Z' }),
      a('7', { type: 'Run', gearId: null }),
    ];
    const p = planSync({ activities: acts, gear, bikes: appBikes, entries: [...base, csv, csvNoId], ignore: ['g3'], importId: 'imp' });
    expect(p.counts).toEqual({ found: 6, known: 2, inStart: 1, assigned: 1, check: 1, other: 1, ignored: 1 });
    expect(p.entries.map((e) => [e.stravaId, e.bikeId, e.state, e.source, e.importId])).toEqual([
      ['1', 'gb', 'counted', 'strava', 'imp'],
      ['5', null, 'open', 'strava', 'imp'],
    ]);
    expect(p.perBike).toEqual({ gb: { n: 1, km: 40 } });
    expect(p.km).toBe(40);
    // the CSV ride without an id gets the Strava id, so a later fetch knows it
    expect(p.updates).toEqual([{ id: 'csv2', changes: { stravaId: '3' } }]);
  });

  it('a ride without a bike: suggestion from the ride type rule or the usual bike; «auto» counts it', () => {
    const usual = [1, 2, 3].map((n) => makeEntry({ id: `u${n}`, bikeId: 'mr', date: '2026-09-0' + n, km: 20, kind: 'ride', source: 'csv', type: 'Mountain Bike Ride' }));
    const ride = { type: 'Mountain Bike Ride', gear: '' };
    expect(suggestBike(ride, { bikes: appBikes, entries: [...base, ...usual] })).toEqual({ bikeId: 'mr', why: 'usual', n: 3 });
    expect(suggestBike(ride, { bikes: appBikes, rules: [{ kind: 'type', value: 'mountain bike ride', bikeIds: ['gb'] }] })).toEqual({ bikeId: 'gb', why: 'rule', n: 0 });
    expect(suggestBike({ type: 'Ride', gear: '' }, { bikes: appBikes, entries: usual })).toBe(null);
    const acts = [a('9', { gearId: null, type: 'MountainBikeRide' })];
    const check = planSync({ activities: acts, gear, bikes: appBikes, entries: [...base, ...usual] });
    expect(check.entries[0]).toMatchObject({ bikeId: 'mr', state: 'open', sure: 'unclear', by: 'type' });
    expect(check.entries[0].reason.suggest).toEqual({ bikeId: 'mr', why: 'usual', n: 3 });
    const auto = planSync({ activities: acts, gear, bikes: appBikes, entries: [...base, ...usual], noBike: 'auto' });
    expect(auto.entries[0]).toMatchObject({ bikeId: 'mr', state: 'counted', by: 'type', sure: 'likely' });
    expect(auto.counts.assigned).toBe(1);
    // no suggestion: «auto» still sends it to check
    const none = planSync({ activities: [a('8', { gearId: null, type: 'Ride' })], gear, bikes: appBikes, entries: base, noBike: 'auto' });
    expect(none.entries[0]).toMatchObject({ bikeId: null, state: 'open' });
  });

  it('a removed ride («Zählt nicht») is never fetched again', () => {
    const gone = makeEntry({ id: 'x', bikeId: 'gb', date: '2026-10-05', km: 40, kind: 'ride', source: 'strava', stravaId: '1', gear: 'Gravel Blau', state: 'removed' });
    const p = planSync({ activities: [a('1')], gear, bikes: appBikes, entries: [...base, gone] });
    expect(p.entries).toEqual([]);
    expect(p.counts.known).toBe(1);
  });

  it('a changed Strava bike asks (4b), only within the days looked at again (3a)', () => {
    const took = makeEntry({ id: 'e1', bikeId: 'gb', date: '2026-10-09', km: 42, kind: 'ride', source: 'strava', stravaId: '1', gear: 'Gravel Blau', name: 'Abendrunde' });
    const waiting = makeEntry({ id: 'e2', bikeId: null, date: '2026-10-08', km: 12, kind: 'ride', source: 'strava', stravaId: '2', gear: '', state: 'open', sure: 'unclear' });
    const old = makeEntry({ id: 'e3', bikeId: 'gb', date: '2026-08-01', km: 50, kind: 'ride', source: 'strava', stravaId: '3', gear: 'Gravel Blau' });
    const acts = [a('1', { gearId: 'g2', start: '2026-10-09T07:00:00Z' }), a('2', { gearId: 'g1', start: '2026-10-08T07:00:00Z' }), a('3', { gearId: 'g2', start: '2026-08-01T07:00:00Z' })];
    const p = planSync({ activities: acts, gear, bikes: appBikes, entries: [...base, took, waiting, old], checkFrom: '2026-09-12' });
    expect(p.changes).toEqual([{ id: '1', entryId: 'e1', date: '2026-10-09', km: 42, name: 'Abendrunde', fromBike: 'gb', toBike: 'mr', fromGear: 'Gravel Blau', toGear: 'MTB Rot' }]);
    // the waiting ride has a bike in Strava now: it counts for that bike
    expect(p.updates).toEqual([{ id: 'e2', changes: { bikeId: 'gb', gear: 'Gravel Blau', state: 'counted', by: 'gear', sure: 'likely', reason: null } }]);
    expect(p.entries).toEqual([]);
    // a renamed Strava bike that still means the same app bike: only the name is noted
    const rule = [{ kind: 'gear', value: 'MTB Rot', bikeIds: ['gb'] }];
    const same = planSync({ activities: [acts[0]], gear, bikes: appBikes, rules: rule, entries: [...base, took], checkFrom: '2026-09-12' });
    expect(same.changes).toEqual([]);
    expect(same.updates).toEqual([{ id: 'e1', changes: { gear: 'MTB Rot' } }]);
  });

  it('recheckFrom, mergeChanges, errorText', () => {
    expect(recheckFrom('2026-10-12T06:00:00Z')).toBe('2026-09-12');
    expect(recheckFrom('nope')).toBe(null);
    expect(mergeChanges([{ entryId: 'a', toBike: 'x' }, { entryId: 'b' }], [{ entryId: 'a', toBike: 'y' }])).toEqual([{ entryId: 'b' }, { entryId: 'a', toBike: 'y' }]);
    expect(errorText('strava_busy')).toMatch(/15 minutes/);
    expect(errorText('whatever')).toMatch(/error/);
  });
});

describe('«Zum Prüfen» stays in the Strava list (Noah «4b»)', () => {
  it('an open Strava ride is not in the ledger rows, counts or the reconcile list', async () => {
    const { ledgerRows, ledgerCounts, reconcile, waitsInStrava } = await import('../src/lib/kmbook.js');
    const entries = [
      { id: 'a', bikeId: 'b1', kind: 'ride', source: 'strava', state: 'open', km: 10, date: '2026-10-10' },
      { id: 'b', bikeId: 'b1', kind: 'ride', source: 'csv', state: 'open', km: 12, date: '2026-10-09' },
      { id: 'c', bikeId: 'b1', kind: 'ride', source: 'strava', state: 'counted', km: 20, date: '2026-10-08' },
    ];
    expect(waitsInStrava(entries[0])).toBe(true);
    expect(ledgerRows(entries, 'b1').map((r) => r.id)).toEqual(['b', 'c']);
    expect(ledgerCounts(entries, 'b1').open.map((e) => e.id)).toEqual(['b']);
    expect(reconcile([{ id: 'b1', name: 'Gravel Blau' }], entries)[0].open.map((e) => e.id)).toEqual(['b']);
  });
});

describe('Puls pro Fahrt (Noah 12.10.2026 «1b 2a und b»)', () => {
  it('keeps the heart rate of a ride and adds it to rides already in the ledger', async () => {
    const { planSync } = await import('../src/lib/stravasync.js');
    const { makeEntry, heartOf, heartBetween, heartOfRide } = await import('../src/lib/kmbook.js');
    const bikes = [{ id: 'gf', name: 'Gravel Factor LS' }];
    const gear = [{ id: 'b1', name: 'Gravel Factor LS', km: 100, primary: true, retired: false }];
    const old = makeEntry({ id: 'k1', bikeId: 'gf', date: '2026-10-05', km: 30, source: 'strava', stravaId: '5', gear: 'Gravel Factor LS' });
    const acts = [
      { id: 5, name: 'Alt', type: 'GravelRide', start: '2026-10-05T08:00:00Z', km: 30, gearId: 'b1', hrAvg: 130, hrMax: 160 },
      { id: 6, name: 'Neu', type: 'GravelRide', start: '2026-10-06T08:00:00Z', km: 50, gearId: 'b1', hrAvg: 145, hrMax: 175 },
    ];
    const p = planSync({ activities: acts, gear, bikes, entries: [old], rules: [], now: new Date('2026-10-07T10:00:00Z') });
    expect(p.updates).toContainEqual({ id: 'k1', changes: { hrAvg: 130, hrMax: 160 } });
    const fresh = p.entries.find((e) => e.stravaId === '6');
    expect([fresh.hrAvg, fresh.hrMax]).toEqual([145, 175]);
    const both = [{ ...old, hrAvg: 130, hrMax: 160 }, fresh];
    // weighted by km: (130·30 + 145·50) / 80 = 139.4
    expect(heartOf(both)).toEqual({ avg: 139, max: 175, n: 2 });
    expect(heartBetween(both, '2026-10-06', '2026-10-06')).toEqual({ avg: 145, max: 175, n: 1 });
    expect(heartBetween(both, '2026-10-01', '2026-10-04')).toBeNull();
    expect(heartOfRide(both, { date: '2026-10-06', km: 49.6, startAt: '2026-10-06T08:02:00Z' })).toEqual({ avg: 145, max: 175, n: 1 });
    expect(heartOfRide(both, { date: '2026-10-06', km: 20 })).toBeNull();
  });
});
