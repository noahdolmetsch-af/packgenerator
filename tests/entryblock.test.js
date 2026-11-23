// «Mein Tag» Design-Abgleich (Noah 23.11.2026 «1-5 a»): the block of one entry (EntryBlock.svelte) takes its colours
// only from the palette: every kind has its own variable in app.css, and the component has no colour of its own.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');
const src = readFileSync(new URL('../src/lib/ui/EntryBlock.svelte', import.meta.url), 'utf8');
const KINDS = { sport: 'wk-sport', date: 'wk-date', todo: 'wk-todo', away: 'wk-away', bike: 'wk-bike', rest: 'wk-rest', food: 'wk-food', sp: 'wk-sp' };

describe('EntryBlock', () => {
  it('lists every kind and maps each to a variable that app.css defines', () => {
    for (const [kind, v] of Object.entries(KINDS)) {
      expect(src, kind).toContain(`'${kind}'`);
      expect(css, v).toMatch(new RegExp(`--${v}: var\\(--[a-z0-9-]+\\);`));
      if (kind !== 'sport') expect(src, `${kind} uses ${v}`).toContain(`.k-${kind} { --k: var(--${v}); }`);
    }
  });
  it('has no colour value of its own and no own font size', () => {
    const style = src.slice(src.indexOf('<style>'));
    expect(style).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/);
    expect(style).not.toMatch(/font-size:\s*\d/);
  });
  it('the tick has a 44 px tap area and a label', () => {
    expect(src).toMatch(/\.eb-ck \{[^}]*width: 44px;[^}]*height: 44px;/);
    expect(src).toContain('aria-label=');
  });
});
