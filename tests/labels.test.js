import { describe, it, expect } from 'vitest';
import { boxesOf, newBox, changeBox, addItem, dropItem, addLine, dropLine, moveBox, boxUrl, boxFromHash, boxesWith, findBoxes, printHtml } from '../src/lib/tools/labels.js';
import { TOOLS, toolKeyOf } from '../src/lib/tools/tools.js';

describe('Box labels', () => {
  it('make, fill and empty a box', () => {
    expect(newBox({ name: '  ' })).toBe(null);
    let b = newBox({ name: ' Winterkiste ', place: 'Keller' }, 'x1');
    expect(b).toEqual({ id: 'x1', name: 'Winterkiste', place: 'Keller', itemIds: [], lines: [] });
    b = addItem(addItem(b, 'i1'), 'i1');
    expect(b.itemIds).toEqual(['i1']);
    b = addLine(addLine(b, 'Lichterkette'), '  ');
    expect(b.lines).toEqual(['Lichterkette']);
    expect(dropLine(dropItem(b, 'i1'), 0)).toMatchObject({ itemIds: [], lines: [] });
  });
  it('sort, change and find', () => {
    const list = [newBox({ name: 'A' }, 'a'), newBox({ name: 'B' }, 'b'), addItem(newBox({ name: 'C', place: 'Estrich' }, 'c'), 'lamp')];
    expect(moveBox(list, 0, 2).map((b) => b.id)).toEqual(['b', 'c', 'a']);
    expect(moveBox(list, 0, 5)).toBe(list);
    expect(changeBox(list, 'b', (x) => ({ ...x, name: 'Bx' }))[1].name).toBe('Bx');
    expect(boxesWith(list, 'lamp').map((b) => b.id)).toEqual(['c']);
    expect(findBoxes(list, 'stirn', (id) => (id === 'lamp' ? 'Stirnlampe' : '')).map((b) => b.id)).toEqual(['c']);
    expect(findBoxes(list, 'estrich').map((b) => b.id)).toEqual(['c']);
    expect(boxesOf([null, { id: 'z' }, { id: 'y', name: 'Y', extra: 1 }])).toEqual([{ id: 'y', name: 'Y', place: '', itemIds: [], lines: [] }]);
  });
  it('the QR code opens the box in this app', () => {
    const u = boxUrl('https://example.org/app/#/me', 'box 1');
    expect(u).toBe('https://example.org/app/#/me/tools/labels?box=box%201');
    expect(boxFromHash(u.slice(u.indexOf('#')))).toBe('box 1');
    expect(toolKeyOf('#/me/tools/labels?box=a')).toBe('labels');
    expect(TOOLS.some((x) => x.key === 'labels')).toBe(true);
  });
  it('prints the labels with their names made safe', () => {
    const h = printHtml([newBox({ name: 'Kiste <A>', place: 'Keller' }, 'a')], () => '<svg></svg>', { title: 'Etiketten', scan: 'Scannen' });
    expect(h).toContain('Kiste &lt;A&gt;');
    expect(h).toContain('<svg></svg>');
    expect(h).toContain('<title>Etiketten</title>');
  });
});
