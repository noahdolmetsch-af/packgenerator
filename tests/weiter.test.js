// «Weiter zu …» (thread «Navigation ohne Sackgassen»): every way on leads to a real page and has a German name; no page points at itself.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { weiterOf, WEITER_ADDRESSES, WEITER_LABELS } from '../src/lib/nav/weiter.js';
import { isUnknown } from '../src/lib/nav.js';
import DE from '../src/lib/i18n/de/index.js';

describe('weiterOf', () => {
  it('gives at most three steps and never the page itself', () => {
    for (const a of WEITER_ADDRESSES) {
      const steps = weiterOf(a);
      expect(steps.length).toBeLessThanOrEqual(3);
      expect(steps.map((s) => s.href)).not.toContain(a);
    }
  });
  it('a page with enough ways, and Heute, get nothing', () => {
    expect(weiterOf('#/')).toEqual([]);
    expect(weiterOf('#/week')).toEqual([]);
  });
  it('an address with a query or a slash at the end is the same page', () => {
    expect(weiterOf('#/kurse/gold?x=1')).toEqual(weiterOf('#/kurse/gold'));
    expect(weiterOf('#/kurse/gold/')).toEqual(weiterOf('#/kurse/gold'));
  });
  it('every address is a page of the app (no «page not found»)', () => {
    for (const a of WEITER_ADDRESSES) expect(isUnknown(a), a).toBe(false);
  });
  it('every name has a German text', () => {
    for (const l of WEITER_LABELS) expect(DE[l], l).toBeTruthy();
    expect(DE['Continue to']).toBe('Weiter zu');
  });
});
