// Live Navigation PR 3: the «Places» filters (fictional places only).
import { describe, it, expect } from 'vitest';
import * as F from '../src/lib/map/poifilter.js';
import { parseHours } from '../src/lib/race/outside.js';
import { parsePlaces } from '../src/lib/map/poisearch.js';

// Tuesday 13 Oct 2026, 10:00 local time
const TUE = new Date(2026, 9, 13, 10, 0);
const d = (along, offKm = 0, atKm = 10 + along) => ({
  km: Math.abs(along),
  along,
  offKm,
  atKm,
});
const P = (id, extra = {}) => ({
  id,
  kind: 'shop',
  cat: 'shop',
  lat: 47,
  lon: 8,
  hours: '',
  feat: [],
  d: d(5),
  ...extra,
});

describe('normFilter', () => {
  it('cleans everything unknown back to off', () => {
    expect(F.normFilter(null)).toEqual({ ...F.NO_FILTER });
    const f = F.normFilter({
      open: 'x',
      feats: ['roof', 'nope', 'roof'],
      detourKm: 3,
      climbM: 100,
      speed: 99,
      sort: 'arrive',
    });
    expect(f.open).toBe('any');
    expect(f.feats).toEqual(['roof']);
    expect(f.detourKm).toBeNull();
    expect(f.climbM).toBe(100);
    expect(f.speed).toBe(F.SPEED.std);
    expect(f.sort).toBe('arrive');
  });
  it('counts the switched-on filters', () => {
    expect(F.filterCount(F.NO_FILTER)).toBe(0);
    expect(F.filterCount({ open: 'now', feats: ['roof', 'card'], last: true })).toBe(4);
  });
});

describe('featsOf (5, 12, 17)', () => {
  it('reads the properties from the tags', () => {
    expect(F.featsOf({ amenity: 'toilets', fee: 'no', drinking_water: 'yes' })).toEqual({ feat: ['water', 'freewc'], big: false, refill: true });
    expect(
      F.featsOf({
        shop: 'supermarket',
        'payment:debit_cards': 'yes',
        'diet:vegetarian': 'yes',
      }),
    ).toEqual({ feat: ['roof', 'card', 'veggie'], big: true, refill: false });
    expect(F.featsOf({ amenity: 'cafe', bicycle: 'yes', 'socket:schuko': '2' }).feat).toEqual(['bikes', 'roof', 'socket']);
    expect(F.featsOf({ man_made: 'water_tap', drinking_water: 'no' })).toEqual({
      feat: [],
      big: false,
      refill: false,
    });
  });
  it('parsePlaces keeps them', () => {
    const json = {
      elements: [
        {
          type: 'node',
          id: 1,
          lat: 47,
          lon: 8,
          tags: { shop: 'supermarket', name: 'Laden A' },
        },
      ],
    };
    const [p] = parsePlaces(json, ['shop']).list;
    expect(p.big).toBe(true);
    expect(p.feat).toContain('roof');
  });
});

describe('openOn (13)', () => {
  it('parseHours keeps the public holiday rule', () => {
    expect(parseHours('Mo-Sa 08:00-18:00; PH off').ph).toEqual([]);
    expect(parseHours('Mo-Sa 08:00-18:00; Su,PH 10:00-12:00').ph).toEqual([{ from: 600, to: 720 }]);
    expect(parseHours('Mo-Fr 08:00-18:00').ph).toBeUndefined();
  });
  it('on a holiday the PH rule counts, else the Sunday hours', () => {
    const whit = new Date(2026, 4, 25, 10, 0); // Whit Monday 2026
    expect(F.openOn('Mo-Sa 08:00-18:00; Su off', TUE)).toMatchObject({
      open: true,
      holiday: null,
    });
    expect(F.openOn('Mo-Sa 08:00-18:00; Su off', whit)).toMatchObject({
      open: false,
      holiday: 'whitmonday',
    });
    expect(F.openOn('Mo-Sa 08:00-18:00; PH 09:00-11:00', whit).open).toBe(true);
    expect(F.openOn('24/7', whit).open).toBe(true);
  });
});

describe('guesses', () => {
  it('climbTo adds the metres up between two km', () => {
    const prof = [
      [0, 400],
      [5, 500],
      [10, 450],
      [15, 600],
    ];
    expect(F.climbTo(prof, 0, 15)).toBe(250);
    expect(F.climbTo(prof, 5, 10)).toBe(0);
    expect(F.climbTo(prof, 2.5, 7.5)).toBe(50);
  });
  it('arrival at the speed, straight distance × 1.3 without a route', () => {
    expect(F.arrivalOf(d(18), 18, 0)).toBe(36e5);
    expect(F.arrivalOf({ km: 10, along: null, offKm: null }, 13, 0)).toBe(36e5);
  });
  it('last chance: the same kind does not come again for 20 km', () => {
    const list = [P('a', { d: d(2) }), P('b', { d: d(4) }), P('c', { d: d(30) }), P('w', { cat: 'water', d: d(3) })];
    const ids = F.lastChances(list, 100);
    expect([...ids].sort()).toEqual(['b', 'c', 'w']);
    expect([...F.lastChances(list, 45)].sort()).toEqual(['b', 'w']);
  });
});

describe('applyFilter', () => {
  const list = [P('open', { hours: 'Mo-Su 08:00-18:00', d: d(8, 0.1) }), P('closed', { hours: 'Mo-Su 14:00-18:00', d: d(2) }), P('nohours', { d: d(4, 2) }), P('behind', { hours: '24/7', d: d(-3) })];
  const ctx = { now: TUE, onRoute: true, endKm: 100 };
  it('nothing on: the same order', () => {
    expect(F.applyFilter(list, F.NO_FILTER, ctx).map((p) => p.id)).toEqual(['open', 'closed', 'nohours', 'behind']);
  });
  it('1 open now, with or without the places without hours', () => {
    expect(F.applyFilter(list, { open: 'now' }, ctx).map((p) => p.id)).toEqual(['open', 'nohours', 'behind']);
    expect(F.applyFilter(list, { open: 'now', unknown: false }, ctx).map((p) => p.id)).toEqual(['open', 'behind']);
  });
  it('1 open when I get there (the 14:00 one counts when you get there after 14:00)', () => {
    expect(F.applyFilter(list, { open: 'arrive', unknown: false, speed: 6 }, ctx).map((p) => p.id)).toEqual(['open', 'behind']);
    const late = { ...ctx, now: new Date(2026, 9, 13, 13, 56) };
    expect(F.applyFilter(list, { open: 'arrive', unknown: false }, late).map((p) => p.id)).toEqual(['open', 'closed', 'behind']);
  });
  it('2 only ahead, 3 detour, 7 sort', () => {
    expect(F.applyFilter(list, { ahead: true }, ctx).map((p) => p.id)).toEqual(['open', 'closed', 'nohours']);
    expect(F.applyFilter(list, { detourKm: 1 }, ctx).map((p) => p.id)).toEqual(['open', 'closed', 'behind']);
    expect(F.applyFilter(list, { sort: 'detour', ahead: true }, ctx).map((p) => p.id)).toEqual(['closed', 'open', 'nohours']);
    expect(F.applyFilter(list, { sort: 'arrive' }, ctx).at(-1).id).toBe('open');
  });
  it('4 before dark', () => {
    const sun = { set: TUE.getTime() + 15 * 60e3 }; // 15 min: 4.5 km at 18 km/h
    expect(F.applyFilter(list, { dark: true }, { ...ctx, sun }).map((p) => p.id)).toEqual(['closed', 'behind']);
  });
  it('5 properties, 6 mine, 12 big shops, 17 refill, 10 rain roof first', () => {
    const l2 = [P('a', { feat: ['card'] }), P('b', { feat: ['roof', 'card'], big: true }), P('c', { kind: 'water', cat: 'water', refill: true })];
    expect(F.applyFilter(l2, { feats: ['card'] }, ctx).map((p) => p.id)).toEqual(['a', 'b']);
    expect(F.applyFilter(l2, { starred: true }, { ...ctx, starred: ['c'] }).map((p) => p.id)).toEqual(['c']);
    expect(F.applyFilter(l2, { hideVisited: true }, { ...ctx, visited: ['a'] }).map((p) => p.id)).toEqual(['b', 'c']);
    expect(F.applyFilter(l2, { big: true }, ctx).map((p) => p.id)).toEqual(['b', 'c']);
    expect(F.applyFilter(l2, { refill: true }, ctx).map((p) => p.id)).toEqual(['c']);
    expect(F.applyFilter(l2, { rain: true }, ctx).map((p) => p.id)).toEqual(['b', 'a', 'c']);
  });
  it('9 climb', () => {
    const prof = [
      [0, 400],
      [12, 400],
      [14, 600],
      [30, 600],
    ];
    const l3 = [P('flat', { d: d(1) }), P('up', { d: d(5) })];
    expect(F.applyFilter(l3, { climbM: 100 }, { ...ctx, profile: prof, myKm: 10 }).map((p) => p.id)).toEqual(['flat']);
  });
  it('18 last chance', () => {
    expect(F.applyFilter(list, { last: true }, ctx).map((p) => p.id)).toEqual(['open']);
  });
});

describe('8 saved filters and 6 visited', () => {
  it('add, replace by name, rename, move, remove', () => {
    let l = F.putPreset([], 'Abend', { open: 'arrive' }, 'p1');
    l = F.putPreset(l, 'Regen', { rain: true }, 'p2');
    l = F.putPreset(l, 'abend', { open: 'now' }, 'p3');
    expect(l.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(l[0].filter.open).toBe('now');
    l = F.renamePreset(l, 'p2', 'Nass');
    expect(l[1].name).toBe('Nass');
    expect(F.movePreset(l, 1, 0).map((p) => p.id)).toEqual(['p2', 'p1']);
    expect(F.removePreset(l, 'p1').map((p) => p.id)).toEqual(['p2']);
    expect(F.putPreset(l, '  ', {})).toEqual(l);
  });
  it('toggles a visited place', () => {
    expect(F.toggleVisited(['a'], 'b')).toEqual(['a', 'b']);
    expect(F.toggleVisited(['a', 'b'], 'a')).toEqual(['b']);
  });
});
