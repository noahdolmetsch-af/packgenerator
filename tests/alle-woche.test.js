import { describe, it, expect } from 'vitest';
import { alleWeek } from '../src/lib/flow/alle-woche.js';
import { rituale } from '../src/lib/flow/rituale.js';
import { einheiten } from '../src/lib/flow/einheiten.js';

const act = (id, ring, goals = [], extra = {}) => ({ id, name: id, ring, goals, ...extra });
const tick = (id, actId, day, extra = {}) => ({ id, actId, day, at: `${day}T10:00:00.000Z`, ...extra });
const W = '2026-11-16'; // Monday
const END = '2026-11-22';
const acts = [
  act('pushups', 'move', [{ count: 10, days: 1 }], { perTap: 10 }),
  act('hockey', 'move', []),
  act('climb', 'move', [{ count: 1, days: 30 }]),
  act('yoga', 'move', [{ count: 1, days: 1 }]),
  act('stretch', 'move', []),
  act('sauna', 'rest', [{ count: 2, days: 7 }]),
  act('nap', 'rest', []),
  act('old', 'move', [], { paused: true }),
];

describe('Alles, was du angelegt hast (Wochenrückblick)', () => {
  it('lists daily habits, sports without a goal and ones with 0 times, not a paused one', () => {
    const log = [tick('a', 'pushups', '2026-11-16'), tick('b', 'pushups', '2026-11-17'), tick('c', 'hockey', '2026-11-18', { min: 60 }), tick('d', 'yoga', '2026-11-19')];
    const w = alleWeek({ log, flowActs: acts }, W, END);
    expect(w.move.shown.map((r) => [r.id, r.n])).toEqual([['pushups', 2], ['hockey', 1], ['yoga', 1], ['climb', 0]]);
    expect(w.move.shown.find((r) => r.id === 'hockey').measuredMin).toBe(60);
    expect(w.move.shown.find((r) => r.id === 'pushups').goal).toBe(7);
    // 0 times and no goal: in the quiet list, the paused one is not there at all
    expect(w.move.quiet.map((r) => r.id)).toEqual(['stretch']);
    expect([...w.move.shown, ...w.move.quiet].some((r) => r.id === 'old')).toBe(false);
  });

  it('the rituals stay as they were and the quiet ones are added', () => {
    const log = [tick('a', 'sauna', '2026-11-17')];
    const w = alleWeek({ log, flowActs: acts }, W, END);
    expect(w.rest.shown.map((r) => [r.id, r.n, r.goal])).toEqual([['sauna', 1, 2]]);
    expect(w.rest.quiet.map((r) => r.id)).toEqual(['nap']);
    // the old list (rituale) gives the same rows for what it showed before
    const units = einheiten({ log, activities: [], acts: acts, usual: {}, map: {} });
    expect(rituale(units, acts, W, END).map((r) => [r.id, r.n])).toEqual([['sauna', 1]]);
  });

  it('ticks of trip days and other weeks do not count', () => {
    const log = [tick('a', 'hockey', '2026-11-10'), tick('b', 'hockey', '2026-11-17', { via: 'trip' })];
    const w = alleWeek({ log, flowActs: acts }, W, END);
    expect(w.move.quiet.map((r) => r.id)).toContain('hockey');
  });

  it('a Strava session without a tick is shown, marked as not counted; one with a tick counts once', () => {
    const activities = [
      { id: 's1', day: '2026-11-18', start: '2026-11-18T08:00:00Z', type: 'Run', kind: 'run', movingS: 1800 },
      { id: 's2', day: '2026-11-19', start: '2026-11-19T08:00:00Z', type: 'Hike', kind: 'hike', movingS: 3600 },
    ];
    const w = alleWeek({ log: [], flowActs: acts, acts: activities }, W, END);
    const sessions = [...w.move.shown, ...w.loose];
    expect(sessions.reduce((s, r) => s + r.n, 0)).toBe(2);
    const loose = w.loose.find((r) => r.key === 'Hike');
    expect(loose?.n).toBe(1);
    expect(loose?.measuredMin).toBe(60);
    const withTick = alleWeek({ log: [tick('t', 'run', '2026-11-18', { via: 'strava', stravaId: 's1' })], flowActs: [...acts, act('run', 'move', [])], acts: activities }, W, END);
    expect(withTick.move.shown.find((r) => r.id === 'run').n).toBe(1);
    expect(withTick.move.shown.find((r) => r.id === 'run').waiting).toBe(0);
  });
});
