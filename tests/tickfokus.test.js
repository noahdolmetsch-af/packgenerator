import { describe, it, expect } from 'vitest';
import { tickUnits, tickRows, tickKinds, tickFocus, stravaOthers } from '../src/lib/flow/tickfokus.js';

const act = (id, extra = {}) => ({ id, name: id, ring: 'move', goals: [], ...extra });
const tick = (id, actId, day, extra = {}) => ({ id, actId, day, at: `${day}T10:00:00.000Z`, ...extra });
const TODAY = '2026-11-18';
const acts = [act('tennis'), act('hockey'), act('gym'), act('bike'), act('stretch', { goals: [{ count: 1, days: 1 }] }), act('sauna', { ring: 'rest' }), act('run')];
const usual = { tennis: { min: 60 }, hockey: { min: 120 } };

describe('Im Fokus: alle Sportarten (ticks of Aktiv)', () => {
  const log = [
    tick('a', 'tennis', '2026-11-16', { min: 75 }),
    tick('b', 'tennis', '2026-11-17'),
    tick('c', 'hockey', '2026-11-18', { min: 90 }),
    tick('d', 'gym', '2026-11-15'),
    tick('e', 'bike', '2026-11-16', { via: 'commute' }),
    tick('f', 'sauna', '2026-11-17'),
    tick('g', 'stretch', '2026-11-17'),
    tick('h', 'tennis', '2026-11-11'),
    tick('i', 'run', '2026-11-14', { stravaId: '77' }),
    tick('j', 'tennis', '2026-11-13', { via: 'trip' }),
  ];
  const activities = [{ id: 77, day: '2026-11-14', kind: 'run', type: 'Run', km: 8, movingS: 2400 }];
  const units = tickUnits({ log, activities, acts, usual });

  it('counts ticks of movement; leaves out the bike, rest, daily habits, trip days and Strava-linked ticks', () => {
    expect(new Set(units.map((u) => u.actId))).toEqual(new Set(['tennis', 'hockey', 'gym']));
    expect(units.some((u) => u.stravaId)).toBe(false);
  });

  it('sorts the sports of the last 7 days by time, estimated time kept apart', () => {
    const rows = tickRows(units, '2026-11-12', TODAY);
    expect(rows.map((r) => r.actId)).toEqual(['tennis', 'hockey', 'gym']);
    const tennis = rows.find((r) => r.actId === 'tennis');
    expect(tennis.n).toBe(2);
    expect(tennis.secs).toBe((75 + 60) * 60);
    expect(tennis.caSecs).toBe(60 * 60);
    expect(tennis.est).toBe(true);
    expect(rows.find((r) => r.actId === 'hockey').est).toBe(false);
    expect(tickKinds(units, TODAY)).toEqual(['tennis', 'hockey', 'gym']);
  });

  it('a card has 7 bars (today on the right) and 28 dots', () => {
    const c = tickFocus(units, TODAY, 'tennis');
    expect(c.bars).toHaveLength(7);
    expect(c.bars.at(-1).day).toBe(TODAY);
    expect(c.n).toBe(2); // 11.11. is older than 7 days
    expect(c.bars.find((b) => b.day === '2026-11-16').secs).toBe(75 * 60);
    expect(c.dots).toHaveLength(28);
    expect(c.dots.filter((d) => d.size > 0)).toHaveLength(3);
  });

  it('a sport nobody timed (no usual duration) counts its sessions', () => {
    const c = tickFocus(units, TODAY, 'gym');
    expect(c.n).toBe(1);
    expect(c.bars.find((b) => b.day === '2026-11-15').n).toBe(1);
  });

  it('no ticks, no card', () => {
    expect(tickKinds(tickUnits({ log: [], acts }), TODAY)).toEqual([]);
  });

  it('a Strava sport without a tick and no ride is told for «This week»; a ride and a ticked activity are not', () => {
    const strava = [
      { id: 77, day: '2026-11-14', kind: 'run', type: 'Run', km: 8, movingS: 2400, name: 'Run' },
      { id: 88, day: '2026-11-15', kind: 'hike', type: 'Hike', km: 12, movingS: 9000 },
      { id: 99, day: '2026-11-16', kind: 'bike', type: 'Ride', km: 40, movingS: 5400 },
    ];
    const others = stravaOthers({ log, activities: strava, acts, usual });
    expect(others.map((o) => [o.day, o.kind])).toEqual([['2026-11-15', 'hike']]); // 77 is linked by a tick, 99 is a ride
  });
});
