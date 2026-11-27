// «Heute abhaken» as the first block of Heute (Noah 23.11.2026 «2a»). Fictional data.
import { describe, it, expect } from 'vitest';
import { hakenPick, hakenIds } from '../src/lib/home/haken.js';
import { TILE, READY, wallOf, wallRecord, withHaken, HEAD_N2 } from '../src/lib/home/tiles.js';
import { SECTION_OF, sectionsOf } from '../src/lib/home/sections.js';
import DE from '../src/lib/i18n/de/index.js';

const st = (id, extra = {}) => ({ act: { id }, resting: false, todayDone: false, ...extra });
const ids = (l) => l.map((x) => x.id);

describe('hakenPick', () => {
  it('shows the first n ticks in the order of the states and does not move a done one', () => {
    const states = [st('a'), st('b', { todayDone: true }), st('c'), st('d'), st('e')];
    const p = hakenPick(states, new Set(), 4);
    expect(p.shown.map((s) => s.act.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(p.done).toBe(1);
    expect(p.total).toBe(5);
  });
  it('leaves the resting ones out and names the habit cards instead of showing them twice', () => {
    const states = [st('a'), st('rest', { resting: true }), st('med'), st('b')];
    const p = hakenPick(states, new Set(['med']), 8);
    expect(p.shown.map((s) => s.act.id)).toEqual(['a', 'b']);
    expect(p.up.map((s) => s.act.id)).toEqual(['med']);
    expect(p.total).toBe(3);
  });
  it('counts the open ticks like the menu at «Plan» (not resting, a daily goal not reached)', () => {
    const states = [st('a', { open: true }), st('b', { open: false, todayDone: true }), st('r', { open: true, resting: true }), st('c', { open: true })];
    expect(hakenPick(states, new Set(), 4).open).toBe(2);
  });
  it('is empty without activities', () => {
    expect(hakenPick([], new Set(), 4)).toEqual({ shown: [], up: [], done: 0, total: 0, open: 0 });
  });
  it('hakenIds are the ones «Active today» must not show again', () => {
    const states = [st('a'), st('b'), st('c')];
    expect([...hakenIds(states, new Set(), 2)]).toEqual(['a', 'b']);
  });
});

describe('the block on the wall', () => {
  it('is in the catalog, in the first area, the first tile of the ready wall and of the head', () => {
    expect(TILE.haken.sizes).toContain(TILE.haken.size);
    expect(SECTION_OF.haken).toBe('now');
    expect(ids(READY)[0]).toBe('pins'); // «Favoriten» stand even before it (Noah 27.11.2026 «1-5a», 1a)
    expect(ids(READY)[1]).toBe('haken');
    expect(HEAD_N2.slice(0, 2)).toEqual(['pins', 'haken']);
    expect(DE[TILE.haken.label]).toBeTruthy();
    expect(DE[TILE.haken.pitch]).toBeTruthy();
    expect(ids(sectionsOf(READY)[0].tiles).slice(0, 2)).toEqual(['pins', 'haken']);
  });
  it('a wall of before (v < 23) gets it on top once; taken away or moved after that, it stays so', () => {
    expect(ids(withHaken([{ id: 'body', size: 'l' }, { id: 'week', size: 'l' }]))).toEqual(['haken', 'body', 'week']);
    expect(ids(withHaken([{ id: 'week', size: 'l' }, { id: 'haken', size: 'long' }]))).toEqual(['week', 'haken']);
    expect(ids(wallOf({ v: 22, tiles: [{ id: 'body', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual(['pins', 'haken', 'body', 'week']);
    expect(ids(wallOf({ v: 23, tiles: [{ id: 'body', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual(['pins', 'body', 'week']); // «Favoriten» come once on top (v 24); «Heute abhaken» taken away by hand: stays away
    expect(ids(wallOf({ v: 24, tiles: [{ id: 'body', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual(['body', 'week']); // both taken away by hand: stay away
    expect(ids(wallOf({ v: 21, tiles: [{ id: 'body', size: 'l' }, { id: 'week', size: 'l' }] }))).toEqual(['pins', 'haken', 'body', 'week']);
    expect(wallRecord([]).v).toBe(24);
  });
});
