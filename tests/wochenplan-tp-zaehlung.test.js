// «TrainingPeaks zählt im Wochen-Soll mit» (Noah 22.11.2026 «1a 2a 3a 4a»), W2: the numbers of «Mein Trainingsplan» and the week star.
// Made-up data only. Pure functions.
import { describe, it, expect } from 'vitest';
import { meinPlan, weekRows, sumOf } from '../src/lib/training/meinplan.js';
import { planOf as weekplanOf } from '../src/lib/training/wochenplan.js';
import { weekFor, withSnapshot, setDone, syncTpDone, tpTicks, tpSnapUnits, completedOn, starWeeks, weekLog, logOf, progress } from '../src/lib/training/wochenlog.js';

const MON = '2026-11-30'; // winter
const WED = '2026-12-02';
const stored = weekplanOf(null);
const tp = (id, day, mins, o = {}) => ({ id, day, kind: 'bike', name: 'Test Endurance', mins, zone: 2, src: 'tp', ...o });
const SESS = [tp('a', '2026-12-01', 64, { time: '07:30' }), tp('b', '2026-12-03', 250, { time: '09:00' })];
const act = (day) => ({ id: `act-${day}`, day, kind: 'bike', movingS: 3600 });

describe('Zählung: Plan plus TrainingPeaks ist die Woche', () => {
  it('Zeilen von TrainingPeaks tragen tp, die Summe nennt tpMins', () => {
    const rows = weekRows({ stored, log: logOf(null), sessions: SESS, acts: [] }, MON, WED);
    const t = rows.filter((r) => r.tp);
    expect(t.map((r) => r.id)).toEqual(['s:a', 's:b']);
    expect(sumOf(rows).tpMins).toBe(314);
    expect(sumOf(rows.filter((r) => !r.tp)).tpMins).toBeUndefined();
  });
  it('die Woche mit TrainingPeaks hat nie «Velo draussen» zusätzlich, wenn TrainingPeaks es deckt', () => {
    const rows = weekRows({ stored, log: logOf(null), sessions: SESS, acts: [] }, MON, WED);
    expect(rows.filter((r) => r.src === 'plan' && (r.type === 'bikeOut' || r.type === 'bikeIn'))).toEqual([]);
    const without = weekRows({ stored, log: logOf(null), sessions: [], acts: [] }, MON, WED);
    expect(without.filter((r) => r.src === 'plan' && (r.type === 'bikeOut' || r.type === 'bikeIn')).length).toBeGreaterThan(0);
    // plan plus TrainingPeaks: the plan lost the bike minutes, so the sum is not «Soll plus TrainingPeaks»
    const bikeMins = without.filter((r) => r.type === 'bikeOut' || r.type === 'bikeIn').reduce((a, r) => a + r.mins, 0);
    expect(sumOf(rows).plannedMins).toBe(sumOf(without).plannedMins - bikeMins + 314);
  });
  it('meinPlan: week.tpMins und eine vergangene Woche ohne doppelte Zeilen', () => {
    const m = meinPlan({ stored, rawPlan: { sessions: SESS }, today: WED });
    expect(m.week.tpMins).toBe(314);
    // a frozen week carries TrainingPeaks units in its snapshot; its rows come from the sessions, not twice
    const { cfg, week } = weekFor(stored, MON, {}, {}, SESS);
    const log = setDone(logOf(null), MON, week.units[0].id, true, WED, week.units, cfg.hours, tpSnapUnits(week.tp));
    const later = meinPlan({ stored, rawLog: log, rawPlan: { sessions: SESS }, today: '2026-12-09' });
    const past = later.weeks.find((w) => w.monday === MON);
    expect(past.rows.filter((r) => r.tp).length).toBe(2);
    expect(past.rows.filter((r) => r.type === 'tp').length).toBe(0);
  });
});

describe('Wochenstern: TrainingPeaks zählt mit (4a)', () => {
  const { cfg, week } = weekFor(stored, MON, {}, {}, SESS);
  const main = week.units.filter((u) => u.type !== 'med' && u.type !== 'stretch');
  const tpUnits = tpSnapUnits(week.tp);
  const ticked = (log, ids, day = WED) => ids.reduce((l, id) => setDone(l, MON, id, true, day, week.units, cfg.hours, tpUnits), log);

  it('tpSnapUnits: Einheiten vom Typ tp mit Tag, Zeit, Minuten', () => {
    expect(tpUnits).toEqual([
      { id: 'tp:a', type: 'tp', d: 1, t: '07:30', mins: 64 },
      { id: 'tp:b', type: 'tp', d: 3, t: '09:00', mins: 250 },
    ]);
    expect(tpSnapUnits(null)).toEqual([]);
  });
  it('offene TrainingPeaks-Einheiten verhindern den Stern', () => {
    const log = ticked(logOf(null), main.map((u) => u.id));
    expect(weekLog(log, MON).snap.units.filter((u) => u.type === 'tp').length).toBe(2);
    expect(completedOn(weekLog(log, MON))).toBeNull();
  });
  it('alles abgehakt, auch TrainingPeaks: der Stern ist da, am Tag des letzten Hakens', () => {
    let log = ticked(logOf(null), main.map((u) => u.id));
    log = syncTpDone(log, MON, [{ id: 'tp:a', done: true, day: '2026-12-01' }, { id: 'tp:b', done: true, day: '2026-12-03' }], WED);
    expect(completedOn(weekLog(log, MON))).toBe('2026-12-03');
    expect(starWeeks(log).map((s) => s.monday)).toEqual([MON]);
  });
  it('ohne TrainingPeaks in der Woche bleibt der Stern wie er war', () => {
    const w0 = weekFor(stored, MON);
    const m0 = w0.week.units.filter((u) => u.type !== 'med' && u.type !== 'stretch');
    let log = logOf(null);
    for (const u of m0) log = setDone(log, MON, u.id, true, WED, w0.week.units, w0.cfg.hours);
    expect(completedOn(weekLog(log, MON))).toBe(WED);
  });
  it('ein Schreiber ohne TrainingPeaks (Heute) lässt die TrainingPeaks-Einheiten im Schnappschuss', () => {
    let log = ticked(logOf(null), [main[0].id]);
    log = withSnapshot(log, MON, week.units, cfg.hours, WED); // no tp argument: keeps them
    expect(weekLog(log, MON).snap.units.filter((u) => u.type === 'tp').length).toBe(2);
    log = withSnapshot(log, MON, week.units, cfg.hours, WED, []); // a writer that knows: none left
    expect(weekLog(log, MON).snap.units.filter((u) => u.type === 'tp').length).toBe(0);
  });
  it('syncTpDone: setzt und nimmt Haken weg, nur bei tp-Ids, vergangene Woche bleibt, gleiche Eingabe gibt dasselbe Log', () => {
    let log = ticked(logOf(null), [main[0].id]);
    const on = syncTpDone(log, MON, [{ id: 'tp:a', done: true, day: '2026-12-01' }, { id: 'tp:b', done: false }], WED);
    expect(weekLog(on, MON).done['tp:a']).toBe('2026-12-01');
    expect(weekLog(on, MON).done[main[0].id]).toBe(WED); // an own tick stays
    expect(syncTpDone(on, MON, [{ id: 'tp:a', done: true, day: '2026-12-01' }, { id: 'tp:b', done: false }], WED)).toBe(on);
    const off = syncTpDone(on, MON, [{ id: 'tp:a', done: false }, { id: 'tp:b', done: false }], WED);
    expect(weekLog(off, MON).done['tp:a']).toBeUndefined();
    const gone = syncTpDone(on, MON, [{ id: 'tp:b', done: false }], WED); // session taken out: its tick goes
    expect(weekLog(gone, MON).done['tp:a']).toBeUndefined();
    expect(syncTpDone(on, MON, [], '2026-12-09')).toBe(on); // frozen
  });
  it('tpTicks: erledigt durch eine Aktivität desselben Tages oder von Hand', () => {
    const sessions = [...SESS.slice(0, 1), { ...SESS[1], done: true }];
    expect(tpTicks(sessions, [act('2026-12-01')], week.tp)).toEqual([{ id: 'tp:a', done: true, day: '2026-12-01' }, { id: 'tp:b', done: true, day: '2026-12-03' }]);
    expect(tpTicks(SESS, [], week.tp).map((x) => x.done)).toEqual([false, false]);
  });
  it('progress zählt TrainingPeaks als Einheit mit', () => {
    const p = progress([...week.units, ...tpUnits], { 'tp:a': '2026-12-01' }, []);
    expect(p.total).toBe(progress(week.units, {}, []).total + 2);
    expect(p.done).toBe(1);
  });
});
