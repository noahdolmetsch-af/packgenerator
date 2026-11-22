import { describe, it, expect } from 'vitest';
import { offsetFor } from '../src/lib/blockplan.js';
import { outdoorOf, startOutdoor, isOutdoor, stravaMin, dayOf, addMin, undoMin, standing, allMin, lightLine, offerOpen, remindDays, REMIND_AT } from '../src/lib/outdoor.js';

const walk = (day, min, extra = {}) => ({ id: `${day}-${min}`, day, type: 'Walk', movingS: min * 60, ...extra });
const rec0 = () => startOutdoor({ today: '2026-11-22', until: '2026-12-31' });

describe('outdoor challenge', () => {
  it('starts with 90 minutes from the first day to the end of the year', () => {
    const r = rec0();
    expect(r).toMatchObject({ goalMin: 90, from: '2026-11-22', until: '2026-12-31', stopped: false, closed: false });
    expect(standing(r, [], '2026-11-22').total).toBe(40);
  });
  it('makes a stored record safe', () => {
    expect(outdoorOf(null)).toBeNull();
    expect(outdoorOf({ from: '2026-12-02', until: '2026-12-01' })).toBeNull();
    expect(outdoorOf({ no: '2026-11-21' })).toEqual({ no: '2026-11-21' });
    expect(outdoorOf({ from: '2026-11-22', until: '2026-12-31', goalMin: 'x', hand: { '2026-11-22': [30, -5, 'a'], bad: [1] } })).toMatchObject({ goalMin: 90, hand: { '2026-11-22': [30] } });
  });
  it('counts Strava outdoor kinds, not the trainer and not indoor kinds', () => {
    const acts = [walk('2026-11-22', 40), walk('2026-11-22', 20, { type: 'Ride', trainer: true }), walk('2026-11-22', 30, { type: 'VirtualRide' }), walk('2026-11-22', 25, { type: 'Ride' }), walk('2026-11-23', 50)];
    expect(isOutdoor(acts[1])).toBe(false);
    expect(stravaMin(acts, '2026-11-22')).toBe(65);
  });
  it('adds Strava and hand minutes and reaches the goal', () => {
    let r = addMin(rec0(), '2026-11-22', 30);
    r = addMin(r, '2026-11-22', 30);
    const acts = [walk('2026-11-22', 30)];
    expect(dayOf(r, acts, '2026-11-22')).toMatchObject({ strava: 30, hand: 60, total: 90, done: true });
    expect(dayOf(rec0(), acts, '2026-11-22').done).toBe(false);
  });
  it('takes the last added minutes back', () => {
    const r = addMin(addMin(rec0(), '2026-11-22', 15), '2026-11-22', 30);
    expect(undoMin(r, '2026-11-22').hand['2026-11-22']).toEqual([15]);
    expect(undoMin(undoMin(r, '2026-11-22'), '2026-11-22').hand['2026-11-22']).toBeUndefined();
  });
  it('never adds more than a day has', () => {
    const r = addMin(addMin(rec0(), '2026-11-22', 1400), '2026-11-22', 100);
    expect(r.hand['2026-11-22'].reduce((a, b) => a + b, 0)).toBe(1440);
  });
  it('stands before the start, on a day, missed days and the streak', () => {
    const r = rec0();
    expect(standing(r, [], '2026-11-21')).toMatchObject({ phase: 'soon', dayNo: 0, doneN: 0, missed: 0 });
    const acts = [walk('2026-11-22', 90), walk('2026-11-23', 100), walk('2026-11-25', 95)];
    const s = standing(r, acts, '2026-11-26');
    expect(s).toMatchObject({ phase: 'running', dayNo: 5, doneN: 3, missed: 1, streak: 1 });
    expect(s.days.map((d) => d.state).slice(0, 6)).toEqual(['ok', 'ok', 'miss', 'ok', 'today', 'todo']);
  });
  it('an open today does not break the streak, a done today adds to it', () => {
    const r = rec0();
    const acts = [walk('2026-11-22', 90), walk('2026-11-23', 90)];
    expect(standing(r, acts, '2026-11-24').streak).toBe(2);
    expect(standing(r, [...acts, walk('2026-11-24', 90)], '2026-11-24').streak).toBe(3);
    expect(standing(r, acts, '2026-11-25').streak).toBe(0);
  });
  it('is over after the last day and sums the minutes', () => {
    const r = startOutdoor({ today: '2026-11-22', until: '2026-11-23' });
    const s = standing(r, [walk('2026-11-22', 90), walk('2026-11-23', 30)], '2026-11-24');
    expect(s).toMatchObject({ phase: 'over', doneN: 1, missed: 1, dayNo: 2 });
    expect(allMin(r, [walk('2026-11-22', 90), walk('2026-11-23', 30)], '2026-11-24')).toBe(120);
  });
  it('a stopped challenge says so', () => {
    expect(standing({ ...rec0(), stopped: true }, [], '2026-11-25').phase).toBe('stopped');
  });
  it('gives the sunset and the latest start at a home place', () => {
    const place = { lat: 47.37, lon: 8.54 };
    const l = lightLine(place, '2026-11-22', 60, new Date('2026-11-22T10:00:00Z'));
    const h = (utcH) => String(utcH + offsetFor('2026-11-22') / 60).padStart(2, '0'); // the device's own clock
    expect(l.set).toMatch(new RegExp(`^${h(15)}:[4-5]\\d$`));
    expect(l.latest).toMatch(new RegExp(`^${h(14)}:[4-5]\\d$`));
    expect(lightLine(place, '2026-11-22', 60, new Date('2026-11-22T15:50:00Z')).latest).toBeNull();
    expect(lightLine(null, '2026-11-22', 60)).toBeNull();
    expect(lightLine(place, '2026-11-22', 0)).toBeNull();
  });
  it('offers the start, and again 30 days after «not now»', () => {
    expect(offerOpen(null, '2026-11-22')).toBe(true);
    expect(offerOpen({ no: '2026-11-22' }, '2026-12-01')).toBe(false);
    expect(offerOpen({ no: '2026-11-22' }, '2026-12-22')).toBe(true);
    expect(offerOpen(rec0(), '2026-11-23')).toBe(false);
    expect(offerOpen({ ...rec0(), closed: true, no: '2026-11-23' }, '2026-11-24')).toBe(false);
  });
});

describe('outdoor phone reminder', () => {
  it('has 16:00 as the time unless a valid one is stored', () => {
    expect(rec0().remindAt).toBe(REMIND_AT);
    expect(REMIND_AT).toBe('16:00');
    expect(outdoorOf({ ...rec0(), remindAt: '17:30' }).remindAt).toBe('17:30');
    expect(outdoorOf({ ...rec0(), remindAt: '25:00' }).remindAt).toBe('16:00');
  });
  it('lists the days from today up to the horizon, with the minutes left', () => {
    const l = remindDays(rec0(), [], '2026-11-22', 3);
    expect(l.map((x) => x.day)).toEqual(['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25']);
    expect(l[0].left).toBe(90);
  });
  it('leaves today out when it is reached and shows what is left otherwise', () => {
    const r = addMin(rec0(), '2026-11-22', 30);
    expect(remindDays(r, [walk('2026-11-22', 30)], '2026-11-22', 1)[0]).toEqual({ day: '2026-11-22', left: 30 });
    expect(remindDays(r, [walk('2026-11-22', 60)], '2026-11-22', 1).map((x) => x.day)).toEqual(['2026-11-23']);
  });
  it('stops at the last day, before the first day nothing, and when ended or closed', () => {
    expect(remindDays(rec0(), [], '2026-12-30', 14).map((x) => x.day)).toEqual(['2026-12-30', '2026-12-31']);
    expect(remindDays(rec0(), [], '2026-11-20', 3).map((x) => x.day)).toEqual(['2026-11-22', '2026-11-23']);
    expect(remindDays({ ...rec0(), stopped: true }, [], '2026-11-22')).toEqual([]);
    expect(remindDays({ ...rec0(), closed: true }, [], '2026-11-22')).toEqual([]);
    expect(remindDays(null, [], '2026-11-22')).toEqual([]);
  });
});

