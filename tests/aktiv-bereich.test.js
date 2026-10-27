// «Aktiv neu» (Noah 22.10.2026, Beschreibung «Aktiv-Bereich»): Aktiv is for doing (Heute, Meine Sportarten,
// Training, Erholung), «Auswerten» for looking; it shares Aktiv's place in the bar. Pure functions, no data.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLACES, SIDE_PLACES, PLACE_TABS, ANALYSIS, barPlace, placeOf, pageOf } from '../src/lib/nav.js';
import { sportHref, actSport } from '../src/lib/flow/mysports.js';
import { BIKE_ACT } from '../src/lib/sportsbase.js';

describe('the places', () => {
  it('the bar: Heute, Planen, Touren, Aktiv, Velos (and Material); Auswerten shares Aktiv', () => {
    expect(PLACES.map((p) => p.key)).toContain('active');
    expect(PLACES.map((p) => p.key)).not.toContain('analysis');
    expect(PLACES.find((p) => p.key === 'active').href).toBe('#/flow');
    expect(ANALYSIS.shares).toBe('active');
    expect(barPlace('analysis')).toBe('active');
    const side = SIDE_PLACES.map((p) => p.key);
    expect(side.indexOf('analysis')).toBe(side.indexOf('active') + 1);
  });
  it('Aktiv has the four tabs of the spec, Auswerten the looking pages', () => {
    expect(PLACE_TABS.active.map((x) => x.key)).toEqual(['today', 'sports', 'training', 'rest']);
    expect(PLACE_TABS.analysis.map((x) => x.key)).toEqual(expect.arrayContaining(['start', 'form', 'body', 'rides', 'ticks', 'history', 'wohl', 'impulse', 'insights', 'weight', 'milestones']));
  });
  it('the start of Auswerten is its own page', () => {
    expect(pageOf('#/auswerten')).toBe('auswerten');
    expect(placeOf('auswerten')).toBe('analysis');
    expect(placeOf('flow', '#/flow')).toBe('active');
    expect(placeOf('flow', '#/flow/form')).toBe('analysis');
  });
});

describe('Meine Sportarten', () => {
  it('a sport opens its page; Meditation keeps its page with the timer', () => {
    expect(sportHref({ id: 'yoga' })).toBe('#/flow/sport/act%3Ayoga');
    expect(sportHref({ id: 'meditation' })).toBe('#/flow/act/meditation');
    expect(sportHref({ id: 'm2', page: 'meditation' })).toBe('#/flow/act/m2');
    expect(sportHref(null)).toBe('#/flow/sports');
  });
  it('the sport of an activity, also of the bike activity the list of sports leaves out', () => {
    expect(actSport({ id: 'yoga', name: 'Yoga', icon: 'leaf', ring: 'rest' })).toMatchObject({ id: 'act:yoga', kind: 'act', key: 'yoga', icon: 'leaf', ring: 'rest', bike: false });
    expect(actSport({ id: BIKE_ACT, name: 'Velo' }).bike).toBe(true);
    expect(actSport(undefined)).toBe(null);
  });
});

describe('Gipfelbuch on the page of a sport (Noah 22.10.2026 «1a»)', () => {
  it('maps the sport pages to the sports of the book and finds own activities by name', async () => {
    const { gbSportOf, placesOfSport, addPlace, emptyBook } = await import('../src/lib/gipfelbuch.js');
    expect(gbSportOf('trip:cycling')).toBe('bike');
    expect(gbSportOf('trip:hiking')).toBe('hike');
    expect(gbSportOf('act:run')).toBe(null);
    let book = emptyBook();
    book = addPlace(book, { name: 'Testpass', sport: 'bike', ele: 1900 }, { day: '2026-07-01' });
    book = addPlace(book, { name: 'Testgipfel', sport: 'hike', ele: 2100 }, { day: '2026-08-01' });
    book = addPlace(book, { name: 'Testsee', sport: 'other', label: 'Schwimmen' }, { day: '2026-08-02' });
    expect(placesOfSport(book, { id: 'trip:cycling' }).map((r) => r.place.name)).toEqual(['Testpass']);
    expect(placesOfSport(book, { id: 'trip:hiking' }).map((r) => r.place.name)).toEqual(['Testgipfel']);
    expect(placesOfSport(book, { id: 'act:x', name: 'schwimmen' }).map((r) => r.place.name)).toEqual(['Testsee']);
    expect(placesOfSport(book, { id: 'act:y', name: 'Yoga' })).toEqual([]);
  });
  it('the sport page shows the part, the book reads ?sport=', () => {
    const page = readFileSync('src/pages/flow/Sport.svelte', 'utf8');
    expect(page).toContain('<GipfelSlot');
    expect(readFileSync('src/pages/flow/Gipfelbuch.svelte', 'utf8')).toContain("params.get('sport')");
  });
});

describe('A06 (Klick-Rundgang 22.10.2026): the tabs of Aktiv on a phone never change', () => {
  it('Heute, Meine Sportarten, Training, Erholung on every page of Aktiv, nothing under «Mehr»', async () => {
    const { phoneTabs } = await import('../src/lib/nav.js');
    for (const h of ['#/flow', '#/flow/sports', '#/flow/sport/act%3Ax', '#/flow/training', '#/flow/rest', '#/flow/gipfelbuch', '#/flow/week']) {
      const { shown, more } = phoneTabs('active', h);
      expect(shown.map((x) => x.key), h).toEqual(['today', 'sports', 'training', 'rest']);
      expect(more, h).toEqual([]);
    }
  });
});

describe('a cover on every sport page (Noah 27.10.2026 «1a»)', () => {
  it('keeps one cover per sport, takes only images, removes with null', async () => {
    const { coverOf, withCover } = await import('../src/lib/sportpage/covers.js');
    expect(coverOf(null, 'trip:hiking')).toEqual({ cover: null, y: 50 });
    let v = withCover({}, 'trip:hiking', { cover: 'data:image/jpeg;base64,AAAA', y: 130 });
    v = withCover(v, 'act:x', { cover: 'data:image/png;base64,BBBB', y: 20 });
    expect(coverOf(v, 'trip:hiking')).toEqual({ cover: 'data:image/jpeg;base64,AAAA', y: 100 });
    expect(coverOf({ a: { cover: 'javascript:alert(1)' } }, 'a').cover).toBe(null);
    v = withCover(v, 'trip:hiking', { cover: null });
    expect(Object.keys(v)).toEqual(['act:x']);
  });
  it('Sport.svelte shows the cover for every sport but Tennis, which has its own', () => {
    const page = readFileSync('src/pages/flow/Sport.svelte', 'utf8');
    expect(page).toMatch(/TENNIS_ID\}<TennisTop[\s\S]*\{:else\}<SportCover/);
  });
});

describe('«Nächstes Ziel» and shorter milestones (Noah 27.10.2026 «2a 3a»)', () => {
  it('Meine Sportarten shows the next goal; the milestones page folds on a phone and needs no length exception', async () => {
    expect(readFileSync('src/pages/flow/MySports.svelte', 'utf8')).toContain('<NextGoalRow');
    expect(readFileSync('src/pages/flow/Milestones.svelte', 'utf8')).toContain('data-ms-fold="all"');
    const { TOO_LONG } = await import('../src/lib/laenge.js');
    expect(TOO_LONG['#/flow/milestones']).toBeUndefined();
  });
});
