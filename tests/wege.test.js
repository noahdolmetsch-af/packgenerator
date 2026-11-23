// «Wege» (thread «Navigation ohne Sackgassen»): the start of the path comes from the map of the app (nav.js).
import { describe, it, expect } from 'vitest';
import { trailOf, keepSteps, placeKeyOf, isRoot } from '../src/lib/nav/wege.js';

const keys = (h) => (trailOf(h) ?? []).map((s) => (s.kind === 'place' ? s.place : `${s.place}/${s.entry.key}`));

describe('trailOf: the place and the tab, as the sidebar lights them', () => {
  it('a page under Woche › Training starts with «week» and the tab «training», no longer with Aktiv', () => {
    expect(keys('#/flow/rest')).toEqual(['week', 'week/training', 'week/rest']); // Erholung is a chip under Training: the path names it too («Woche › Training › Erholung»)
    expect(keys('#/routine')).toEqual(['week', 'week/training', 'week/rest']); // «Das tut mir gut» lives under that chip
    expect(keys('#/flow/training')).toEqual(['week', 'week/training']); // the first chip is the tab itself
  });
  it('the insights of «Ich › Daten» start under Auswerten, where the sidebar lights them', () => {
    expect(placeKeyOf('#/me/insights')).toBe('analysis');
    expect(keys('#/me/insights')[0]).toBe('analysis');
  });
  it('a page of Ich starts with «me»', () => {
    expect(keys('#/me/look')).toEqual(['me']);
    expect(keys('#/me/ruhig/aus')).toEqual(['me']);
  });
  it('Material pages start with the place «bikes» (Velos und Material)', () => {
    expect(keys('#/favorites')[0]).toBe('bikes');
    expect(keys('#/gear/supplies')[0]).toBe('bikes');
  });
  it('Quick Links stands under Heute', () => {
    expect(keys('#/quick')).toEqual(['today']);
  });
});

describe('keepSteps: only what still fits after that start', () => {
  const passed = [
    { href: '#/flow', label: 'Active' }, // the old place
    { href: '#/flow/sports', label: 'My sports' }, // a tab
    { href: '#/flow/review?w=2026-11-16', label: 'Week in review' }, // a page of the same place
    { href: '#/me/data', label: 'Data' }, // a page of another place
    { href: '#/', label: 'Today' },
  ];
  it('drops places, tabs and steps of another place', () => {
    expect(keepSteps('#/flow/review/obs', passed).map((s) => s.label)).toEqual(['Week in review']);
  });
  it('keeps the page of a bike: «#/bikes?bike=…» is no place', () => {
    const s = [{ href: '#/bikes?bike=b1', label: 'Gravel' }];
    expect(keepSteps('#/bikes?tab=care&bike=b1', s)).toEqual(s);
    expect(isRoot('#/bikes')).toBe(true);
    expect(isRoot('#/bikes?bike=b1')).toBe(false);
  });
});
