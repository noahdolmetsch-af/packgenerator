// «Haken und Rhythmus» (S5, Noah 22.11.2026 «a, aber sicherstellen, dass keine vergangenen daten verloren gehen»):
// the retired page «Haken ausgewertet» and the new section in the Sports year read the same ticks. A copy of a backup
// (fictional data, the app's own backup format) is restored into a second database; then the old list and the new
// list are counted per activity: «Haken vorher X / nachher X». Nothing stored is changed, only the view.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup, validateBackup, countRows } from '../src/lib/backup.js';
import { einheiten } from '../src/lib/flow/einheiten.js';
import { rhythmList, looseSports, isStravaOnly } from '../src/lib/flow/rhythmus.js';
import { tilesOf, weekdays, hours, months } from '../src/lib/flow/auswertung.js';
import { normAct, entriesFor, tripDays } from '../src/lib/flow.js';
import { homeTrips } from '../src/lib/home/heute.js';

const TODAY = '2026-11-20';
const FROM = '2020-01-01';
const act = (id, ring, extra = {}) => ({ id, name: id, icon: id, ring, order: 1, goals: [], ...extra });
const ACTS = [
  act('meditation', 'mind'),
  act('sauna', 'rest'),
  act('pushups', 'move', { perTap: 10 }),
  act('bike', 'move', { counts: ['commute', 'trip'] }),
  act('run', 'move'),
  act('tennis', 'move'),
];
const day = (i) => new Date(Date.UTC(2025, 0, 1) + i * 864e5).toISOString().slice(0, 10);

/** Fictional ticks of every kind: by hand, timer, plan, commute, Strava, TrainingPeaks, a deleted activity. */
function ticks() {
  const out = [];
  let n = 0;
  for (let i = 0; i < 700; i++) {
    const d = day(i);
    if (d > TODAY) break;
    const mk = (actId, f = {}) => out.push({ id: `fx-${++n}`, actId, day: d, at: `${d}T0${(n % 9) + 1}:15:00.000Z`, n: 1, ...f });
    if (i % 2 === 0) mk('meditation', { min: 10 });
    if (i % 5 === 0) mk('sauna');
    if (i % 3 === 0) mk('pushups', { n: 10 });
    if (i % 4 === 0) mk('bike', { via: 'commute' });
    if (i % 6 === 0) mk('bike', { via: 'strava', stravaId: `s${i}`, min: 55 });
    if (i % 7 === 0) mk('run', { via: 'timer', min: 40 });
    if (i % 9 === 0) mk('tennis', { via: 'plan' });
    if (i % 13 === 0) mk('tennis', { src: 'tp' });
    if (i % 17 === 0) mk('old-removed'); // an activity that was deleted later: the old page never showed it
  }
  return out;
}
const STRAVA = [
  ...Array.from({ length: 117 }, (_, i) => ({ id: `s${i * 6}`, day: day(i * 6), start: `${day(i * 6)}T15:00:00.000Z`, type: 'Ride', kind: 'ride', km: 30, movingS: 3300, name: 'Fictional ride' })),
  { id: 'x1', day: '2026-03-03', start: '2026-03-03T07:00:00.000Z', type: 'Hike', kind: 'other', km: 12, movingS: 14400, name: 'Fictional hike' }, // no tick of its own
  { id: 'x2', day: '2026-04-04', start: '2026-04-04T07:00:00.000Z', type: 'Hike', kind: 'other', km: 9, movingS: 9000, name: 'Fictional hike 2' },
];
const TRIPS = [{ id: 'tr1', title: 'Fictional tour', startDate: '2026-06-01', days: 3, finished: true }];

let n = 0;
async function backupCopy() {
  const src = createDb(`rhythmus-src-${++n}`);
  await src.flowActs.bulkPut(ACTS);
  await src.flowLog.bulkPut(ticks());
  await src.activities.bulkPut(STRAVA);
  await src.trips.bulkPut(TRIPS);
  const file = JSON.parse(JSON.stringify(await buildBackup(src))); // what «Backup speichern» writes
  expect(validateBackup(file)).toEqual([]);
  const copy = createDb(`rhythmus-copy-${++n}`);
  await restoreBackup(copy, file, 'replace');
  return { file, copy };
}

describe('Haken vorher / nachher, from a copy of a backup', () => {
  it('the backup copy holds every tick, and the view changes nothing in it', async () => {
    const { file, copy } = await backupCopy();
    expect((await copy.flowLog.toArray()).length).toBe(file.tables.flowLog.length);
    expect(countRows(file).flowLog).toBe(ticks().length);
    const before = JSON.stringify(await copy.flowLog.toArray());
    const log = await copy.flowLog.toArray();
    const units = einheiten({ log, activities: await copy.activities.toArray(), acts: await copy.flowActs.toArray() });
    rhythmList({ units, log, acts: await copy.flowActs.toArray(), days: [], pick: '' });
    expect(JSON.stringify(await copy.flowLog.toArray())).toBe(before); // only the view reads
  });

  it('all activities: every tick the old page showed is in the new list, with the same tiles', async () => {
    const { copy } = await backupCopy();
    const log = await copy.flowLog.toArray();
    const acts = await copy.flowActs.toArray();
    const units = einheiten({ log, activities: await copy.activities.toArray(), acts });
    const ids = new Set(acts.map((a) => a.id));
    const old = log.filter((e) => ids.has(e.actId)); // the old list: every tick of an activity that exists
    const now = rhythmList({ units, log, acts, days: [], pick: '' });
    const nowIds = new Set(now.map((e) => e.id));
    expect(old.length).toBeGreaterThan(900);
    expect(old.filter((e) => !nowIds.has(e.id))).toEqual([]);
    const only = units.filter(isStravaOnly);
    expect(now.length).toBe(old.length + only.length); // the only new entries: Strava units without a tick
    expect(only.length).toBeGreaterThan(0);
    // the tiles of the log-backed part are the old tiles, tick for tick
    const logPart = now.filter((e) => !String(e.id).startsWith('strava-'));
    const a = tilesOf(old, FROM, TODAY, TODAY);
    const b = tilesOf(logPart, FROM, TODAY, TODAY);
    expect(b).toEqual(a);
    expect(weekdays(logPart)).toEqual(weekdays(old));
    expect(hours(logPart)).toEqual(hours(old));
    expect(months(logPart, FROM, TODAY)).toEqual(months(old, FROM, TODAY));
  });

  it('per activity: before X / after X, trips and «counts» included', async () => {
    const { copy } = await backupCopy();
    const log = await copy.flowLog.toArray();
    const acts = await copy.flowActs.toArray();
    const units = einheiten({ log, activities: await copy.activities.toArray(), acts });
    const days = tripDays(homeTrips(await copy.trips.toArray()), TODAY);
    const rows = [];
    for (const raw of acts) {
      const a = normAct(raw);
      const old = entriesFor(a, log, days);
      const now = rhythmList({ units, log, acts, days, pick: a.id });
      const oldIds = new Set(old.map((e) => e.id));
      const nowIds = new Set(now.map((e) => e.id));
      expect([...oldIds].filter((id) => !nowIds.has(id))).toEqual([]);
      expect(tilesOf(now.filter((e) => oldIds.has(e.id)), FROM, TODAY, TODAY)).toEqual(tilesOf(old, FROM, TODAY, TODAY));
      rows.push(`${a.id}: Haken vorher ${old.length} / nachher ${now.length}`);
    }
    console.log(rows.join('\n'));
    // the ride to work and the tour days stay with the bike
    expect(rhythmList({ units, log, acts, days, pick: 'bike' }).some((e) => e.via === 'commute')).toBe(true);
    expect(rhythmList({ units, log, acts, days, pick: 'bike' }).some((e) => e.via === 'trip')).toBe(true);
  });

  it('a Strava sport with no activity (Hike) can be picked and nothing of it is lost', async () => {
    const { copy } = await backupCopy();
    const log = await copy.flowLog.toArray();
    const acts = await copy.flowActs.toArray();
    const units = einheiten({ log, activities: await copy.activities.toArray(), acts });
    const loose = looseSports(units, acts);
    expect(loose.map((l) => l.type)).toContain('Hike');
    const hike = loose.find((l) => l.type === 'Hike');
    expect(rhythmList({ units, log, acts, days: [], pick: hike.id })).toHaveLength(2);
  });

  it('an empty backup copy gives an empty list, no error', () => {
    expect(rhythmList({})).toEqual([]);
    expect(looseSports([], [])).toEqual([]);
  });
});
