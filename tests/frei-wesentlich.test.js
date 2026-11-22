// «Was mir wesentlich ist» (Noah 05.11.2026 «8b»): the quarterly look again and «Then and now». Fictional data only.
import { describe, it, expect } from 'vitest';
import { essentialDue, monthsSince, addDaysTo, daysBetween, wordsOf, compareTexts, pickEarlier, newestOf, remindOn, QUARTER_DAYS, SNOOZE_DAYS } from '../src/lib/frei/wesentlich-rueckblick.js';

const e = (id, day, text = 'x') => ({ id, kind: 'essential', day, at: `${day}T10:00:00.000Z`, text });

describe('the quarterly reminder', () => {
  const entries = [e('a', '2026-06-01'), e('b', '2026-08-01')];
  it('counts calendar days from the newest entry', () => {
    expect(newestOf(entries).id).toBe('b');
    expect(daysBetween('2026-08-01', '2026-10-31')).toBe(91);
    expect(addDaysTo('2026-10-25', 14)).toBe('2026-11-08');
    expect(addDaysTo('2026-10-20', 14)).toBe('2026-11-03'); // over the end of summer time, still 14 calendar days
  });
  it('is due after a quarter, not before, and says how long', () => {
    expect(essentialDue({ entries, cfg: {}, today: '2026-10-30' })).toBeNull();
    expect(essentialDue({ entries, cfg: {}, today: '2026-10-31' })).toEqual({ last: '2026-08-01', days: QUARTER_DAYS });
    expect(monthsSince(QUARTER_DAYS)).toBe(3);
    expect(monthsSince(200)).toBe(7);
  });
  it('stays quiet without an entry, when switched off and while «Later» waits', () => {
    expect(essentialDue({ entries: [], cfg: {}, today: '2027-01-01' })).toBeNull();
    expect(essentialDue({ entries, cfg: { essRemind: false }, today: '2027-01-01' })).toBeNull();
    expect(remindOn({ essRemind: false })).toBe(false);
    expect(remindOn({})).toBe(true);
    expect(essentialDue({ entries, cfg: { essSnooze: '2026-11-14' }, today: '2026-11-13' })).toBeNull();
    expect(essentialDue({ entries, cfg: { essSnooze: '2026-11-14' }, today: '2026-11-14' })).not.toBeNull();
    expect(SNOOZE_DAYS).toBe(14);
  });
});

describe('then and now', () => {
  it('takes the words that carry meaning, each once, no filler', () => {
    expect([...wordsOf('More time outside with friends, and more time for friends!').values()]).toEqual(['time', 'outside', 'friends']);
    expect([...wordsOf('Mehr Zeit draussen, nicht arbeiten').values()]).toEqual(['Zeit', 'draussen', 'arbeiten']);
  });
  it('says what stayed, what is new and what is gone', () => {
    const r = compareTexts('Friends, quiet mornings and the bike', 'Career, friends and the bike');
    expect(r.stayed).toEqual(['Friends', 'bike']);
    expect(r.added).toEqual(['quiet', 'mornings']);
    expect(r.dropped).toEqual(['Career']);
  });
  it('picks the entry about a quarter before the newest, else the one before', () => {
    const list = [e('n', '2026-11-05'), e('q', '2026-08-06'), e('y', '2025-11-05'), e('p', '2026-11-01')];
    expect(pickEarlier(list, list[0]).id).toBe('q');
    expect(pickEarlier([e('n', '2026-11-05'), e('p', '2026-11-01')], e('n', '2026-11-05')).id).toBe('p');
    expect(pickEarlier([e('n', '2026-11-05')], e('n', '2026-11-05'))).toBeNull();
  });
});
