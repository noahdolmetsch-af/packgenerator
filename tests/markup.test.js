// «Bild bearbeiten» (Noah 28.10.2026): the pure helpers of Werkzeugkasten › Bild bearbeiten
import { describe, it, expect } from 'vitest';
import { pageSize, moveTo, resultName, dataUrlBytes, PAGE_MAX } from '../src/lib/tools/markup.js';
import { TOOLS, toolOf } from '../src/lib/tools/tools.js';

describe('Bild bearbeiten', () => {
  it('is a tool of the Werkzeugkasten', () => {
    expect(toolOf('markup')?.title).toBe('Edit a picture');
    expect(TOOLS.filter((x) => x.key === 'markup')).toHaveLength(1);
  });
  it('keeps small pages and makes big ones smaller, keeping the shape', () => {
    expect(pageSize(1080, 2400)).toEqual({ w: 1080, h: 2400 });
    expect(pageSize(4000, 3000)).toEqual({ w: PAGE_MAX, h: 1800 });
    expect(pageSize(0, 0)).toEqual({ w: 1, h: 1 });
  });
  it('moves a page and ignores steps outside the list', () => {
    expect(moveTo(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveTo(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'c', 'b']);
    const l = ['a', 'b'];
    expect(moveTo(l, 0, -1)).toBe(l);
    expect(moveTo(l, 1, 2)).toBe(l);
  });
  it('names the result by day, numbered when there are several', () => {
    expect(resultName('2026-10-28', 'pdf')).toBe('bild-2026-10-28.pdf');
    expect(resultName('2026-10-28', 'jpg', 1, 3)).toBe('bild-2026-10-28-2.jpg');
  });
  it('reads the bytes of a data URL', () => {
    expect([...dataUrlBytes('data:image/jpeg;base64,/9j/')]).toEqual([0xff, 0xd8, 0xff]);
  });
});
