// «Versteckte Funktionen» (Noah 03.11.2026 «5a»): the list of pages further than 3 taps only gets shorter.
import { describe, it, expect } from 'vitest';
import { HOME } from '../src/lib/know/heimat.js';
import { MAX_TAPS, TAP_GAPS, TAP_GAPS_BY_DATA } from '../src/lib/know/tipps.js';

/** Lower it when a page leaves TAP_GAPS; never raise it. */
const MAX_TAP_GAPS = 13;

describe('tap guard', () => {
  it('keeps the list of far pages from growing', () => {
    expect(TAP_GAPS.length).toBeLessThanOrEqual(MAX_TAP_GAPS);
  });
  it('lists only home pages of functions, each once', () => {
    const pages = new Set(Object.values(HOME));
    expect(TAP_GAPS.filter((p) => !pages.has(p))).toEqual([]);
    expect(new Set(TAP_GAPS).size).toBe(TAP_GAPS.length);
  });
  it('lets only listed pages be near or far by the data', () => {
    expect(TAP_GAPS_BY_DATA.filter((p) => !TAP_GAPS.includes(p))).toEqual([]);
    expect(TAP_GAPS_BY_DATA).toEqual(['#/live']);
  });
  it('allows the bar tap and 2 more', () => {
    expect(MAX_TAPS).toBe(3);
  });
});
