import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLACE_TABS, tabOf, subOf, placeOf, pageOf } from '../src/lib/nav.js';

// «Ganze App neu denken» Schritt 12: the pages of Auswerten are chips (`subs`) under five tabs
const pagesOf = (place) => PLACE_TABS[place].flatMap((x) => x.subs ?? [x]).map((x) => x.key);

// «Auswerten aufräumen» (Noah 07.11.2026 «4a»): the summit book is a tab of Auswerten, the link cards of the start are gone
describe('the summit book is a tab of Auswerten', () => {
  it('has its chip under the tab «Rides» and no longer lights «My sports»', () => {
    expect(pagesOf('analysis')).toContain('gipfel');
    expect(PLACE_TABS.analysis.find((x) => x.key === 'rides').subs.map((x) => x.key)).toContain('gipfel');
    expect(subOf('analysis', '#/flow/gipfelbuch').key).toBe('gipfel');
    expect(subOf('analysis', '#/flow/gipfelbuch?sport=bike').key).toBe('gipfel');
    expect(tabOf('analysis', '#/flow/gipfelbuch')).toBe('rides');
    expect(tabOf('active', '#/flow/gipfelbuch')).toBeNull();
    expect(placeOf(pageOf('#/flow/gipfelbuch'), '#/flow/gipfelbuch')).toBe('analysis');
    expect(placeOf(pageOf('#/flow/sports'), '#/flow/sports')).toBe('active');
  });
  it('the start of Auswerten has no link cards any more, and every page of them is a tab', () => {
    const src = readFileSync('src/pages/AuswertenStart.svelte', 'utf8');
    expect(src).not.toContain('<MoreAktiv');
    const keys = pagesOf('analysis');
    for (const k of ['impulse', 'milestones', 'ticks', 'gipfel']) expect(keys).toContain(k);
  });
  it('Ideen opens from the page Impulse', () => {
    expect(readFileSync('src/lib/frei/Impulse.svelte', 'utf8')).toContain('href="#/flow/ideen"');
  });
});
