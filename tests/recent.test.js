// «Aktiv und Auswerten» 5a: «Zuletzt genutzt» on «Meine Sportarten». Fictional sports, fixed days.
import { describe, it, expect } from 'vitest';
import { recentActs } from '../src/lib/flow/recent.js';

const act = (id, extra = {}) => ({ id, name: id, ...extra });
const tick = (actId, day, id = `${actId}-${day}`) => ({ id, actId, day });
const acts = [act('yoga'), act('run'), act('gym'), act('tennis'), act('old', { paused: true })];

describe('recently used sports', () => {
  it('the last three, newest day first, each once', () => {
    const log = [tick('yoga', '2026-11-01'), tick('run', '2026-11-03'), tick('run', '2026-10-20'), tick('gym', '2026-11-02'), tick('tennis', '2026-10-01')];
    expect(recentActs(acts, log).map((a) => a.id)).toEqual(['run', 'gym', 'yoga']);
  });
  it('two entries on one day: the later entry wins', () => {
    const log = [tick('yoga', '2026-11-03', 'b'), tick('run', '2026-11-03', 'a')];
    expect(recentActs(acts, log).map((a) => a.id)).toEqual(['yoga', 'run']);
  });
  it('paused sports and entries of sports that are gone are left out; nothing ticked gives nothing', () => {
    expect(recentActs(acts, [tick('old', '2026-11-03'), tick('gone', '2026-11-03')])).toEqual([]);
    expect(recentActs(acts, [])).toEqual([]);
  });
  it('n limits the list', () => {
    const log = [tick('yoga', '2026-11-01'), tick('run', '2026-11-03')];
    expect(recentActs(acts, log, 1).map((a) => a.id)).toEqual(['run']);
  });
});
