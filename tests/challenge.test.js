// v0.102.0 «Vorschlag und Challenge» (D1b/D5): the pure rules (fictional data).
import { describe, it, expect } from 'vitest';
import { suggestOf, pickOption, addOption, toggleTick, tickedToday, monthEnd, challengesOf, newChallenge, countOf, activeFor, stepChallenges, freshDone, TODAY_OPTIONS } from '../src/lib/challenge.js';

describe('the suggestion with alternatives', () => {
  it('starts with the alternatives of Heute and the first chosen', () => {
    expect(suggestOf(null)).toEqual({ options: TODAY_OPTIONS, pick: TODAY_OPTIONS[0], ticks: {} });
  });
  it('chooses, adds an own one, ticks and takes back', () => {
    let s = suggestOf(null);
    s = pickOption(s, 'Sauna');
    expect(s.pick).toBe('Sauna');
    expect(pickOption(s, 'nope').pick).toBe('Sauna');
    s = addOption(s, '  Cold shower ');
    expect(s.options.at(-1)).toBe('Cold shower');
    expect(s.pick).toBe('Cold shower');
    s = toggleTick(s, 'Swim', '2026-10-12');
    expect(tickedToday(s, 'Swim', '2026-10-12')).toBe(true);
    s = toggleTick(s, 'Swim', '2026-10-12');
    expect(tickedToday(s, 'Swim', '2026-10-12')).toBe(false);
  });
  it('makes a stored record safe', () => {
    expect(suggestOf({ options: ['A', 'A', ''], pick: 'X', ticks: { A: ['2026-10-01', 'bad', '2026-10-01'] } })).toEqual({ options: ['A'], pick: 'A', ticks: { A: ['2026-10-01'] } });
  });
});

describe('a challenge', () => {
  it('ends with the month by default and counts the ticks in its window', () => {
    expect(monthEnd('2026-10-12')).toBe('2026-10-31');
    expect(monthEnd('2028-02-03')).toBe('2028-02-29');
    const c = newChallenge({ what: 'Swim', times: 3, today: '2026-10-12', id: 'c1' });
    expect(c).toEqual({ id: 'c1', area: 'today', what: 'Swim', times: 3, from: '2026-10-12', until: '2026-10-31', doneOn: null, stopped: false });
    const s = { ticks: { Swim: ['2026-10-11', '2026-10-12', '2026-10-14', '2026-11-01'] } };
    expect(countOf(c, s)).toBe(2);
  });
  it('becomes a milestone once reached, and is celebrated for two days', () => {
    const list = challengesOf([newChallenge({ what: 'Swim', times: 2, today: '2026-10-12', id: 'c1' }), { id: 'bad' }]);
    expect(list).toHaveLength(1);
    const s = { today: { ticks: { Swim: ['2026-10-12', '2026-10-13'] } } };
    const r = stepChallenges(list, s, '2026-10-13');
    expect(r.reached.map((c) => c.id)).toEqual(['c1']);
    expect(r.list[0].doneOn).toBe('2026-10-13');
    expect(stepChallenges(r.list, s, '2026-10-14').reached).toEqual([]);
    expect(freshDone(r.list, '2026-10-14')).toHaveLength(1);
    expect(freshDone(r.list, '2026-10-15')).toHaveLength(0);
  });
  it('finds the running one for a name; a stopped or past one is not running', () => {
    const list = challengesOf([newChallenge({ what: 'Swim', today: '2026-10-01', until: '2026-10-05', id: 'old' }), { ...newChallenge({ what: 'Swim', today: '2026-10-10', id: 'new' }), stopped: false }, { ...newChallenge({ what: 'Sauna', today: '2026-10-10', id: 's' }), stopped: true }]);
    expect(activeFor(list, 'Swim', '2026-10-12')?.id).toBe('new');
    expect(activeFor(list, 'Sauna', '2026-10-12')).toBeNull();
  });
});
