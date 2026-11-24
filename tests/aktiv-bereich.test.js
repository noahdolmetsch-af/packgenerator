// «Aktiv neu» (Noah 22.10.2026, Beschreibung «Aktiv-Bereich»): Aktiv is for doing (Heute, Meine Sportarten,
// Training, Erholung), «Auswerten» for looking; it shares Aktiv's place in the bar. Pure functions, no data.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { PLACES, SIDE_PLACES, PLACE_TABS, ANALYSIS, barPlace, placeOf, pageOf, subOf } from '../src/lib/nav.js';
import { sportHref, actSport } from '../src/lib/flow/mysports.js';
import { BIKE_ACT } from '../src/lib/sportsbase.js';

describe('the places', () => {
  it('V4a (Noah 21.11.2026 «1a 2a»): Aktiv is part of Woche, Auswerten has its own place', () => {
    expect(PLACES.map((p) => p.key)).not.toContain('active');
    expect(PLACES.map((p) => p.key)).toContain('analysis');
    expect(ANALYSIS.shares).toBeUndefined();
    expect(barPlace('analysis')).toBe('analysis');
    expect(PLACE_TABS.active).toBeUndefined();
  });
  it('Woche has the four tabs of the new order (the pages of Aktiv are chips under Training), Auswerten the looking pages', () => {
    expect(PLACE_TABS.week.map((x) => x.key)).toEqual(['week', 'training', 'notes', 'alltag']);
    expect(PLACE_TABS.week.find((x) => x.key === 'training').subs.map((x) => x.key)).toEqual(['flowhome', 'training', 'wochenplan', 'sports', 'rest']);
    // Schritt 12: five tabs by question, every old page is a chip under one of them
    expect(PLACE_TABS.analysis.map((x) => x.key)).toEqual(['start', 'body', 'rides', 'history', 'analyse']);
    expect(PLACE_TABS.analysis.flatMap((x) => x.subs.map((s) => s.key))).toEqual(expect.arrayContaining(['fragen', 'start', 'form', 'body', 'rides', 'ticks', 'history', 'wohl', 'ideen', 'insights', 'weight', 'milestones']));
  });
  it('the start of Auswerten is its own page', () => {
    expect(pageOf('#/auswerten')).toBe('auswerten');
    expect(placeOf('auswerten')).toBe('analysis');
    expect(placeOf('flow', '#/flow')).toBe('week');
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

describe('A06 (Klick-Rundgang 22.10.2026): the tabs on a phone never change', () => {
  it('V4a: Woche, Training, Notizen, Alltag on every page of the old Aktiv, nothing under «Mehr»', async () => {
    const { phoneTabs } = await import('../src/lib/nav.js');
    for (const h of ['#/flow', '#/flow/sports', '#/flow/sport/act%3Ax', '#/flow/training', '#/flow/rest', '#/flow/gipfelbuch', '#/flow/week']) {
      const { shown, more } = phoneTabs('week', h);
      expect(shown.map((x) => x.key), h).toEqual(['week', 'training', 'notes', 'alltag']);
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
  it('Meine Sportarten shows the next goal; the milestones page folds on a phone', () => {
    expect(readFileSync('src/pages/flow/MySports.svelte', 'utf8')).toContain('<NextGoalRow');
    expect(readFileSync('src/pages/flow/Milestones.svelte', 'utf8')).toContain('data-ms-fold="all"');
  });
});

// «Ganze App neu denken» Schritt 12 (Noah 18.11.2026): Auswerten has five tabs, sorted by the question you ask (before: three groups in «Alle n»)
describe('Auswerten in five tabs by question', () => {
  const all = PLACE_TABS.analysis;
  it('five tabs: overview, body, rides, how you are, own diagram', () => {
    expect(all.map((x) => x.key)).toEqual(['start', 'body', 'rides', 'history', 'analyse']);
    const subs = Object.fromEntries(all.map((x) => [x.key, x.subs.map((s) => s.key)]));
    expect(subs.start).toEqual(['heute', 'fragen', 'start']); // «Auswerten neu» (Noah 24.11.2026): «Heute» is the new first chip
    expect(subs.body).toEqual(expect.arrayContaining(['form', 'body', 'weight', 'insights']));
    expect(subs.rides).toEqual(expect.arrayContaining(['rides', 'ticks', 'milestones', 'heatmap', 'neuland', 'gipfel', 'year', 'learned', 'challenges']));
    expect(subs.history).toEqual(expect.arrayContaining(['history', 'wohl', 'ideen']));
    expect(subs.analyse).toEqual(['analyse']);
  });
  it('no page of the old eighteen tabs is lost or stands twice', () => {
    const shown = all.flatMap((x) => x.subs.map((s) => s.key));
    expect(new Set(shown).size).toBe(shown.length);
    expect([...shown].sort()).toEqual(['analyse', 'fragen', 'form', 'body', 'rides', 'ticks', 'history', 'wohl', 'ideen', 'insights', 'weight', 'milestones', 'heatmap', 'neuland', 'gipfel', 'learned', 'year', 'start', 'challenges', 'heute'].sort());
  });
});

// «Auswerten neu» (Noah 24.11.2026 «2a 3b»): the new start «Heute» at #/auswerten, the old overview unchanged at #/auswerten/uebersicht
describe('Auswerten: Heute is the start, the old overview moved', () => {
  it('the addresses tell the two pages apart, the tab stays the first one', () => {
    expect(subOf('analysis', '#/auswerten')?.key).toBe('heute');
    expect(subOf('analysis', '#/auswerten?x=1')?.key).toBe('heute');
    expect(subOf('analysis', '#/auswerten/uebersicht')?.key).toBe('start');
    expect(subOf('analysis', '#/auswerten/fragen')?.key).toBe('fragen');
    const tab = PLACE_TABS.analysis[0];
    expect(tab.href).toBe('#/auswerten');
    expect(tab.match('#/auswerten') && tab.match('#/auswerten/uebersicht')).toBe(true);
    expect(PLACE_TABS.analysis.flatMap((x) => x.subs).find((x) => x.key === 'start').href).toBe('#/auswerten/uebersicht');
  });
});

describe('Heatmap, Neuland, Gelernt and Jahr stand in Auswerten («Aktiv und Auswerten» 3a, Noah 03.11.2026)', () => {
  const FOUR = [['#/heatmap', 'heatmap', 'heatmap'], ['#/neuland', 'neuland', 'neuland'], ['#/gelernt', 'gelernt', 'learned'], ['#/jahr', 'jahr', 'year']];
  it('the addresses stay and belong to the place Auswerten, each with a tab', () => {
    for (const [hash, page, tab] of FOUR) {
      expect(pageOf(hash), hash).toBe(page);
      expect(placeOf(pageOf(hash), hash), hash).toBe('analysis');
      expect(PLACE_TABS.analysis.flatMap((x) => x.subs).find((x) => x.key === tab)?.href, tab).toBe(hash);
    }
    expect(placeOf(pageOf('#/neuland?c=cantons'), '#/neuland?c=cantons')).toBe('analysis');
    expect(placeOf(pageOf('#/gelernt/2026-10'), '#/gelernt/2026-10')).toBe('analysis');
  });
  it('Touren › Rückblick keeps its buttons to them, and its tab no longer claims them', () => {
    const hub = readFileSync(new URL('../src/lib/review/Hub.svelte', import.meta.url), 'utf8');
    for (const [hash] of FOUR) expect(hub, hash).toContain(`href: '${hash}'`);
    const look = PLACE_TABS.trips.find((x) => x.key === 'lookback');
    for (const [hash] of FOUR) expect(look.match(hash), hash).toBe(false);
    expect(look.match('#/debrief')).toBe(true);
  });
});
