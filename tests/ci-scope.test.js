import { describe, it, expect } from 'vitest';
import { scope, newsScope, partsFor, CORE_SPECS, MAX_SPECS } from '../scripts/ci-scope.mjs';

describe('ci-scope: which phone tests a PR needs', () => {
  it('docs and news only: no phone tests', () => {
    expect(scope(['docs/releases/x.md', 'src/lib/news/x.js']).mode).toBe('none');
  });
  it('whole spec files: only these specs', () => {
    const r = scope(['tests/e2e/pf.spec.js', 'docs/releases/x.md', 'tests/e2e/gesamttest/scenarios.spec.js']);
    expect(r).toEqual({ mode: 'specs', specs: ['tests/e2e/pf.spec.js', 'tests/e2e/gesamttest/scenarios.spec.js'], parts: 1 });
  });
  it('shared helpers or app code: everything', () => {
    expect(scope(['tests/e2e/clock.js']).mode).toBe('all');
    expect(scope(['tests/e2e/gesamttest/lib.js', 'tests/e2e/pf.spec.js']).mode).toBe('all');
    expect(scope(['src/pages/Home.svelte', 'docs/releases/x.md']).mode).toBe('all');
    expect(scope(['.github/workflows/deploy.yml']).mode).toBe('all');
  });
  it('no files known: everything', () => {
    expect(scope([]).mode).toBe('all');
  });
  it('German text files alone: no phone tests; the files that wire them: everything', () => {
    expect(scope(['src/lib/i18n/de/pack.js', 'docs/releases/x.md']).mode).toBe('none');
    expect(scope(['src/lib/i18n/de/index.js']).mode).toBe('all');
    expect(scope(['src/lib/i18n/de/auto.gen.js']).mode).toBe('all');
  });
});

describe('ci-scope: app code with the map (Noah 05.11.2026 «3a ja»)', () => {
  it('the mapped specs, the PR\'s own specs and the Kern, sorted and once', () => {
    const r = scope(['src/pages/Lend.svelte', 'tests/e2e/own.spec.js', 'src/lib/i18n/de/lend.js'], () => ['tests/e2e/paket-h.spec.js', 'tests/e2e/guard.spec.js']);
    expect(r.mode).toBe('specs');
    expect(r.specs).toEqual([...new Set([...CORE_SPECS, 'tests/e2e/own.spec.js', 'tests/e2e/paket-h.spec.js'])].sort());
  });
  it('the map says unknown (null): everything', () => {
    expect(scope(['src/lib/home/rows.js'], () => null).mode).toBe('all');
  });
  it('only app code is mapped; a config, build or workflow file runs everything, the map is not asked', () => {
    let asked = false;
    const map = () => { asked = true; return []; };
    for (const f of ['package.json', 'vite.config.js', '.github/workflows/deploy.yml', 'public/x.png', 'src/app.css', 'index.html']) expect(scope([f], map).mode, f).toBe('all');
    expect(scope(['src/pages/Lend.svelte', 'vite.config.js'], map).mode).toBe('all');
    expect(asked).toBe(false);
  });
  it('a shared test helper is app code for the map (it reaches the specs that import it)', () => {
    expect(scope(['tests/e2e/clock.js'], () => ['tests/e2e/a.spec.js']).mode).toBe('specs');
  });
  it('too many specs: everything', () => {
    const many = Array.from({ length: MAX_SPECS + 1 }, (_, i) => `tests/e2e/s${i}.spec.js`);
    expect(scope(['src/pages/Lend.svelte'], () => many).mode).toBe('all');
  });
  it('parts: one per 20 specs, 1 to 5', () => {
    expect(partsFor(['a'])).toBe(1);
    expect(partsFor(Array(21).fill('a'))).toBe(2);
    expect(partsFor(Array(250).fill('a'))).toBe(5);
  });
});

describe('ci-scope: which news lines «Ausprobieren» taps in a PR', () => {
  const has = () => true;
  it('only the lines of the PR\'s own news files', () => {
    expect(newsScope(['src/lib/news/a-b.js', 'src/pages/Bikes.svelte', 'src/lib/news/c.js'], has)).toBe('a-b.js c.js');
  });
  it('no news file: none', () => {
    expect(newsScope(['src/pages/Bikes.svelte', 'docs/releases/x.md'], has)).toBe('');
  });
  it('a deleted news file is left out', () => {
    expect(newsScope(['src/lib/news/gone.js'], () => false)).toBe('');
  });
  it('the update list, the go-map, the Ausprobieren code and the helpers: all lines', () => {
    for (const f of ['src/lib/whatsnew.js', 'src/lib/know/newsgo-map.js', 'src/lib/know/spot.js', 'src/lib/news/README.md', 'src/pages/WasNeu.svelte', 'tests/e2e/ausprobieren.spec.js', 'tests/e2e/clock.js', 'tests/e2e/gesamttest/lib.js'])
      expect(newsScope(['src/lib/news/x.js', f], has), f).toBe('all');
  });
  it('no files known: all lines', () => {
    expect(newsScope([], has)).toBe('all');
  });
});
