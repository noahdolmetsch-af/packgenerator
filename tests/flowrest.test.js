import { describe, it, expect } from 'vitest';
import { activeStreak, restHint, restActs, restIdeas, restStrip, STREAK } from '../src/lib/flowrest.js';
import { normAct } from '../src/lib/flow.js';

// fictional activities; Tuesday 13 Oct 2026 is «today»
const TODAY = '2026-10-13';
const acts = [
  normAct({ id: 'bike', name: 'Bike', ring: 'move', goals: [{ id: 'g', count: 3, days: 7 }] }),
  normAct({ id: 'tennis', name: 'Tennis', ring: 'move', goals: [{ id: 'g', count: 1, days: 7 }] }),
  normAct({ id: 'sauna', name: 'Sauna', ring: 'rest', goals: [{ id: 'g', count: 2, days: 7 }] }),
  normAct({ id: 'walk', name: 'Walk', ring: 'rest', goals: [{ id: 'g', count: 1, days: 7 }] }),
  normAct({ id: 'nap', name: 'Nap', ring: 'rest', paused: true }),
];
const e = (actId, day) => ({ id: `${actId}-${day}`, actId, day, n: 1 });

describe('recovery (AK2)', () => {
  it('counts active days in a row without a recovery day', () => {
    const log = [e('bike', '2026-10-10'), e('sauna', '2026-10-10'), e('bike', '2026-10-11'), e('tennis', '2026-10-12'), e('bike', '2026-10-13')];
    expect(activeStreak(acts, log, TODAY)).toEqual({ n: 3, acts: ['bike', 'tennis'] });
    // nothing today yet: counts up to yesterday
    expect(activeStreak(acts, log.slice(0, 4), TODAY).n).toBe(2);
  });

  it('suggests a pause from 3 active days, not after a recovery today and not when hidden today', () => {
    const log = [e('bike', '2026-10-11'), e('tennis', '2026-10-12'), e('bike', '2026-10-13')];
    expect(restHint({ acts, log, today: TODAY })?.n).toBe(STREAK);
    expect(restHint({ acts, log: [...log, e('walk', TODAY)], today: TODAY })).toBeNull();
    expect(restHint({ acts, log, today: TODAY, hiddenOn: TODAY })).toBeNull();
    expect(restHint({ acts, log: log.slice(1), today: TODAY })).toBeNull();
  });

  it('lists the recovery activities with the last day', () => {
    const r = restActs(acts, [e('sauna', '2026-10-01'), e('walk', TODAY)], TODAY);
    expect(r.map((x) => [x.act.id, x.ago, x.today])).toEqual([['sauna', 12, false], ['walk', 0, true]]);
  });

  it('offers recovery ideas not added yet', () => {
    const ids = restIdeas(acts).map((i) => i.id);
    expect(ids).toContain('early');
    expect(ids).toContain('massage');
    expect(ids).not.toContain('nap'); // added (paused) already
    expect(restIdeas(acts).every((i) => i.ring === 'rest')).toBe(true);
  });

  it('draws the last 14 days', () => {
    const s = restStrip(acts, [e('sauna', TODAY), e('bike', '2026-10-12')], TODAY);
    expect(s).toHaveLength(14);
    expect(s.at(-1)).toEqual({ day: TODAY, rest: true, move: false });
    expect(s.at(-2)).toEqual({ day: '2026-10-12', rest: false, move: true });
    expect(s[0].day).toBe('2026-09-30');
  });
});
