// «Inspiration» (UC2-1, UC2-2, UC2-4; mockups 13.10.2026, Noah «3b» + «a», 4a, 5a): your own links,
// the kind from the address, one list from two stores (rigs and races stay in Velos › Setup) and a note
// that becomes a packing rule, a wishlist item or a note. Fictional data only.
import 'fake-indexeddb/auto';
import { describe, it, expect } from 'vitest';
import { TYPES, TYPE, ACTIONS, HAS_TAKE, MAKES, TAKEN_LABEL, OPEN_LABEL, INSPO_KEY, RIG_KEY, detectType, makeLink, allLinks, putLink, dropLink, freshLink, filterLinks, rigsOfRace, ruleFrom, wishFrom, noteFrom, withTaken, recentTaken, inspoHints, raceIcs, numOf, sourceOf } from '../src/lib/inspiration.js';
import { learningsFor } from '../src/lib/debrief.js';
import { racesOf, rigLinks } from '../src/lib/rig.js';
import { createDb } from '../src/lib/db.js';
import { buildBackup, restoreBackup } from '../src/lib/backup.js';
import DE from '../src/lib/i18n/de/index.js';

const NOW = '2026-10-14T08:00:00.000Z';
const P = 'test_data_gtp_';

describe('the kind from the address (UC2-4)', () => {
  const cases = [
    ['https://www.youtube.com/watch?v=abc123', 'video'],
    ['youtu.be/abc123', 'video'],
    ['https://vimeo.com/123456', 'video'],
    ['https://open.spotify.com/episode/4xYz', 'podcast'],
    ['https://podcasts.apple.com/ch/podcast/the-ride/id123', 'podcast'],
    ['https://www.komoot.com/collection/2139311', 'route'],
    ['https://www.strava.com/routes/987654', 'route'],
    ['https://ridewithgps.com/routes/555', 'route'],
    ['https://example.org/files/jura-loop.gpx', 'route'],
    ['https://bikepacking.com/routes/swiss-jura-explorer/', 'route'],
    ['https://bikepacking.com/bikes/2026-silk-road-mountain-race-rigs-part-one/', 'rig'],
    ['https://bikepacking.com/plog/what-to-pack-bikepacking-101/', 'packlist'],
    ['https://bikepacking.com/gear/bikepacking-overnighter-gear-list/', 'packlist'],
    ['https://www.themountainraces.cc/atlas-mountain-race', 'race'],
    ['https://www.bike24.com/p2123456.html', 'product'],
    ['https://www.galaxus.ch/de/s3/product/zelt-123', 'product'],
    ['https://bikepacking.com/plog/complete-guide-to-bikepacking-bags/', 'article'],
  ];
  for (const [url, type] of cases) it(`${url} → ${type}`, () => expect(detectType(url).type).toBe(type));

  it('gives the domain and a title from the address; an unknown site leaves the kind to you', () => {
    const d = detectType('https://bikepacking.com/bikes/2026-silk-road-mountain-race-rigs-part-one/');
    expect(d.domain).toBe('bikepacking.com');
    expect(d.title).toBe('2026 Silk Road Mountain Race Rigs Part One');
    expect(detectType('https://example.org/something').type).toBeNull();
    expect(detectType('').type).toBeNull();
    expect(detectType('not a link at all').type).toBeNull();
    // A start page says nothing about the kind (Noah 15.10.2026 «3a»).
    expect(detectType('https://bikepacking.com/').type).toBeNull();
    expect(detectType('bikepacking.com').type).toBeNull();
    expect(detectType('https://www.youtube.com').type).toBeNull();
  });

  it('every kind has a badge, a filter chip and actions, each with a German text', () => {
    expect(TYPES.map((x) => x.key)).toEqual(['rig', 'packlist', 'video', 'route', 'podcast', 'product', 'race', 'article']);
    const keys = [...TYPES.flatMap((x) => [x.name, x.plural]), ...MAKES.flatMap((m) => [m.name, m.text]), ...Object.values(TAKEN_LABEL), ...Object.values(OPEN_LABEL), 'Open on {site}'];
    expect(keys.filter((k) => !(k in DE))).toEqual([]);
    for (const x of TYPES) expect(ACTIONS[x.key], x.key).toBeTruthy();
    for (const k of HAS_TAKE) expect(TYPE[k], k).toBeTruthy();
  });
});

describe('the links in two stores', () => {
  const route = makeLink({ url: 'komoot.com/collection/1', title: `${P}Jura Runde`, type: 'route', notes: [' St-Ursanne ', '', 'Neuchâtel'], facts: { km: '136', up: "2'400", days: '3' } }, { id: 'r1', now: NOW });
  const rig = makeLink({ url: 'https://example.org/bikes/rigs-of-doom-2025/', type: 'rig', notes: [`${P}Über 90 Rigs`] }, { id: 'g1', now: '2026-10-13T08:00:00.000Z' });
  const race = makeLink({ url: 'https://example.org/race-alpen-2027', title: `${P}Rennen Alpen 2027`, type: 'race', raceDate: '2027-08-14', raceEnd: '2027-08-22', facts: { place: 'Graubünden' } }, { id: 'c1', now: '2026-10-12T08:00:00.000Z' });

  it('makes a link with your own words and numbers', () => {
    expect(route).toMatchObject({ id: 'r1', url: 'https://komoot.com/collection/1', type: 'route', notes: ['St-Ursanne', 'Neuchâtel'], facts: { km: 136, up: 2400, days: 3 }, take: '', taken: [], star: false, addedAt: NOW });
    expect(route.kind).toBeUndefined();
    expect(rig).toMatchObject({ kind: 'rig', year: 2025, title: 'Rigs Of Doom 2025', raceId: null });
    expect(race).toMatchObject({ kind: 'race', year: 2027, raceDate: '2027-08-14', raceEnd: '2027-08-22', facts: { place: 'Graubünden' } });
    expect(numOf('268,07')).toBe(268.07);
    expect(numOf('')).toBeNull();
    expect(numOf('abc')).toBeNull();
  });

  it('a price keeps the day it was typed until it changes', () => {
    const p = makeLink({ url: 'bike24.com/p1', type: 'product', facts: { price: '€ 268.07', grams: '440' } }, { id: 'p1', now: NOW });
    expect(p.priceAt).toBe('2026-10-14');
    const same = makeLink({ url: 'bike24.com/p1', type: 'product', facts: { price: '€ 268.07', grams: '440' } }, { id: 'p1', now: '2026-11-01T08:00:00.000Z', old: p });
    expect(same.priceAt).toBe('2026-10-14');
    const other = makeLink({ url: 'bike24.com/p1', type: 'product', facts: { price: '€ 249.00' } }, { id: 'p1', now: '2026-11-01T08:00:00.000Z', old: p });
    expect(other.priceAt).toBe('2026-11-01');
  });

  it('rigs and races go to Velos › Setup\'s list, the rest to Inspiration; one list, newest first', () => {
    let s = { rig: [], insp: [] };
    for (const l of [route, rig, race]) s = putLink(l, s);
    expect(s.rig.map((x) => x.id)).toEqual(['g1', 'c1']);
    expect(s.insp.map((x) => x.id)).toEqual(['r1']);
    expect(s.rig[0].type).toBeUndefined(); // Velos › Setup keeps its own shape (kind)
    // Velos › Setup sees the rig and the race (rig.js)
    expect(rigLinks(s.rig).map((x) => x.id)).toEqual(['g1']);
    expect(racesOf(s.rig, '2026-10-14').map((x) => x.id)).toEqual(['c1']);
    const all = allLinks(s.rig, s.insp);
    expect(all.map((x) => [x.id, x.type])).toEqual([['r1', 'route'], ['g1', 'rig'], ['c1', 'race']]);
    expect(filterLinks(all, 'rig').map((x) => x.id)).toEqual(['g1']);
    expect(filterLinks(all, 'star')).toEqual([]);
  });

  it('a rig made a video moves to Inspiration, never twice; a race that is gone frees its rigs', () => {
    let s = putLink(race, putLink({ ...rig, raceId: 'c1' }, { rig: [], insp: [] }));
    expect(rigsOfRace(allLinks(s.rig, s.insp), 'c1')).toBe(1);
    const video = makeLink({ url: rig.url, type: 'video' }, { id: 'g1', now: NOW, old: allLinks(s.rig, s.insp).find((x) => x.id === 'g1') });
    s = putLink(video, s);
    expect(s.rig.map((x) => x.id)).toEqual(['c1']);
    expect(s.insp.map((x) => [x.id, x.type])).toEqual([['g1', 'video']]);
    expect(s.insp[0].kind).toBeUndefined();
    s = putLink({ ...rig, raceId: 'c1' }, s);
    s = dropLink('c1', s);
    expect(s.rig).toEqual([expect.objectContaining({ id: 'g1', raceId: null })]);
    expect(s.insp).toEqual([]);
  });

  it('a note typed a moment ago is kept when the link is taken over (freshLink)', () => {
    const s = putLink({ ...route, take: 'Gravel ab St-Ursanne' }, { rig: [], insp: [] });
    expect(freshLink(route, s).take).toBe('Gravel ab St-Ursanne');
    expect(freshLink({ id: 'nope' }, s)).toEqual({ id: 'nope' });
  });
});

describe('«Aus der Notiz wird …» (UC2-2)', () => {
  const guide = { ...makeLink({ url: 'https://bikepacking.com/plog/complete-guide-to-bikepacking-bags/', title: 'The Complete Guide to Bikepacking Bags', type: 'article' }, { id: 'a1', now: NOW }), take: 'Werkzeug in die Rahmentasche' };

  it('a packing rule is a learning with its source, shown while packing, not under «From earlier trips»', () => {
    const r = ruleFrom(guide, ' Werkzeug in die Rahmentasche ', { id: 'insp-r-1', now: NOW });
    expect(r).toMatchObject({ id: 'insp-r-1', topic: 'Inspiration', rule: 'Werkzeug in die Rahmentasche', source: 'bikepacking.com, Guide to Bikepacking Bags', packHint: true, inspo: { linkId: 'a1', url: guide.url } });
    expect(sourceOf(guide)).toBe('bikepacking.com, Guide to Bikepacking Bags');
    const old = { id: 7, topic: 'Clothing', rule: `${P}Fewer layers`, priority: 'high', createdAt: '2026-10-10T08:00:00.000Z' };
    expect(learningsFor({ startDate: '2026-10-20', entries: [] }, [r, old], 3, new Date(NOW)).map((l) => l.id)).toEqual([7]);
    expect(inspoHints([old, r]).map((l) => l.id)).toEqual(['insp-r-1']);
    expect(inspoHints([{ ...r, packHint: false }])).toEqual([]);
    const newer = { ...r, id: 'insp-r-2', createdAt: '2026-10-15T08:00:00.000Z' };
    const third = { ...r, id: 'insp-r-3', createdAt: '2026-10-13T08:00:00.000Z' };
    expect(inspoHints([r, newer, third]).map((l) => l.id)).toEqual(['insp-r-2', 'insp-r-1']);
  });

  it('a wishlist item keeps the link; a product brings its weight and price', () => {
    const w = wishFrom(guide, 'Dynamo-Nabe für lange Touren', { id: 'LX09', now: NOW });
    expect(w).toMatchObject({ id: 'LX09', name: 'Dynamo-Nabe für lange Touren', ownership: 'wishlist', category: 'lux', weightG: null, weightStatus: 'missing' });
    expect(w.note).toContain(guide.url);
    const hub = makeLink({ url: 'https://www.bike24.com/p2123456.html', title: `${P}Nabendynamo`, type: 'product', facts: { price: '€ 268.07', grams: '440' } }, { id: 'p1', now: NOW });
    const w2 = wishFrom(hub, '', { id: 'LX10', now: NOW });
    expect(w2).toMatchObject({ name: `${P}Nabendynamo`, weightG: 440, weightStatus: 'online' });
    expect(w2.note).toContain('€ 268.07 (2026-10-14)');
  });

  it('a note is a kept note with the link', () => {
    const n = noteFrom(guide, 'Lenkerrolle leicht halten', { id: 'note-1', now: NOW });
    expect(n).toMatchObject({ id: 'note-1', status: 'kept', kind: 'note', text: 'Lenkerrolle leicht halten', link: { title: guide.title, url: guide.url } });
  });

  it('«Zuletzt übernommen»: the newest taken notes of all links', () => {
    const a = withTaken(guide, { kind: 'rule', text: 'Werkzeug in die Rahmentasche', at: '2026-10-14T09:00:00.000Z', ref: 'insp-r-1' });
    const b = withTaken({ id: 'g1', title: '2026 Silk Road Mountain Race Rigs (Part One)', url: 'x' }, { kind: 'wish', text: 'Dynamo-Nabe', at: '2026-10-14T08:00:00.000Z', ref: 'LX09' });
    const rows = recentTaken([b, withTaken(a, { kind: 'note', text: 'alt', at: '2026-10-01T08:00:00.000Z', ref: 'n' })], 2);
    expect(rows.map((r) => [r.kind, r.text, r.from])).toEqual([['rule', 'Werkzeug in die Rahmentasche', 'Guide to Bikepacking Bags'], ['wish', 'Dynamo-Nabe', '2026 Silk Road Mountain Race Rigs (Part…']]);
  });
});

describe('a race into the calendar', () => {
  it('an all-day event over the race days, with the link; none without a date', () => {
    const race = makeLink({ url: 'https://example.org/race-alpen-2027', title: `${P}Rennen, Alpen`, type: 'race', raceDate: '2027-08-14', raceEnd: '2027-08-22', facts: { place: 'Graubünden' } }, { id: 'c1', now: NOW });
    const ics = raceIcs(race, NOW);
    expect(ics).toContain('DTSTART;VALUE=DATE:20270814');
    expect(ics).toContain('DTEND;VALUE=DATE:20270823');
    expect(ics).toContain(`SUMMARY:${P}Rennen\\, Alpen`);
    expect(ics).toContain('LOCATION:Graubünden');
    expect(ics).toContain('URL:https://example.org/race-alpen-2027');
    expect(raceIcs({ ...race, raceDate: null })).toBeNull();
  });
});

describe('backup', () => {
  it('carries the links of both stores and the packing rule (export → import)', async () => {
    const db = createDb('inspo-backup-1');
    const route = makeLink({ url: 'komoot.com/collection/1', title: `${P}Jura`, type: 'route' }, { id: 'r1', now: NOW });
    const rig = makeLink({ url: 'https://example.org/bikes/rigs-2025/', type: 'rig' }, { id: 'g1', now: NOW });
    const s = putLink(rig, putLink(withTaken(route, { kind: 'note', text: 'x', at: NOW, ref: 'n1' }), { rig: [], insp: [] }));
    await db.settings.bulkPut([{ key: INSPO_KEY, value: s.insp }, { key: RIG_KEY, value: s.rig }]);
    await db.learnings.put(ruleFrom(route, 'Wasser für 2 Tage', { id: 'insp-r-1', now: NOW }));
    const file = JSON.parse(JSON.stringify(await buildBackup(db)));
    expect(file.tables.settings.map((r) => r.key).sort()).toEqual([INSPO_KEY, RIG_KEY]);
    const other = createDb('inspo-backup-2');
    await restoreBackup(other, file, 'replace');
    expect((await other.settings.get(INSPO_KEY)).value).toEqual(s.insp);
    expect((await other.settings.get(RIG_KEY)).value).toEqual(s.rig);
    expect(await other.learnings.get('insp-r-1')).toMatchObject({ inspo: { linkId: 'r1' }, packHint: true });
  });
});
