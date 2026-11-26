// «Fokus Intervalle / Kraft» as a kind of week (Noah 23.11.2026 «3a»): the planner, the stored mode and the texts. Fictional data only.
import { describe, it, expect } from 'vitest';
import { defaultsFor, planWeek, focusOf, FOCUS_MODES, countsMins, plannedMins } from '../src/lib/training/wochenplan.js';
import { NOTE_TEXT } from '../src/lib/training/wochenplan-text.js';
import { modeOf, setMode, logOf, weekFor } from '../src/lib/training/wochenlog.js';

const MON = '2026-11-09'; // a Monday in winter
const cfg = () => defaultsFor(false);
const run = (focus, over = {}, c = cfg()) => planWeek(c, { monday: MON, ski: false, rain: false, pins: {}, focus, ...over });
const of = (r, type) => r.units.filter((x) => x.type === type);
const intervals = (r) => r.units.filter((x) => x.variant === 'intervals');

describe('focusOf and the stored mode', () => {
  it('knows the two focus modes and never both', () => {
    expect(FOCUS_MODES).toEqual(['hit', 'kraft']);
    expect(focusOf({})).toBe(null);
    expect(focusOf({ hit: true })).toBe('hit');
    expect(focusOf({ kraft: true, light: true })).toBe('kraft');
    expect(modeOf({ hit: true, kraft: true })).toEqual({ hit: true });
    expect(modeOf({ kraft: true, light: true })).toEqual({ kraft: true, light: true });
  });
  it('is stored per week like the other kinds and goes into the plan of the week', () => {
    const log = setMode(logOf(null), MON, { kraft: true }, MON);
    expect(log.weeks[MON].mode).toEqual({ kraft: true });
    const r = weekFor(null, MON, {}, { kraft: true }, []);
    expect(of(r.week, 'gym').length).toBe(3);
  });
});

describe('without a focus nothing changes', () => {
  it('has one interval unit, as before', () => {
    const r = run(null);
    expect(intervals(r).length).toBe(1);
    expect(r.notes.some((n) => n.key.startsWith('focus'))).toBe(false);
  });
  it('an unknown focus is ignored', () => {
    expect(run('x').units).toEqual(run(null).units);
  });
});

describe('focus intervals', () => {
  it('makes two bike units intervals, on days that do not follow each other, and says so', () => {
    const r = run('hit');
    const iv = intervals(r);
    expect(iv.length).toBe(2);
    expect(Math.abs(iv[0].d - iv[1].d)).toBeGreaterThanOrEqual(2);
    expect(iv.every((u) => u.load === 'M' && ['bikeOut', 'bikeIn'].includes(u.type))).toBe(true);
    expect(r.notes.find((n) => n.key === 'focus-hit')?.n).toBe(2);
  });
  it('the winter start week has two bike units already: no swap, only the marks change', () => {
    const r = run('hit');
    expect(of(r, 'bikeIn').length + of(r, 'bikeOut').length).toBe(2);
    expect(r.notes.some((n) => n.key === 'focus-swap')).toBe(false);
  });
  it('keeps the hours: with no bike unit two indoor rides come in and small units make room', () => {
    const c = cfg();
    c.counts.bikeOut = 0;
    c.counts.bikeIn = 0;
    const base = run(null, {}, c);
    const r = run('hit', {}, c);
    expect(of(r, 'bikeIn').length).toBe(2);
    expect(intervals(r).length).toBe(2);
    expect(plannedMins(r.units)).toBeLessThanOrEqual(plannedMins(base.units) + 25);
    expect(r.notes.some((n) => n.key === 'focus-swap')).toBe(true);
  });
  it('with one bike unit one more comes in', () => {
    const c = cfg();
    c.counts.bikeIn = 0;
    const r = run('hit', {}, c);
    expect(of(r, 'bikeOut').length + of(r, 'bikeIn').length).toBe(2);
  });
  it('never touches fixed days', () => {
    const c = cfg();
    const r = run('hit', {}, c);
    for (const t of ['tennis', 'yoga', 'hockey']) expect(of(r, t).length).toBe(c.counts[t]);
  });
});

describe('focus strength', () => {
  it('has three gym sessions, no intervals, easy bike', () => {
    const r = run('kraft');
    expect(of(r, 'gym').length).toBe(3);
    expect(intervals(r).length).toBe(0);
    expect(r.units.filter((x) => ['bikeIn', 'bikeOut'].includes(x.type)).every((x) => x.variant === 'easy')).toBe(true);
    expect(r.notes.find((n) => n.key === 'focus-kraft')?.n).toBe(3);
  });
  it('keeps the hours: small units make room, the plan stays about as long', () => {
    const base = run(null);
    const r = run('kraft');
    expect(plannedMins(r.units)).toBeLessThanOrEqual(plannedMins(base.units) + 40);
    expect(r.notes.filter((n) => n.key === 'focus-swap').length).toBeGreaterThan(0);
  });
  it('a plan with three gym sessions already needs no swap', () => {
    const c = cfg();
    c.counts.gym = 3;
    expect(run('kraft', {}, c).notes.some((n) => n.key === 'focus-swap')).toBe(false);
  });
  it('is the same every time', () => {
    expect(run('kraft')).toEqual(run('kraft'));
  });
});

describe('with TrainingPeaks in the week', () => {
  const tp = (id, d, mins) => ({ id, day: `2026-11-${String(9 + d).padStart(2, '0')}`, kind: 'bike', name: 'Basemiles', mins, zone: 2, src: 'tp' });
  it('focus intervals adds no bike units when TrainingPeaks brings them: nothing is swapped out, nothing is lost', () => {
    const sessions = [tp('a', 1, 90), tp('b', 3, 90)];
    const base = run(null, { sessions });
    const r = run('hit', { sessions });
    expect(r.notes.find((n) => n.key === 'focus-hit-tp')).toBeTruthy();
    expect(r.notes.some((n) => n.key === 'focus-swap')).toBe(false);
    expect(r.units.filter((u) => u.type !== 'med' && u.type !== 'stretch').length).toBe(base.units.filter((u) => u.type !== 'med' && u.type !== 'stretch').length);
  });
  it('focus strength keeps the hours goal: it only adds a gym session when small units make room', () => {
    const sessions = [tp('a', 1, 150), tp('b', 3, 150), tp('c', 5, 150)];
    const base = run(null, { sessions });
    const r = run('kraft', { sessions });
    const total = (x) => plannedMins(x.units) + x.tp.reduce((a, u) => a + u.mins, 0);
    expect(total(r)).toBeLessThanOrEqual(total(base) + 25);
    expect(r.notes.some((n) => n.key === 'focus-kraft' || n.key === 'focus-kraft-none')).toBe(true);
  });
});

describe('ski tour week', () => {
  it('ignores the focus: the tour is the plan', () => {
    const a = run('hit', { ski: true });
    const b = run(null, { ski: true });
    expect(a.units).toEqual(b.units);
    expect(a.notes.some((n) => n.key.startsWith('focus'))).toBe(false);
  });
});

describe('summer', () => {
  it('focus strength in summer: three gym sessions, the summer bike hours stay', () => {
    const r = planWeek(defaultsFor(true), { monday: '2026-06-01', ski: false, rain: false, pins: {}, focus: 'kraft' });
    expect(of(r, 'gym').length).toBe(3);
    expect(countsMins(defaultsFor(true).counts)).toBeGreaterThan(0);
  });
});

describe('texts', () => {
  it('has a text for every note of the focus', () => {
    for (const k of ['focus-hit', 'focus-hit-tp', 'focus-hit-none', 'focus-kraft', 'focus-kraft-none', 'focus-swap']) expect(NOTE_TEXT[k]).toBeTruthy();
  });
});
