import { describe, it, expect } from 'vitest';
import { STAGES, cleanAnswers, laterOf, stagesOf, withLater, openCount, ANSWER_MAX } from '../src/lib/review/spaeter.js';

const trip = { startDate: '2026-11-10', days: 3 }; // last day 2026-11-12

describe('R1 debrief in three stages', () => {
  it('has three stages with three questions each', () => {
    expect(STAGES.map((s) => [s.key, s.after, s.questions.length])).toEqual([['d1', 1, 3], ['w1', 7, 3], ['m1', 30, 3]]);
  });
  it('cleans answers: three strings, trimmed and cut', () => {
    expect(cleanAnswers([' a  b ', null])).toEqual(['a b', '', '']);
    expect(cleanAnswers(['x'.repeat(500)])[0].length).toBe(ANSWER_MAX);
  });
  it('counts days from the last day of the trip, in calendar days', () => {
    const s = stagesOf(trip, '2026-11-12');
    expect(s.map((x) => [x.key, x.dueDay, x.state])).toEqual([['d1', '2026-11-13', 'later'], ['w1', '2026-11-19', 'later'], ['m1', '2026-12-12', 'later']]);
    expect(stagesOf(trip, '2026-11-13')[0].state).toBe('open');
    expect(stagesOf(trip, '2026-11-20').map((x) => x.state)).toEqual(['open', 'open', 'later']);
    expect(stagesOf(trip, '2027-01-01').map((x) => x.state)).toEqual(['open', 'open', 'open']);
  });
  it('a stage with an answer is done, also before its day', () => {
    const t = { ...trip, later: { w1: { day: '2026-11-13', a: ['', 'the knee', ''] } } };
    expect(stagesOf(t, '2026-11-13').map((x) => x.state)).toEqual(['open', 'done', 'later']);
    expect(laterOf(t)).toEqual({ w1: { day: '2026-11-13', a: ['', 'the knee', ''] } });
    expect(openCount(t, '2026-11-20')).toBe(1);
  });
  it('writes and takes away answers', () => {
    const a = withLater(trip, 'd1', ['sore knee', '', ''], '2026-11-13');
    expect(a).toEqual({ d1: { day: '2026-11-13', a: ['sore knee', '', ''] } });
    expect(withLater({ ...trip, later: a }, 'd1', ['', ' ', ''])).toEqual({});
  });
  it('a trip without a start has no stages', () => {
    expect(stagesOf({}, '2026-11-20')).toEqual([]);
    expect(laterOf(null)).toEqual({});
  });
});
