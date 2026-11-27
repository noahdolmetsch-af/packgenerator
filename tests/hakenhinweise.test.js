// «Was auffällt» (Noah 27.11.2026 «4a»): the rules behind the hints (src/lib/flow/hakenhinweise.js).
import { describe, it, expect } from 'vitest';
import { hintsOf, cardHints, lineHint } from '../src/lib/flow/hakenhinweise.js';
import { addDays } from '../src/lib/flow.js';

const TODAY = '2026-11-24'; // a Tuesday
const act = (id, ring, extra = {}) => ({ id, name: id, ring, order: 1, goals: [], ...extra });
const ACTS = [act('gym', 'move'), act('run', 'move'), act('sauna', 'rest'), act('cold', 'rest'), act('yoga', 'move')];
const back = (n) => addDays(TODAY, -n);
const ticks = (id, backs) => backs.map((b) => ({ id: `${id}-${b}`, actId: id, day: back(b), n: 1 }));
const of = (log, acts = ACTS) => hintsOf({ acts, log, today: TODAY });
const kind = (hs, k) => hs.filter((h) => h.kind === k);

describe('Was auffällt', () => {
  it('finds a series that is still going, today or yesterday as its end', () => {
    const hs = of([...ticks('gym', [0, 1, 2, 3]), ...ticks('run', [1, 2, 3]), ...ticks('yoga', [0, 1])]);
    expect(kind(hs, 'streak').map((h) => [h.actId, h.n])).toEqual([['gym', 4], ['run', 3]]);
  });

  it('finds a gap against the own usual gap, but not a short pause or a stopped activity', () => {
    // every 3 days for a month, then 9 days nothing
    const usual = [9, 12, 15, 18, 21, 24, 27, 30, 33];
    const hs = kind(of(ticks('gym', usual)), 'gap');
    expect(hs).toEqual([{ kind: 'gap', actId: 'gym', n: 9, every: 3 }]);
    expect(kind(of(ticks('gym', [4, 7, 10, 13, 16, 19])), 'gap')).toEqual([]); // 4 days: not yet
    expect(kind(of(ticks('gym', [40, 43, 46, 49, 52])), 'gap')).toEqual([]); // 40 days: it has stopped
    expect(kind(of(ticks('gym', [7, 8, 9, 10, 11, 12, 13])), 'gap')[0].every).toBe(1); // almost daily
  });

  it('finds days in a row with movement and no recovery, only where a recovery activity exists', () => {
    const log = [...ticks('gym', [0, 2]), ...ticks('run', [1])];
    expect(kind(of(log), 'balance')).toEqual([{ kind: 'balance', n: 3 }]);
    expect(kind(of([...log, ...ticks('sauna', [0])]), 'balance')).toEqual([]); // recovered today
    expect(kind(of(log, ACTS.filter((a) => a.ring !== 'rest')), 'balance')).toEqual([]);
    expect(kind(of([...ticks('gym', [1, 2])]), 'balance')).toEqual([]); // two days are not yet a run
  });

  it('finds what you tick together, not what only counts the other', () => {
    const days = [2, 5, 9, 12, 16, 19];
    const log = [...ticks('sauna', days), ...ticks('cold', days), ...ticks('gym', [1, 3, 4, 6, 7, 8, 10, 11, 13, 14, 15])];
    const t = kind(of(log), 'together')[0];
    expect(t && [[t.actId, t.other].sort(), t.part, t.of]).toEqual([['cold', 'sauna'], 6, 6]);
    const counts = ACTS.map((a) => (a.id === 'cold' ? { ...a, counts: ['sauna'] } : a));
    expect(kind(of(log, counts), 'together')).toEqual([]);
  });

  it('finds a weekday that carries most ticks', () => {
    // 24 Nov 2026 is a Tuesday: 7, 14, 21, 28 … days back are Tuesdays, plus two other days
    const log = ticks('yoga', [7, 14, 21, 28, 35, 3, 10]);
    const r = kind(of(log), 'rhythm')[0];
    expect(r).toMatchObject({ actId: 'yoga', weekday: 1, part: 5, of: 7 });
    expect(kind(of(ticks('yoga', [1, 3, 5, 8, 10, 12])), 'rhythm')).toEqual([]);
  });

  it('orders the hints and keeps the card short', () => {
    const hs = [{ kind: 'streak', n: 3 }, { kind: 'streak', n: 5 }, { kind: 'streak', n: 4 }, { kind: 'balance', n: 3 }, { kind: 'gap', n: 7 }];
    expect(cardHints(hs).filter((h) => h.kind === 'streak')).toHaveLength(2);
    expect(cardHints(hs, 3)).toHaveLength(3);
  });

  it('puts one hint on Heute: recovery first, then a gap, then a series; the others stay on the card', () => {
    expect(lineHint([{ kind: 'streak', n: 3 }, { kind: 'gap', n: 7 }, { kind: 'balance', n: 3 }]).kind).toBe('balance');
    expect(lineHint([{ kind: 'streak', n: 3 }, { kind: 'gap', n: 7 }]).kind).toBe('gap');
    expect(lineHint([{ kind: 'together' }, { kind: 'rhythm' }])).toBeNull();
    expect(lineHint([])).toBeNull();
  });
});
