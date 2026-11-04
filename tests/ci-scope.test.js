import { describe, it, expect } from 'vitest';
import { scope, newsScope } from '../scripts/ci-scope.mjs';

describe('ci-scope: which phone tests a PR needs', () => {
  it('docs and news only: no phone tests', () => {
    expect(scope(['docs/releases/x.md', 'src/lib/news/x.js']).mode).toBe('none');
  });
  it('whole spec files: only these specs', () => {
    const r = scope(['tests/e2e/pf.spec.js', 'docs/releases/x.md', 'tests/e2e/gesamttest/scenarios.spec.js']);
    expect(r).toEqual({ mode: 'specs', specs: ['tests/e2e/pf.spec.js', 'tests/e2e/gesamttest/scenarios.spec.js'] });
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
