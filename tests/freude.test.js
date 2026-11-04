// «Freude als Auswertung» (Persönliches Lernen Idee 6): four optional scales on the debrief and the calm line over several tours.
import { describe, it, expect } from 'vitest';
import { JOY_KEYS, MAX, MIN_TOURS, joyOf, hasJoy, joyChange, overview, perTour, means } from '../src/lib/freude.js';

const d = (joy) => ({ joy });

describe('the four answers of a debrief', () => {
  it('has the four dimensions', () => {
    expect(JOY_KEYS).toEqual(['fun', 'nature', 'flow', 'company']);
    expect(MAX).toBe(5);
  });
  it('reads whole numbers 1–5 only', () => {
    expect(joyOf(d({ fun: 4, nature: 0, flow: 6, company: 2.5 }))).toEqual({ fun: 4, nature: null, flow: null, company: null });
    expect(joyOf(null)).toEqual({ fun: null, nature: null, flow: null, company: null });
    expect(hasJoy(d({ flow: 3 }))).toBe(true);
    expect(hasJoy({})).toBe(false);
  });
  it('a second tap on the same value takes it away; another value changes it; an empty set is null', () => {
    expect(joyChange({}, 'fun', 4)).toEqual({ fun: 4 });
    expect(joyChange(d({ fun: 4 }), 'fun', 4)).toBe(null);
    expect(joyChange(d({ fun: 4 }), 'fun', 2)).toEqual({ fun: 2 });
    expect(joyChange(d({ fun: 4 }), 'nature', 5)).toEqual({ fun: 4, nature: 5 });
    expect(joyChange(d({ fun: 4 }), 'nothing', 5)).toEqual({ fun: 4 });
  });
});

describe('over several tours', () => {
  it('needs at least three debriefs with an answer', () => {
    expect(MIN_TOURS).toBe(3);
    expect(overview([d({ fun: 4 }), d({ fun: 5 }), {}])).toBe(null);
    expect(overview(null)).toBe(null);
  });
  it('is the mean per dimension over the debriefs that answered it, highest first', () => {
    const o = overview([d({ fun: 4, nature: 5 }), d({ fun: 3, nature: 5 }), d({ fun: 5, flow: 2 })]);
    expect(o.n).toBe(3);
    expect(o.means.map((m) => m.key)).toEqual(['nature', 'fun', 'flow']);
    expect(o.means[0]).toEqual({ key: 'nature', count: 2, mean: 5 });
    expect(o.means[1]).toEqual({ key: 'fun', count: 3, mean: 4 });
    expect(o.top).toBe('nature');
  });
  it('names no top on a tie', () => {
    expect(overview([d({ fun: 4, nature: 4 }), d({ fun: 4, nature: 4 }), d({ fun: 4, nature: 4 })]).top).toBe(null);
  });
});

describe('for the page', () => {
  it('lists the tours with an answer, newest first', () => {
    const rows = perTour([{ tripId: 'a', doneAt: '2026-08-01T10:00:00Z', joy: { fun: 3 } }, { tripId: 'b', doneAt: '2026-09-01T10:00:00Z', joy: { nature: 5 } }, { tripId: 'c', doneAt: '2026-10-01T10:00:00Z' }]);
    expect(rows.map((r) => r.tripId)).toEqual(['b', 'a']);
    expect(rows[0]).toEqual({ tripId: 'b', day: '2026-09-01', joy: { fun: null, nature: 5, flow: null, company: null } });
    expect(perTour(null)).toEqual([]);
  });
  it('gives the means from the first answer on', () => {
    expect(means([d({ fun: 4 }), d({ fun: 2, flow: 5 })])).toEqual([{ key: 'flow', count: 1, mean: 5 }, { key: 'fun', count: 2, mean: 3 }]);
    expect(means([{}])).toEqual([]);
  });
});
