// Paket Q #340: empty places show one thing of your own.
import { describe, it, expect } from 'vitest';
import { sparkOf } from '../src/lib/clear/spark.js';

describe('own content on empty places', () => {
  it('nothing of your own: nothing shown', () => {
    expect(sparkOf({}, '2026-10-19')).toBeNull();
  });
  it('picks a learning or a link, the same all day', () => {
    const data = { learnings: [{ id: 'l1', rule: 'Regenhose oben packen', source: 'Testtour' }], links: [{ id: 'k1', url: 'https://example.org/a', title: 'Beispiel' }] };
    const a = sparkOf(data, '2026-10-19', 'inbox');
    expect(a).toEqual(sparkOf(data, '2026-10-19', 'inbox'));
    expect(['learning', 'link']).toContain(a.kind);
  });
  it('skips empty and archived learnings', () => {
    expect(sparkOf({ learnings: [{ rule: ' ' }, { rule: 'x', archived: true }] }, '2026-10-19')).toBeNull();
  });
});
