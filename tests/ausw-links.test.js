import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLACE_TABS, TAB_GROUPS, tabOf, placeOf, pageOf } from '../src/lib/nav.js';

// «Auswerten aufräumen» (Noah 07.11.2026 «4a»): the summit book is a tab of Auswerten, the link cards of the start are gone
describe('the summit book is a tab of Auswerten', () => {
  it('has its tab in the group «What did I do?» and no longer lights «My sports»', () => {
    expect(PLACE_TABS.analysis.map((x) => x.key)).toContain('gipfel');
    expect(TAB_GROUPS.analysis[1].keys).toContain('gipfel');
    expect(tabOf('analysis', '#/flow/gipfelbuch')).toBe('gipfel');
    expect(tabOf('analysis', '#/flow/gipfelbuch?sport=bike')).toBe('gipfel');
    expect(tabOf('active', '#/flow/gipfelbuch')).toBeNull();
    expect(placeOf(pageOf('#/flow/gipfelbuch'), '#/flow/gipfelbuch')).toBe('analysis');
    expect(placeOf(pageOf('#/flow/sports'), '#/flow/sports')).toBe('active');
  });
  it('the start of Auswerten has no link cards any more, and every page of them is a tab', () => {
    const src = readFileSync('src/pages/AuswertenStart.svelte', 'utf8');
    expect(src).not.toContain('<MoreAktiv');
    const keys = PLACE_TABS.analysis.map((x) => x.key);
    for (const k of ['impulse', 'milestones', 'ticks', 'gipfel']) expect(keys).toContain(k);
  });
  it('Ideen opens from the page Impulse', () => {
    expect(readFileSync('src/lib/frei/Impulse.svelte', 'utf8')).toContain('href="#/flow/ideen"');
  });
});
