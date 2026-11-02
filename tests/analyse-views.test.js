import { describe, it, expect } from 'vitest';
import { STARTERS, cleanViews, makeView, renameView, moveView, applyDiagram, sameAs, NAME_MAX } from '../src/lib/analyse/views.js';

describe('analyse saved views', () => {
  it('never changed → the starters; broken entries left out', () => {
    expect(cleanViews(null).map((v) => v.id)).toEqual(STARTERS.map((s) => s.id));
    expect(cleanViews([{ id: 'a', name: 'Ski', diagram: { keys: ['sleep'], junk: 1 } }, { name: 'no id' }, null])).toEqual([{ id: 'a', name: 'Ski', diagram: { keys: ['sleep'] }, tiles: {} }]);
    expect(cleanViews([])).toEqual([]);
  });
  it('make, rename, move', () => {
    const v = makeView('v1', '  Winter  ', { keys: ['sleep'], period: '30', colors: { sleep: 1 } }, { period: 30, on: ['fitbit'] });
    expect(v).toEqual({ id: 'v1', name: 'Winter', diagram: { keys: ['sleep'], period: '30' }, tiles: { period: 30, on: ['fitbit'] } });
    expect(makeView('x', 'y'.repeat(99), {}, {}).name).toHaveLength(NAME_MAX);
    const list = [v, { ...STARTERS[0] }];
    expect(renameView(list, 'start-all', 'Alles')[1]).toMatchObject({ id: 'start-all', name: 'Alles' });
    expect(renameView(list, 'start-all', 'Alles')[1].starter).toBeUndefined();
    expect(moveView(list, 1, 0).map((x) => x.id)).toEqual(['start-all', 'v1']);
  });
  it('applies over the diagram now and knows when it is shown', () => {
    const now = { keys: ['rhr'], colors: { rhr: 2 }, recent: ['azm'] };
    const v = makeView('v', 'V', { keys: ['sleep'], period: '30' }, { period: 30 });
    const d = applyDiagram(now, v);
    expect(d).toEqual({ keys: ['sleep'], period: '30', colors: { rhr: 2 }, recent: ['azm'] });
    expect(sameAs(v, d, { period: 30, on: ['fitbit'] })).toBe(true);
    expect(sameAs(v, now, { period: 30 })).toBe(false);
  });
});
