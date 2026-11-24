// The names beside the dots of the Gipfel-Karte: inside the map, not over another dot or name. Fictional dots.
import { describe, it, expect } from 'vitest';
import { placeLabels } from '../src/lib/dotlabels.js';

const B = { x0: 0, y0: 0, x1: 300, y1: 200 };
describe('placeLabels', () => {
  it('puts a name to the right of its dot when there is room', () => {
    const [l] = placeLabels([{ id: 'a', x: 50, y: 50, r: 8, name: 'Testhorn' }], 14, B);
    expect(l.anchor).toBe('start');
    expect(l.x).toBeGreaterThan(58);
  });
  it('moves a name to the left at the right edge and gives a dot without a name no label', () => {
    const out = placeLabels([{ id: 'a', x: 290, y: 50, r: 8, name: 'Testhorn' }, { id: 'b', x: 100, y: 100, r: 4 }], 14, B);
    expect(out).toHaveLength(1);
    expect(out[0].anchor).not.toBe('start');
    expect(out[0].b.x1).toBeLessThanOrEqual(300);
  });
  it('keeps two names apart', () => {
    const out = placeLabels([{ id: 'a', x: 100, y: 100, r: 8, name: 'Testhorn' }, { id: 'b', x: 110, y: 104, r: 8, name: 'Testspitze' }], 14, B);
    const [a, b] = out;
    const overlap = a.b.x0 < b.b.x1 && a.b.x1 > b.b.x0 && a.b.y0 < b.b.y1 && a.b.y1 > b.b.y0;
    expect(overlap).toBe(false);
  });
});
