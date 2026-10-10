// v0.68.0 «Q1 Jeder km zählt»: one fictional data set (all ids start with test_data_gtp_), built on
// the v038 fixture (trips, items, notes). Five bikes: «Demo Neu» picked up 35 days ago with its ride
// ledger (FIT, Strava CSV, by hand, a correction, one unclear ride) and start points on every part but
// two; «Demo Gravel», «Demo Hardtail» and «Demo Trail» with only their old km counter (the migration
// turns it into the opening entry); «Demo Rennvelo» without km. Dates are Zurich calendar days.
import { writeFileSync } from 'node:fs';
import { v038Data, P, SPARK, SCALE, GRAVEL, day } from './v038-fixture.js';
import { fitRide } from '../fixtures/fit.js';

export { P, day };
export const NEU = `${P}neu`;
export const RENN = `${P}renn`;
export const TRAIL = SPARK;
export const HARDTAIL = SCALE;
export { GRAVEL };
export const SENSOR = 0xa1b24f2a; // the speed sensor of «Demo Neu» → «…4F2A»
export const PICKUP = -35;

const MAIN = ['cassette', 'shifting', 'shifter', 'crank', 'chainring', 'bb', 'chain', 'brakeF', 'brakeR', 'rotorF', 'rotorR', 'padsF', 'tyres', 'wheelF', 'wheelR', 'seatpost'];

export function q1Data() {
  const fix = v038Data();
  const T = fix.tables;
  const name = { [SPARK]: 'Demo Trail', [SCALE]: 'Demo Hardtail', [GRAVEL]: 'Demo Gravel' };
  for (const b of T.bikes) if (name[b.id]) b.name = name[b.id];
  for (const t of T.trips) if (name[t.bikeId]) t.bike = name[t.bikeId];
  T.bikes.find((b) => b.id === GRAVEL).km = 12800;
  T.bikes.find((b) => b.id === GRAVEL).kmDate = day(-6);
  T.bikes.find((b) => b.id === SCALE).km = 6400;
  T.bikes.find((b) => b.id === SCALE).kmDate = day(-6);
  const start = { date: day(PICKUP), km: 0, value: null, action: 'replace', result: 'done', by: null, model: null, note: '', start: true };
  const parts = MAIN.map((key) => ({ key, model: '', history: [start] }));
  parts.push({ key: 'padsR', model: '', history: [] }, { key: 'grips', model: '', history: [] });
  const R = (id, n, km, f = {}) => ({
    id: `${P}km${id}`, bikeId: NEU, date: day(n), time: null, km, kind: 'ride', source: 'fit', name: '', device: 'Edge 1040', serial: null, profile: 'Demo Neu', sensors: ['A1B24F2A'],
    gear: '', stravaId: null, by: 'sensor', sure: 'sure', state: 'counted', reason: null, note: '', importId: null, inclusive: false, span: null, tripId: null, at: `${day(n)}T18:00:00.000Z`, ...f,
  });
  const csv = { source: 'csv', device: '', profile: '', sensors: [], gear: 'Demo Neu', by: 'gear', sure: 'likely' };
  T.kmBook = [
    R('0', PICKUP, 0, { kind: 'start', source: 'hand', name: '', device: '', profile: '', sensors: [], by: 'user', sure: 'user', note: 'Start value' }),
    R('1', -34, 18, { ...csv, name: 'Probefahrt' }),
    R('2', -28, 57, { name: 'Lägern' }),
    R('3', -27, 46, { ...csv, name: 'Zürichsee Runde' }),
    R('4', -21, 72, { name: 'Albis Kette' }),
    R('5', -20, 22, { source: 'hand', name: 'Arbeitsweg, ohne Gerät', device: '', profile: '', sensors: [], by: 'user', sure: 'user' }),
    R('6', -14, 64, { name: 'Pfannenstiel Gravel' }),
    R('7', -13, -6, { kind: 'correction', source: 'hand', name: '', device: '', profile: '', sensors: [], by: 'user', sure: 'user', note: 'Fahrt doppelt, beide Geräte liefen' }),
    R('8', -12, 38, { ...csv, name: 'Greifensee' }),
    R('9', -8, 46, { name: 'Türlersee' }),
    R('10', -7, 14, { ...csv, name: 'Feierabendrunde', device: 'Edge 540', profile: 'MTB', state: 'open', sure: 'unclear', reason: { code: 'conflict', by: 'profile', said: SCALE, bike: NEU, profile: 'MTB', strava: true } }),
    R('11', -6, 41, { name: 'Rundfahrt Albis' }),
  ];
  const sum = T.kmBook.filter((e) => e.state === 'counted').reduce((s, e) => s + e.km, 0);
  T.bikes.push(
    { id: NEU, name: 'Demo Neu', type: 'Gravel bike', weightG: 9100, slots: ['seat', 'frame', 'cage1', 'cage2'], setup: {}, fixtures: [], km: sum, kmDate: day(-6), bought: day(PICKUP), parts, strava: { km: sum + 14, date: day(-6), at: day(-6) } },
    { id: RENN, name: 'Demo Rennvelo', type: 'Road bike', weightG: 7800, slots: ['seat', 'cage1', 'cage2'], setup: {}, fixtures: [] },
  );
  T.settings.push({
    key: 'kmRules',
    value: [
      { id: `${P}r1`, kind: 'sensor', value: 'A1B24F2A', bikeIds: [NEU] },
      { id: `${P}r2`, kind: 'profile', value: 'Gravel', bikeIds: [GRAVEL, NEU] },
      { id: `${P}r3`, kind: 'profile', value: 'MTB', bikeIds: [SCALE] },
      { id: `${P}r4`, kind: 'profile', value: 'Downhill', bikeIds: [SPARK] },
    ],
  });
  return { fix, appKm: sum };
}

export function q1File(info) {
  const path = info.outputPath('q1-fixture.json');
  writeFileSync(path, JSON.stringify(q1Data().fix));
  return path;
}

/** A Strava time («Oct 4, 2026, 7:12:33 AM», UTC) for a Zurich day at 08:00 UTC. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const stravaDate = (iso, h = 8) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `"${MON[m - 1]} ${d}, ${y}, ${h}:00:00 AM"`;
};

/**
 * The import files: activities.csv (four activities: one known already, one new with the bike, one
 * for the Hardtail, one run) and three FIT files (the same new ride from a second unit, a ride with
 * the sensor of «Demo Neu», a ride with the profile «Rad» that no rule knows: unclear).
 */
export function q1ImportFiles(info) {
  const csv = [
    'Activity ID,Activity Date,Activity Name,Activity Type,Distance,Activity Gear',
    `7001,${stravaDate(day(-6), 6)},Rundfahrt Albis,Ride,41.0,Demo Neu`,
    `7002,${stravaDate(day(-2))},Uetliberg Gravel,Gravel Ride,35.4,Demo Neu`,
    `7003,${stravaDate(day(-1))},Hardtail Hügel,Mountain Bike Ride,22.0,Demo Hardtail`,
    `7004,${stravaDate(day(-1), 7)},Morgenlauf,Run,8.0,`,
  ].join('\n');
  const csvPath = info.outputPath('activities.csv');
  writeFileSync(csvPath, csv);
  const fit1 = info.outputPath('second-unit.fit');
  writeFileSync(fit1, fitRide({ start: `${day(-2)}T08:05:00Z`, km: 35.2, product: 4061, serial: 4400002, profile: 'Gravel' }));
  const fit2 = info.outputPath('sensor-ride.fit');
  writeFileSync(fit2, fitRide({ start: `${day(-3)}T15:00:00Z`, km: 27.3, product: 3843, serial: 3300001, profile: 'Demo Neu', sensors: [{ serial: SENSOR, type: 123 }, { serial: 777, type: 120 }] }));
  const fit3 = info.outputPath('profile-rad.fit');
  writeFileSync(fit3, fitRide({ start: `${day(-4)}T06:30:00Z`, km: 23.1, product: 4061, serial: 4400002, profile: 'Rad', sensors: [{ serial: 0xbeef1234, type: 123 }] }));
  return [csvPath, fit1, fit2, fit3];
}
