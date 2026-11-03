import { describe, it, expect } from 'vitest';
import { gehoertDazu, PAGE_MOMENT, SHOWN, allHref, HUB_ONLY, showsRow } from '../src/lib/know/gehoert.js';
import { featureHref } from '../src/lib/features.js';
import { momentOfFeature } from '../src/lib/moment.js';

describe('«Belongs to …» on top of a page (PR 7)', () => {
  it('Pack is the first page; the row has at most 5 functions of the moment', () => {
    expect(PAGE_MOMENT.pack).toBe('packen');
    const r = gehoertDazu({ moment: 'packen', here: '#/pack' });
    expect(r.items.length).toBe(SHOWN);
    expect(r.total).toBeGreaterThan(SHOWN);
    for (const f of r.items) expect(momentOfFeature(f.id)).toBe('packen');
  });
  it('never used first, «Not for me» out', () => {
    const r = gehoertDazu({ moment: 'packen', here: '#/pack' });
    const used = new Set([r.items[0].id]);
    const r2 = gehoertDazu({ moment: 'packen', here: '#/pack', used });
    expect(r2.items.map((f) => f.id)).not.toContain(r.items[0].id);
    const r3 = gehoertDazu({ moment: 'packen', here: '#/pack', notForMe: { [r.items[0].id]: { why: '', at: '' } } });
    expect(r3.total).toBe(r.total - 1);
  });
  it('a function on the page itself is left out', () => {
    const all = gehoertDazu({ moment: 'packen', here: '#/nowhere' }).total;
    expect(gehoertDazu({ moment: 'packen', here: '#/pack' }).total).toBeLessThan(all);
  });
  it('Trips (planning) is the second page', () => {
    expect(PAGE_MOMENT.trips).toBe('planen');
    const r = gehoertDazu({ moment: 'planen', here: '#/trips' });
    expect(r.items.length).toBe(SHOWN);
    for (const f of r.items) expect(momentOfFeature(f.id)).toBe('planen');
  });
  it('Me (Ich) is the third page', () => {
    expect(PAGE_MOMENT.me).toBe('app');
    const r = gehoertDazu({ moment: 'app', here: '#/me' });
    expect(r.items.length).toBeGreaterThan(0);
    for (const f of r.items) expect(momentOfFeature(f.id)).toBe('app');
  });
  it('Velos, Material and Aktiv show their moment (Wegweiser PR 10)', () => {
    expect(PAGE_MOMENT.bikes).toBe('velo');
    expect(PAGE_MOMENT.gear).toBe('velo');
    expect(PAGE_MOMENT.flow).toBe('koerper');
    for (const page of HUB_ONLY) {
      const r = gehoertDazu({ moment: PAGE_MOMENT[page], here: `#/${page}`, under: true });
      expect(r.items.length).toBe(SHOWN);
      for (const f of r.items) expect(momentOfFeature(f.id)).toBe(PAGE_MOMENT[page]);
    }
  });
  it('Rückblick, Neuland and Wetter show their moment (idea D4)', () => {
    expect(PAGE_MOMENT.debrief).toBe('zurueck');
    expect(PAGE_MOMENT.neuland).toBe('lust');
    expect(PAGE_MOMENT.wetter).toBe('planen');
    expect(showsRow('debrief', '#/debrief')).toBe(true);
    expect(showsRow('debrief', '#/debrief/logbook')).toBe(false);
    expect(showsRow('wetter', '#/wetter')).toBe(true);
  });
  it('on a hub page only on the page itself, and its own sub-pages are left out', () => {
    expect(showsRow('flow', '#/flow')).toBe(true);
    expect(showsRow('flow', '#/flow/edit/x')).toBe(false);
    expect(showsRow('bikes', '#/bikes?tab=rig')).toBe(true);
    expect(showsRow('pack', '#/pack/templates')).toBe(true);
    expect(showsRow('home', '#/')).toBe(false);
    const r = gehoertDazu({ moment: 'koerper', here: '#/flow', under: true });
    for (const f of r.items) expect(featureHref(f).startsWith('#/flow/')).toBe(false);
  });
  it('«all n ›» opens the catalogue by moment', () => {
    expect(allHref('packen')).toBe('#/features?by=moment&moment=packen');
  });
});
