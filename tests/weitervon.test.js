// «Weiter von hier» (UI-Prüfung 07.11.2026, Q1): ONE block joins «As next» and «Fits here». Fictional/none: only ids of the catalogue.
import { describe, it, expect } from 'vitest';
import { weiterVon, MAX_WEGE } from '../src/lib/weitervon.js';
import { PASST_HIER } from '../src/lib/passthier.js';
import { ALS_NAECHSTES } from '../src/lib/alsnaechstes.js';
import DE from '../src/lib/i18n/de/index.js';

const ids = (r) => r.map((x) => x.f.id);

describe('Continue from here', () => {
  it('shows what comes after an action first, then what fits the section', () => {
    const r = weiterVon({ moment: 'ride', place: 'weight' });
    expect(ids(r)).toEqual(['f.partwear', 'f.logbook', 'f.weightsure', 'f.lighter', 'f.bagplan']);
    expect(r.map((x) => x.why)).toEqual(['next', 'next', 'fits', 'fits', 'fits']);
  });
  it('a place alone and a moment alone work, unknown ones give nothing', () => {
    expect(ids(weiterVon({ place: 'route' }))).toEqual(['f.mapmeasure', 'f.komoot']);
    expect(ids(weiterVon({ moment: 'packed' }))).toEqual(['f.weather', 'f.departsheet']);
    expect(weiterVon({ place: 'nowhere', moment: 'nowhen' })).toEqual([]);
    expect(weiterVon()).toEqual([]);
  });
  it('names a function once, even when two lists carry it, and takes ids the page names', () => {
    const r = weiterVon({ moment: 'ride', also: ['f.partwear', 'f.weather', 'f.nothing'] });
    expect(ids(r)).toEqual(['f.partwear', 'f.logbook', 'f.weather']);
    expect(r.at(-1).why).toBe('also');
  });
  it('leaves out what is marked «Not for me»', () => {
    expect(ids(weiterVon({ moment: 'ride' }, { 'f.logbook': true }))).toEqual(['f.partwear']);
  });
  it('never shows more than the maximum, in the order of the lists', () => {
    expect(MAX_WEGE).toBe(6);
    const r = weiterVon({ place: 'ride', also: ['f.weather', 'f.logbook', 'f.setuplog'] });
    expect(r).toHaveLength(6);
    expect(ids(r).slice(0, 4)).toEqual(PASST_HIER.ride);
    expect(weiterVon({ place: 'ride' }, {}, 2)).toHaveLength(2);
    expect(weiterVon({ place: 'ride' }, {}, 0)).toEqual([]);
  });
  it('every place and every moment of the two lists gives ways with a page and a German title', () => {
    for (const place of Object.keys(PASST_HIER)) {
      const r = weiterVon({ place });
      expect(r.length, place).toBeGreaterThan(0);
      for (const { f } of r) {
        expect(f.href.startsWith('#/'), f.id).toBe(true);
        expect(DE[f.title], f.id).toBeTruthy();
      }
    }
    for (const moment of Object.keys(ALS_NAECHSTES)) expect(weiterVon({ moment }).length, moment).toBeGreaterThan(0);
    expect(DE['Continue from here']).toBe('Weiter von hier');
  });
});
