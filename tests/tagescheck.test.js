// v0.127.0 «Tages-Check» 1: the morning check and the evening review (mockups T1, T2). The rules are
// pure: old rows read fine, Q11 filled in from rides, Q12/Q13 take turns, Q14 found from meditation,
// the highlights of the week, the suggestion, the entry from 20:30. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { checkOf, patchCheck, answer, complete, toggleId, outsideStep, rideMinutes, outsideFromRides, eveningTurn, mindfulFound, weekHighlights, suggestion, isEvening, checkHref, checkPart, eveningDone, BEST, JOYS, OUTSIDE } from '../src/lib/flowcheck.js';
import { addDays } from '../src/lib/flow.js';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import { saveCheck } from '../src/lib/flowdb.js';

const T = '2026-10-15'; // Thursday

describe('the row of the day', () => {
  it('an old row (v0.51) reads with every new answer empty', () => {
    const c = checkOf({ day: T, sleep: 6, energy: 5, mood: 7, q: 'body', extra: 6 });
    expect(c).toMatchObject({ sleep: 6, mood: 7, joy: [], goal: null, last: [], sugg: null, sat: null, best: [], story: '', goalDone: null, outside: null, people: null, fun: null, mindful: null });
    expect(complete(c)).toBe(true);
  });
  it('a new answer keeps the others; the old answer() keeps the new fields too', () => {
    let c = patchCheck(null, { joy: ['nature', 'Konzert'], goal: { id: 'ride' } }, T);
    c = answer(c, 'sleep', 7, T);
    c = patchCheck(c, { sat: 8, best: ['sport'], outside: '30-90' }, T);
    expect(c).toMatchObject({ day: T, sleep: 7, joy: ['nature', 'Konzert'], goal: { id: 'ride' }, sat: 8, best: ['sport'], outside: '30-90' });
  });
  it('broken values are dropped', () => {
    const c = checkOf({ day: T, sat: 12, outside: 'lots', people: 'x', goal: { id: 'nope' }, last: ['coffee', 'other'], best: 'sport', fun: '0' });
    expect(c).toMatchObject({ sat: null, outside: null, people: null, goal: null, last: ['coffee'], best: [], fun: null });
    expect(checkOf({ goal: { text: '  Ein eigener Satz ' } }, T).goal).toEqual({ text: 'Ein eigener Satz' });
  });
  it('chips toggle', () => {
    expect(toggleId(['nature'], 'sport')).toEqual(['nature', 'sport']);
    expect(toggleId(['nature', 'sport'], 'nature')).toEqual(['sport']);
  });
});

describe('Q11: time outside filled in from the rides', () => {
  it('four steps', () => {
    expect(OUTSIDE.map((x) => x)).toEqual(['0', 'lt30', '30-90', 'gt90']);
    expect([0, 20, 30, 31, 90, 91].map(outsideStep)).toEqual(['0', 'lt30', 'lt30', '30-90', '30-90', 'gt90']);
    expect(outsideStep(null)).toBeNull();
  });
  it('the time of a GPX ride, else a guess from its km', () => {
    expect(rideMinutes({ km: 24, movingH: 1.08 })).toBe(65);
    expect(rideMinutes({ km: 24, movingH: 1, totalH: 1.5 })).toBe(90);
    expect(rideMinutes({ km: 18 })).toBe(60);
    expect(rideMinutes({})).toBe(0);
  });
  it('only rides of that day; none → nothing filled in', () => {
    const rides = [{ date: T, km: 24, source: 'strava' }, { date: addDays(T, -1), km: 80 }, { date: T, km: 6 }];
    expect(outsideFromRides(rides, T)).toEqual({ step: 'gt90', min: 100, km: 30, n: 2 });
    expect(outsideFromRides([{ date: T, km: 6 }], T).step).toBe('lt30');
    expect(outsideFromRides(rides, addDays(T, 1))).toBeNull();
  });
});

describe('Q12 / Q13 take turns, Q14 found by itself', () => {
  it('one a day, in turn', () => {
    const a = eveningTurn(T);
    expect(eveningTurn(addDays(T, 1))).not.toBe(a);
    expect(eveningTurn(addDays(T, 2))).toBe(a);
    expect(['people', 'fun']).toContain(a);
  });
  it('today\'s meditation counts as the mindful moment', () => {
    const log = [
      { id: 'a', actId: 'meditation', day: T, at: `${T}T04:40:00.000Z`, min: 20 },
      { id: 'b', actId: 'meditation', day: T, at: `${T}T18:00:00.000Z`, min: 5 },
      { id: 'c', actId: 'meditation', day: addDays(T, -1), min: 30 },
      { id: 'd', actId: 'yoga', day: T, min: 60 },
    ];
    expect(mindfulFound(log, T)).toEqual({ min: 25, at: `${T}T04:40:00.000Z`, n: 2 });
    expect(mindfulFound(log, addDays(T, 1))).toBeNull();
  });
});

describe('the week so far', () => {
  it('highlights of the last 7 days, most first, own ones too', () => {
    const checks = [
      { day: T, best: ['nature', 'sport'] },
      { day: addDays(T, -1), best: ['nature'] },
      { day: addDays(T, -6), best: ['calm', 'Konzert'] },
      { day: addDays(T, -7), best: ['friends'] }, // 8 days ago: not in the week
    ];
    expect(weekHighlights(checks, T)).toEqual([{ id: 'nature', n: 2 }, { id: 'sport', n: 1 }, { id: 'calm', n: 1 }, { id: 'Konzert', n: 1 }]);
    expect(weekHighlights([], T)).toEqual([]);
  });
  it('the chips of the evening are those of the morning plus «Geschafft»', () => {
    expect(BEST.map((b) => b.id).sort()).toEqual([...JOYS.map((j) => j.id), 'done'].sort());
  });
});

describe('the suggestion and the entry', () => {
  it('rules: tired → easy, dry + nature → ride, wet → indoors', () => {
    expect(suggestion({ sleep: 3, energy: 8, joy: ['nature'] }).id).toBe('easy');
    expect(suggestion({ energy: 7, joy: ['nature'], weather: { max: 14, rain: 'none' } }).id).toBe('ride');
    expect(suggestion({ energy: 7, joy: ['nature'], weather: { max: 9, rain: 'rain' } }).id).toBe('indoor');
    expect(suggestion({ joy: ['calm'] }).id).toBe('calm');
    expect(suggestion({}).opts.length).toBeGreaterThan(0);
  });
  it('from 20:30 local time the entry offers the evening review', () => {
    expect(isEvening(new Date(2026, 9, 15, 20, 29))).toBe(false);
    expect(isEvening(new Date(2026, 9, 15, 20, 30))).toBe(true);
    expect(checkHref(new Date(2026, 9, 15, 7, 0))).toBe('#/check/morning');
    expect(checkHref(new Date(2026, 9, 15, 21, 0))).toBe('#/check/evening');
    expect(checkPart('#/check/evening')).toBe('evening');
    expect(checkPart('#/check/morning')).toBe('morning');
    expect(checkPart('#/check')).toBe('morning');
    expect(eveningDone({ day: T, sat: 7 })).toBe(true);
    expect(eveningDone({ day: T, sleep: 7 })).toBe(false);
  });
});

describe('storage', () => {
  it('the new answers go into the backup and come back', async () => {
    const db = createDb('tc-a');
    await saveCheck(db, patchCheck(null, { sleep: 6, joy: ['nature'], goal: { text: 'Fiktives Ziel' }, sat: 8, best: ['sport'], story: 'Ein Satz', outside: 'gt90', mindful: 'auto' }, T));
    const backup = await buildBackup(db);
    const other = createDb('tc-b');
    await restoreBackup(other, backup);
    expect(checkOf(await other.flowChecks.get(T))).toMatchObject({ sleep: 6, joy: ['nature'], goal: { text: 'Fiktives Ziel' }, sat: 8, best: ['sport'], story: 'Ein Satz', outside: 'gt90', mindful: 'auto' });
  });
});
