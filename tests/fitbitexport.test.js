/**
 * Package G (#157, #158): the old Fitbit data from the Google Takeout export. Fictional fixtures only,
 * written inline (field names as in the export, values made up).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { parseCsv, parseFile, wantedPath, knownType, typeKey, defaultAct, mergeItems, planImport, zurichDay, entryIdOf, FITBIT_TYPES, VIA } from '../src/lib/fitbitexport.js';
import { zipEntries, zipTexts } from '../src/lib/fitbit/zipread.js';
import { applyPlan, undoPlan } from '../src/lib/fitbit/importdb.js';
import { seedActs } from '../src/lib/flow.js';
import { createDb } from '../src/lib/db.js';
import DE from '../src/lib/i18n/de/fitbitexport.js';

const ACTS = seedActs();

/* ---------- fictional export files ---------- */
const exJson = (list) =>
  JSON.stringify(
    list.map(([logId, activityName, activityTypeId, startTime, ms, logType = 'tracker']) => ({ logId, activityName, activityTypeId, activityLevel: [], calories: 100, duration: ms, activeDuration: ms, logType, startTime, originalStartTime: startTime, originalDuration: ms, lastModified: startTime, hasGps: false })),
  );
const EX_CSV_HEAD = 'exercise_id,exercise_start,exercise_end,utc_offset,exercise_created,exercise_last_updated,activity_name,log_type,pool_length,deletion_reason';
const exCsv = (rows) => [EX_CSV_HEAD, ...rows.map(([id, start, end, name, logType = 'TRACKER', del = 'UNSPECIFIED']) => `${id},${start},${end},+01:00,${end},${end},${name},${logType},0,${del}`)].join('\n');
const MIND_HEAD = 'session_id,activity_name,average_heart_rate,start_heart_rate,end_heart_rate,duration,start_date_time,end_date_time,session_type,stress_metrics,pause_times';
const mindCsv = (rows) => [MIND_HEAD, ...rows.map(([id, name, start, end]) => `${id},${name},null,60,58,600000,${start},${end},relax,{a=1  b=2},null`)].join('\n');
const TS_HEAD = 'start time,end time,heart_rate_summary_average_bpm,heart_rate_summary_start_bpm,heart_rate_summary_end_bpm,pause_times_start_time,pause_times_end_time,pause_times_start_timestamp,pause_times_end_timestamp,metadata_update_time,metadata_session_name,metadata_type,metadata_description,metadata_media_content_duration_seconds,metadata_active_duration_seconds,metadata_external_id,data source';
const mindTs = (rows) => [TS_HEAD, ...rows.map(([id, name, start, end]) => `${start},${end},0,60,58,,,,,,${name},OTHER,,600,0,${id},Example App`)].join('\n');

const ex = (srcId, name, start, min, extra = {}) => ({ kind: 'ex', src: 'csv', srcId, name, typeId: null, start: Date.parse(start), sec: min * 60, auto: false, ...extra });
const mind = (srcId, name, start, min) => ({ kind: 'mind', src: 'mindcsv', srcId, name, start: Date.parse(start), end: Date.parse(start) + min * 60000, sec: min * 60 });

describe('reading the export files', () => {
  it('parses CSV with quotes, commas and line breaks in quotes', () => {
    const rows = parseCsv('a,b,c\r\n1,"x, y","line\nbreak"\n2,"say ""hi""",\n');
    expect(rows).toEqual([
      { a: '1', b: 'x, y', c: 'line\nbreak' },
      { a: '2', b: 'say "hi"', c: '' },
    ]);
  });

  it('knows the four files by their content, not their name', () => {
    expect(parseFile('a.json', exJson([[1, 'Tennis', 15675, '06/01/25 16:00:00', 3600000]])).kind).toBe('exjson');
    expect(parseFile('b.csv', exCsv([['9', '2025-06-01T16:00:00Z', '2025-06-01T17:00:00Z', 'Tennis']])).kind).toBe('excsv');
    expect(parseFile('c.csv', mindCsv([['s1', 'Relax', '2025-06-02T07:00:00+02:00', '2025-06-02T07:10:00+02:00']])).kind).toBe('mindcsv');
    expect(parseFile('d.csv', mindTs([['s1', 'Relax', '2025-06-02T05:00:00Z', '2025-06-02T05:10:00Z']])).kind).toBe('mindts');
    expect(parseFile('e.csv', 'date,steps\n2025-06-01,1000')).toEqual({ kind: null, items: [] });
    expect(parseFile('f.json', '[{"dateTime":"x","value":"1"}]')).toEqual({ kind: null, items: [] });
    expect(parseFile('g.json', '[broken')).toEqual({ kind: null, items: [] });
  });

  it('reads a training from the JSON (start in UTC, active minutes) and from the CSV (start to end)', () => {
    const [j] = parseFile('x', exJson([[42, 'Radfahren im Freien', 1071, '07/03/25 05:30:00', 25 * 60000, 'auto_detected']])).items;
    expect(j).toMatchObject({ kind: 'ex', src: 'json', srcId: '42', name: 'Radfahren im Freien', typeId: 1071, start: Date.parse('2025-07-03T05:30:00Z'), sec: 1500, auto: true });
    const [c] = parseFile('y', exCsv([['77', '2025-07-03T05:30:00Z', '2025-07-03T05:55:00Z', 'Outdoor Bike', 'AUTO_DETECTED']])).items;
    expect(c).toMatchObject({ src: 'csv', srcId: '77', name: 'Outdoor Bike', sec: 1500, auto: true });
  });

  it('leaves out trainings the export marks as deleted', () => {
    const { items } = parseFile('y', exCsv([['1', '2025-07-03T05:30:00Z', '2025-07-03T05:55:00Z', 'Tennis', 'MANUAL', 'USER_DELETED'], ['2', '2025-07-04T05:30:00Z', '2025-07-04T05:55:00Z', 'Tennis']]));
    expect(items.map((x) => x.srcId)).toEqual(['2']);
  });

  it('reads the mindfulness sessions from both files with the same id', () => {
    const [a] = parseFile('m', mindCsv([['s1', 'Relax', '2025-06-02T07:00:00+02:00', '2025-06-02T07:10:00+02:00']])).items;
    const [b] = parseFile('t', mindTs([['s1', 'Relax', '2025-06-02T05:00:00Z', '2025-06-02T05:10:00Z']])).items;
    expect(a).toMatchObject({ kind: 'mind', srcId: 's1', name: 'Relax', start: Date.parse('2025-06-02T05:00:00Z'), sec: 600 });
    expect(b).toMatchObject({ kind: 'mind', srcId: 's1', start: a.start, sec: 600 });
  });

  it('picks only the needed paths out of the zip', () => {
    expect(wantedPath('Takeout/Google Health/Global Export Data/exercise-100.json')).toBe(true);
    expect(wantedPath('Takeout/Google Health/Health Fitness Data_GoogleData/UserExercises_2025-01-01.csv')).toBe(true);
    expect(wantedPath('Takeout/Google Health/Mindfulness/Mindfulness Sessions.csv')).toBe(true);
    expect(wantedPath('Takeout/Google Health/Physical Activity_GoogleData/Mindfulness Session/mindfulness_session_2025-01-01.csv')).toBe(true);
    expect(wantedPath('Takeout/Google Health/Global Export Data/steps-2025-01-01.json')).toBe(false);
    expect(wantedPath('Takeout/Google Health/Mindfulness/Mindfulness Eda Data Sessions - 2025-01-01.csv')).toBe(false);
    expect(wantedPath('Takeout/Google Health/Physical Activity_GoogleData/Mindfulness Session/mindfulness_session_readme.txt')).toBe(false);
  });
});

describe('Fitbit types → app activities', () => {
  it('knows a type by its English or German name, a longer name, or its type id', () => {
    expect(knownType({ name: 'Tennis' }).key).toBe('tennis');
    expect(knownType({ name: 'Gehen' }).key).toBe('walk');
    expect(knownType({ name: 'Outdoor Run' }).key).toBe('run');
    expect(knownType({ name: 'Ski Alpin, mittlere Anstrengung, allgemein' }).key).toBe('ski');
    expect(knownType({ name: 'Skilanglauf' }).key).toBe('xcski');
    expect(knownType({ name: 'Irgendwas', typeId: 55001 }).key).toBe('spinning');
    expect(knownType({ name: 'Bogenschiessen' })).toBe(null);
    expect(typeKey({ kind: 'ex', name: 'Bogenschiessen' })).toBe('x:bogenschiessen');
    expect(typeKey({ kind: 'mind', name: 'Relax' })).toBe('mind:relax');
  });

  it('every known type has a German label', () => {
    for (const x of FITBIT_TYPES) expect(DE[x.label], x.label).toBeTruthy();
  });

  it('suggests the seeded activities, the user’s own by name, and skips what it does not know', () => {
    expect(defaultAct('tennis', ACTS)).toBe('tennis');
    expect(defaultAct('run', ACTS)).toBe('run');
    expect(defaultAct('treadmill', ACTS)).toBe('run');
    expect(defaultAct('outdoorbike', ACTS)).toBe('bike');
    expect(defaultAct('spinning', ACTS)).toBe('spin');
    expect(defaultAct('weights', ACTS)).toBe('gym');
    expect(defaultAct('yoga', ACTS)).toBe('yoga');
    expect(defaultAct('sport', ACTS)).toBe(null);
    expect(defaultAct('x:bogenschiessen', ACTS)).toBe(null);
    expect(defaultAct('walk', ACTS)).toBe(null);
    expect(defaultAct('walk', [...ACTS, { id: 'act-1', name: 'Wandern', ring: 'move', order: 30 }])).toBe('act-1');
    expect(defaultAct('swim', [...ACTS, { id: 'act-2', name: 'Schwimmen / Aare', ring: 'move', order: 31 }])).toBe('act-2');
    expect(defaultAct('mind:relax', ACTS)).toBe('meditation');
    expect(defaultAct('mind:relax', [{ id: 'act-3', name: 'Stille', ring: 'mind', order: 0 }])).toBe('act-3');
  });
});

describe('merging the two copies of the export', () => {
  it('the same training from JSON and CSV once, the CSV row wins (it carries edits)', () => {
    const json = ex('1', 'Sport', '2025-05-10T15:00:00Z', 60, { src: 'json', typeId: 15000 });
    const csv = ex('900', 'Tennis', '2025-05-10T15:01:00Z', 60);
    const other = ex('2', 'Laufen', '2025-05-10T18:00:00Z', 30, { src: 'json', typeId: 90009 });
    const out = mergeItems([json, csv, other]);
    expect(out.map((x) => `${x.src}:${x.srcId}`)).toEqual(['csv:900', 'json:2']);
  });

  it('a session from both mindfulness files once', () => {
    const a = mind('s1', 'Relax', '2025-06-02T05:00:00Z', 10);
    expect(mergeItems([{ ...a, src: 'mindts' }, a])).toHaveLength(1);
    expect(mergeItems([{ ...a, src: 'mindts' }, a])[0].src).toBe('mindcsv');
  });
});

describe('the plan', () => {
  it('day and time in Zurich (summer and winter), minutes, via fitbit, a stable id', () => {
    expect(zurichDay(Date.parse('2025-07-01T22:30:00Z'))).toBe('2025-07-02');
    expect(zurichDay(Date.parse('2025-01-15T22:30:00Z'))).toBe('2025-01-15');
    expect(zurichDay(Date.parse('2025-01-15T23:30:00Z'))).toBe('2025-01-16');
    const item = ex('900', 'Tennis', '2025-07-01T22:30:00Z', 62.4);
    const p = planImport([item], { acts: ACTS });
    expect(p.entries).toEqual([{ id: 'fl-fb-e-900', actId: 'tennis', day: '2025-07-02', at: '2025-07-01T22:30:00.000Z', n: 1, min: 62, via: VIA, fbType: 'Tennis' }]);
    expect(entryIdOf(item)).toBe('fl-fb-e-900');
    expect(p.sessions).toEqual([]);
    expect(p.counts).toMatchObject({ read: 1, fresh: 1, have: 0, skipped: 0 });
    expect(p.range).toEqual({ from: '2025-07-02', to: '2025-07-02' });
  });

  it('a mindfulness session becomes a meditation entry and its session record', () => {
    const p = planImport([mind('s1', 'Relax', '2025-06-02T05:00:00Z', 10)], { acts: ACTS });
    expect(p.entries).toEqual([{ id: 'fl-fb-m-s1', actId: 'meditation', day: '2025-06-02', at: '2025-06-02T05:00:00.000Z', n: 1, min: 10, via: VIA, fbType: 'Relax' }]);
    expect(p.sessions).toEqual([{ id: 'fl-fb-m-s1', actId: 'meditation', day: '2025-06-02', at: '2025-06-02T05:00:00.000Z', endAt: '2025-06-02T05:10:00.000Z', min: 10, target: null, art: null, tplId: null, place: null, marks: [], bowl: null, via: VIA, fbType: 'Relax' }]);
    expect(p.types[0]).toMatchObject({ key: 'mind:relax', kind: 'mind', label: 'Relax', known: false });
  });

  it('counts per type and per activity; unknown types are skipped and listed', () => {
    const items = [ex('1', 'Tennis', '2025-05-01T15:00:00Z', 60), ex('2', 'Tennis', '2025-05-08T15:00:00Z', 60), ex('3', 'Sport', '2025-05-09T15:00:00Z', 40), ex('4', 'Bogenschiessen', '2025-05-10T15:00:00Z', 40)];
    const p = planImport(items, { acts: ACTS });
    expect(p.types.map((x) => [x.key, x.n, x.actId])).toEqual([
      ['tennis', 2, 'tennis'],
      ['sport', 1, null],
      ['x:bogenschiessen', 1, null],
    ]);
    expect(p.perAct).toEqual([{ actId: 'tennis', fresh: 2, have: 0 }]);
    expect(p.skipped).toEqual([
      { key: 'sport', label: 'Sport|fbtype', known: true, n: 1 },
      { key: 'x:bogenschiessen', label: 'Bogenschiessen', known: false, n: 1 },
    ]);
    expect(p.counts).toMatchObject({ fresh: 2, skipped: 2 });
  });

  it('the user’s choice per type wins: another activity, or skip', () => {
    const items = [ex('1', 'Tennis', '2025-05-01T15:00:00Z', 60), ex('3', 'Sport', '2025-05-09T15:00:00Z', 40)];
    const p = planImport(items, { acts: ACTS, map: { sport: 'gym', tennis: '' } });
    expect(p.entries.map((e) => [e.id, e.actId])).toEqual([['fl-fb-e-3', 'gym']]);
    expect(planImport(items, { acts: ACTS, map: { sport: 'gone' } }).entries).toHaveLength(1); // an activity that no longer exists: skipped
  });

  it('leaves out what is under a minute, and on request what the watch recognised by itself', () => {
    const items = [ex('1', 'Outdoor Bike', '2025-05-01T06:00:00Z', 0.5), ex('2', 'Outdoor Bike', '2025-05-02T06:00:00Z', 20, { auto: true }), ex('3', 'Outdoor Bike', '2025-05-03T06:00:00Z', 20)];
    expect(planImport(items, { acts: ACTS }).counts).toMatchObject({ fresh: 2, short: 1 });
    const off = planImport(items, { acts: ACTS, auto: false });
    expect(off.counts).toMatchObject({ fresh: 1, auto: 1, short: 1 });
    expect(off.types[0].auto).toBe(1);
  });

  it('a second import adds nothing twice, also from the other copy of the export', () => {
    const first = planImport([ex('900', 'Tennis', '2025-05-10T15:00:00Z', 60), mind('s1', 'Relax', '2025-06-02T05:00:00Z', 10)], { acts: ACTS });
    const again = planImport([ex('900', 'Tennis', '2025-05-10T15:00:00Z', 60), mind('s1', 'Relax', '2025-06-02T05:00:00Z', 10)], { acts: ACTS, log: first.entries, sessions: first.sessions });
    expect(again.counts).toMatchObject({ fresh: 0, have: 2 });
    const json = planImport([ex('1', 'Sport', '2025-05-10T15:01:30Z', 60, { src: 'json', typeId: 15000 })], { acts: ACTS, log: first.entries, map: { sport: 'gym' } });
    expect(json.counts).toMatchObject({ fresh: 0, have: 1 });
  });

  it('an own tick of the same activity on that day counts as already there', () => {
    const log = [{ id: 'fl-own', actId: 'tennis', day: '2025-05-10', at: '2025-05-10T18:00:00.000Z', n: 1 }];
    const p = planImport([ex('900', 'Tennis', '2025-05-10T15:00:00Z', 60), ex('901', 'Tennis', '2025-05-11T15:00:00Z', 60)], { acts: ACTS, log });
    expect(p.entries.map((e) => e.id)).toEqual(['fl-fb-e-901']);
    expect(p.perAct).toEqual([{ actId: 'tennis', fresh: 1, have: 1 }]);
  });
});

/* ---------- a small zip, built here ---------- */
const enc = new TextEncoder();
async function deflate(bytes) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
}
async function makeZip(files) {
  const parts = [];
  const cen = [];
  let offset = 0;
  for (const [name, text, store] of files) {
    const nameB = enc.encode(name);
    const raw = enc.encode(text);
    const data = store ? raw : await deflate(raw);
    const loc = new DataView(new ArrayBuffer(30));
    loc.setUint32(0, 0x04034b50, true);
    loc.setUint16(8, store ? 0 : 8, true);
    loc.setUint32(18, data.length, true);
    loc.setUint32(22, raw.length, true);
    loc.setUint16(26, nameB.length, true);
    parts.push(new Uint8Array(loc.buffer), nameB, data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(10, store ? 0 : 8, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, raw.length, true);
    c.setUint16(28, nameB.length, true);
    c.setUint32(42, offset, true);
    cen.push(new Uint8Array(c.buffer), nameB);
    offset += 30 + nameB.length + data.length;
  }
  const cdSize = cen.reduce((s, b) => s + b.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...cen, new Uint8Array(end.buffer)]);
}

describe('reading a zip without loading all of it', () => {
  it('lists the entries and unpacks only the wanted ones (deflated and stored)', async () => {
    const zip = await makeZip([
      ['Takeout/Google Health/Global Export Data/exercise-0.json', exJson([[5, 'Tennis', 15675, '05/10/25 15:00:00', 3600000]])],
      ['Takeout/Google Health/Global Export Data/steps-2025-05-10.json', '[]'],
      ['Takeout/Google Health/Mindfulness/Mindfulness Sessions.csv', mindCsv([['s1', 'Relax', '2025-06-02T07:00:00+02:00', '2025-06-02T07:10:00+02:00']]), true],
    ]);
    expect((await zipEntries(zip)).map((x) => x.method)).toEqual([8, 8, 0]);
    const items = [];
    const names = [];
    for await (const { name, text } of zipTexts(zip, wantedPath)) {
      names.push(name.split('/').pop());
      items.push(...parseFile(name, text).items);
    }
    expect(names).toEqual(['exercise-0.json', 'Mindfulness Sessions.csv']);
    const p = planImport(items, { acts: ACTS });
    expect(p.entries.map((e) => [e.actId, e.day])).toEqual([
      ['tennis', '2025-05-10'],
      ['meditation', '2025-06-02'],
    ]);
  });

  it('says so when the file is no zip', async () => {
    await expect(zipEntries(new Blob(['hello']))).rejects.toThrow('not_zip');
  });
});

describe('take over and undo', () => {
  let db;
  beforeEach(async () => {
    db = createDb(`fbx-${Math.random()}`);
    await db.open();
  });

  it('writes the new rows in one go and undo removes exactly those', async () => {
    const mine = { id: 'fl-own', actId: 'tennis', day: '2025-05-01', at: '2025-05-01T10:00:00.000Z', n: 1 };
    await db.flowLog.put(mine);
    const p = planImport([ex('900', 'Tennis', '2025-05-10T15:00:00Z', 60), mind('s1', 'Relax', '2025-06-02T05:00:00Z', 10)], { acts: ACTS, log: [mine] });
    const added = await applyPlan(db, p);
    expect(added).toEqual({ entryIds: ['fl-fb-e-900', 'fl-fb-m-s1'], sessionIds: ['fl-fb-m-s1'] });
    expect(await db.flowLog.count()).toBe(3);
    expect((await db.flowSessions.get('fl-fb-m-s1')).actId).toBe('meditation');
    // the same plan again writes nothing new
    expect(await applyPlan(db, p)).toEqual({ entryIds: [], sessionIds: [] });
    await undoPlan(db, added);
    expect((await db.flowLog.toArray()).map((e) => e.id)).toEqual(['fl-own']);
    expect(await db.flowSessions.count()).toBe(0);
  });
});

describe('German texts', () => {
  it('the component’s texts have German entries (or are shared ones)', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync(new URL('../src/lib/fitbit/FitbitImport.svelte', import.meta.url), 'utf8');
    const ALL = (await import('../src/lib/i18n/de/index.js')).default;
    const keys = [...src.matchAll(/\bt\('((?:[^'\\]|\\.)+)'/g), ...src.matchAll(/tn\([^,]+, '([^']+)', '([^']+)'/g)].flatMap((m) => m.slice(1).filter(Boolean));
    const missing = keys.filter((k) => !DE[k] && !ALL[k]);
    expect(missing).toEqual([]);
  });
});
