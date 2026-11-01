import { describe, it, expect } from 'vitest';
import { troubled, render } from '../scripts/test-summary.mjs';

const report = { suites: [{ title: 'a.spec.js', file: 'a.spec.js', suites: [{ title: 'group', suites: [], specs: [{ title: 'inner', file: 'a.spec.js', line: 5, tests: [{ status: 'unexpected', projectName: 'phone', results: [{}, {}] }] }] }], specs: [
  { title: 'fine', file: 'a.spec.js', line: 1, tests: [{ status: 'expected', projectName: 'phone', results: [{}] }] },
  { title: 'skipped', file: 'a.spec.js', line: 2, tests: [{ status: 'skipped', projectName: 'phone', results: [] }] },
  { title: 'wobbly', file: 'a.spec.js', line: 9, tests: [{ status: 'flaky', projectName: 'desktop', results: [{}, {}] }] },
] }] };

describe('test summary of a CI run', () => {
  it('lists failed and flaky tests, not passed or skipped ones', () => {
    const list = troubled(report);
    expect(list.map((t) => [t.title, t.status, t.retries])).toEqual([['group › inner', 'unexpected', 1], ['wobbly', 'flaky', 1]]);
  });
  it('writes one line per test, nothing when all is well', () => {
    const text = render(troubled(report), 'phone part 2');
    expect(text).toContain('phone part 2: 2 unreliable or failed');
    expect(text).toContain('flaky (passed on retry) · desktop · `a.spec.js:9` wobbly');
    expect(render([], 'x')).toBe('');
  });
});
