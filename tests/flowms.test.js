// Hobby pages, package 1 (Aktiv › Aktivität, Meilensteine; mockups A, A2): the milestones (next star,
// «soon» from 80 %, stars kept after a streak breaks, own thresholds), the tiles and seed 2, the
// suggestions, and the database upgrade 7 → 8 that keeps the old data. Fictional data only; days are
// calendar days (addDays), never «now + n × 24 h».
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, it, expect } from 'vitest';
import { seedActs, normAct, addDays, rings as ringsOf, flowStates } from '../src/lib/flow.js';
import { STAGES, msContext, crossMilestones, actMilestones, evaluate, allMilestones, newStars, soonList, recentStars, yearSummary, nextPerAct, records, rewardState, stepsOf, weekStart, zurichHour, SOON } from '../src/lib/flowms.js';
import { seed2Plan, favActs, moveFav, tileLine, ringWeek, FAV_SEED, WALK, SEED2_KEY } from '../src/lib/flowtiles.js';
import { suggestions, actFromTemplate, openIdeas, FUN_IDEAS, connections, MAX_SUGG } from '../src/lib/flowsugg.js';
import { createDb, DATA_TABLES, SCHEMA_VERSION } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { ensureSeed, ensureSeed2, deleteAct, saveStars } from '../src/lib/flowdb.js';
import DE from '../src/lib/i18n/de/index.js';

const T = '2026-10-09'; // a Friday
const acts = seedActs();
let k = 0;
const e = (actId, day, extra = {}) => ({ id: `e${++k}`, actId, day, at: `${day}T10:00:00.000Z`, n: 1, ...extra });
/** n entries on the n days ending with `end` (one per day). */
const daily = (actId, end, n, extra = {}) => Array.from({ length: n }, (_, i) => e(actId, addDays(end, -i), extra));
const ctxOf = (log, today = T, extra = {}) => msContext({ acts, log, today, ...extra });
const find = (list, id) => list.find((r) => r.id === id);
const med = (id) => actMilestones(acts.find((a) => a.id === 'meditation')).find((m) => m.id === `meditation.${id}`);

describe('the stages and the milestone lists', () => {
  it('seven stages with the decided names, in German', () => {
    expect(STAGES.map((s) => DE[s])).toEqual(['Anfang', 'Gewohnheit', 'Hingabe', 'Tiefe', 'Ruhe', 'Meisterschaft', 'Weg']);
  });
  it('nine over all, meditation six plus four optional, every milestone at most seven stars, ascending', () => {
    const ctx = ctxOf([]);
    expect(crossMilestones(ctx)).toHaveLength(9);
    const m = actMilestones(acts.find((a) => a.id === 'meditation'));
    expect(m.filter((x) => !x.opt)).toHaveLength(6);
    expect(m.filter((x) => x.opt)).toHaveLength(4);
    expect(m.find((x) => x.id === 'meditation.variety').steps).toHaveLength(6); // Vielfalt: only six stars
    for (const x of [...crossMilestones(ctx), ...acts.flatMap(actMilestones)]) {
      expect(x.steps.length).toBeLessThanOrEqual(7);
      expect([...x.steps].sort((a, b) => a - b)).toEqual(x.steps);
      expect(DE[x.name], x.name).toBeTruthy();
      expect(DE[x.what], x.what).toBeTruthy();
    }
  });
});

describe('the next star', () => {
  it('only the next star; progress is value / threshold; «soon» from 80 %', () => {
    // Hingebungsvoll: 10 · 25 · …; 18 sessions → star 1 reached, next is star 2 at 25 (72 %)
    const ctx18 = ctxOf(daily('meditation', T, 18));
    const r = evaluate(med('devoted'), ctx18);
    expect(r.reached.map((s) => s.star)).toEqual([1]);
    expect(r).toMatchObject({ value: 18, next: 2, target: 25, soon: false, done: false });
    expect(r.progress).toBeCloseTo(0.72);
    // 20 of 25 = 80 % is «soon», 19 is not
    expect(evaluate(med('devoted'), ctxOf(daily('meditation', T, 20))).soon).toBe(true);
    expect(evaluate(med('devoted'), ctxOf(daily('meditation', T, 19))).soon).toBe(false);
    expect(SOON).toBe(0.8);
  });
  it('the day a star was reached is the first day the value met it', () => {
    const r = evaluate(med('devoted'), ctxOf(daily('meditation', T, 12)));
    expect(r.reached[0].day).toBe(addDays(T, -2)); // the 10th session, two days before today
  });
  it('a star stays when the streak breaks; the streak is not broken before today has passed', () => {
    // 7 days in a row ending 10 days ago, then nothing: Täglich star 1 (3) and 2 (7) stay
    const log = daily('meditation', addDays(T, -10), 7);
    const r = evaluate(med('daily'), ctxOf(log));
    expect(r.reached.map((s) => s.star)).toEqual([1, 2]);
    expect(r.value).toBe(0);
    expect(r.next).toBe(3);
    // done until yesterday, not yet today: the streak still counts
    expect(evaluate(med('daily'), ctxOf(daily('meditation', addDays(T, -1), 4))).value).toBe(4);
  });
  it('stored stars count even when the entries are gone (flowStars, never lost)', () => {
    const stored = new Map([['meditation.devoted:1', '2026-01-05']]);
    const r = evaluate(med('devoted'), ctxOf([]), stored);
    expect(r.reached).toEqual([{ star: 1, day: '2026-01-05', id: 'meditation.devoted:1' }]);
    expect(r.next).toBe(2);
  });
  it('own thresholds (flow.msTune) and switching a milestone off', () => {
    const m = med('devoted');
    const tune = { 'meditation.devoted': { steps: [5, '3', 0, 8] } };
    expect(stepsOf(m, tune)).toEqual([3, 5, 8]);
    const r = evaluate(m, ctxOf(daily('meditation', T, 6)), new Map(), tune);
    expect(r).toMatchObject({ next: 3, target: 8 });
    const list = allMilestones(ctxOf([]), new Map(), { 'x.activeDay': { off: true } });
    expect(find(list, 'x.activeDay').off).toBe(true);
    expect(soonList(list).some((x) => x.id === 'x.activeDay')).toBe(false);
  });
  it('all stars reached: «Path», the card shows the best value', () => {
    const r = evaluate(med('devoted'), ctxOf(daily('meditation', T, 30)), new Map(), { 'meditation.devoted': { steps: [5, 10] } });
    expect(r).toMatchObject({ done: true, next: null, best: 30, progress: 1 });
  });
});

describe('the values', () => {
  it('Tiefer = longest session; Geübter = sessions from 60 min; Stunden auf dem Kissen', () => {
    const log = [e('meditation', T, { min: 25 }), e('meditation', addDays(T, -1), { min: 62 }), e('meditation', addDays(T, -2), { min: 13 })];
    const ctx = ctxOf(log);
    expect(evaluate(med('deeper'), ctx).value).toBe(62);
    expect(evaluate(med('practised'), ctx).value).toBe(1);
    expect(evaluate(med('hours'), ctx).value).toBe(1.7);
  });
  it('Wochenend = minutes of one Saturday + Sunday; Intensiver = days in a row with two sessions', () => {
    // Sat 3 + Sun 4 Oct 2026
    const log = [e('meditation', '2026-10-03', { min: 40 }), e('meditation', '2026-10-04', { min: 50 }), e('meditation', '2026-10-04', { min: 10 }), e('meditation', '2026-10-05', { min: 30 })];
    const r = evaluate(med('weekend'), ctxOf(log));
    expect(r.value).toBe(100); // still the last weekend on Friday
    expect(r.reached.map((s) => s.star)).toEqual([1, 2]); // 30, 60
    expect(evaluate(med('intense'), ctxOf(log)).best).toBe(1);
  });
  it('Morgen and Früh-Start: before 8 in Zurich (summer and winter time)', () => {
    expect(zurichHour('2026-10-09T05:30:00.000Z')).toBe(7); // CEST
    expect(zurichHour('2026-11-09T06:30:00.000Z')).toBe(7); // CET after 25.10.2026
    expect(zurichHour('2026-11-09T07:30:00.000Z')).toBe(8);
    const log = [e('meditation', T, { at: '2026-10-09T05:30:00.000Z' }), e('run', addDays(T, -1), { at: '2026-10-08T06:30:00.000Z' })];
    const list = allMilestones(ctxOf(log));
    expect(find(list, 'x.early').value).toBe(1);
    expect(find(list, 'meditation.morning').value).toBe(1);
  });
  it('Vielfalt counts the kinds of the session details', () => {
    const sessions = [{ id: 's1', actId: 'meditation', day: T, art: 'breath' }, { id: 's2', actId: 'meditation', day: T, art: 'metta' }, { id: 's3', actId: 'meditation', day: T, art: 'breath' }];
    expect(evaluate(med('variety'), ctxOf([], T, { sessions })).value).toBe(2);
  });
  it('over all: active days, all-rounder this week (from Monday), three-ring days, recovery, new tried, hours this year', () => {
    const mon = weekStart(T);
    expect(mon).toBe('2026-10-05');
    const log = [
      e('run', mon, { min: 60 }), e('tennis', addDays(mon, 1), { min: 90 }), e('gym', addDays(mon, 2)),
      e('meditation', addDays(mon, 2)), e('sauna', addDays(mon, 2)),
      e('bike', addDays(mon, -1), { min: 30 }), // last week, still counts as an active day
      e('run', '2025-12-30', { min: 600 }), // last year: not in the hours of 2026
    ];
    const list = allMilestones(ctxOf(log));
    expect(find(list, 'x.activeDay').value).toBe(5);
    expect(find(list, 'x.allround').value).toBe(3);
    expect(find(list, 'x.threeRings').value).toBe(1);
    expect(find(list, 'x.recovery').value).toBe(1);
    expect(find(list, 'x.newTried').value).toBe(6);
    expect(find(list, 'x.hours.2026').value).toBe(3);
    expect(find(list, 'x.outdoor').value).toBe(3); // run twice, bike once (a suggestion: bike, run, walk)
  });
  it('the record wall shows only what has data', () => {
    const log = [e('meditation', T, { min: 45 }), e('pushups', T, { n: 42 }), ...daily('run', addDays(T, -1), 3)];
    const recs = records(ctxOf(log), [{ km: 142.4, date: '2026-09-01' }]);
    expect(recs.map((r) => [r.id, r.value])).toEqual([['med', 45], ['push', 42], ['ride', 142], ['streak', 4], ['week', 45]]);
    expect(records(ctxOf([]), [])).toEqual([]);
  });
});

describe('stars, «soon», «recently», the year', () => {
  it('new stars are written once, with their id and day; the newest come first', () => {
    const log = daily('meditation', T, 12);
    const list = allMilestones(ctxOf(log));
    const rows = newStars(list);
    expect(rows.find((r) => r.id === 'meditation.devoted:1')).toEqual({ id: 'meditation.devoted:1', msId: 'meditation.devoted', star: 1, day: addDays(T, -2) });
    const stored = new Map(rows.map((r) => [r.id, r.day]));
    expect(newStars(allMilestones(ctxOf(log), stored), stored)).toEqual([]);
    const recent = recentStars(list, 3);
    expect(recent).toHaveLength(3);
    expect(recent[0].star.day >= recent[2].star.day).toBe(true);
    const y = yearSummary(list, T);
    expect(y.year).toBe(rows.length);
    expect(y.month).toBe(rows.filter((r) => r.day.startsWith('2026-10')).length);
  });
  it('the next star per activity is its closest milestone', () => {
    const list = allMilestones(ctxOf(daily('meditation', T, 9)));
    expect(nextPerAct(list).get('meditation').id).toBe('meditation.devoted'); // 9 of 10
  });
  it('the reward hangs on a star and says how far it is', () => {
    const list = allMilestones(ctxOf(daily('meditation', T, 18)));
    expect(rewardState({ msId: 'meditation.devoted', star: 2, itemId: 'wish-1' }, list)).toMatchObject({ star: 2, threshold: 25, left: 7, reached: false });
    expect(rewardState({ msId: 'meditation.devoted', star: 1, itemId: 'wish-1' }, list)).toMatchObject({ reached: true, left: 0 });
    expect(rewardState({ msId: 'x', star: 1, itemId: 'w' }, list)).toBeNull();
    expect(rewardState(null, list)).toBeNull();
  });
});

describe('tiles and seed 2', () => {
  it('seed 2: playful names, six favourites, the walk; nothing of the user is overwritten', () => {
    const plan = seed2Plan(acts);
    const by = Object.fromEntries(plan.map((a) => [a.id, a]));
    expect(FAV_SEED.map((f) => by[f.id].nickDe)).toEqual(['Kissenzeit', 'Pedal-Glück', 'Matten-Moment', 'Eisen-Stunde', 'Filzball', 'Boden-Küsse']);
    expect(by.sauna.nickDe).toBe('Schwitz-Pause');
    expect(by.walk).toMatchObject({ id: 'walk', nameDe: 'Spaziergang', ring: 'rest' });
    expect(favActs([...acts.filter((a) => !by[a.id]), ...plan]).map((a) => a.id)).toEqual(FAV_SEED.map((f) => f.id));
    // own names and choices stay; a deleted seed activity is not brought back
    const mine = acts.filter((a) => a.id !== 'gym').map((a) => (a.id === 'meditation' ? { ...a, nick: 'Stille', fav: true, favOrder: 0 } : a));
    const p2 = seed2Plan(mine);
    expect(p2.find((a) => a.id === 'meditation').nick).toBe('Stille');
    expect(p2.some((a) => a.id === 'gym')).toBe(false);
    expect(p2.some((a) => a.fav && a.id !== 'meditation')).toBe(false); // a favourite choice of the user stays
  });
  it('moving a tile swaps two favourites', () => {
    const favs = favActs(seed2Plan(acts));
    const out = moveFav(favs, 'bike', -1);
    expect(out.map((a) => a.id).slice(0, 2)).toEqual(['bike', 'meditation']);
    expect(moveFav(favs, 'meditation', -1)).toEqual([]);
  });
  it('each tile line: next star, history, week, nudge, streak, best', () => {
    const A = Object.fromEntries(seed2Plan(acts).map((a) => [a.id, a]));
    const log = [...daily('meditation', T, 9), e('pushups', '2026-09-12', { n: 42 }), e('pushups', T, { n: 10 }), e('tennis', T), e('tennis', addDays(T, -7)), e('bike', addDays(T, -8))];
    const ms = allMilestones(ctxOf(log)).filter((r) => r.m.actId === 'meditation');
    expect(tileLine(A.meditation, { log, today: T, ms })).toMatchObject({ key: '{n} to star {k}', vars: { n: 1, k: 1 } });
    const spark = tileLine(A.bike, { log, today: T });
    expect(spark.points).toHaveLength(8);
    expect(spark.points.reduce((s, v) => s + v, 0)).toBe(1);
    expect(tileLine(A.yoga, { log, today: T }).parts.map((p) => [p.goal.id, p.n, p.of])).toEqual([['studio', 0, 1], ['home', 0, 1]]);
    expect(tileLine(A.gym, { log, today: '2026-07-01' })).toMatchObject({ key: 'Back on {date} · bag ready?', vars: { date: '2026-11-01' } });
    expect(tileLine(A.tennis, { log, today: T })).toMatchObject({ n: 2, one: '{n} week in a row' });
    expect(tileLine(A.pushups, { log, today: T })).toMatchObject({ key: '{n} in one go ({month})', vars: { n: 42, month: '2026-09-12' } });
  });
  it('the ring week runs Monday to Sunday, future days empty', () => {
    const w = ringWeek(acts, [e('meditation', '2026-10-05'), e('run', T), e('sauna', T)], T);
    expect(w.map((d) => d.day)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(w[0]).toMatchObject({ mind: true, move: false });
    expect(w[4]).toMatchObject({ today: true, move: true, rest: true, mind: false });
    expect(w[5].future).toBe(true);
  });
});

describe('suggestions, ideas, connections', () => {
  const all = seed2Plan(acts).concat(acts.filter((a) => !seed2Plan(acts).some((p) => p.id === a.id)));
  const favs = favActs(all).map((a) => a.id);
  it('at most 8, never a tile, hidden ones left out, a reason that fits the day', () => {
    const log = [e('bike', addDays(T, -1)), e('bike', addDays(T, -2))];
    const states = flowStates(all, log, T);
    const s = suggestions({ acts: all, log, today: T, hour: 20, dry: true, rings: ringsOf(states, log, T), favs, hidden: ['plank'] });
    expect(s.length).toBeLessThanOrEqual(MAX_SUGG);
    expect(s.some((x) => favs.includes(x.id))).toBe(false);
    expect(s.some((x) => x.id === 'plank')).toBe(false);
    expect(s.find((x) => x.id === 'stretch').key).toBe('after 2 cycling days');
    expect(s.find((x) => x.id === 'breath')).toMatchObject({ key: 'before going to sleep', tpl: { ring: 'mind' } });
    expect(s.find((x) => x.id === 'walk').key).toBe('dry today: good for outside');
    for (const x of s) expect(DE[x.key], x.key).toBeTruthy();
  });
  it('a paused activity is not suggested and not made again from a template', () => {
    const paused = [...all, normAct({ id: 'breath', name: 'Breathing exercise', ring: 'mind', paused: true, goals: [] })];
    expect(suggestions({ acts: paused, log: [], today: T, favs }).some((x) => x.id === 'breath')).toBe(false);
  });
  it('13 ideas to add; an added one leaves the list; a new activity gets a gentle goal at the end', () => {
    expect(FUN_IDEAS).toHaveLength(13);
    const a = actFromTemplate(FUN_IDEAS[2], all);
    expect(a).toMatchObject({ id: 'nap', nameDe: 'Nickerchen', goals: [{ count: 1, days: 7 }] });
    expect(a.order).toBeGreaterThan(Math.max(...all.map((x) => x.order)) - 1);
    expect(openIdeas([...all, a]).some((i) => i.id === 'nap')).toBe(false);
  });
  it('connections: weather is active when there is a forecast, the rest planned', () => {
    expect(connections(null).find((c) => c.id === 'weather').state).toBe('setup');
    expect(connections({ max: 14.2, rain: 'none' }).find((c) => c.id === 'weather')).toMatchObject({ state: 'active', vars: { max: 14 } });
    expect(connections(null).filter((c) => c.state === 'planned').map((c) => c.id)).toEqual(['strava', 'fitbit', 'ics', 'media']);
  });
});

describe('the database: version 8', () => {
  it('only adds the three tables, which go into the backup', () => {
    expect(SCHEMA_VERSION).toBe(8);
    expect(DATA_TABLES).toEqual(expect.arrayContaining(['flowSessions', 'flowTemplates', 'flowStars']));
  });
  it('the upgrade from version 7 keeps the old data', async () => {
    const name = 'hobby-upgrade';
    const old = new Dexie(name);
    // version 7 as it was on main (db.js before the hobby pages)
    old.version(7).stores({ items: 'id, category, ownership, weightStatus, *domains', kits: 'id, domain', trips: 'id, domain, status, startDate', debriefs: 'tripId', learnings: 'id, topic', events: 'id, sortDate', maintenance: 'id, subject, status', bikes: 'id', weightChecks: 'id', settings: 'key', meta: 'key', containers: 'id, slot', visits: 'id, bikeId, date', photos: 'id, bikeId, tripId', notes: 'id, status, at', rides: 'id, date, tripId', flowActs: 'id, order', flowLog: 'id, actId, day', flowChecks: 'day', kmBook: 'id, bikeId, date, state, importId' });
    await old.open();
    await old.flowActs.bulkPut(acts);
    await old.flowLog.put(e('meditation', T, { min: 20 }));
    await old.items.put({ id: 'test_item', name: 'Fictional tent', ownership: 'owned', domains: [] });
    await old.settings.put({ key: 'flowSeeded', value: true });
    old.close();

    const db = createDb(name);
    await db.open();
    expect(db.verno).toBe(8);
    expect(await db.flowActs.count()).toBe(12);
    expect(await db.flowLog.toArray()).toMatchObject([{ actId: 'meditation', min: 20 }]);
    expect(await db.items.get('test_item')).toMatchObject({ name: 'Fictional tent' });
    expect(await db.flowStars.count()).toBe(0);
    await saveStars(db, [{ id: 'meditation.devoted:1', msId: 'meditation.devoted', star: 1, day: T }]);
    expect(await db.flowStars.where('msId').equals('meditation.devoted').count()).toBe(1);
    db.close();
  });
  it('seed 2 runs once, keeps own names, and the stars go through a backup', async () => {
    const db = createDb('hobby-seed2');
    await ensureSeed(db);
    await db.flowActs.update('meditation', { nick: 'Stille' });
    await ensureSeed2(db);
    expect((await db.flowActs.get('meditation')).nick).toBe('Stille');
    expect((await db.flowActs.get('bike')).nickDe).toBe('Pedal-Glück');
    expect(await db.flowActs.get(WALK.id)).toMatchObject({ ring: 'rest' });
    expect((await db.settings.get(SEED2_KEY)).value).toBe(true);
    await deleteAct(db, 'walk');
    await ensureSeed2(db); // once: the deleted walk stays deleted
    expect(await db.flowActs.get('walk')).toBeUndefined();

    await db.flowSessions.put({ id: 'fl-1', actId: 'meditation', day: T, min: 20 });
    await saveStars(db, [{ id: 'x.activeDay:1', msId: 'x.activeDay', star: 1, day: T }]);
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    const other = createDb('hobby-seed2-b');
    await restoreBackup(other, file, 'replace');
    expect(await other.flowStars.get('x.activeDay:1')).toMatchObject({ day: T });
    // deleting an activity removes its session details too (its stars stay)
    await deleteAct(other, 'meditation');
    expect(await other.flowSessions.count()).toBe(0);
    expect(await other.flowStars.count()).toBe(1);
  });
});
