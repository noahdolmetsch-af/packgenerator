// «Trainingspläne» (Noah 19.10.2026): the sample plans, the start, the weeks, writing into the week plan,
// missed sessions and the felt effort 1–10. Fictional data only.
import { describe, it, expect } from 'vitest';
import { PLAN_TEMPLATES, allPlans, cleanOwn, ownOf, midHours, weekFactor, firstMonday, buildPlan, applyPlan, removePlan, weeksGone, zoneWays, moveSuggestions, feelToAsk } from '../src/lib/training/plans.js';
import { cleanSession, feelOf, feelZone, zoneFeel, DEFAULT_BOUNDS } from '../src/lib/training.js';
import { sessionState } from '../src/lib/training/inhalt/inhalt-woche.js';
import de from '../src/lib/i18n/de/index.js';

describe('sample plans', () => {
  it('has the four plans of Noah «4 1-4», each with German texts', () => {
    expect(PLAN_TEMPLATES.map((p) => p.id)).toEqual(['first', 'multi', 'ultra', 'short']);
    for (const p of PLAN_TEMPLATES) {
      expect(de[p.name]).toBeTruthy();
      expect(de[p.who]).toBeTruthy();
      for (const d of p.days) expect(de[d.name]).toBeTruthy();
      expect(de['Endurance ride']).toBeTruthy();
      // the shares of a week add up to the whole week
      expect(Math.round(p.days.reduce((s, d) => s + d.share, 0) * 100)).toBe(100);
    }
  });
  it('hides samples and adds own plans after them', () => {
    const own = ownOf([{ id: 'own-1', name: ' Mein Plan ', base: 'multi', weeks: 30, lo: 9, hi: 3 }, { name: 'x', base: 'nope' }]);
    expect(own).toEqual([{ id: 'own-1', name: 'Mein Plan', base: 'multi', weeks: 24, lo: 9, hi: 9, order: 0 }]);
    const all = allPlans(own, ['first']);
    expect(all.map((p) => p.id)).toEqual(['multi', 'ultra', 'short', 'own-1']);
    expect(all.at(-1)).toMatchObject({ own: true, days: PLAN_TEMPLATES[1].days, name: 'Mein Plan' });
    expect(cleanOwn({ base: 'multi', name: '' })).toBe(null);
    expect(midHours(PLAN_TEMPLATES[1])).toBe(8.5);
  });
});

describe('weeks', () => {
  it('rises, eases every fourth week and tapers at the end', () => {
    const k = Array.from({ length: 12 }, (_, i) => weekFactor(i, 12));
    expect(k[0]).toEqual({ f: 0.8, kind: 'build' });
    expect(k[3].kind).toBe('easy');
    expect(k[3].f).toBeLessThan(k[2].f);
    expect(k[10]).toEqual({ f: 0.7, kind: 'taper' });
    expect(k[11]).toEqual({ f: 0.4, kind: 'race' });
    expect(k[8].f).toBeGreaterThan(k[0].f);
  });
  it('starts backwards from the race day or in the week of a day', () => {
    const multi = PLAN_TEMPLATES[1];
    // race on Saturday 2027-06-12: its Monday is 2027-06-07, 11 weeks before is 2027-03-22
    expect(firstMonday(multi, 'race', '2027-06-12')).toBe('2027-03-22');
    expect(firstMonday(multi, 'start', '2026-10-22')).toBe('2026-10-19');
    expect(firstMonday(multi, 'race', '')).toBe(null);
  });
  it('builds the sessions; no session on or after the race day; the second long day from six weeks before', () => {
    const multi = PLAN_TEMPLATES[1];
    const w = buildPlan(multi, { first: '2027-03-22', hours: 8, race: '2027-06-12' });
    expect(w).toHaveLength(12);
    expect(w[0].sessions.map((s) => s.day)).toEqual(['2027-03-23', '2027-03-24', '2027-03-25', '2027-03-27', '2027-03-28']);
    expect(w[0].sessions[4].name).toBe('Endurance ride');
    expect(w[6].sessions[4].name).toBe('Second long day');
    expect(w[11].sessions.every((s) => s.day < '2027-06-12')).toBe(true);
    for (const s of w.flatMap((x) => x.sessions)) expect(s.mins % 15).toBe(0);
    // the build weeks sum about the chosen hours (80 % in week 1)
    expect(Math.abs(w[0].mins - 8 * 60 * 0.8)).toBeLessThanOrEqual(5 * 15);
  });
  it('counts the weeks that fell away', () => {
    expect(weeksGone('2026-10-05', '2026-10-21')).toBe(2);
    expect(weeksGone('2026-11-02', '2026-10-21')).toBe(0);
  });
});

describe('week plan', () => {
  const mine = cleanSession({ id: 'own', day: '2026-10-24', mins: 60, zone: 2 });
  it('keeps the plan id on a session', () => {
    expect(cleanSession({ day: '2026-10-24', mins: 60, src: 'tpl:multi' }).src).toBe('tpl:multi');
    expect('src' in mine).toBe(false);
  });
  it('writes a plan from today on, replaces an old plan, keeps own sessions and the past', () => {
    const old = [mine, cleanSession({ id: 'p1', day: '2026-10-20', mins: 60, src: 'tpl:first' }), cleanSession({ id: 'p2', day: '2026-10-23', mins: 60, src: 'tpl:first' })];
    const weeks = buildPlan(PLAN_TEMPLATES[0], { first: '2026-10-19', hours: 6 });
    const next = applyPlan(old, weeks, 'first', '2026-10-21', (x) => `DE ${x}`);
    expect(next.find((s) => s.id === 'own')).toBeTruthy();
    expect(next.find((s) => s.id === 'p1')).toBeTruthy(); // in the past
    expect(next.find((s) => s.id === 'p2')).toBeFalsy(); // replaced
    const added = next.filter((s) => s.src === 'tpl:first' && s.id !== 'p1');
    expect(added.every((s) => s.day >= '2026-10-21' && s.name.startsWith('DE '))).toBe(true);
    expect(removePlan(next, '2026-10-21').map((s) => s.id)).toEqual(['own', 'p1']);
  });
  it('suggests a free day for a missed session of this week, the long ones first', () => {
    const s1 = cleanSession({ id: 'a', day: '2026-10-19', mins: 60, zone: 2 });
    const s2 = cleanSession({ id: 'b', day: '2026-10-20', mins: 180, zone: 2 });
    const s3 = cleanSession({ id: 'c', day: '2026-10-22', mins: 60, zone: 2 });
    const states = [{ s: s1, state: 'missed' }, { s: s2, state: 'missed' }];
    // today Thursday 22nd: Thursday is taken, free are Friday, Saturday, Sunday
    expect(moveSuggestions(states, [s1, s2, s3], '2026-10-22').map((m) => [m.s.id, m.to])).toEqual([['b', '2026-10-23'], ['a', '2026-10-24']]);
  });
});

describe('felt effort', () => {
  it('own answer first, then Strava, else nothing', () => {
    expect(feelOf({ feel: 6, rpe: 3 })).toBe(6);
    expect(feelOf({ rpe: 3 })).toBe(3);
    expect(feelOf({ feel: 0 })).toBe(null);
    expect([1, 2, 3, 6, 9, 10].map(feelZone)).toEqual([1, 1, 2, 3, 5, 5]);
    expect(zoneFeel(2)).toEqual([3, 4]);
  });
  it('asks for the newest ride of the last 3 days without an answer', () => {
    const acts = [
      { id: '1', kind: 'bike', day: '2026-10-20', time: '08:00' },
      { id: '2', kind: 'bike', day: '2026-10-21', time: '07:00', feel: 5 },
      { id: '3', kind: 'run', day: '2026-10-21', time: '09:00' },
      { id: '4', kind: 'bike', day: '2026-10-21', time: '06:00', feelSkip: true },
      { id: '5', kind: 'bike', day: '2026-10-15', time: '06:00' },
    ];
    expect(feelToAsk(acts, '2026-10-21')?.id).toBe('1');
    expect(feelToAsk(acts.slice(1), '2026-10-21')).toBe(null);
  });
  it('stands in for the zone of «Plan kept?» without heart rate, and counts nothing without an answer', () => {
    const s = cleanSession({ id: 's', day: '2026-10-20', mins: 60, zone: 2 });
    expect(sessionState(s, [{ id: 'x', kind: 'bike', day: '2026-10-20', movingS: 3600, feel: 8 }], '2026-10-21', DEFAULT_BOUNDS)).toMatchObject({ zone: 4, state: 'other' });
    expect(sessionState(s, [{ id: 'x', kind: 'bike', day: '2026-10-20', movingS: 3600 }], '2026-10-21', DEFAULT_BOUNDS)).toMatchObject({ zone: null, state: 'kept' });
  });
  it('shows a zone in three ways', () => {
    const w = zoneWays(2, DEFAULT_BOUNDS, 250);
    expect(w.feel).toEqual([3, 4]);
    expect(w.w).toEqual({ from: 139, to: 188 });
    expect(zoneWays(2, DEFAULT_BOUNDS, null).w).toBe(null);
  });
});

import { raceChoices, raceMoved } from '../src/lib/training/plans.js';
describe('coupled to a race', () => {
  const trips = [
    { id: 't1', title: 'Beispiel 1000', startDate: '2027-06-12' },
    { id: 't2', title: 'Wochenende', startDate: '2027-05-01' },
    { id: 't3', title: 'Brevet', startDate: '2027-04-10', event: true },
    { id: 't4', title: 'Vorbei', startDate: '2026-09-01', event: true },
  ];
  it('lists the races ahead, soonest first: from Rennen or marked as race', () => {
    expect(raceChoices(trips, { races: { t1: {} } }, '2026-10-21').map((r) => r.id)).toEqual(['t3', 't1']);
    expect(raceChoices(trips, null, '2026-10-21').map((r) => r.id)).toEqual(['t3']);
  });
  it('notices when the race moved', () => {
    expect(raceMoved({ mode: 'race', date: '2027-06-12', tripId: 't1' }, trips)).toBe(null);
    expect(raceMoved({ mode: 'race', date: '2027-06-05', tripId: 't1' }, trips)).toBe('2027-06-12');
    expect(raceMoved({ mode: 'start', date: '2027-06-05', tripId: 't1' }, trips)).toBe(null);
  });
});
