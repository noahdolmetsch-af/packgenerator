import { describe, it, expect } from 'vitest';
import { openSports, waiting, newActFor } from '../src/lib/flow/stravaneu.js';

const act = (id, o = {}) => ({ id, name: id, icon: 'run', ring: 'move', order: 0, goals: [], ...o });
const A = (id, type, extra = {}) => ({ id, day: '2026-09-01', type, ...extra });

describe('Aktivität anlegen?', () => {
  const acts = [act('bike', { name: 'Velo' }), act('run', { name: 'Laufen', order: 2 })];
  const activities = [A('1', 'Ride'), A('2', 'Hike'), A('3', 'Hike'), A('4', 'Swim'), A('5', 'Golf')];

  it('lists the Strava sports without an activity, the biggest first', () => {
    const rows = openSports({ activities, acts });
    expect(rows.map((r) => [r.key, r.count])).toEqual([['Hike', 2], ['Golf', 1], ['Swim', 1]]);
    expect(waiting(rows)).toBe(4);
  });

  it('leaves out a sport the person said no to, and one that is mapped', () => {
    expect(openSports({ activities, acts, map: { Hike: '' } }).map((r) => r.key)).not.toContain('Hike');
    expect(openSports({ activities, acts, map: { Hike: 'bike' } }).map((r) => r.key)).not.toContain('Hike');
  });

  it('makes the activity with the usual id, a symbol, no goal and no minimum', () => {
    const a = newActFor({ key: 'Hike' }, acts, 'Wandern');
    expect(a).toMatchObject({ id: 'hike', name: 'Wandern', icon: 'walk', ring: 'move', goals: [], minMin: 0, order: 3 });
  });

  it('takes a free id when the usual one is taken, and an own id for an unknown sport', () => {
    expect(newActFor({ key: 'Hike' }, [...acts, act('hike')], 'Wandern').id).toBe('hike-2');
    const g = newActFor({ key: 'Golf' }, acts, 'Golf');
    expect(g.id).toBe('strava-golf');
    expect(g.icon).toBe('heart');
  });
});
