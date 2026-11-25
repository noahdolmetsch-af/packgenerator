// Noah 24.11.2026 «5a» (thread «Wochenplan-Vorschläge verlässlich machen»): the sessions an older «Woche vorschlagen» wrote can be taken out
// of the week in one go; own sessions, TrainingPeaks, training plans and ticked ones stay. Made-up data only. Pure.
import { describe, it, expect } from 'vitest';
import { oldSuggestions, withoutOldSuggestions, SRC } from '../src/lib/training/suggest.js';

const s = (id, day, src, o = {}) => ({ id, day, kind: 'bike', name: 'X', mins: 60, zone: 2, ...(src ? { src } : {}), ...o });
const list = [s('a', '2026-12-02', SRC), s('b', '2026-12-03', SRC), s('c', '2026-12-01', SRC), s('d', '2026-12-03', 'tp'), s('e', '2026-12-04'), s('f', '2026-12-05', 'tpl:ultra'), s('g', '2026-12-06', SRC, { done: true }), { rest: true, day: '2026-12-07' }];

describe('alte Vorschläge', () => {
  it('zählt nur die kommenden, nicht abgehakten Vorschläge', () => {
    expect(oldSuggestions(list, '2026-12-02').map((x) => x.id)).toEqual(['a', 'b']);
    expect(oldSuggestions(list, '2026-12-03').map((x) => x.id)).toEqual(['b']);
    expect(oldSuggestions(null, '2026-12-02')).toEqual([]);
  });
  it('nimmt nur sie heraus, alles andere bleibt', () => {
    const r = withoutOldSuggestions(list, '2026-12-02');
    expect(r.map((x) => x.id ?? 'rest')).toEqual(['c', 'd', 'e', 'f', 'g', 'rest']);
  });
  it('ohne Vorschläge bleibt die Liste gleich', () => {
    const own = [s('e', '2026-12-04'), s('d', '2026-12-03', 'tp')];
    expect(withoutOldSuggestions(own, '2026-12-02')).toEqual(own);
  });
});
