// «Mehr Inhalt» T1 «Plan erfüllt?», T3 «Ausdauer-Check», T4 «FTP über die Monate»: the pure maths.
// Fictional activities only; fixed calendar days, nothing reads the clock.
import { describe, it, expect } from 'vitest';
import { sessionState, planWeeks, decoupling, decouplePoints, longCalm, ftpMonths, hardRecently, monthEnd, PLAN_WEEKS, DEC_TREND_MIN } from '../src/lib/training/inhalt/inhalt-woche.js';
import { ftpEstimate, shiftDay } from '../src/lib/training.js';

const P = 'test_data_gtp_';
const BOUNDS = [115, 135, 150, 165]; // Z1 < 115 ≤ Z2 < 135 ≤ Z3 < 150 ≤ Z4 < 165 ≤ Z5
const histIn = (bpm) => ({ [bpm]: 3000, 100: 200 });
const TODAY = '2026-10-15'; // a Thursday
const ride = (id, day, f = {}) => ({ id, day, kind: 'bike', name: `${P}${id}`, movingS: 3900, hrAvg: 130, hist: histIn(125), ...f });
const sess = (id, day, f = {}) => ({ id, day, kind: 'bike', name: `${P}${id}`, mins: 60, zone: 2, ...f });

describe('T1 plan kept', () => {
  it('kept, nearly (±1 zone), other, missed and still open', () => {
    expect(sessionState(sess('a', '2026-10-13'), [ride('1', '2026-10-13')], TODAY, BOUNDS)).toMatchObject({ state: 'kept', zone: 2, diff: 0 });
    expect(sessionState(sess('a', '2026-10-13'), [ride('1', '2026-10-13', { hist: histIn(140) })], TODAY, BOUNDS)).toMatchObject({ state: 'near', zone: 3, diff: 1 });
    expect(sessionState(sess('a', '2026-10-13'), [ride('1', '2026-10-13', { hist: histIn(158) })], TODAY, BOUNDS)).toMatchObject({ state: 'other', zone: 4, diff: 2 });
    expect(sessionState(sess('a', '2026-10-13', { zone: 4 }), [ride('1', '2026-10-13', { hist: histIn(105) })], TODAY, BOUNDS)).toMatchObject({ state: 'other', diff: -3 });
    expect(sessionState(sess('a', '2026-10-13'), [ride('1', '2026-10-12')], TODAY, BOUNDS).state).toBe('missed');
    expect(sessionState(sess('a', '2026-10-13'), [ride('1', '2026-10-13', { kind: 'run' })], TODAY, BOUNDS).state).toBe('missed');
    expect(sessionState(sess('a', TODAY), [], TODAY, BOUNDS).state).toBe('open');
    expect(sessionState(sess('a', '2026-10-17'), [], TODAY, BOUNDS).state).toBe('open');
    // no zone planned, or no heart rate: done counts as kept
    expect(sessionState(sess('a', '2026-10-13', { zone: null }), [ride('1', '2026-10-13', { hist: histIn(158) })], TODAY, BOUNDS).state).toBe('kept');
    expect(sessionState(sess('a', '2026-10-13'), [ride('1', '2026-10-13', { hist: null })], TODAY, BOUNDS)).toMatchObject({ state: 'kept', zone: null });
    // «other» takes any kind
    expect(sessionState(sess('a', '2026-10-13', { kind: 'other' }), [ride('1', '2026-10-13', { kind: 'run' })], TODAY, BOUNDS).state).toBe('kept');
  });
  it('two sessions on one day each take their own activity, the closest in minutes', () => {
    const acts = [ride('long', '2026-10-13', { movingS: 7200 }), ride('short', '2026-10-13', { movingS: 1800, hist: histIn(158) })];
    const w = planWeeks([sess('a', '2026-10-13', { mins: 120 }), sess('b', '2026-10-13', { mins: 30, zone: 4 })], acts, TODAY, BOUNDS);
    const rows = w.weeks.at(-1).rows;
    expect(rows.map((r) => r.act.id).sort()).toEqual(['long', 'short']);
    expect(rows.find((r) => r.s.id === 'b')).toMatchObject({ act: { id: 'short' }, state: 'kept' });
  });
  it('this week and the last five: counts, only the due sessions count', () => {
    const plan = [sess('m', '2026-10-12'), sess('t', '2026-10-13'), sess('w', '2026-10-14', { zone: 3 }), sess('today', TODAY), sess('sa', '2026-10-17'), sess('old', '2026-09-08'), sess('too-old', '2026-08-01')];
    const acts = [ride('1', '2026-10-12'), ride('2', '2026-10-14', { hist: histIn(158) }), ride('3', '2026-09-08')];
    const w = planWeeks(plan, acts, TODAY, BOUNDS);
    expect(w.weeks).toHaveLength(PLAN_WEEKS);
    expect(w.weeks[0].monday).toBe('2026-09-07');
    expect(w.weeks[0]).toMatchObject({ due: 1, kept: 1 });
    const now = w.weeks.at(-1);
    expect(now).toMatchObject({ monday: '2026-10-12', current: true, due: 3, kept: 1, near: 1, missed: 1, other: 0 });
    expect(now.rows.map((r) => r.state)).toEqual(['kept', 'missed', 'near', 'open', 'open']);
    expect(w.any).toBe(true);
    expect(planWeeks([sess('too-old', '2026-08-01')], acts, TODAY, BOUNDS).any).toBe(false);
  });
});

describe('T3 endurance check', () => {
  it('decoupling from the two halves', () => {
    expect(decoupling([{ s: 2000, w: 200, hr: 130 }, { s: 2000, w: 200, hr: 134 }])).toBe(3);
    expect(decoupling([{ w: 190, hr: 134 }, { w: 186, hr: 140 }])).toBe(6.3);
    expect(decoupling([{ w: 200, hr: 140 }, { w: 200, hr: 138 }])).toBe(-1.4);
    expect(decoupling([{ w: 0, hr: 140 }, { w: 200, hr: 138 }])).toBe(null);
    expect(decoupling(null)).toBe(null);
  });
  const halves = (hr2) => [{ s: 1950, w: 200, hr: 130 }, { s: 1950, w: 200, hr: hr2 }];
  const pm = (id, day, f = {}) => ride(id, day, { wDevice: true, w20: 240, halves: halves(134), ...f });
  it('only long calm rides with a power meter, heart rate and both halves', () => {
    expect(longCalm(pm('1', TODAY), BOUNDS)).toBe(true);
    expect(longCalm(pm('1', TODAY, { movingS: 3500 }), BOUNDS)).toBe(false);
    expect(longCalm(pm('1', TODAY, { wDevice: false }), BOUNDS)).toBe(false);
    expect(longCalm(pm('1', TODAY, { hrAvg: null }), BOUNDS)).toBe(false);
    expect(longCalm(pm('1', TODAY, { halves: null }), BOUNDS)).toBe(false);
    expect(longCalm(pm('1', TODAY, { hist: histIn(158) }), BOUNDS)).toBe(false);
    expect(longCalm(pm('1', TODAY, { kind: 'run' }), BOUNDS)).toBe(false);
  });
  it('six months of rides, the mean and a trend from three rides', () => {
    const acts = [pm('a', '2026-05-01', { halves: halves(140) }), pm('b', '2026-06-10', { halves: halves(136.5) }), pm('c', '2026-08-20', { halves: halves(133.9) }), pm('d', '2026-10-01', { halves: halves(132.6) }), pm('e', '2026-04-30'), pm('f', '2026-10-02', { movingS: 1800 })];
    const d = decouplePoints(acts, TODAY, BOUNDS);
    expect(d.from).toBe('2026-05-01');
    expect(d.pts.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(d.pts.map((p) => p.v)).toEqual([7.1, 4.8, 2.9, 2]);
    expect(d.mean).toBe(4.2);
    expect(d.trend.b).toBeLessThan(0);
    expect(decouplePoints(acts.slice(0, DEC_TREND_MIN - 1), TODAY, BOUNDS).trend).toBe(null);
    expect(decouplePoints([], TODAY, BOUNDS)).toMatchObject({ pts: [], mean: null, trend: null });
  });
});

describe('T4 FTP over the months', () => {
  it('the month end, today for this month, also over the turn of the year', () => {
    expect(monthEnd('2026-02-01', TODAY)).toBe('2026-02-28');
    expect(monthEnd('2025-12-01', TODAY)).toBe('2025-12-31');
    expect(monthEnd('2026-10-01', TODAY)).toBe(TODAY);
  });
  const p = (id, day, w20) => ({ id, day, kind: 'bike', wDevice: true, w20 });
  const acts = [p('1', '2025-11-20', 250), p('2', '2026-03-10', 240), p('3', '2026-07-01', 260), p('4', '2026-08-25', 200)];
  it('the estimate of the app at each month end (95 % of the best 20 minutes in 90 days), with W/kg', () => {
    const m = ftpMonths(acts, TODAY, [{ day: '2026-01-01', kg: 72 }, { day: '2026-08-01', kg: 70 }]);
    expect(m).toHaveLength(12);
    expect(m[0]).toMatchObject({ ym: '2025-11', end: '2025-11-30', ftp: 238, kg: 72, wkg: 3.3 });
    expect(m.map((x) => x.ftp)).toEqual(m.map((x) => ftpEstimate(acts, x.end)));
    expect(m.find((x) => x.ym === '2026-03').ftp).toBe(228);
    expect(m.find((x) => x.ym === '2026-07').ftp).toBe(247);
    expect(m.find((x) => x.ym === '2026-07').wkg).toBe(3.4);
    expect(m.at(-1)).toMatchObject({ ym: '2026-10', end: TODAY, ftp: 190, kg: 70, wkg: 2.7 });
    expect(m.find((x) => x.ym === '2026-06').ftp).toBe(null); // nothing in the 90 days up to 30 June
    expect(ftpMonths(acts, TODAY)[0]).toMatchObject({ kg: null, wkg: null });
  });
  it('a full hard 20 minutes in the last six weeks: at least 90 % of the estimate', () => {
    expect(hardRecently(acts, TODAY)).toBe(false); // the 200 of 25 Aug is older than 6 weeks
    expect(hardRecently([p('1', '2026-09-01', 250), p('2', '2026-10-10', 220)], TODAY)).toBe(true); // 220 ≥ 0.9 × 238
    expect(hardRecently([p('1', '2026-08-20', 250), p('2', '2026-10-10', 200)], TODAY)).toBe(false); // the 250 is older than 6 weeks, 200 < 214
    expect(hardRecently([], TODAY)).toBe(null);
  });
});
