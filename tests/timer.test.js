import { describe, it, expect } from 'vitest';
import {
  parseTime,
  setupOk,
  segmentsOf,
  startRun,
  position,
  pauseRun,
  resumeRun,
  addMinute,
  runDone,
  dueCue,
  digits,
  dur,
  short,
  setupWords,
  secUntil,
  prefsOf,
  faceFor,
  logEntry,
  logRowOk,
  mergeLog,
  filterLog,
  byDay,
  mondayOf,
  dayStats,
  weekStats,
  recentSetups,
  MODES,
  FACES,
  BLOCKS,
} from '../src/lib/timer.js';

// 14.10.2026 10:00 in Zurich (summer time, UTC+2)
const T0 = Date.parse('2026-10-14T08:00:00Z');

describe('parseTime (Z2: a time in words)', () => {
  it('reads minutes, hours and seconds', () => {
    expect(parseTime('7')).toEqual({ mode: 'down', sec: 420 });
    expect(parseTime('7 min')).toEqual({ mode: 'down', sec: 420 });
    expect(parseTime('1h 20m')).toEqual({ mode: 'down', sec: 4800 });
    expect(parseTime('1 Std 20 Minuten')).toEqual({ mode: 'down', sec: 4800 });
    expect(parseTime('90 s')).toEqual({ mode: 'down', sec: 90 });
    expect(parseTime('2,5 min')).toEqual({ mode: 'down', sec: 150 });
    expect(parseTime('1:30')).toEqual({ mode: 'down', sec: 90 });
    expect(parseTime('1:20:00')).toEqual({ mode: 'down', sec: 4800 });
  });
  it('reads «bis 17:30» as until', () => {
    expect(parseTime('bis 17:30')).toEqual({ mode: 'until', until: '17:30' });
    expect(parseTime('until 9:45')).toEqual({ mode: 'until', until: '09:45' });
    expect(parseTime('bis 18 Uhr')).toEqual({ mode: 'until', until: '18:00' });
    expect(parseTime('bis 25:00')).toBeNull();
  });
  it('reads Pomodoro and intervals', () => {
    expect(parseTime('25/5')).toEqual({ mode: 'pomodoro', work: 1500, rest: 300, rounds: 4 });
    expect(parseTime('52/17')).toEqual({ mode: 'pomodoro', work: 3120, rest: 1020, rounds: 1 });
    expect(parseTime('3x60s')).toEqual({ mode: 'interval', work: 60, rest: 0, rounds: 3 });
    expect(parseTime('8 × 20/10')).toEqual({ mode: 'interval', work: 20, rest: 10, rounds: 8 });
  });
  it('gives null for nonsense', () => {
    expect(parseTime('')).toBeNull();
    expect(parseTime('soon')).toBeNull();
    expect(parseTime('5 parsecs')).toBeNull();
    expect(parseTime('0')).toBeNull();
  });
});

describe('setups and segments', () => {
  it('makes a setup safe', () => {
    expect(setupOk({ mode: 'nope' })).toBeNull();
    expect(setupOk({ mode: 'down' })).toBeNull();
    expect(setupOk({ mode: 'pomodoro', work: 1500, rest: 300, rounds: 4, label: 'x' })).toEqual({ mode: 'pomodoro', work: 1500, rest: 300, rounds: 4, label: 'x' });
  });
  it('splits interval and Pomodoro into work and rest', () => {
    expect(segmentsOf({ mode: 'interval', work: 20, rest: 10, rounds: 2 })).toEqual([
      { kind: 'work', sec: 20 },
      { kind: 'rest', sec: 10 },
      { kind: 'work', sec: 20 },
      { kind: 'rest', sec: 10 },
    ]);
    expect(segmentsOf({ mode: 'up' })).toEqual([]);
  });
  it('counts until a clock time in Zurich, tomorrow when it has passed', () => {
    expect(secUntil('10:30', T0)).toBe(1800);
    expect(secUntil('09:00', T0)).toBe(23 * 3600);
  });
});

describe('a run', () => {
  it('counts down and ends', () => {
    const r = startRun({ mode: 'down', sec: 300 }, T0, 'Kaffee');
    expect(position(r, T0 + 60_000)).toMatchObject({ show: 240, left: 240, done: false, round: 1, rounds: 1 });
    expect(runDone(r, T0 + 300_000)).toBe(true);
    expect(position(r, T0 + 999_000).show).toBe(0);
  });
  it('counts up without an end («Timer zählt hoch», Noah 2a)', () => {
    const r = startRun({ mode: 'up' }, T0);
    const p = position(r, T0 + 4_000_000);
    expect(p.show).toBe(4000);
    expect(p.done).toBe(false);
    expect(p.endAt).toBeNull();
  });
  it('leaves the pauses out', () => {
    let r = startRun({ mode: 'down', sec: 300 }, T0);
    r = pauseRun(r, T0 + 60_000);
    expect(position(r, T0 + 500_000).left).toBe(240);
    r = resumeRun(r, T0 + 500_000);
    expect(position(r, T0 + 560_000).left).toBe(180);
  });
  it('shows the round and the time left in it (Pomodoro «Runde 1 von 4»)', () => {
    const r = startRun({ mode: 'pomodoro', work: 1500, rest: 300, rounds: 4 }, T0);
    expect(position(r, T0)).toMatchObject({ show: 1500, kind: 'work', round: 1, rounds: 4 });
    expect(position(r, T0 + 1_600_000)).toMatchObject({ show: 200, kind: 'rest', round: 1 });
    expect(position(r, T0 + 1_900_000)).toMatchObject({ kind: 'work', round: 2 });
  });
  it('«+1 min» makes the last part longer', () => {
    const r = addMinute(startRun({ mode: 'down', sec: 60 }, T0));
    expect(position(r, T0 + 60_000).left).toBe(60);
  });
  it('sounds each change once, and the end even after a locked screen', () => {
    let r = startRun({ mode: 'interval', work: 20, rest: 10, rounds: 2 }, T0);
    let d = dueCue(r, T0 + 21_000);
    expect(d.cue).toBe('seg');
    r = d.run;
    expect(dueCue(r, T0 + 22_000).cue).toBeNull();
    d = dueCue(r, T0 + 600_000);
    expect(d.cue).toBe('end');
    expect(dueCue(d.run, T0 + 601_000).cue).toBeNull();
  });
});

describe('words and digits', () => {
  it('writes the digits (Z3 «Ziffern»)', () => {
    expect(digits(300)).toBe('00:05:00');
    expect(digits(300, 'auto')).toBe('05:00');
    expect(digits(4800, 'auto')).toBe('01:20:00');
    expect(dur(240)).toBe('4:00');
    expect(dur(4140)).toBe('1:09:00');
  });
  it('says a setup in words', () => {
    expect(short(30)).toEqual({ key: '{n} s', vars: { n: 30 } });
    expect(short(4800)).toEqual({ key: '{h} h {m} min', vars: { h: 1, m: 20 } });
    expect(setupWords({ mode: 'interval', work: 60, rest: 30, rounds: 3 })).toEqual({ key: '{n} × {w} s', vars: { n: 3, w: 60 } });
    expect(setupWords({ mode: 'pomodoro', work: 3120, rest: 1020, rounds: 1 })).toEqual({ key: '{w} + {r} min', vars: { w: 52, r: 17 } });
    expect(setupWords({ mode: 'until', until: '17:30' })).toEqual({ key: 'until {hm}', vars: { hm: '17:30' } });
  });
});

describe('prefs and faces (Z3)', () => {
  it('starts with Digital, the singing bowl and hh:mm:ss (Noah 3a, 4a)', () => {
    expect(prefsOf(null)).toMatchObject({ faces: { all: 'digital' }, end: 'bowl', fmt: 'hms', blocks: [] });
  });
  it('a face of its own for Pomodoro or meditation', () => {
    const p = prefsOf({ faces: { all: 'ring', pomodoro: 'egg', meditation: 'moon', nope: 'x' } });
    expect(faceFor(p, { mode: 'pomodoro' })).toBe('egg');
    expect(faceFor(p, { mode: 'down', med: true })).toBe('moon');
    expect(faceFor(p, { mode: 'down' })).toBe('ring');
  });
  it('keeps own building blocks that are whole', () => {
    const p = prefsOf({ blocks: [{ id: 'b1', label: 'Eier', setup: { mode: 'down', sec: 420 } }, { id: 'b2', label: 'kaputt', setup: { mode: 'x' } }] });
    expect(p.blocks.map((b) => b.id)).toEqual(['b1']);
  });
  it('every kind, face and block has a name', () => {
    expect(MODES.map((m) => m.id)).toEqual(['up', 'down', 'interval', 'pomodoro', 'until']);
    expect(FACES.length).toBe(6);
    for (const b of BLOCKS) expect(setupOk(b.setup)).not.toBeNull();
  });
});

describe('the log (Z5)', () => {
  const run = startRun({ mode: 'down', sec: 240, blockId: 'coffee' }, T0, 'Kaffee');
  const e = logEntry(run, T0 + 240_000, '2026-10-14');
  it('writes what ran', () => {
    expect(e).toMatchObject({ day: '2026-10-14', sec: 240, mode: 'down', label: 'Kaffee', blockId: 'coffee', note: '' });
    expect(logRowOk({ ...e, mode: 'x' })).toBeNull();
  });
  const rows = mergeLog(
    [e, { id: 'a', day: '2026-10-13', at: '2026-10-13T12:00:00Z', sec: 4140, mode: 'pomodoro', label: 'Fokus 52/17', setup: { mode: 'pomodoro', work: 3120, rest: 1020, rounds: 1 } }, { id: 'b', day: '2026-10-05', at: '2026-10-05T12:00:00Z', sec: 180, mode: 'interval', label: '' }],
    [{ id: 'm1', day: '2026-10-13', at: '2026-10-13T04:50:00Z', min: 20, note: 'ruhig' }],
  );
  it('shows the meditation sessions with the timers, newest first', () => {
    expect(rows.map((r) => r.id)).toEqual([e.id, 'a', 'med:m1', 'b']);
    expect(filterLog(rows, 'pomodoro').map((r) => r.id)).toEqual(['a']);
    expect(byDay(rows).map((g) => g.day)).toEqual(['2026-10-14', '2026-10-13', '2026-10-05']);
  });
  it('counts today and this week (Monday to today)', () => {
    expect(mondayOf('2026-10-14')).toBe('2026-10-12');
    expect(dayStats(rows, '2026-10-14')).toEqual({ n: 1, sec: 240 });
    expect(weekStats(rows, '2026-10-14')).toEqual({ n: 3, sec: 240 + 4140 + 1200, top: 'down', medAvgMin: 20 });
  });
  it('remembers the last different setups', () => {
    expect(recentSetups(rows).map((r) => r.label)).toEqual(['Kaffee', 'Fokus 52/17']);
  });
});
