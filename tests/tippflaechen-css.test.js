// Durchklick Fund 1 (Noah 22.11.2026 «1a»): the quiet small controls get the invisible 44 px tap area on touch.
// The list may only grow: every selector below must be in the touch block of app.css with a ::after rule.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const SELECTORS = ['.tap', '.back a', 'a.back', 'a.chip', 'button.skip', 'button.more', 'button.idot'];

describe('tap areas on touch', () => {
  const at = css.indexOf('.tap::after');
  const block = css.slice(css.lastIndexOf('@media (pointer: coarse)', at), css.indexOf('\n}\n', at) + 3);
  it('sits in a touch-only block', () => {
    expect(at).toBeGreaterThan(0);
    expect(block).toMatch(/^@media \(pointer: coarse\)/);
  });
  it.each(SELECTORS)('%s has the invisible 44 px area', (sel) => {
    expect(block).toContain(`${sel}::after`);
    expect(block).toMatch(new RegExp(`${sel.replace(/\./g, '\\.')}[,\\s][^{]*\\{\\s*position: relative`));
  });
  it('is 44 px high and does not move the layout', () => {
    expect(block).toMatch(/height: 44px/);
    expect(block).toMatch(/position: absolute/);
  });
});
