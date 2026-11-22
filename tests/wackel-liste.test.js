// Wobbly list (Noah 21.11.2026 «4»): nights are counted, a second night is a work order, old ones fall off.
import { describe, it, expect } from 'vitest';
import { update, render, KEEP_DAYS } from '../scripts/wackel-liste.mjs';
import { troubled, flakyKeys, failedKeys } from '../scripts/test-summary.mjs';

const A = 'phone · a.spec.js · wobbly one';
const B = 'desktop · b.spec.js · wobbly two';

describe('Wobbly list', () => {
  it('starts a list, counts nights, and counts a night only once', () => {
    const d1 = update(null, new Set([A, B]), '2026-11-22');
    expect(d1[A]).toEqual({ nights: 1, first: '2026-11-22', last: '2026-11-22' });
    const d2 = update(d1, new Set([A]), '2026-11-23');
    expect(d2[A]).toEqual({ nights: 2, first: '2026-11-22', last: '2026-11-23' });
    expect(d2[B].nights).toBe(1); // not seen today: kept, not counted
    expect(update(d2, new Set([A]), '2026-11-23')[A].nights).toBe(2); // the same night again (a second run) does not count twice
  });
  it('keeps a test for 14 days after it last wobbled, then drops it', () => {
    const d1 = update(null, new Set([A]), '2026-11-01');
    expect(update(d1, new Set(), `2026-11-${String(1 + KEEP_DAYS).padStart(2, '0')}`)[A]).toBeTruthy();
    expect(update(d1, new Set(), `2026-11-${String(2 + KEEP_DAYS).padStart(2, '0')}`)[A]).toBeUndefined();
  });
  it('says only what is a work order: two nights or more; a first wobble is only watched', () => {
    let list = update(null, new Set([A, B]), '2026-11-22');
    expect(render(list, '2026-11-22')).not.toContain('Wackler (');
    expect(render(list, '2026-11-22')).toContain('Heute zum ersten Mal gewackelt (2');
    list = update(list, new Set([A]), '2026-11-23');
    const text = render(list, '2026-11-23');
    expect(text).toContain('Wackler (1)');
    expect(text).toContain(`2 Nächte (seit 2026-11-22, heute wieder): ${A}`);
    expect(text).not.toContain(B); // B wobbled one night only: not a work order
    expect(render({}, '2026-11-23')).toBe('Kein Test hat heute gewackelt.\n');
  });
  it('a wobbler that stays away for a week leaves the list of work orders', () => {
    let list = update(null, new Set([A]), '2026-11-22');
    list = update(list, new Set([A]), '2026-11-23');
    expect(render(list, '2026-11-30')).toContain('Wackler (1)'); // 7 days later: still there
    expect(render(list, '2026-12-01')).not.toContain('Wackler ('); // 8 days: no longer an open work order
  });
});

describe('flaky names from the Playwright report', () => {
  const report = { suites: [{ title: 'a.spec.js', file: 'a.spec.js', suites: [], specs: [
    { title: 'fine', file: 'a.spec.js', line: 1, tests: [{ status: 'expected', projectName: 'phone', results: [{}] }] },
    { title: 'wobbly one', file: 'a.spec.js', line: 9, tests: [{ status: 'flaky', projectName: 'phone', results: [{}, {}] }] },
    { title: 'broken', file: 'a.spec.js', line: 12, tests: [{ status: 'unexpected', projectName: 'phone', results: [{}, {}] }] },
  ] }] };
  it('flaky ones only (a red one is in the other list), stable and without a line number', () => {
    expect(flakyKeys(troubled(report))).toEqual([A]);
    expect(failedKeys(troubled(report))).toEqual(['phone · a.spec.js · broken']);
  });
});
