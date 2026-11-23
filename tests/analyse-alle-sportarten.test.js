// «Alle Sportarten» in Analyse: Strava sports without a tick count like on Heute › Diese Woche. Fictional days only.
import { describe, it, expect } from 'vitest';
import { withStrava, looseId } from '../src/lib/analyse/alle.js';
import { normAct } from '../src/lib/flow.js';

const acts = [normAct({ id: 'gym', name: 'Gym', ring: 'move' })];
const run = (id, day, extra = {}) => ({ id, day, kind: 'run', type: 'Run', start: `${day}T07:00:00Z`, movingS: 1800, km: 5, ...extra });

describe('withStrava', () => {
  it('nothing to add without Strava sports: the same lists', () => {
    const log = [{ id: 'a', actId: 'gym', day: '2026-11-20' }];
    expect(withStrava({ acts, log, activities: [] })).toEqual({ acts, log });
  });
  it('a run without a tick is one more entry under a sport of its own', () => {
    const r = withStrava({ acts, log: [], activities: [run('s1', '2026-11-21'), run('s2', '2026-11-22')] });
    expect(r.log.map((e) => [e.actId, e.day])).toEqual([[looseId('run'), '2026-11-21'], [looseId('run'), '2026-11-22']]);
    expect(r.acts.map((a) => a.id)).toEqual(['gym', looseId('run')]);
    expect(r.acts.at(-1)).toMatchObject({ ring: 'move' });
    expect(r.acts.at(-1).name).toBeTruthy();
  });
  it('a run that a tick already links counts once, as the tick', () => {
    const log = [{ id: 'k1', actId: 'gym', day: '2026-11-21', via: 'strava', stravaId: 's1' }];
    const r = withStrava({ acts, log, activities: [run('s1', '2026-11-21')] });
    expect(r.log).toHaveLength(1);
  });
  it('rides are not added (the rides list and their ticks count them)', () => {
    const r = withStrava({ acts, log: [], activities: [run('r1', '2026-11-21', { kind: 'bike', type: 'Ride' })] });
    expect(r.log).toEqual([]);
  });
});
