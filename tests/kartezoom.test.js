import { describe, it, expect } from 'vitest';
import { visibleBox, clampView, zoomAt, pinch, MAX_ZOOM } from '../src/lib/neuland/kartezoom.js';

const base = [0, 0, 400, 200];

describe('kartezoom', () => {
  it('shows the whole map at zoom 1', () => {
    expect(visibleBox(base, { z: 1, cx: null, cy: null })).toEqual([0, 0, 400, 200]);
  });
  it('shows a smaller part when zoomed', () => {
    expect(visibleBox(base, { z: 4, cx: 100, cy: 50 })).toEqual([50, 25, 100, 50]);
  });
  it('keeps zoom within 1 and the maximum and the middle inside the map', () => {
    expect(clampView(base, { z: 0.3, cx: 5, cy: 5 })).toEqual({ z: 1, cx: null, cy: null });
    expect(clampView(base, { z: 999, cx: 200, cy: 100 }).z).toBe(MAX_ZOOM);
    const v = clampView(base, { z: 2, cx: -500, cy: 900 });
    expect(v.cx).toBe(100); // half of the shown width 200
    expect(v.cy).toBe(150);
    const box = visibleBox(base, v);
    expect(box[0]).toBeGreaterThanOrEqual(0);
    expect(box[1] + box[3]).toBeLessThanOrEqual(200);
  });
  it('zooms around a point that stays where it is', () => {
    const v = zoomAt(base, { z: 1, cx: null, cy: null }, 300, 50, 2);
    const box = visibleBox(base, v);
    // the point's relative position in the picture is the same as before: 300/400 and 50/200
    expect((300 - box[0]) / box[2]).toBeCloseTo(0.75);
    expect((50 - box[1]) / box[3]).toBeCloseTo(0.25);
  });
  it('pinch out zooms in, pinch in goes back to the whole map, moving the fingers moves the map', () => {
    const a = pinch(base, { z: 1, cx: null, cy: null }, { px: 200, py: 100, ratio: 3 });
    expect(a.z).toBeCloseTo(3);
    const b = pinch(base, a, { px: 200, py: 100, ratio: 1 / 3 });
    expect(b).toEqual({ z: 1, cx: null, cy: null });
    const c = pinch(base, { z: 2, cx: 200, cy: 100 }, { px: 200, py: 100, ratio: 1, dx: 20, dy: 0 });
    expect(c.cx).toBe(180); // fingers right → the map follows, the view middle goes left
  });
});
