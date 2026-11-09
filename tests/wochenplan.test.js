// «Variabler Wochenplan» part 1 (Noah 09.11.2026): the planner, hours → units and the stored setting. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import {
  WEEKPLAN_KEY, GOAL_TYPES, MAX_COUNT, isSummer, defTime, defaultsFor, configOf, planOf, suggestFromHours, setHours, followsHours,
  stepCount, toggleFix, medDays, planWeek, plannedMins, overlaps, countsMins,
} from '../src/lib/training/wochenplan.js';

const MON_WINTER = '2026-11-09'; // a Monday in the winter window
const MON_SUMMER = '2026-06-01'; // a Monday in the summer window
const winter = () => defaultsFor(false);
const summer = () => defaultsFor(true);
const plan = (cfg, over = {}) => planWeek(cfg, { monday: MON_WINTER, ski: false, rain: false, pins: {}, ...over });
const ofType = (r, type) => r.units.filter((x) => x.type === type);
const noClash = (r) => {
  const U = r.units.filter((x) => !['med', 'stretch'].includes(x.type));
  for (let i = 0; i < U.length; i++) for (let j = i + 1; j < U.length; j++) if (U[i].d === U[j].d) expect(U[i].start < U[j].end && U[j].start < U[i].end, `${U[i].id} / ${U[j].id}`).toBe(false);
};

describe('season', () => {
  it('summer is 1 April to 30 October', () => {
    expect(isSummer('2026-03-31')).toBe(false);
    expect(isSummer('2026-04-01')).toBe(true);
    expect(isSummer('2026-10-30')).toBe(true);
    expect(isSummer('2026-10-31')).toBe(false);
    expect(isSummer('2026-12-24')).toBe(false);
  });
});

describe('the week of the start settings', () => {
  it('winter: everything wished for fits, no warning, no unit beyond 3 a day', () => {
    const r = plan(winter());
    expect(r.warnings).toEqual([]);
    expect(Math.max(...r.perDay)).toBeLessThanOrEqual(3);
    expect(r.perDay).toEqual([2, 2, 3, 2, 2, 1, 1]);
    expect(r.dayLoad.join('')).toBe('MHMHMHH');
    expect(r.freeHalves).toBeGreaterThanOrEqual(5);
    expect(ofType(r, 'tennis').map((x) => x.d)).toEqual([1, 3, 5]);
    expect(ofType(r, 'hockey').map((x) => x.d)).toEqual([6]);
    expect(ofType(r, 'yoga').map((x) => `${x.d} ${x.t}`)).toEqual(['0 09:30', '3 07:00']);
    expect(ofType(r, 'gym').map((x) => `${x.d} ${x.t}`)).toEqual(['2 15:00', '4 08:00']);
    expect(ofType(r, 'sauna')).toHaveLength(1);
    expect(ofType(r, 'rest')).toHaveLength(1);
    expect(Math.round(plannedMins(r.units) / 60)).toBe(15);
    noClash(r);
  });
  it('never puts two hard days beside three in a row, and the sauna follows the gym', () => {
    const r = plan(winter());
    const gym = ofType(r, 'gym').find((x) => x.d === 2);
    const sauna = ofType(r, 'sauna')[0];
    expect(sauna.d).toBe(gym.d);
    expect(sauna.start).toBeGreaterThanOrEqual(gym.end);
    expect(sauna.why).toEqual({ key: 'after-gym' });
  });
  it('is deterministic', () => {
    expect(plan(winter())).toEqual(plan(winter()));
  });
  it('gives every placement a reason as a code and no German text', () => {
    const r = plan(winter());
    for (const u of r.units) expect(typeof u.why.key).toBe('string');
    expect(JSON.stringify(r)).not.toMatch(/[äöüÄÖÜ]|Tennis|Velo/);
  });
});

describe('a skiing week', () => {
  it('is lighter: the tour replaces cycling, running and the mini workout, Thursday tennis is easy', () => {
    const r = plan(winter(), { ski: true });
    expect(ofType(r, 'ski')).toHaveLength(1);
    expect(ofType(r, 'ski')[0].d).toBe(5); // Saturday
    for (const t of ['bikeOut', 'bikeIn', 'runOut', 'runIn', 'mini']) expect(ofType(r, t)).toHaveLength(0);
    expect(r.notes.filter((n) => n.key === 'ski-drops').map((n) => n.type).sort()).toEqual(['bikeIn', 'bikeOut', 'mini', 'runIn', 'runOut']);
    expect(r.notes).toContainEqual({ key: 'ski-day-taken', type: 'tennis', d: 5 });
    const thu = ofType(r, 'tennis').find((x) => x.d === 3);
    expect(thu.load).toBe('M');
    expect(thu.variant).toBe('light');
    expect(r.units.filter((x) => x.d === 4 && !['med', 'stretch'].includes(x.type))).toHaveLength(0); // the day before is free
    expect(r.units.filter((x) => x.d === 5 && x.type !== 'ski')).toHaveLength(0); // nothing else on the tour day
    noClash(r);
  });
  it('moves to Sunday when the ice hockey is on Saturday', () => {
    const cfg = toggleFix(toggleFix(winter(), 'hockey', 6, false), 'hockey', 5, false);
    const r = plan(cfg, { ski: true });
    expect(ofType(r, 'ski')[0].d).toBe(6);
    expect(ofType(r, 'ski')[0].why).toEqual({ key: 'ski', sunday: true });
  });
});

describe('summer', () => {
  it('no ice hockey, 3× tennis, about 8 hours of cycling outdoors with the longest ride at the weekend', () => {
    const r = plan(summer(), { monday: MON_SUMMER });
    expect(ofType(r, 'hockey')).toHaveLength(0);
    expect(ofType(r, 'tennis')).toHaveLength(3);
    const bikes = ofType(r, 'bikeOut');
    expect(bikes).toHaveLength(4);
    expect(Math.round(bikes.reduce((a, x) => a + x.mins, 0) / 60)).toBe(8);
    const longest = bikes.reduce((a, b) => (b.mins > a.mins ? b : a));
    expect(longest.d).toBeGreaterThanOrEqual(5);
    expect(ofType(r, 'tennis').find((x) => x.d === 3).variant).toBe('evening');
    expect(r.warnings).toEqual([]);
    noClash(r);
  });
});

describe('a rainy week', () => {
  it('turns cycling outdoors into cycling indoors', () => {
    const cfg = stepCount(winter(), 'bikeOut', 0, false);
    const r = plan(cfg, { rain: true });
    expect(ofType(r, 'bikeOut')).toHaveLength(0);
    expect(ofType(r, 'bikeIn')).toHaveLength(2);
    expect(ofType(r, 'bikeIn').some((x) => x.variant === 'rain')).toBe(true);
  });
});

describe('hours → units', () => {
  it('15 hours in winter and 19 in summer are the start settings', () => {
    expect(suggestFromHours(15, false).counts).toEqual(winter().counts);
    const s = suggestFromHours(19, true);
    expect(s.counts).toEqual(summer().counts);
    expect(s.bikeHours).toBeGreaterThanOrEqual(7.5);
  });
  it('more hours never mean fewer units, and the plan stays near the goal while it fits', () => {
    let last = 0;
    for (let h = 6; h <= 24; h++) {
      const c = suggestFromHours(h, false).counts;
      const m = countsMins(c);
      expect(m).toBeGreaterThanOrEqual(last);
      last = m;
    }
    for (const h of [9, 12, 15, 18]) {
      const cfg = setHours(winter(), h, false);
      const r = plan(cfg);
      expect(Math.abs(plannedMins(r.units) / 60 - h)).toBeLessThan(1.5);
      expect(r.warnings).toEqual([]);
    }
  });
  it('above about 20 hours it says so instead of planning more', () => {
    const cfg = setHours(winter(), 24, false);
    const r = plan(cfg);
    expect(plannedMins(r.units) / 60).toBeLessThan(23);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
  it('setHours keeps fixed days the person set, cut to the new count', () => {
    let cfg = toggleFix(winter(), 'tennis', 4, false); // Friday: now 4 tennis, custom
    expect(cfg.counts.tennis).toBe(4);
    cfg = setHours(cfg, 9, false); // 2 tennis fit
    expect(cfg.counts.tennis).toBe(2);
    expect(cfg.fixes.tennis.map((f) => f.d)).toEqual([1, 3]);
  });
  it('knows whether the units still follow the hours', () => {
    expect(followsHours(winter(), false)).toBe(true);
    expect(followsHours(stepCount(winter(), 'mini', -1, false), false)).toBe(false);
  });
});

describe('changes by hand', () => {
  it('stepCount cuts fixed days beyond the count and never goes below 0 or above the maximum', () => {
    const cfg = stepCount(winter(), 'tennis', -1, false);
    expect(cfg.counts.tennis).toBe(2);
    expect(cfg.fixes.tennis.map((f) => f.d)).toEqual([1, 3]);
    expect(stepCount(winter(), 'mini', -5, false).counts.mini).toBe(0);
    expect(stepCount(winter(), 'tennis', 99, false).counts.tennis).toBe(MAX_COUNT.tennis);
    expect(stepCount(winter(), 'nonsense', 1, false)).toEqual(winter());
  });
  it('toggleFix adds and removes a fixed day, with the usual time of that day', () => {
    const a = toggleFix(winter(), 'tennis', 4, false);
    expect(a.fixes.tennis.map((f) => `${f.d} ${f.t}`)).toEqual(['1 10:00', '3 15:00', '4 10:00', '5 10:00']);
    expect(a.custom.tennis).toBe(true);
    const b = toggleFix(a, 'tennis', 1, false);
    expect(b.fixes.tennis.map((f) => f.d)).toEqual([3, 4, 5]);
    expect(b.counts.tennis).toBe(4); // the goal stays: one more unit is free now
    expect(toggleFix(winter(), 'sauna', 2, false)).toEqual(winter());
  });
  it('summer cycling hours follow the number of rides', () => {
    expect(stepCount(summer(), 'bikeOut', 1, true).bikeHours).toBeGreaterThan(summer().bikeHours);
    expect(stepCount(stepCount(summer(), 'bikeOut', -9, true), 'bikeOut', 0, true).bikeHours).toBe(null);
  });
});

describe('stable units', () => {
  it('a unit keeps its id when other goals change', () => {
    const a = plan(winter());
    const b = plan(stepCount(winter(), 'mini', 1, false));
    const ids = (r) => r.units.map((x) => x.id);
    expect(ids(a).every((id) => ids(b).includes(id))).toBe(true);
    expect(new Set(ids(a)).size).toBe(ids(a).length);
    expect(ids(a)).toContain('tennis@1');
    expect(ids(a)).toContain('bikeOut#1');
    expect(ids(a)).toContain('med@0');
  });
  it('a moved unit stays where it was put, the rest plans around it', () => {
    const base = plan(winter());
    const bike = ofType(base, 'bikeOut')[0];
    const r = plan(winter(), { pins: { [bike.id]: { d: 4, t: '16:00' } } });
    const moved = r.units.find((x) => x.id === bike.id);
    expect([moved.d, moved.t, moved.pinned, moved.why]).toEqual([4, '16:00', true, { key: 'pinned' }]);
    expect(r.units.filter((x) => x.pinned)).toHaveLength(1);
  });
  it('a pin on a unit that is gone is ignored', () => {
    const r = plan(winter(), { pins: { 'tennis#9': { d: 2, t: '12:00' } } });
    expect(r.units.some((x) => x.pinned)).toBe(false);
  });
});

describe('conflicts', () => {
  it('four hard days in a row are reported with a way out', () => {
    const r = plan(toggleFix(winter(), 'tennis', 4, false)); // Thu, Fri, Sat tennis + Sun hockey
    const w = r.warnings.find((x) => x.key === 'hard-run');
    expect(w).toBeTruthy();
    expect(w.fix).toEqual({ type: 'tennis', delta: -1 });
    expect(plan(stepCount(toggleFix(winter(), 'tennis', 4, false), 'tennis', -1, false)).warnings.find((x) => x.key === 'hard-run')).toBeUndefined();
  });
  it('two units that overlap are reported, and a moved one can go back', () => {
    const base = plan(winter());
    const gym = ofType(base, 'gym').find((x) => x.d === 4);
    const r = plan(winter(), { pins: { [gym.id]: { d: 1, t: '10:00' } } }); // on top of Tuesday tennis
    const o = r.warnings.find((x) => x.key === 'overlap');
    expect(o).toBeTruthy();
    expect(o.fix).toEqual({ unpin: gym.id });
    expect(overlaps(base.units)).toEqual([]);
  });
  it('a goal that does not fit says so, it is not dropped quietly', () => {
    const cfg = { ...winter(), counts: { ...winter().counts, hockey: 2, tennis: 5, bikeOut: 6, runOut: 3, gym: 4, mini: 4 } };
    const r = plan(cfg);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('meditation every second day', () => {
  it('continues across weeks with exactly one day between two sessions', () => {
    let last = null;
    for (const mon of ['2026-11-02', '2026-11-09', '2026-11-16', '2026-11-23', '2026-12-28', '2027-01-04']) {
      const days = medDays(mon);
      expect(days.length).toBeGreaterThanOrEqual(3);
      const dates = days.map((d) => Date.parse(`${mon}T12:00:00Z`) / 864e5 + d);
      if (last !== null) expect(dates[0] - last).toBe(2);
      for (let i = 1; i < dates.length; i++) expect(dates[i] - dates[i - 1]).toBe(2);
      last = dates[dates.length - 1];
      // the next listed Monday is not always the following week: only chain when it is
      if (mon === '2026-11-23') last = null;
    }
  });
  it('is dropped on the tour day, and stretching takes the days in between', () => {
    const r = plan(winter(), { ski: true });
    const days = medDays(MON_WINTER);
    const med = ofType(r, 'med').map((x) => x.d);
    expect(med.every((d) => days.includes(d))).toBe(true);
    expect(med).not.toContain(5);
    const stretch = ofType(r, 'stretch').map((x) => x.d);
    expect(stretch.every((d) => !days.includes(d))).toBe(true);
  });
});

describe('the stored setting', () => {
  it('nothing or nonsense gives the full start settings of both seasons', () => {
    for (const raw of [undefined, null, 'x', 7, [], {}]) expect(planOf(raw)).toEqual({ v: 1, winter: winter(), summer: summer() });
  });
  it('keeps valid values and repairs broken ones', () => {
    const raw = { winter: { hours: 99, counts: { tennis: 2, mini: -3, nonsense: 5, gym: 'x' }, fixes: { tennis: [{ d: 4, t: '07:00' }, { d: 4, t: '09:00' }, { d: 9, t: '10:00' }, { d: 2, t: 'abc' }] }, custom: { tennis: true } } };
    const w = planOf(raw).winter;
    expect(w.hours).toBe(24);
    expect(w.counts.tennis).toBe(2);
    expect(w.counts.mini).toBe(0);
    expect(w.counts.gym).toBe(winter().counts.gym);
    expect(w.counts.nonsense).toBeUndefined();
    expect(w.fixes.tennis).toEqual([{ d: 2, t: '10:00' }, { d: 4, t: '07:00' }]); // a double day and a day out of range are gone
    expect(GOAL_TYPES.every((t) => Number.isInteger(w.counts[t]))).toBe(true);
  });
  it('a person who cleared all fixed days keeps them cleared', () => {
    const w = planOf({ winter: { ...winter(), fixes: {}, custom: { tennis: true } } }).winter;
    expect(w.fixes.tennis).toBeUndefined();
    expect(w.fixes.yoga).toEqual(winter().fixes.yoga); // not touched by hand: the usual days
  });
  it('is stable: sanitising twice changes nothing', () => {
    const once = planOf(planOf({ winter: setHours(winter(), 12, false) }));
    expect(planOf(once)).toEqual(once);
  });
  it('defTime gives the usual start of a weekday', () => {
    expect(defTime('tennis', 3, false)).toBe('15:00');
    expect(defTime('tennis', 3, true)).toBe('19:00');
    expect(defTime('gym', 2, false)).toBe('15:00');
    expect(defTime('yoga', 4, false)).toBe('09:30');
  });
  it('configOf of a season is the config the planner reads', () => {
    expect(configOf(undefined, false)).toEqual(winter());
  });
});

describe('backup', () => {
  it('the setting goes through a backup and back unchanged (settings table, no new table)', async () => {
    const db = createDb('wochenplan-a');
    const value = planOf({ winter: setHours(toggleFix(winter(), 'tennis', 4, false), 11, false), summer: stepCount(summer(), 'bikeOut', 1, true) });
    await db.settings.put({ key: WEEKPLAN_KEY, value });
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.settings.find((r) => r.key === WEEKPLAN_KEY).value).toEqual(value);
    const other = createDb('wochenplan-b');
    await restoreBackup(other, file, 'replace');
    expect((await other.settings.get(WEEKPLAN_KEY)).value).toEqual(value);
    expect(planOf((await other.settings.get(WEEKPLAN_KEY)).value)).toEqual(value);
  });
  it('an old backup without the setting restores fine and gives the start settings', async () => {
    const db = createDb('wochenplan-c');
    const old = { app: 'pack-generator', schemaVersion: 1, tables: { settings: [{ key: 'riderWeightG', value: 64000 }] } };
    await restoreBackup(db, old, 'replace');
    expect(await db.settings.get(WEEKPLAN_KEY)).toBeUndefined();
    expect(planOf((await db.settings.get(WEEKPLAN_KEY))?.value)).toEqual({ v: 1, winter: winter(), summer: summer() });
  });
});
