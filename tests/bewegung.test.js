// «Bewegung» (Noah 24.11.2026 «4a»): the three durations of app.css and of src/lib/ui/rowout.js are the same, and the moves are still with reduced motion.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MOVE } from '../src/lib/ui/rowout.js';

const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8');

describe('Bewegung: three durations', () => {
  it('the tokens in app.css equal MOVE in rowout.js', () => {
    for (const [k, v] of Object.entries({ fast: MOVE.fast, base: MOVE.base, sheet: MOVE.sheet })) {
      expect(css, k).toContain(`--t-${k}: ${v}ms;`);
    }
  });
  it('the window and fold moves use the tokens, not free numbers', () => {
    const block = css.slice(css.indexOf('@keyframes mv-fade'), css.indexOf('«Richtung zeigen»'));
    expect(block).not.toMatch(/animation:[^;]*\b\d+ms/);
  });
  it('the tick pop runs only when motion is allowed', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.tick-pop \{\s*animation: tick-pop var\(--t-base\) var\(--ease-out\);/);
  });
});
