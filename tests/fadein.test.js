// «Ruhiges Einblenden» (Paket A Seitenwechsel 4): which parts fade in after a slow load (src/lib/nav/fadein.js)
import { describe, it, expect } from 'vitest';
import { between, fadeIn, stillWanted } from '../src/lib/nav/fadein.js';

// a tiny stand-in for the DOM: a parent with a row of children
function row(kinds) {
  const parent = { firstChild: null };
  const nodes = kinds.map((k, i) => ({ nodeType: k === 'c' ? 8 : 1, name: `${k}${i}`, parentNode: parent, nextSibling: null, animated: 0, animate() { this.animated++; } }));
  nodes.forEach((n, i) => (n.nextSibling = nodes[i + 1] ?? null));
  parent.firstChild = nodes[0] ?? null;
  return { parent, nodes };
}

describe('between', () => {
  it('takes the elements between the two neighbours and leaves comments out', () => {
    const { parent, nodes } = row(['e', 'c', 'e', 'e', 'c', 'e']);
    expect(between({ parent, prev: nodes[0], next: nodes[5] }).map((n) => n.name)).toEqual(['e2', 'e3']);
  });
  it('runs from the start when there is no previous neighbour, to the end when there is no next one', () => {
    const { parent, nodes } = row(['e', 'e', 'e']);
    expect(between({ parent, prev: null, next: nodes[2] }).map((n) => n.name)).toEqual(['e0', 'e1']);
    expect(between({ parent, prev: nodes[0], next: null }).map((n) => n.name)).toEqual(['e1', 'e2']);
  });
  it('fades nothing when a neighbour is gone from the parent', () => {
    const { parent, nodes } = row(['e', 'e', 'e']);
    const lost = { ...nodes[2], parentNode: null };
    expect(between({ parent, prev: nodes[0], next: lost })).toEqual([]);
    expect(between({ parent: null, prev: null, next: null })).toEqual([]);
  });
});

describe('fadeIn', () => {
  it('fades every element once, and nothing when less motion is wanted', () => {
    const { nodes } = row(['e', 'e']);
    expect(fadeIn(nodes, { still: false })).toBe(2);
    expect(nodes.map((n) => n.animated)).toEqual([1, 1]);
    expect(fadeIn(nodes, { still: true })).toBe(0);
    expect(nodes.map((n) => n.animated)).toEqual([1, 1]);
  });
  it('stillWanted: the app switch «Aus» and the device setting both mean still', () => {
    expect(stillWanted({ document: { documentElement: { dataset: { motion: 'off' } } } })).toBe(true);
    expect(stillWanted({ document: { documentElement: { dataset: {} } }, matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(stillWanted({ document: { documentElement: { dataset: {} } }, matchMedia: () => ({ matches: false }) })).toBe(false);
  });
});
