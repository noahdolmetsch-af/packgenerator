// «Rueckmeldung beim Tippen» (Noah 25.11.2026 «1-5a»): a tick buzzes briefly and lights up, a finished moment buzzes twice,
// and the buzz is one switch that is not tied to «reduce motion» (a buzz is no movement).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DONE_PATTERN, OPS, buzzNow } from '../src/lib/bedienung.js';
import DE from '../src/lib/i18n/de/index.js';

const src = (p) => readFileSync(new URL(`../src/${p}`, import.meta.url), 'utf8');
const css = src('app.css');

describe('Rueckmeldung: the buzz', () => {
  it('the finished moment is a longer double buzz than the tick', () => {
    expect(DONE_PATTERN.length).toBeGreaterThanOrEqual(3);
    expect(DONE_PATTERN.reduce((a, b) => a + b, 0)).toBeGreaterThan(15);
    const calls = [];
    expect(buzzNow({ vibrate: (p) => (calls.push(p), true) }, DONE_PATTERN)).toBe(true);
    expect(calls).toEqual([DONE_PATTERN]);
  });
  it('one switch, with its German text', () => {
    const op = OPS.find((o) => o.key === 'buzz');
    expect(op.on).toBe(true);
    expect(DE[op.text]).toBeTruthy();
  });
  it('the buzz does not look at reduced motion', () => {
    expect(src('lib/bedienung.svelte.js')).not.toMatch(/doneBuzz = [^\n]*(motion|matchMedia)/);
  });
});

describe('Rueckmeldung: the places', () => {
  const tick = [
    ['lib/flow/TickGrid.svelte', /buzz\(\);\s*tickFlash\(el\)/],
    ['lib/home/HabitCard.svelte', /buzz\(\)[\s\S]*tickFlash/],
    ['lib/tag/Todos.svelte', /buzz\(\);\s*tickFlash\(el\)/],
    ['lib/home/ChallengeLine.svelte', /doneBuzz\(\);\s*else buzz\(\)/],
  ];
  for (const [file, re] of tick) it(`${file} buzzes and lights up`, () => expect(src(file)).toMatch(re));
  for (const file of ['lib/flow/hobby/StarWindow.svelte', 'pages/Between.svelte', 'lib/care/CareTab.svelte', 'lib/home/ChallengeLine.svelte']) {
    it(`${file} has the double buzz`, () => expect(src(file)).toContain('doneBuzz'));
  }
});

describe('Rueckmeldung: the light and the pressed state', () => {
  it('the ring and the pressed state run only when motion is allowed', () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.tick-flash \{\s*animation: tick-flash var\(--t-sheet\) var\(--ease-out\);/);
    expect(css).toMatch(/\.tap-fx:active:not\(:disabled\) \{\s*transform: scale\(0\.97\);/);
    expect(css).toContain("html[data-motion='off'] .tap-fx:active");
  });
  it('tickFlash is still with «Bewegung: Aus»', () => {
    const js = src('lib/ui/rowout.js');
    expect(js).toMatch(/export function tickFlash\(el\) \{\s*if \(!el \|\| motionStill\(\)\) return;/);
  });
});
