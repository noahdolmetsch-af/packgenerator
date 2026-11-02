import { describe, it, expect } from 'vitest';
import { scope } from '../scripts/ci-scope.mjs';

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
