import { describe, it, expect } from 'vitest';
import { newInk, hashSrc, inkFor, withInk, pruneInks, replaceFlats, flatsOf, drawnOn, widthAt, pressureOf, bbox, hitItem, itemAt, moveItem, arrowHead, thinPoints, emptyInk, history, commit, undo, redo, current, TOOLS, PAPERS } from '../src/lib/draw/ink.js';
import { setPhotos, removePhoto, photosOf } from '../src/lib/noteformats.js';

// Paket NE 1146 «Zeichnen auf Fotos» (Noah 20.10.2026)
describe('the ink: editable drawing plus flat pictures', () => {
  it('a new ink on a photo has the photo and its size; a pad has paper and one empty page', () => {
    const a = newInk({ base: 'data:image/jpeg;base64,AAA', w: 800.4, h: 600, id: 'i1' });
    expect(a).toEqual({ v: 1, id: 'i1', base: 'data:image/jpeg;base64,AAA', w: 800, h: 600, paper: 'plain', pages: [[]] });
    const p = newInk({ paper: 'squared', id: 'p1' });
    expect(p.base).toBe(null);
    expect(p.paper).toBe('squared');
    expect(emptyInk(p)).toBe(true);
    expect(TOOLS.map((x) => x.key)).toEqual(['pen', 'hi', 'line', 'arrow', 'rect', 'ellipse', 'text', 'erase', 'select']);
    expect(PAPERS.map((x) => x.key)).toEqual(['plain', 'squared', 'lined']);
  });
  it('hashes a picture stably and tells two apart', () => {
    expect(hashSrc('data:a')).toBe(hashSrc('data:a'));
    expect(hashSrc('data:a')).not.toBe(hashSrc('data:b'));
    const long = 'x'.repeat(30000);
    expect(hashSrc(long)).not.toBe(hashSrc(long + 'y'));
  });
  it('keeps the drawing per picture: withInk, inkFor, pruneInks', () => {
    const ink = newInk({ id: 'pad' });
    let m = withInk({}, [], ['f1', 'f2'], ink);
    expect(inkFor(m, 'f1')).toEqual({ ink, at: 0 });
    expect(inkFor(m, 'f2').at).toBe(1);
    expect(inkFor(m, 'other')).toBe(null);
    m = withInk(m, ['f1', 'f2'], ['g1'], ink);
    expect(inkFor(m, 'f1')).toBe(null);
    expect(inkFor(m, 'g1').at).toBe(0);
    expect(pruneInks(m, ['zzz'])).toBe(undefined);
    expect(Object.keys(pruneInks(m, ['g1']))).toHaveLength(1);
  });
  it('replaces the pages of a pad in place, a new pad goes at the end', () => {
    expect(replaceFlats(['a', 'p1', 'b', 'p2'], ['p1', 'p2'], ['n1', 'n2', 'n3'])).toEqual(['a', 'n1', 'n2', 'n3', 'b']);
    expect(replaceFlats(['a', 'b'], ['b'], ['b2'])).toEqual(['a', 'b2']);
    expect(replaceFlats(['a'], ['x'], ['n'])).toEqual(['a', 'n']);
    const ink = newInk({ id: 'pad' });
    const m = withInk({}, [], ['p1', 'p2'], ink);
    expect(flatsOf(m, ['a', 'p2', 'p1'], 'p2')).toEqual(['p1', 'p2']);
    expect(flatsOf(m, ['a'], 'a')).toEqual(['a']);
  });
  it('drawnOn: one photo of a record changes, the drawings of the others stay', () => {
    const i1 = newInk({ base: 'a', id: 'i1' });
    const i2 = newInk({ base: 'b', id: 'i2' });
    const first = drawnOn(['a', 'b'], undefined, 'a', 'a2', i1);
    expect(first.list).toEqual(['a2', 'b']);
    const second = drawnOn(first.list, first.inks, 'b', 'b2', i2);
    expect(second.list).toEqual(['a2', 'b2']);
    expect(inkFor(second.inks, 'a2').ink.id).toBe('i1');
    expect(inkFor(second.inks, 'b2').ink.id).toBe('i2');
  });
  it('a note: setPhotos keeps the first photo in note.photo, removing a photo drops its drawing', () => {
    const ink = newInk({ base: 'p1', id: 'i' });
    let n = setPhotos({ id: 'n', photo: null }, ['f1', 'p2'], withInk({}, [], ['f1'], ink));
    expect(n.photo).toBe('f1');
    expect(n.photos).toEqual(['p2']);
    expect(inkFor(n.inks, 'f1').ink.id).toBe('i');
    n = removePhoto(n, 0);
    expect(photosOf(n)).toEqual(['p2']);
    expect(n.inks).toBe(undefined);
    expect('photos' in n).toBe(false);
  });
});

describe('pen pressure, hit test and moving', () => {
  it('pressure makes a line thicker when on; off or a finger: the size as chosen', () => {
    expect(widthAt(10, 1, true)).toBeGreaterThan(widthAt(10, 0.2, true));
    expect(widthAt(10, 1, false)).toBe(10);
    expect(widthAt(10, 0, true)).toBe(widthAt(10, 0.5, true));
    expect(pressureOf({ pointerType: 'pen', pressure: 0.83 })).toBe(0.83);
    expect(pressureOf({ pointerType: 'touch', pressure: 1 })).toBe(0.5);
    expect(pressureOf({ pointerType: 'mouse', pressure: 0.5 })).toBe(0.5);
  });
  it('finds the item at a point: line, rectangle edge, circle outline, text box', () => {
    const items = [
      { t: 'pen', c: '#000', s: 4, p: [[0, 0, 0.5], [100, 0, 0.5]] },
      { t: 'rect', c: '#000', s: 4, a: [200, 200], b: [300, 300] },
      { t: 'ellipse', c: '#000', s: 4, a: [400, 400], b: [600, 500] },
      { t: 'text', c: '#000', s: 6, a: [50, 600], text: 'Bremse' },
      { t: 'arrow', c: '#000', s: 4, a: [700, 0], b: [700, 300] },
    ];
    expect(itemAt(items, 50, 3)).toBe(0);
    expect(itemAt(items, 200, 250)).toBe(1);
    expect(itemAt(items, 250, 250)).toBe(-1); // inside a rectangle is not its edge
    expect(itemAt(items, 600, 450)).toBe(2);
    expect(itemAt(items, 500, 450)).toBe(-1);
    expect(itemAt(items, 60, 610)).toBe(3);
    expect(itemAt(items, 702, 150)).toBe(4);
    expect(hitItem(items[0], 50, 40)).toBe(false);
  });
  it('moves any item; the box follows', () => {
    const pen = { t: 'pen', c: '#000', s: 4, p: [[0, 0, 0.5], [10, 10, 0.7]] };
    expect(moveItem(pen, 5, -5).p).toEqual([[5, -5, 0.5], [15, 5, 0.7]]);
    const r = moveItem({ t: 'rect', a: [0, 0], b: [10, 20] }, 1, 1);
    expect(bbox(r)).toEqual({ x: 1, y: 1, w: 10, h: 20 });
    expect(moveItem({ t: 'text', a: [3, 4], text: 'x' }, 1, 1).a).toEqual([4, 5]);
  });
  it('an arrow head points back from the tip', () => {
    const [l, r] = arrowHead([0, 0], [100, 0], 6);
    expect(l[0]).toBeLessThan(100);
    expect(r[0]).toBeLessThan(100);
    expect(Math.sign(l[1])).toBe(-Math.sign(r[1]));
  });
  it('thins the pen points but keeps the first and the last', () => {
    const p = [[0, 0, 0.5], [0.2, 0.1, 0.5], [0.5, 0.5, 0.5], [5, 5, 0.5], [5.1, 5, 0.6]];
    const out = thinPoints(p);
    expect(out[0]).toEqual([0, 0, 0.5]);
    expect(out[out.length - 1]).toEqual([5.1, 5, 0.6]);
    expect(out.length).toBeLessThan(p.length);
  });
});

describe('undo and redo', () => {
  it('goes back and forward; a new step after undo drops the redo', () => {
    let h = history([[]]);
    h = commit(h, [['a']]);
    h = commit(h, [['a', 'b']]);
    expect(current(undo(h))).toEqual([['a']]);
    expect(current(redo(undo(h)))).toEqual([['a', 'b']]);
    h = commit(undo(h), [['a', 'c']]);
    expect(current(redo(h))).toEqual([['a', 'c']]);
    expect(current(undo(undo(undo(h))))).toEqual([[]]);
  });
});
