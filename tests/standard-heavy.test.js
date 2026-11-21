// UI-Test T13 (G4-03): Bausteine says when «Standard» is heavy and «Tidy up» suggests fewer things.
// Fictional items only.
import { describe, it, expect, afterEach } from 'vitest';
import { setPackRules } from '../src/lib/packrules.svelte.js';
import { standardHint, standardNow, suggestPlan, HEAVY_STANDARD_G } from '../src/lib/packcleanup.js';

afterEach(() => setPackRules(null));

const it_ = (id, name, f = {}) => ({ id, name, ownership: 'owned', role: null, sets: ['standard'], defaultBag: 'seat', domains: ['bikepacking'], ...f });
const light = [it_('P1', 'Phone', { weightG: 200 }), it_('K1', 'Keys', { weightG: 50 }), it_('T1', 'Spare tube', { weightG: 120 })];
const heavy = [...light, it_('SK', 'Touring skis with binding test', { weightG: 3000 }), it_('ST', 'Stove test', { weightG: 2500 }), it_('PO', 'Pot test', { weightG: 400 })];

describe('standardHint', () => {
  it('stays quiet while Standard is light', () => {
    expect(standardHint(light)).toBe(null);
  });
  it('speaks when Standard is heavy and the suggestion keeps fewer things', () => {
    const h = standardHint(heavy);
    const kept = suggestPlan(heavy, [], null).std.length;
    expect(standardNow(heavy).length).toBe(6);
    // the skis, the stove and the pot are no core line of a bike trip: the suggestion leaves them out
    expect(kept).toBeLessThan(6);
    expect(h).toEqual({ g: 6270, n: 6, suggested: kept });
    expect(h.g).toBeGreaterThanOrEqual(HEAVY_STANDARD_G);
  });
  it('the limit can be set', () => {
    expect(standardHint(heavy, [], null, 100000)).toBe(null);
  });
});
